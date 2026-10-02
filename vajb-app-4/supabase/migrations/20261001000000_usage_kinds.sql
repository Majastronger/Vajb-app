-- Separate daily counters for text and image generations.

alter table public.usage add column kind text not null default 'text';
alter table public.usage drop constraint usage_pkey;
alter table public.usage add primary key (user_id, day, kind);

drop function public.take_credit(uuid, int);
drop function public.refund_credit(uuid);

-- Atomically takes one credit of the given kind for today (Croatian time).
-- Returns credits left after this one, or -1 when the daily limit is reached.
create function public.take_credit(p_user uuid, p_limit int, p_kind text)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  used int;
begin
  insert into public.usage (user_id, day, kind, count)
  values (p_user, (now() at time zone 'Europe/Zagreb')::date, p_kind, 1)
  on conflict (user_id, day, kind) do update
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
create function public.refund_credit(p_user uuid, p_kind text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.usage
  set count = greatest(count - 1, 0)
  where user_id = p_user and kind = p_kind and day = (now() at time zone 'Europe/Zagreb')::date;
$$;

revoke execute on function public.take_credit(uuid, int, text) from public, anon, authenticated;
revoke execute on function public.refund_credit(uuid, text) from public, anon, authenticated;
grant execute on function public.take_credit(uuid, int, text) to service_role;
grant execute on function public.refund_credit(uuid, text) to service_role;
