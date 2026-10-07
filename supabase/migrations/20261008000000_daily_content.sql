-- "Inspiration of the day": generated once per day and language, shared by all users.
-- Only the edge function (service role) reads and writes it.

create table public.daily_content (
  day date not null,
  lang text not null,
  content jsonb not null,
  primary key (day, lang)
);

alter table public.daily_content enable row level security;
