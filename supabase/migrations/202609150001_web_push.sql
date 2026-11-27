-- Device-scoped Web Push. No browser access to endpoints or encryption keys.
create table if not exists public.push_devices (
  id uuid primary key,
  token_hash text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  platform text not null,
  user_agent text not null,
  timezone text not null,
  preferences jsonb not null,
  revision integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  next_plan_at timestamptz not null default now(),
  last_successful_push timestamptz,
  last_displayed_push timestamptz,
  last_push_error text
);
create index if not exists push_devices_planning on public.push_devices(next_plan_at) where active;
create table if not exists public.push_jobs (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.push_devices(id) on delete cascade,
  notification_id text not null,
  kind text not null,
  revision integer not null,
  due_at timestamptz not null,
  expires_at timestamptz not null,
  payload jsonb not null,
  status text not null default 'pending' check(status in ('pending','sending','sent','failed','expired','cancelled')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  lease_until timestamptz,
  lease_token uuid,
  last_error text,
  accepted_at timestamptz,
  displayed_at timestamptz,
  clicked_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(device_id,notification_id)
);
create index if not exists push_jobs_due on public.push_jobs(available_at,due_at) where status in ('pending','sending');
create table if not exists public.push_rate_limits (
  bucket text primary key, hits integer not null, reset_at timestamptz not null
);
create table if not exists public.push_daily_duas (day date primary key, dua_id text not null);
create table if not exists public.push_dua_bag (
  id integer primary key check(id=1), remaining text[] not null default '{}', previous text
);
insert into public.push_dua_bag(id) values(1) on conflict do nothing;
create table if not exists public.push_health (
  id integer primary key check(id=1), last_tick timestamptz, last_error text
);
insert into public.push_health(id) values(1) on conflict do nothing;

alter table public.push_devices enable row level security;
alter table public.push_jobs enable row level security;
alter table public.push_rate_limits enable row level security;
alter table public.push_daily_duas enable row level security;
alter table public.push_dua_bag enable row level security;
alter table public.push_health enable row level security;
revoke all on public.push_devices, public.push_jobs, public.push_rate_limits, public.push_daily_duas, public.push_dua_bag, public.push_health from anon, authenticated;
grant all on public.push_devices, public.push_jobs, public.push_rate_limits, public.push_daily_duas, public.push_dua_bag, public.push_health to service_role;

create or replace function public.push_rate_limit(p_bucket text, p_limit integer, p_seconds integer)
returns boolean language plpgsql set search_path=public as $$
declare n integer;
begin
 insert into push_rate_limits(bucket,hits,reset_at) values(p_bucket,1,now()+make_interval(secs=>p_seconds))
 on conflict(bucket) do update set
 hits=case when push_rate_limits.reset_at<=now() then 1 else push_rate_limits.hits+1 end,
 reset_at=case when push_rate_limits.reset_at<=now() then excluded.reset_at else push_rate_limits.reset_at end
 returning hits into n;
 return n<=p_limit;
end $$;

-- Row lock makes subscription updates atomic and keeps previously registered
-- endpoints owned by their original unguessable device capability.
create or replace function public.push_register(p_id uuid,p_hash text,p_endpoint text,p_p256dh text,p_auth text,p_platform text,p_agent text,p_timezone text,p_preferences jsonb)
returns jsonb language plpgsql set search_path=public as $$
declare d push_devices; changed boolean;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into d from push_devices where id=p_id for update;
 if found then
   if d.token_hash<>p_hash then raise exception 'device_not_owned'; end if;
   changed:=d.endpoint<>p_endpoint or d.timezone<>p_timezone or d.preferences<>p_preferences or not d.active;
   update push_devices set endpoint=p_endpoint,p256dh=p_p256dh,auth=p_auth,platform=p_platform,user_agent=p_agent,
     timezone=p_timezone,preferences=p_preferences,active=true,updated_at=now(),last_push_error=null,
     revision=revision+case when changed then 1 else 0 end,
     next_plan_at=case when changed then now() else next_plan_at end where id=p_id returning * into d;
   if changed then
     update push_jobs set status='cancelled' where device_id=p_id and status in ('pending','sending');
   end if;
 else
   insert into push_devices(id,token_hash,endpoint,p256dh,auth,platform,user_agent,timezone,preferences)
   values(p_id,p_hash,p_endpoint,p_p256dh,p_auth,p_platform,p_agent,p_timezone,p_preferences) returning * into d;
 end if;
 return jsonb_build_object('id',d.id,'active',d.active,'revision',d.revision);
end $$;

create or replace function public.push_claim_planning(p_limit integer default 100)
returns setof public.push_devices language sql set search_path=public as $$
 with due as (select id from push_devices where active and next_plan_at<=now() order by next_plan_at for update skip locked limit least(p_limit,100))
 update push_devices d set next_plan_at=now()+interval '5 minutes' from due where d.id=due.id returning d.*;
$$;

-- Cancelled jobs can be rescheduled after a preference edit, but a sent
-- occurrence can never be recreated by a retry or another scheduler worker.
create or replace function public.push_enqueue(p_device uuid,p_revision integer,p_jobs jsonb)
returns void language plpgsql set search_path=public as $$
declare item jsonb;
begin
 perform 1 from push_devices where id=p_device and revision=p_revision and active for update;
 if not found then return; end if;
 for item in select value from jsonb_array_elements(p_jobs) loop
   insert into push_jobs(device_id,notification_id,kind,revision,due_at,expires_at,payload,available_at)
   values(p_device,item->>'notification_id',item->>'kind',p_revision,(item->>'due_at')::timestamptz,(item->>'expires_at')::timestamptz,item->'payload',(item->>'due_at')::timestamptz)
   on conflict(device_id,notification_id) do update set revision=excluded.revision,due_at=excluded.due_at,
     expires_at=excluded.expires_at,payload=excluded.payload,available_at=excluded.available_at,status='pending',attempts=0
   where push_jobs.status='cancelled' and push_jobs.accepted_at is null;
 end loop;
end $$;

create or replace function public.push_claim_jobs(p_limit integer default 100)
returns setof public.push_jobs language plpgsql set search_path=public as $$
begin
 update push_jobs set status='expired' where status in ('pending','sending') and expires_at<=now();
 return query with due as (
   select j.id from push_jobs j join push_devices d on d.id=j.device_id
   where d.active and j.revision=d.revision and j.due_at<=now() and j.available_at<=now()
   and j.expires_at>now() and j.attempts<4
   and (j.status='pending' or (j.status='sending' and j.lease_until<now()))
   order by j.due_at for update of j skip locked limit least(p_limit,100)
 ) update push_jobs j set status='sending',attempts=attempts+1,lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid()
 from due where j.id=due.id returning j.*;
 update push_jobs set status='failed',last_error='retry_limit' where status='sending' and attempts>=4 and lease_until<now();
end $$;

create or replace function public.push_claim_test(p_device uuid,p_notification text)
returns setof public.push_jobs language sql set search_path=public as $$
 with due as (
   select j.id from push_jobs j join push_devices d on d.id=j.device_id
   where j.device_id=p_device and j.notification_id=p_notification and j.kind='test'
   and d.active and d.revision=j.revision and j.status='pending' and j.due_at<=now()
   and j.expires_at>now() and j.available_at<=now() and j.attempts<4
   for update of j skip locked
 ) update push_jobs j set status='sending',attempts=attempts+1,
   lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid()
 from due where j.id=due.id returning j.*;
$$;
revoke all on function public.push_claim_test(uuid,text) from public,anon,authenticated;
grant execute on function public.push_claim_test(uuid,text) to service_role;

create or replace function public.push_select_dua(p_day date,p_ids text[])
returns text language plpgsql set search_path=public as $$
declare chosen text; bag push_dua_bag;
begin
 select * into bag from push_dua_bag where id=1 for update;
 select dua_id into chosen from push_daily_duas where day=p_day;
 if found then return chosen; end if;
 if cardinality(bag.remaining)=0 then
   select array_agg(x order by random()) into bag.remaining from unnest(p_ids) x;
   if cardinality(bag.remaining)>1 and bag.remaining[1]=bag.previous then
     bag.remaining:=bag.remaining[2:cardinality(bag.remaining)]||bag.remaining[1];
   end if;
 end if;
 chosen:=bag.remaining[1];
 if chosen is null then raise exception 'empty_dua_dataset'; end if;
 update push_dua_bag set remaining=bag.remaining[2:cardinality(bag.remaining)],previous=chosen where id=1;
 insert into push_daily_duas(day,dua_id) values(p_day,chosen);
 return chosen;
end $$;

revoke all on function public.push_rate_limit(text,integer,integer), public.push_register(uuid,text,text,text,text,text,text,text,jsonb), public.push_claim_planning(integer), public.push_enqueue(uuid,integer,jsonb), public.push_claim_jobs(integer), public.push_select_dua(date,text[]) from public,anon,authenticated;
grant execute on function public.push_rate_limit(text,integer,integer), public.push_register(uuid,text,text,text,text,text,text,text,jsonb), public.push_claim_planning(integer), public.push_enqueue(uuid,integer,jsonb), public.push_claim_jobs(integer), public.push_select_dua(date,text[]) to service_role;
