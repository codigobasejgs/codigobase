insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ai-generated-creatives', 'ai-generated-creatives', true, 52428800, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.cb_ai_creative_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  theme_category text not null,
  theme_option text not null,
  description text,
  platforms text[] not null default array['instagram','whatsapp'],
  daily_story_count int not null default 3,
  daily_carousel_count int not null default 1,
  carousel_slide_count int not null default 5,
  approval_mode text not null default 'manual' check (approval_mode in ('manual','auto_after_theme_approval','mixed')),
  default_times text[] not null default array['09:00','13:30','18:00'],
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cb_ai_creative_drafts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.cb_ai_creative_campaigns(id) on delete set null,
  draft_type text not null check (draft_type in ('story','carousel')),
  platform_targets text[] not null default array['instagram','whatsapp'],
  theme_category text not null,
  theme_option text not null,
  title text,
  caption text,
  status text not null default 'generated' check (status in ('draft','generated','approved','scheduled','rejected','error')),
  scheduled_at timestamptz,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cb_ai_creative_assets (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.cb_ai_creative_drafts(id) on delete cascade,
  position int not null default 0,
  prompt text,
  media_url text not null,
  media_path text,
  mime_type text not null default 'image/png',
  openai_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cb_ai_creative_logs (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references public.cb_ai_creative_drafts(id) on delete cascade,
  event_type text not null,
  status text,
  message text,
  response jsonb,
  created_at timestamptz not null default now()
);

alter table public.cb_ai_creative_campaigns enable row level security;
alter table public.cb_ai_creative_drafts enable row level security;
alter table public.cb_ai_creative_assets enable row level security;
alter table public.cb_ai_creative_logs enable row level security;

drop policy if exists "admin manage ai creative campaigns" on public.cb_ai_creative_campaigns;
create policy "admin manage ai creative campaigns" on public.cb_ai_creative_campaigns for all to authenticated using (true) with check (true);

drop policy if exists "admin manage ai creative drafts" on public.cb_ai_creative_drafts;
create policy "admin manage ai creative drafts" on public.cb_ai_creative_drafts for all to authenticated using (true) with check (true);

drop policy if exists "admin manage ai creative assets" on public.cb_ai_creative_assets;
create policy "admin manage ai creative assets" on public.cb_ai_creative_assets for all to authenticated using (true) with check (true);

drop policy if exists "admin read ai creative logs" on public.cb_ai_creative_logs;
create policy "admin read ai creative logs" on public.cb_ai_creative_logs for select to authenticated using (true);

create index if not exists cb_ai_creative_drafts_status_idx on public.cb_ai_creative_drafts (status, created_at desc);
create index if not exists cb_ai_creative_drafts_theme_idx on public.cb_ai_creative_drafts (theme_category, theme_option, created_at desc);
create index if not exists cb_ai_creative_assets_draft_idx on public.cb_ai_creative_assets (draft_id, position);
create index if not exists cb_ai_creative_logs_created_idx on public.cb_ai_creative_logs (created_at desc);

drop policy if exists "admin upload ai creatives" on storage.objects;
create policy "admin upload ai creatives" on storage.objects for insert to authenticated with check (bucket_id = 'ai-generated-creatives');

drop policy if exists "admin update ai creatives" on storage.objects;
create policy "admin update ai creatives" on storage.objects for update to authenticated using (bucket_id = 'ai-generated-creatives') with check (bucket_id = 'ai-generated-creatives');

drop policy if exists "public read ai creatives" on storage.objects;
create policy "public read ai creatives" on storage.objects for select to public using (bucket_id = 'ai-generated-creatives');
