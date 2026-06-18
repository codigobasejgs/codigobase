do $$
begin
  if exists (select 1 from cron.job where jobname = 'codigobase-ai-creative-daily-generator') then
    perform cron.unschedule('codigobase-ai-creative-daily-generator');
  end if;
end $$;

select cron.schedule(
  'codigobase-ai-creative-daily-generator',
  '30 6 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'codigobase_project_url') || '/functions/v1/creative-daily-generator?secret=' || (select decrypted_secret from vault.decrypted_secrets where name = 'codigobase_instagram_scheduler_secret'),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('source', 'pg_cron', 'job', 'ai-creative-daily-generator', 'time', now()::text),
    timeout_milliseconds := 300000
  ) as request_id;
  $$
);
