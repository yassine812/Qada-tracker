-- Daily visits use the same account-owned ledger and transactional RPC.
-- Preserve existing activities, awards, uniqueness rules, and access controls.
begin;
alter table public.streak_activity_events
  drop constraint if exists streak_activity_events_activity_type_check;
alter table public.streak_activity_events
  add constraint streak_activity_events_activity_type_check
  check (activity_type in ('app_open','qada_prayer','istighfar','quran','wird','adhkar','fasting'));
commit;
