-- Run only AFTER deploying and smoke-testing the Vercel API.
-- Set Vault secrets qada_push_cron_url (full HTTPS /api/notifications/cron URL)
-- and qada_push_cron_secret (same CRON_SECRET as Vercel) via the Vault UI.
-- No private values should be pasted into a shared SQL snippet or committed.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists(select 1 from vault.decrypted_secrets where name='qada_push_cron_url')
     or not exists(select 1 from vault.decrypted_secrets where name='qada_push_cron_secret') then
    raise exception 'Configure the two qada_push Vault secrets before enabling the scheduler';
  end if;
end $$;

select cron.schedule('qada-web-push-every-minute', '* * * * *', $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='qada_push_cron_url' limit 1),
    headers := jsonb_build_object('Content-Type','application/json','Authorization',
      'Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='qada_push_cron_secret' limit 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$job$);

-- Inspect cron.job / cron.job_run_details and net._http_response for failures.
-- push_health.last_tick confirms completion, unlike pg_net request acceptance.
-- Pause safely with: select cron.unschedule('qada-web-push-every-minute');
