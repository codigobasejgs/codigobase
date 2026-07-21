create or replace function public.cb_is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- Tighten legacy admin surfaces: authenticated is not equivalent to administrator.
drop policy if exists "admin read contacts" on public.cb_whatsapp_contacts;
create policy "admin read contacts" on public.cb_whatsapp_contacts for select to authenticated using (public.cb_is_admin());

drop policy if exists "admin read conversations" on public.cb_whatsapp_conversations;
create policy "admin read conversations" on public.cb_whatsapp_conversations for select to authenticated using (public.cb_is_admin());

drop policy if exists "admin update conversations" on public.cb_whatsapp_conversations;
create policy "admin update conversations" on public.cb_whatsapp_conversations for update to authenticated using (public.cb_is_admin()) with check (public.cb_is_admin());

drop policy if exists "admin read messages" on public.cb_whatsapp_messages;
create policy "admin read messages" on public.cb_whatsapp_messages for select to authenticated using (public.cb_is_admin());

drop policy if exists "admin read ai settings" on public.cb_ai_settings;
create policy "admin read ai settings" on public.cb_ai_settings for select to authenticated using (public.cb_is_admin());

drop policy if exists "admin update ai settings" on public.cb_ai_settings;
create policy "admin update ai settings" on public.cb_ai_settings for update to authenticated using (public.cb_is_admin()) with check (public.cb_is_admin());

drop policy if exists "admin read conversation events" on public.cb_conversation_events;
create policy "admin read conversation events" on public.cb_conversation_events for select to authenticated using (public.cb_is_admin());
drop policy if exists "admin read webhook logs" on public.cb_webhook_logs;
create policy "admin read webhook logs" on public.cb_webhook_logs for select to authenticated using (public.cb_is_admin());

create table if not exists public.cb_outbound_prospects (
  id uuid primary key default gen_random_uuid(),
  name text,
  company text,
  phone_e164 text not null unique check (phone_e164 ~ '^\+[1-9][0-9]{9,14}$'),
  remote_jid text generated always as (replace(phone_e164, '+', '') || '@s.whatsapp.net') stored unique,
  website text,
  email text,
  address text,
  source text not null default 'manual',
  audit_finding text,
  notes text,
  legal_basis text not null default 'legitimate_interest' check (legal_basis in ('legitimate_interest', 'consent')),
  purpose text not null default 'b2b_manual_outreach',
  status text not null default 'new' check (status in ('new','ready','contacted','replied','opted_out','blocked','invalid')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cb_whatsapp_suppressions (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null unique check (phone_e164 ~ '^\+[1-9][0-9]{9,14}$'),
  reason text not null check (reason in ('opt_out','manual','invalid','legal')),
  source_message_id uuid references public.cb_whatsapp_messages(id) on delete set null,
  created_by uuid references auth.users(id),
  suppressed_at timestamptz not null default now()
);

create table if not exists public.cb_outbound_message_drafts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.cb_outbound_prospects(id) on delete cascade,
  body text not null check (
    char_length(body) between 1 and 4096
    and right(rtrim(body), char_length('Se não quiser receber novas mensagens, responda SAIR.')) = 'Se não quiser receber novas mensagens, responda SAIR.'
  ),
  status text not null default 'draft' check (status in ('draft','approved','sending','sent','pending_confirmation','error','blocked','cancelled')),
  idempotency_key uuid not null default gen_random_uuid() unique,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  sent_by uuid references auth.users(id),
  sent_at timestamptz,
  send_lock_id uuid,
  sending_started_at timestamptz,
  attempt_count int not null default 0 check (attempt_count >= 0),
  evolution_message_id text unique,
  evolution_response jsonb,
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cb_outbound_draft_approval_check check (
    (status = 'draft' and approved_at is null and approved_by is null)
    or status in ('cancelled','blocked')
    or (approved_at is not null and approved_by is not null)
  )
);

create unique index if not exists cb_outbound_one_active_draft_idx
  on public.cb_outbound_message_drafts (prospect_id)
  where status not in ('cancelled','blocked');

create index if not exists cb_outbound_drafts_status_idx
  on public.cb_outbound_message_drafts (status, updated_at desc);

create or replace function public.cb_claim_outbound_draft(
  target_draft_id uuid,
  target_user_id uuid,
  target_lock_id uuid
)
returns table (
  draft_id uuid,
  prospect_id uuid,
  body text,
  idempotency_key uuid,
  attempt_count int,
  phone_e164 text,
  remote_jid text,
  prospect_status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.cb_is_admin() or auth.uid() is distinct from target_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  update public.cb_outbound_message_drafts d set
    status = 'sending',
    send_lock_id = target_lock_id,
    sending_started_at = now(),
    sent_by = target_user_id,
    attempt_count = d.attempt_count + 1,
    error_message = null,
    updated_at = now()
  from public.cb_outbound_prospects p
  where d.id = target_draft_id
    and d.prospect_id = p.id
    and d.status = 'approved'
    and p.status in ('new','ready')
    and not exists (
      select 1 from public.cb_whatsapp_suppressions s where s.phone_e164 = p.phone_e164
    )
  returning d.id, d.prospect_id, d.body, d.idempotency_key, d.attempt_count,
    p.phone_e164, p.remote_jid, p.status;
end;
$$;

create table if not exists public.cb_outbound_send_logs (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.cb_outbound_prospects(id) on delete set null,
  draft_id uuid references public.cb_outbound_message_drafts(id) on delete set null,
  lock_id uuid,
  event_type text not null,
  status text,
  message text,
  evolution_response jsonb,
  duration_ms int,
  created_at timestamptz not null default now()
);

create index if not exists cb_outbound_send_logs_draft_idx
  on public.cb_outbound_send_logs (draft_id, created_at desc);

create or replace function public.cb_finalize_outbound_send(
  target_draft_id uuid,
  target_lock_id uuid,
  target_evolution_message_id text,
  target_evolution_response jsonb,
  target_duration_ms int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_prospect_id uuid;
begin
  update public.cb_outbound_message_drafts set
    status = 'sent',
    sent_at = now(),
    evolution_message_id = target_evolution_message_id,
    evolution_response = target_evolution_response,
    updated_at = now()
  where id = target_draft_id
    and send_lock_id = target_lock_id
    and status = 'sending'
  returning prospect_id into target_prospect_id;

  if target_prospect_id is null then return false; end if;

  update public.cb_outbound_prospects set status = 'contacted', updated_at = now()
  where id = target_prospect_id and status in ('new','ready');

  insert into public.cb_outbound_send_logs (
    prospect_id, draft_id, lock_id, event_type, status, evolution_response, duration_ms
  ) values (
    target_prospect_id, target_draft_id, target_lock_id, 'send_succeeded', 'sent', target_evolution_response, target_duration_ms
  );

  return true;
end;
$$;

alter table public.cb_outbound_prospects enable row level security;
alter table public.cb_whatsapp_suppressions enable row level security;
alter table public.cb_outbound_message_drafts enable row level security;
alter table public.cb_outbound_send_logs enable row level security;

drop policy if exists "admin manage outbound prospects" on public.cb_outbound_prospects;
create policy "admin manage outbound prospects"
  on public.cb_outbound_prospects for all to authenticated
  using (public.cb_is_admin()) with check (public.cb_is_admin());

drop policy if exists "admin manage whatsapp suppressions" on public.cb_whatsapp_suppressions;
create policy "admin manage whatsapp suppressions"
  on public.cb_whatsapp_suppressions for all to authenticated
  using (public.cb_is_admin()) with check (public.cb_is_admin());

drop policy if exists "admin manage outbound drafts" on public.cb_outbound_message_drafts;
create policy "admin manage outbound drafts"
  on public.cb_outbound_message_drafts for all to authenticated
  using (public.cb_is_admin()) with check (public.cb_is_admin());

drop policy if exists "admin read outbound send logs" on public.cb_outbound_send_logs;
create policy "admin read outbound send logs"
  on public.cb_outbound_send_logs for select to authenticated
  using (public.cb_is_admin());

create or replace function public.cb_preserve_conversation_state(
  target_remote_jid text,
  target_contact_id uuid,
  target_suspected_bot boolean,
  target_wants_human boolean,
  target_service_interest text,
  target_last_message_at timestamptz
)
returns public.cb_whatsapp_conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.cb_whatsapp_conversations;
begin
  insert into public.cb_whatsapp_conversations (
    contact_id,
    remote_jid,
    is_group,
    suspected_bot,
    ai_paused,
    pause_reason,
    service_interest,
    last_message_at,
    updated_at
  ) values (
    target_contact_id,
    target_remote_jid,
    false,
    target_suspected_bot,
    target_suspected_bot or target_wants_human,
    case when target_suspected_bot then 'suspected_bot' when target_wants_human then 'human_requested' end,
    target_service_interest,
    target_last_message_at,
    now()
  )
  on conflict (remote_jid) do update set
    contact_id = excluded.contact_id,
    suspected_bot = public.cb_whatsapp_conversations.suspected_bot or excluded.suspected_bot,
    ai_paused = public.cb_whatsapp_conversations.ai_paused or excluded.ai_paused,
    pause_reason = coalesce(public.cb_whatsapp_conversations.pause_reason, excluded.pause_reason),
    service_interest = coalesce(excluded.service_interest, public.cb_whatsapp_conversations.service_interest),
    last_message_at = excluded.last_message_at,
    updated_at = now()
  returning * into result;
  return result;
end;
$$;

revoke all on function public.cb_preserve_conversation_state(text, uuid, boolean, boolean, text, timestamptz) from public, anon, authenticated;
grant execute on function public.cb_preserve_conversation_state(text, uuid, boolean, boolean, text, timestamptz) to service_role;

revoke all on function public.cb_claim_outbound_draft(uuid, uuid, uuid) from public, anon;
grant execute on function public.cb_claim_outbound_draft(uuid, uuid, uuid) to authenticated, service_role;

revoke all on function public.cb_finalize_outbound_send(uuid, uuid, text, jsonb, int) from public, anon, authenticated;
grant execute on function public.cb_finalize_outbound_send(uuid, uuid, text, jsonb, int) to service_role;
