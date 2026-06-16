create extension if not exists pgcrypto;

create table if not exists public.cb_whatsapp_contacts (
  id uuid primary key default gen_random_uuid(),
  remote_jid text not null unique,
  phone text,
  push_name text,
  is_group boolean not null default false,
  suspected_bot boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cb_whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.cb_whatsapp_contacts(id) on delete cascade,
  remote_jid text not null unique,
  status text not null default 'open' check (status in ('open','pending_human','closed')),
  ai_enabled boolean not null default true,
  ai_paused boolean not null default false,
  pause_reason text,
  is_group boolean not null default false,
  suspected_bot boolean not null default false,
  service_interest text,
  last_message_at timestamptz,
  last_human_at timestamptz,
  last_ai_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cb_whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.cb_whatsapp_conversations(id) on delete cascade,
  evolution_message_id text unique,
  remote_jid text not null,
  from_me boolean not null default false,
  sender_type text not null default 'customer' check (sender_type in ('customer','ai','human','system')),
  message_type text not null default 'text',
  content text,
  media_url text,
  media_mime_type text,
  media_base64 text,
  ai_summary text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cb_ai_settings (
  id int primary key default 1,
  enabled boolean not null default true,
  model text not null default 'gemini-3-flash',
  business_name text not null default 'Código Base',
  system_prompt text not null default 'Você é a assistente comercial da Código Base. Responda em português do Brasil, seja objetiva, cordial e focada em entender a necessidade do cliente para oferecer serviços de tecnologia, IA, sistemas, dashboards, marketing digital, automação, WhatsApp, Instagram, hardware e suporte. Nunca diga que é humana. Se o cliente pedir atendimento humano, sinalize que um especialista vai assumir.',
  handoff_keywords text[] not null default array['humano','atendente','pessoa','vendedor','consultor','falar com alguém','quero falar com humano'],
  bot_detection_keywords text[] not null default array['sou assistente virtual','mensagem automática','resposta automática','bot','chatbot','assistente de ia','ia atendendo'],
  updated_at timestamptz not null default now(),
  constraint only_one_cb_ai_settings check (id = 1)
);

insert into public.cb_ai_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.cb_conversation_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.cb_whatsapp_conversations(id) on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cb_webhook_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'evolution',
  event text,
  remote_jid text,
  ignored boolean not null default false,
  ignore_reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.cb_whatsapp_contacts enable row level security;
alter table public.cb_whatsapp_conversations enable row level security;
alter table public.cb_whatsapp_messages enable row level security;
alter table public.cb_ai_settings enable row level security;
alter table public.cb_conversation_events enable row level security;
alter table public.cb_webhook_logs enable row level security;

drop policy if exists "admin read contacts" on public.cb_whatsapp_contacts;
create policy "admin read contacts" on public.cb_whatsapp_contacts for select to authenticated using (true);

drop policy if exists "admin read conversations" on public.cb_whatsapp_conversations;
create policy "admin read conversations" on public.cb_whatsapp_conversations for select to authenticated using (true);

drop policy if exists "admin update conversations" on public.cb_whatsapp_conversations;
create policy "admin update conversations" on public.cb_whatsapp_conversations for update to authenticated using (true) with check (true);

drop policy if exists "admin read messages" on public.cb_whatsapp_messages;
create policy "admin read messages" on public.cb_whatsapp_messages for select to authenticated using (true);

drop policy if exists "admin read ai settings" on public.cb_ai_settings;
create policy "admin read ai settings" on public.cb_ai_settings for select to authenticated using (true);

drop policy if exists "admin update ai settings" on public.cb_ai_settings;
create policy "admin update ai settings" on public.cb_ai_settings for update to authenticated using (true) with check (true);

create or replace view public.whatsapp_admin_analytics as
select
  (select count(*) from public.cb_whatsapp_contacts where is_group = false) as total_contacts,
  (select count(*) from public.cb_whatsapp_conversations where is_group = false) as total_conversations,
  (select count(*) from public.cb_whatsapp_messages where from_me = false) as total_inbound_messages,
  (select count(*) from public.cb_whatsapp_messages where sender_type = 'ai') as total_ai_messages,
  (select count(*) from public.cb_whatsapp_conversations where ai_paused = true) as ai_paused_conversations,
  (select service_interest from public.cb_whatsapp_conversations where service_interest is not null group by service_interest order by count(*) desc limit 1) as top_service_interest;
