alter table public.cb_whatsapp_conversations
  add column if not exists lead_stage text not null default 'novo',
  add column if not exists lead_value_estimate numeric,
  add column if not exists lead_notes text,
  add column if not exists next_follow_up_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.cb_whatsapp_conversations'::regclass
      and conname = 'cb_whatsapp_conversations_lead_stage_check'
  ) then
    alter table public.cb_whatsapp_conversations
      add constraint cb_whatsapp_conversations_lead_stage_check
      check (lead_stage in ('novo','qualificado','orcamento','fechado','perdido'));
  end if;
end $$;

create index if not exists cb_whatsapp_conversations_lead_stage_idx
  on public.cb_whatsapp_conversations (lead_stage, updated_at desc);

create index if not exists cb_whatsapp_conversations_next_follow_up_idx
  on public.cb_whatsapp_conversations (next_follow_up_at)
  where next_follow_up_at is not null;

alter table public.cb_whatsapp_status_posts
  add column if not exists campaign text;

create index if not exists cb_whatsapp_status_posts_campaign_idx
  on public.cb_whatsapp_status_posts (campaign, scheduled_at desc);
