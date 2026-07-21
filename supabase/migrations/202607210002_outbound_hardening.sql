-- Harden the already-deployed manual outbound workflow without changing existing data.

create or replace function public.cb_guard_outbound_prospect_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if not public.cb_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if tg_op = 'DELETE' then raise exception 'outbound_records_are_not_deletable' using errcode = '22000'; end if;

  if tg_op = 'INSERT' then
    new.status := 'new';
    new.created_by := auth.uid();
    return new;
  end if;

  if new.phone_e164 is distinct from old.phone_e164 or new.created_by is distinct from old.created_by then
    raise exception 'prospect_identity_is_immutable' using errcode = '22000';
  end if;
  if old.status in ('opted_out','blocked','invalid') and new.status is distinct from old.status then
    raise exception 'terminal_prospect_status' using errcode = '22000';
  end if;
  if old.status in ('contacted','replied') and new.status not in (old.status,'blocked') then
    raise exception 'invalid_prospect_transition' using errcode = '22000';
  end if;
  if old.status = 'new' and new.status not in ('new','ready','blocked','invalid') then
    raise exception 'invalid_prospect_transition' using errcode = '22000';
  end if;
  if old.status = 'ready' and new.status not in ('ready','blocked','invalid') then
    raise exception 'invalid_prospect_transition' using errcode = '22000';
  end if;
  return new;
end;
$$;

drop trigger if exists cb_guard_outbound_prospect_mutation on public.cb_outbound_prospects;
create trigger cb_guard_outbound_prospect_mutation before insert or update or delete on public.cb_outbound_prospects
for each row execute function public.cb_guard_outbound_prospect_mutation();

create or replace function public.cb_guard_outbound_draft_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if not public.cb_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if tg_op = 'DELETE' then raise exception 'outbound_records_are_not_deletable' using errcode = '22000'; end if;

  if tg_op = 'INSERT' then
    if new.status <> 'draft' or new.approved_by is not null or new.approved_at is not null
      or new.sent_by is not null or new.sent_at is not null or new.send_lock_id is not null
      or new.sending_started_at is not null or new.attempt_count <> 0
      or new.evolution_message_id is not null or new.evolution_response is not null then
      raise exception 'draft_must_start_unapproved' using errcode = '22000';
    end if;
    new.created_by := auth.uid();
    return new;
  end if;

  if new.prospect_id is distinct from old.prospect_id
    or new.idempotency_key is distinct from old.idempotency_key
    or new.created_by is distinct from old.created_by
    or new.sent_by is distinct from old.sent_by or new.sent_at is distinct from old.sent_at
    or new.send_lock_id is distinct from old.send_lock_id or new.sending_started_at is distinct from old.sending_started_at
    or new.attempt_count is distinct from old.attempt_count
    or new.evolution_message_id is distinct from old.evolution_message_id
    or new.evolution_response is distinct from old.evolution_response then
    raise exception 'protected_draft_fields' using errcode = '22000';
  end if;
  if old.status not in ('draft','approved','error') and new.status is distinct from old.status then
    raise exception 'system_managed_draft_status' using errcode = '22000';
  end if;
  if old.status = 'error' and new.status not in ('error','draft','blocked','cancelled') then
    raise exception 'invalid_draft_transition' using errcode = '22000';
  end if;
  if old.status = 'draft' and new.status not in ('draft','approved','blocked','cancelled') then
    raise exception 'invalid_draft_transition' using errcode = '22000';
  end if;
  if old.status = 'approved' and new.status not in ('approved','draft','blocked','cancelled') then
    raise exception 'invalid_draft_transition' using errcode = '22000';
  end if;
  if old.status = 'approved' and new.status = 'approved' and new.body is distinct from old.body then
    raise exception 'approved_body_is_immutable' using errcode = '22000';
  end if;

  if old.status = 'draft' and new.status = 'approved' then
    if new.body is distinct from old.body then raise exception 'save_before_approval' using errcode = '22000'; end if;
    new.approved_by := auth.uid();
    new.approved_at := now();
  elsif new.status = 'draft' then
    new.approved_by := null;
    new.approved_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists cb_guard_outbound_draft_mutation on public.cb_outbound_message_drafts;
create trigger cb_guard_outbound_draft_mutation before insert or update or delete on public.cb_outbound_message_drafts
for each row execute function public.cb_guard_outbound_draft_mutation();

create unique index if not exists cb_outbound_one_success_log_idx
  on public.cb_outbound_send_logs (draft_id, event_type) where event_type = 'send_succeeded';

-- A definitive provider rejection allows a new reviewed draft. Uncertain outcomes stay active.
drop index if exists public.cb_outbound_one_active_draft_idx;
create unique index cb_outbound_one_active_draft_idx
  on public.cb_outbound_message_drafts (prospect_id)
  where status not in ('cancelled','blocked','error');

create or replace function public.cb_finalize_outbound_send(
  target_draft_id uuid, target_lock_id uuid, target_evolution_message_id text,
  target_evolution_response jsonb, target_duration_ms int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_prospect_id uuid;
  target_body text;
  target_phone text;
  target_remote_jid text;
  target_name text;
  target_contact_id uuid;
  target_conversation_id uuid;
begin
  if exists (select 1 from public.cb_outbound_message_drafts where id = target_draft_id
    and send_lock_id = target_lock_id and status = 'sent'
    and evolution_message_id is not distinct from target_evolution_message_id) then return true; end if;

  update public.cb_outbound_message_drafts set status = 'sent', sent_at = now(),
    evolution_message_id = target_evolution_message_id, evolution_response = target_evolution_response, updated_at = now()
  where id = target_draft_id and send_lock_id = target_lock_id and status = 'sending'
  returning prospect_id, body into target_prospect_id, target_body;
  if target_prospect_id is null then return false; end if;

  update public.cb_outbound_prospects set status = 'contacted', updated_at = now()
  where id = target_prospect_id and status in ('new','ready')
  returning phone_e164, remote_jid, coalesce(name, company) into target_phone, target_remote_jid, target_name;

  if target_remote_jid is not null then
    insert into public.cb_whatsapp_contacts (remote_jid, phone, push_name, is_group, updated_at)
    values (target_remote_jid, replace(target_phone, '+', ''), target_name, false, now())
    on conflict (remote_jid) do update set phone = excluded.phone,
      push_name = coalesce(public.cb_whatsapp_contacts.push_name, excluded.push_name), updated_at = now()
    returning id into target_contact_id;

    insert into public.cb_whatsapp_conversations (
      contact_id, remote_jid, ai_paused, pause_reason, is_group, last_message_at, last_human_at, updated_at
    ) values (target_contact_id, target_remote_jid, true, 'outbound_manual', false, now(), now(), now())
    on conflict (remote_jid) do update set contact_id = excluded.contact_id, ai_paused = true,
      pause_reason = coalesce(public.cb_whatsapp_conversations.pause_reason, 'outbound_manual'),
      last_message_at = greatest(public.cb_whatsapp_conversations.last_message_at, excluded.last_message_at),
      last_human_at = greatest(public.cb_whatsapp_conversations.last_human_at, excluded.last_human_at), updated_at = now()
    returning id into target_conversation_id;

    insert into public.cb_whatsapp_messages (
      conversation_id, evolution_message_id, remote_jid, from_me, sender_type, message_type, content, raw_payload
    ) values (target_conversation_id, target_evolution_message_id, target_remote_jid, true,
      'human', 'text', target_body, coalesce(target_evolution_response, '{}'::jsonb))
    on conflict (evolution_message_id) do nothing;
  end if;

  insert into public.cb_outbound_send_logs (
    prospect_id, draft_id, lock_id, event_type, status, evolution_response, duration_ms
  ) values (target_prospect_id, target_draft_id, target_lock_id, 'send_succeeded', 'sent', target_evolution_response, target_duration_ms)
  on conflict (draft_id, event_type) where event_type = 'send_succeeded' do nothing;
  return true;
end;
$$;

create or replace function public.cb_reconcile_stale_outbound_draft(target_draft_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare target_prospect_id uuid; target_lock_id uuid;
begin
  if not public.cb_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.cb_outbound_message_drafts set status = 'pending_confirmation',
    error_message = 'Processo interrompido após claim; confirme na Evolution antes de qualquer novo envio', updated_at = now()
  where id = target_draft_id and status = 'sending' and sending_started_at < now() - interval '5 minutes'
  returning prospect_id, send_lock_id into target_prospect_id, target_lock_id;
  if target_prospect_id is null then return false; end if;
  insert into public.cb_outbound_send_logs (prospect_id, draft_id, lock_id, event_type, status, message)
  values (target_prospect_id, target_draft_id, target_lock_id, 'stale_send_reconciled', 'pending_confirmation',
    'Confirmação manual obrigatória; nenhum retry automático foi executado');
  return true;
end;
$$;

create or replace function public.cb_preserve_conversation_state(
  target_remote_jid text, target_contact_id uuid, target_suspected_bot boolean,
  target_wants_human boolean, target_service_interest text, target_last_message_at timestamptz
)
returns public.cb_whatsapp_conversations
language plpgsql
security definer
set search_path = public
as $$
declare result public.cb_whatsapp_conversations;
begin
  insert into public.cb_whatsapp_conversations (
    contact_id, remote_jid, is_group, suspected_bot, ai_paused, pause_reason, service_interest, last_message_at, updated_at
  ) values (target_contact_id, target_remote_jid, false, target_suspected_bot,
    target_suspected_bot or target_wants_human,
    case when target_suspected_bot then 'suspected_bot' when target_wants_human then 'human_requested' end,
    target_service_interest, target_last_message_at, now())
  on conflict (remote_jid) do update set contact_id = excluded.contact_id,
    suspected_bot = public.cb_whatsapp_conversations.suspected_bot or excluded.suspected_bot,
    ai_paused = public.cb_whatsapp_conversations.ai_paused or excluded.ai_paused,
    pause_reason = coalesce(public.cb_whatsapp_conversations.pause_reason, excluded.pause_reason),
    service_interest = coalesce(excluded.service_interest, public.cb_whatsapp_conversations.service_interest),
    last_message_at = greatest(public.cb_whatsapp_conversations.last_message_at, excluded.last_message_at), updated_at = now()
  returning * into result;
  return result;
end;
$$;

alter view public.whatsapp_admin_analytics set (security_invoker = true);
revoke all on public.whatsapp_admin_analytics from anon, authenticated;
grant select on public.whatsapp_admin_analytics to service_role;
revoke all on function public.cb_reconcile_stale_outbound_draft(uuid) from public, anon;
grant execute on function public.cb_reconcile_stale_outbound_draft(uuid) to authenticated, service_role;
revoke all on function public.cb_guard_outbound_prospect_mutation() from public, anon, authenticated;
revoke all on function public.cb_guard_outbound_draft_mutation() from public, anon, authenticated;

create or replace function public.cb_guard_outbound_suppression_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  if not public.cb_is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if tg_op = 'DELETE' then raise exception 'suppressions_require_database_review' using errcode = '22000'; end if;
  if tg_op = 'INSERT' then new.created_by := auth.uid(); end if;
  if tg_op = 'UPDATE' and (
    new.phone_e164 is distinct from old.phone_e164
    or new.suppressed_at is distinct from old.suppressed_at
    or new.created_by is distinct from old.created_by
  ) then raise exception 'suppression_identity_is_immutable' using errcode = '22000'; end if;
  return new;
end;
$$;

drop trigger if exists cb_guard_outbound_suppression_mutation on public.cb_whatsapp_suppressions;
create trigger cb_guard_outbound_suppression_mutation before insert or update or delete on public.cb_whatsapp_suppressions
for each row execute function public.cb_guard_outbound_suppression_mutation();
revoke all on function public.cb_guard_outbound_suppression_mutation() from public, anon, authenticated;
