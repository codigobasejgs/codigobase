alter table public.cb_ai_settings
  add column if not exists gemini_api_key text,
  add column if not exists updated_by uuid;
