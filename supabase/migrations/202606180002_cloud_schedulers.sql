create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'codigobase-instagram-scheduler-every-minute') then
    perform cron.unschedule('codigobase-instagram-scheduler-every-minute');
  end if;
  if exists (select 1 from cron.job where jobname = 'codigobase-whatsapp-status-scheduler-every-minute') then
    perform cron.unschedule('codigobase-whatsapp-status-scheduler-every-minute');
  end if;
  if exists (select 1 from cron.job where jobname = 'codigobase-instagram-token-refresh-daily') then
    perform cron.unschedule('codigobase-instagram-token-refresh-daily');
  end if;
end $$;

select cron.schedule(
  'codigobase-instagram-scheduler-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'codigobase_project_url') || '/functions/v1/instagram-scheduler?secret=' || (select decrypted_secret from vault.decrypted_secrets where name = 'codigobase_instagram_scheduler_secret'),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('source', 'pg_cron', 'job', 'instagram-scheduler', 'time', now()::text),
    timeout_milliseconds := 300000
  ) as request_id;
  $$
);

select cron.schedule(
  'codigobase-whatsapp-status-scheduler-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'codigobase_project_url') || '/functions/v1/status-scheduler?secret=' || (select decrypted_secret from vault.decrypted_secrets where name = 'codigobase_whatsapp_status_scheduler_secret'),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('source', 'pg_cron', 'job', 'whatsapp-status-scheduler', 'time', now()::text),
    timeout_milliseconds := 300000
  ) as request_id;
  $$
);

select cron.schedule(
  'codigobase-instagram-token-refresh-daily',
  '17 6 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'codigobase_project_url') || '/functions/v1/refresh-instagram-tokens?secret=' || (select decrypted_secret from vault.decrypted_secrets where name = 'codigobase_instagram_scheduler_secret'),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('source', 'pg_cron', 'job', 'instagram-token-refresh', 'time', now()::text),
    timeout_milliseconds := 300000
  ) as request_id;
  $$
);
