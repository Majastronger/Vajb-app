-- Total free generations of a kind today, across all users (for the daily budget cap).
create function public.usage_today(p_kind text)
returns int
language sql
security definer
set search_path = ''
as $$
  select coalesce(sum(count), 0)::int
  from public.usage
  where kind = p_kind and day = (now() at time zone 'Europe/Zagreb')::date;
$$;

revoke execute on function public.usage_today(text) from public, anon, authenticated;
grant execute on function public.usage_today(text) to service_role;
