insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('instagram-media', 'instagram-media', true, 104857600, array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.cb_instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  facebook_user_id text,
  facebook_page_id text,
  facebook_page_name text,
  instagram_user_id text not null unique,
  instagram_username text,
  access_token text not null,
  token_expires_at timestamptz,
  token_last_refreshed_at timestamptz,
  is_active boolean not null default true,
  last_error text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cb_instagram_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.cb_instagram_accounts(id) on delete cascade,
  title text,
  caption text,
  post_type text not null check (post_type in ('feed_image','feed_video','reel','story','carousel')),
  scheduled_at timestamptz not null,
  timezone text not null default 'America/Sao_Paulo',
  campaign text,
  status text not null default 'scheduled' check (status in ('draft','scheduled','publishing','container_created','pending_confirmation','published','error','cancelled')),
  publish_lock_id uuid,
  publishing_started_at timestamptz,
  attempt_count int not null default 0,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  published_at timestamptz,
  ig_container_id text,
  ig_media_id text,
  permalink text,
  error_message text,
  graph_response jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cb_instagram_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.cb_instagram_posts(id) on delete cascade,
  position int not null default 0,
  media_url text not null,
  media_path text,
  media_mime_type text,
  media_kind text not null check (media_kind in ('image','video')),
  ig_child_container_id text,
  graph_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cb_instagram_publish_logs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.cb_instagram_posts(id) on delete cascade,
  account_id uuid references public.cb_instagram_accounts(id) on delete set null,
  lock_id uuid,
  event_type text not null,
  status text,
  message text,
  graph_endpoint text,
  graph_response jsonb,
  duration_ms int,
  created_at timestamptz not null default now()
);

alter table public.cb_instagram_accounts enable row level security;
alter table public.cb_instagram_posts enable row level security;
alter table public.cb_instagram_post_media enable row level security;
alter table public.cb_instagram_publish_logs enable row level security;

drop policy if exists "admin manage instagram accounts" on public.cb_instagram_accounts;
create policy "admin manage instagram accounts" on public.cb_instagram_accounts for all to authenticated using (true) with check (true);

drop policy if exists "admin manage instagram posts" on public.cb_instagram_posts;
create policy "admin manage instagram posts" on public.cb_instagram_posts for all to authenticated using (true) with check (true);

drop policy if exists "admin manage instagram media" on public.cb_instagram_post_media;
create policy "admin manage instagram media" on public.cb_instagram_post_media for all to authenticated using (true) with check (true);

drop policy if exists "admin read instagram logs" on public.cb_instagram_publish_logs;
create policy "admin read instagram logs" on public.cb_instagram_publish_logs for select to authenticated using (true);

create index if not exists cb_instagram_posts_publish_idx on public.cb_instagram_posts (status, scheduled_at);
create index if not exists cb_instagram_posts_stale_idx on public.cb_instagram_posts (status, publishing_started_at);
create index if not exists cb_instagram_posts_account_idx on public.cb_instagram_posts (account_id, scheduled_at desc);
create index if not exists cb_instagram_post_media_post_idx on public.cb_instagram_post_media (post_id, position);
create index if not exists cb_instagram_publish_logs_post_idx on public.cb_instagram_publish_logs (post_id, created_at desc);
create index if not exists cb_instagram_publish_logs_created_idx on public.cb_instagram_publish_logs (created_at desc);

drop policy if exists "admin upload instagram media" on storage.objects;
create policy "admin upload instagram media" on storage.objects for insert to authenticated with check (bucket_id = 'instagram-media');

drop policy if exists "admin update instagram media" on storage.objects;
create policy "admin update instagram media" on storage.objects for update to authenticated using (bucket_id = 'instagram-media') with check (bucket_id = 'instagram-media');

drop policy if exists "admin delete instagram media" on storage.objects;
create policy "admin delete instagram media" on storage.objects for delete to authenticated using (bucket_id = 'instagram-media');

drop policy if exists "public read instagram media" on storage.objects;
create policy "public read instagram media" on storage.objects for select to public using (bucket_id = 'instagram-media');

insert into auth.audit_log_entries (instance_id, id, payload, created_at, ip_address)
values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), '{"action":"instagram_scheduler_added"}'::jsonb, now(), '127.0.0.1');
