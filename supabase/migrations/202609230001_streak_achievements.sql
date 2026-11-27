-- Account-owned, append-only activity/achievement ledgers. Independent of snapshot backups.
create table if not exists public.streak_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null
);
create table if not exists public.streak_activity_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null,
  activity_date date not null,
  activity_type text not null check(activity_type in ('qada_prayer','istighfar','quran','wird','adhkar','fasting')),
  occurred_at timestamptz not null,
  timezone text not null,
  primary key(user_id, event_id),
  unique(user_id, activity_date, activity_type)
);
create table if not exists public.streak_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  event_id uuid not null default gen_random_uuid(),
  unlocked_at date not null,
  primary key(user_id, achievement_id),
  unique(user_id, event_id)
);
alter table public.streak_accounts enable row level security;
alter table public.streak_activity_events enable row level security;
alter table public.streak_achievements enable row level security;
revoke all on public.streak_accounts, public.streak_activity_events, public.streak_achievements from anon, authenticated;
-- All writes go through the authenticated transactional function, not client snapshot upserts.
create or replace function public.sync_daily_streak(
  p_events jsonb default '[]', p_achievements jsonb default '[]',
  p_timezone text default 'UTC', p_set_timezone boolean default false
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  uid uuid := auth.uid(); zone text; ev jsonb; d date; run integer := 0;
  prev date; milestone integer; earned date; award_id text; supplied_id uuid;
begin
  if uid is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if not exists(select 1 from pg_timezone_names where name = p_timezone) then raise exception 'Invalid timezone'; end if;
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 500 then raise exception 'Invalid batch'; end if;
  if jsonb_typeof(p_achievements) <> 'array' or jsonb_array_length(p_achievements) > 9 then raise exception 'Invalid achievements'; end if;
  insert into streak_accounts(user_id, timezone) values(uid, p_timezone) on conflict do nothing;
  -- Serialize same-account sync requests; concurrent devices cannot lose activity or awards.
  select timezone into zone from streak_accounts where user_id = uid for update;
  if p_set_timezone then
    zone := p_timezone;
    update streak_accounts set timezone = zone where user_id = uid;
  end if;
  for ev in select value from jsonb_array_elements(p_events) loop
    if not exists(select 1 from pg_timezone_names where name = ev->>'timezone') then raise exception 'Invalid event timezone'; end if;
    d := ((ev->>'occurredAt')::timestamptz at time zone (ev->>'timezone'))::date;
    if d <> (ev->>'date')::date or (ev->>'occurredAt')::timestamptz > now() + interval '5 minutes' then raise exception 'Invalid activity date'; end if;
    insert into streak_activity_events(user_id,event_id,activity_date,activity_type,occurred_at,timezone)
      values(uid,(ev->>'eventId')::uuid,d,ev->>'type',(ev->>'occurredAt')::timestamptz,ev->>'timezone')
      on conflict do nothing;
  end loop;
  -- Derive awards from the full union of days, including offline backfills. Never delete an award.
  for d in select distinct activity_date from streak_activity_events where user_id = uid order by activity_date loop
    run := case when prev = d - 1 then run + 1 else 1 end;
    if run = any(array[1,3,7,14,30,60,100,180,365]) then
      award_id := 'streak_' || run;
      supplied_id := null;
      select (value->>'eventId')::uuid into supplied_id from jsonb_array_elements(p_achievements)
        where value->>'achievementId' = award_id limit 1;
      insert into streak_achievements(user_id,achievement_id,event_id,unlocked_at)
        values(uid,award_id,coalesce(supplied_id,gen_random_uuid()),d)
        on conflict(user_id,achievement_id) do update set unlocked_at = least(streak_achievements.unlocked_at,excluded.unlocked_at);
    end if;
    prev := d;
  end loop;
  return jsonb_build_object('timezone',zone,
    'events',coalesce((select jsonb_agg(jsonb_build_object('eventId',event_id,'type',activity_type,'date',activity_date,'occurredAt',occurred_at,'timezone',timezone)) from streak_activity_events where user_id=uid),'[]'::jsonb),
    'achievements',coalesce((select jsonb_agg(jsonb_build_object('eventId',event_id,'achievementId',achievement_id,'type','streak','unlockedAt',unlocked_at)) from streak_achievements where user_id=uid),'[]'::jsonb));
end $$;
revoke all on function public.sync_daily_streak(jsonb,jsonb,text,boolean) from public, anon;
grant execute on function public.sync_daily_streak(jsonb,jsonb,text,boolean) to authenticated;
