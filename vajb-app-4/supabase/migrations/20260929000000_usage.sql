-- Daily free-generation counter and premium flag, one row per (anonymous) user.

create table public.usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);

create table public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  is_premium boolean not null default false,
  premium_until timestamptz
);

alter table public.usage enable row level security;
alter table public.profiles enable row level security;

create policy "read own usage" on public.usage for select to authenticated using ((select auth.uid()) = user_id);
create policy "read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);

-- Atomically takes one credit for today (Croatian time).
-- Returns credits left after this one, or -1 when the daily limit is reached.
create or replace function public.take_credit(p_user uuid, p_limit int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  used int;
begin
  insert into public.usage (user_id, day, count)
  values (p_user, (now() at time zone 'Europe/Zagreb')::date, 1)
  on conflict (user_id, day) do update
    set count = public.usage.count + 1
    where public.usage.count < p_limit
  returning count into used;

  if used is null then
    return -1;
  end if;
  return p_limit - used;
end;
$$;

-- Gives a credit back when the AI call failed.
create or replace function public.refund_credit(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.usage
  set count = greatest(count - 1, 0)
  where user_id = p_user and day = (now() at time zone 'Europe/Zagreb')::date;
$$;

revoke execute on function public.take_credit(uuid, int) from public, anon, authenticated;
revoke execute on function public.refund_credit(uuid) from public, anon, authenticated;
grant execute on function public.take_credit(uuid, int) to service_role;
grant execute on function public.refund_credit(uuid) to service_role;
