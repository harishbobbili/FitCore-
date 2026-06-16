-- Run this first if Supabase says: relation "public.cardio_logs" does not exist.
-- Then run FITCORE_FULL_SETUP.sql again.

create extension if not exists "pgcrypto";

create table if not exists public.cardio_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date default current_date not null,
  type text not null check (type in ('walk', 'run', 'hiit', 'jump_rope')),
  duration_mins integer default 0 not null check (duration_mins >= 0),
  distance_km numeric default 0 not null check (distance_km >= 0),
  calories_burned integer default 0 not null check (calories_burned >= 0),
  avg_heart_rate integer check (avg_heart_rate > 0),
  incline_pct numeric default 0 check (incline_pct >= 0),
  logged_at timestamptz default now() not null
);

alter table public.cardio_logs add column if not exists logged_at timestamptz default now();
alter table public.cardio_logs enable row level security;

drop policy if exists "Users can crud own cardio logs" on public.cardio_logs;
create policy "Users can crud own cardio logs" on public.cardio_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists cardio_logs_user_date_idx on public.cardio_logs(user_id, date);
