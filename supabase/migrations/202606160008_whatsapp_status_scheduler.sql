insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('whatsapp-status-media', 'whatsapp-status-media', true, 10485760, array['image/png','image/jpeg','image/webp','video/mp4'])
on conflict (id) do update set public = true;

create table if not exists public.cb_whatsapp_status_posts (
  id uuid primary key default gen_random_uuid(),
  title text,
  caption text,
  media_url text,
  media_path text,
  media_mime_type text,
  scheduled_at timestamptz not null,
  timezone text not null default 'America/Sao_Paulo',
  repeat_type text not null default 'once' check (repeat_type in ('once','daily','weekly')),
  repeat_days int[] not null default '{}',
  status text not null default 'scheduled' check (status in ('scheduled','publishing','published','error','cancelled')),
  published_at timestamptz,
  last_attempt_at timestamptz,
  error_message text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cb_whatsapp_status_posts enable row level security;

drop policy if exists "admin read status posts" on public.cb_whatsapp_status_posts;
create policy "admin read status posts" on public.cb_whatsapp_status_posts for select to authenticated using (true);

drop policy if exists "admin insert status posts" on public.cb_whatsapp_status_posts;
create policy "admin insert status posts" on public.cb_whatsapp_status_posts for insert to authenticated with check (true);

drop policy if exists "admin update status posts" on public.cb_whatsapp_status_posts;
create policy "admin update status posts" on public.cb_whatsapp_status_posts for update to authenticated using (true) with check (true);

drop policy if exists "admin delete status posts" on public.cb_whatsapp_status_posts;
create policy "admin delete status posts" on public.cb_whatsapp_status_posts for delete to authenticated using (true);

drop policy if exists "admin upload whatsapp status media" on storage.objects;
create policy "admin upload whatsapp status media" on storage.objects for insert to authenticated with check (bucket_id = 'whatsapp-status-media');

drop policy if exists "admin update whatsapp status media" on storage.objects;
create policy "admin update whatsapp status media" on storage.objects for update to authenticated using (bucket_id = 'whatsapp-status-media') with check (bucket_id = 'whatsapp-status-media');

drop policy if exists "public read whatsapp status media" on storage.objects;
create policy "public read whatsapp status media" on storage.objects for select to public using (bucket_id = 'whatsapp-status-media');
