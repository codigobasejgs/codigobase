alter table public.cb_whatsapp_status_posts
  add column if not exists recurrence_enabled boolean not null default false,
  add column if not exists recurrence_frequency text not null default 'none' check (recurrence_frequency in ('none','daily','weekly','monthly')),
  add column if not exists recurrence_times text[] not null default '{}',
  add column if not exists recurrence_weekdays int[] not null default '{}',
  add column if not exists recurrence_month_days int[] not null default '{}',
  add column if not exists recurrence_until timestamptz,
  add column if not exists recurrence_source_id uuid;

alter table public.cb_instagram_posts
  add column if not exists recurrence_enabled boolean not null default false,
  add column if not exists recurrence_frequency text not null default 'none' check (recurrence_frequency in ('none','daily','weekly','monthly')),
  add column if not exists recurrence_times text[] not null default '{}',
  add column if not exists recurrence_weekdays int[] not null default '{}',
  add column if not exists recurrence_month_days int[] not null default '{}',
  add column if not exists recurrence_until timestamptz,
  add column if not exists recurrence_source_id uuid;

create index if not exists cb_whatsapp_status_posts_recurrence_source_idx on public.cb_whatsapp_status_posts (recurrence_source_id, scheduled_at);
create index if not exists cb_instagram_posts_recurrence_source_idx on public.cb_instagram_posts (recurrence_source_id, scheduled_at);
