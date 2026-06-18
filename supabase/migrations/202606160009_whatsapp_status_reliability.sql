alter table public.cb_whatsapp_status_posts
  add column if not exists attempt_count int not null default 0,
  add column if not exists publishing_started_at timestamptz,
  add column if not exists publish_lock_id uuid,
  add column if not exists last_success_at timestamptz,
  add column if not exists last_evolution_status text,
  add column if not exists evolution_response jsonb;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.cb_whatsapp_status_posts'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%status%scheduled%publishing%published%error%cancelled%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.cb_whatsapp_status_posts drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.cb_whatsapp_status_posts
  add constraint cb_whatsapp_status_posts_status_check
  check (status in ('scheduled','publishing','pending_confirmation','published','error','cancelled'));

create index if not exists cb_whatsapp_status_posts_status_scheduled_idx
  on public.cb_whatsapp_status_posts (status, scheduled_at);

create index if not exists cb_whatsapp_status_posts_status_publishing_idx
  on public.cb_whatsapp_status_posts (status, publishing_started_at);

create table if not exists public.cb_whatsapp_status_publish_logs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.cb_whatsapp_status_posts(id) on delete cascade,
  lock_id uuid,
  event_type text not null,
  status text,
  message text,
  evolution_response jsonb,
  duration_ms int,
  created_at timestamptz not null default now()
);

alter table public.cb_whatsapp_status_publish_logs enable row level security;

drop policy if exists "admin read status publish logs" on public.cb_whatsapp_status_publish_logs;
create policy "admin read status publish logs" on public.cb_whatsapp_status_publish_logs for select to authenticated using (true);
