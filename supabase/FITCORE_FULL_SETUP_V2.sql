-- FitCore complete Supabase setup
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> Run.
-- Safe to run more than once.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. TABLES
--------------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text,
  height_cm numeric default 162.5,
  weight_kg numeric default 63,
  goal text default 'Fat Loss + Visible Abs',
  experience_level text default 'Intermediate',
  avatar_url text,
  created_at timestamptz default now() not null
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  height_cm numeric default 162.5,
  weight_kg numeric default 63,
  goal text default 'Fat Loss',
  experience text default 'Intermediate',
  maintenance_kcal integer default 2200,
  target_kcal integer default 1800,
  protein_goal_g integer default 120,
  carbs_goal_g integer default 180,
  fat_goal_g integer default 55,
  water_goal_ml integer default 3000,
  step_goal integer default 9000,
  workout_days_per_week integer default 5,
  created_at timestamptz default now() not null
);

create table if not exists public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date default current_date not null,
  calories_consumed integer default 0 not null,
  protein_g integer default 0 not null,
  carbs_g integer default 0 not null,
  fat_g integer default 0 not null,
  water_ml integer default 0 not null,
  steps integer default 0 not null,
  sleep_hours numeric default 0 not null,
  mood_score integer,
  weight_kg numeric,
  unique (user_id, date)
);

create table if not exists public.meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_id uuid references public.daily_logs(id) on delete set null,
  date date default current_date not null,
  meal_slot text not null,
  food_name text,
  name text,
  quantity_g numeric default 0,
  calories integer default 0 not null,
  protein_g integer default 0 not null,
  carbs_g integer default 0 not null,
  fat_g integer default 0 not null,
  logged_at timestamptz default now() not null,
  time_logged timestamptz default now() not null
);

create table if not exists public.workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date default current_date not null,
  split_name text not null,
  started_at timestamptz default now() not null,
  finished_at timestamptz,
  duration_mins integer default 0 not null,
  calories_burned integer default 0 not null,
  calories_burned_est integer default 0 not null,
  notes text
);

create table if not exists public.exercise_sets (
  id uuid default gen_random_uuid() primary key,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  exercise_name text not null,
  set_number integer not null,
  reps integer not null,
  weight_kg numeric not null,
  rest_seconds integer default 60 not null,
  duration_secs integer,
  is_pr boolean default false not null,
  logged_at timestamptz default now() not null
);

create table if not exists public.cardio_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date default current_date not null,
  type text not null,
  duration_mins integer default 0 not null,
  distance_km numeric default 0 not null,
  calories_burned integer default 0 not null,
  avg_heart_rate integer,
  incline_pct numeric default 0,
  logged_at timestamptz default now() not null
);

create table if not exists public.body_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date default current_date not null,
  weight_kg numeric not null,
  body_fat_pct numeric,
  chest_cm numeric,
  waist_cm numeric,
  hip_cm numeric,
  notes text,
  unique (user_id, date)
);

create table if not exists public.streaks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  current_streak integer default 0 not null,
  longest_streak integer default 0 not null,
  last_workout_date date
);

create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz default now() not null,
  unique (user_id, badge_id)
);

--------------------------------------------------------------------------------
-- 2. REPAIR / ADD MISSING COLUMNS IF TABLES ALREADY EXISTED
--------------------------------------------------------------------------------

alter table public.users add column if not exists email text;
alter table public.users add column if not exists name text;
alter table public.users add column if not exists height_cm numeric default 162.5;
alter table public.users add column if not exists weight_kg numeric default 63;
alter table public.users add column if not exists goal text default 'Fat Loss + Visible Abs';
alter table public.users add column if not exists experience_level text default 'Intermediate';
alter table public.users add column if not exists avatar_url text;
alter table public.users add column if not exists created_at timestamptz default now();

alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists height_cm numeric default 162.5;
alter table public.profiles add column if not exists weight_kg numeric default 63;
alter table public.profiles add column if not exists goal text default 'Fat Loss';
alter table public.profiles add column if not exists experience text default 'Intermediate';
alter table public.profiles add column if not exists maintenance_kcal integer default 2200;
alter table public.profiles add column if not exists target_kcal integer default 1800;
alter table public.profiles add column if not exists protein_goal_g integer default 120;
alter table public.profiles add column if not exists carbs_goal_g integer default 180;
alter table public.profiles add column if not exists fat_goal_g integer default 55;
alter table public.profiles add column if not exists water_goal_ml integer default 3000;
alter table public.profiles add column if not exists step_goal integer default 9000;
alter table public.profiles add column if not exists workout_days_per_week integer default 5;
alter table public.profiles add column if not exists created_at timestamptz default now();

alter table public.daily_logs add column if not exists calories_consumed integer default 0;
alter table public.daily_logs add column if not exists protein_g integer default 0;
alter table public.daily_logs add column if not exists carbs_g integer default 0;
alter table public.daily_logs add column if not exists fat_g integer default 0;
alter table public.daily_logs add column if not exists water_ml integer default 0;
alter table public.daily_logs add column if not exists steps integer default 0;
alter table public.daily_logs add column if not exists sleep_hours numeric default 0;
alter table public.daily_logs add column if not exists mood_score integer;
alter table public.daily_logs add column if not exists weight_kg numeric;

alter table public.meals add column if not exists date date default current_date;
alter table public.meals add column if not exists food_name text;
alter table public.meals add column if not exists name text;
alter table public.meals add column if not exists quantity_g numeric default 0;
alter table public.meals add column if not exists logged_at timestamptz default now();
alter table public.meals add column if not exists time_logged timestamptz default now();

alter table public.workout_sessions add column if not exists started_at timestamptz default now();
alter table public.workout_sessions add column if not exists finished_at timestamptz;
alter table public.workout_sessions add column if not exists calories_burned integer default 0;
alter table public.workout_sessions add column if not exists calories_burned_est integer default 0;

alter table public.exercise_sets add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.exercise_sets add column if not exists duration_secs integer;
alter table public.exercise_sets add column if not exists logged_at timestamptz default now();

alter table public.cardio_logs add column if not exists logged_at timestamptz default now();

--------------------------------------------------------------------------------
-- 3. NORMALIZE EXISTING DATA
--------------------------------------------------------------------------------

update public.meals
set
  food_name = coalesce(food_name, name, 'Meal'),
  name = coalesce(name, food_name, 'Meal'),
  logged_at = coalesce(logged_at, time_logged, now()),
  time_logged = coalesce(time_logged, logged_at, now()),
  date = coalesce(date, (coalesce(logged_at, time_logged, now()) at time zone 'utc')::date, current_date);

update public.exercise_sets es
set user_id = ws.user_id
from public.workout_sessions ws
where es.session_id = ws.id
  and es.user_id is null;

--------------------------------------------------------------------------------
-- 4. TRIGGERS
--------------------------------------------------------------------------------

create or replace function public.sync_meal_fields()
returns trigger as $$
begin
  new.food_name := coalesce(new.food_name, new.name, 'Meal');
  new.name := coalesce(new.name, new.food_name, 'Meal');
  new.logged_at := coalesce(new.logged_at, new.time_logged, now());
  new.time_logged := coalesce(new.time_logged, new.logged_at, now());
  new.date := coalesce(new.date, (new.logged_at at time zone 'utc')::date, current_date);
  return new;
end;
$$ language plpgsql;

drop trigger if exists sync_meal_fields_before_write on public.meals;
create trigger sync_meal_fields_before_write
  before insert or update on public.meals
  for each row execute procedure public.sync_meal_fields();

create or replace function public.set_exercise_set_user_id()
returns trigger as $$
begin
  if new.user_id is null then
    select user_id into new.user_id
    from public.workout_sessions
    where id = new.session_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_exercise_set_user_id_before_write on public.exercise_sets;
create trigger set_exercise_set_user_id_before_write
  before insert or update on public.exercise_sets
  for each row execute procedure public.set_exercise_set_user_id();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, height_cm, weight_kg, goal, experience_level)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'FitCore Athlete'),
    162.5,
    63,
    'Fat Loss + Visible Abs',
    'Intermediate'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name;

  insert into public.profiles (
    id,
    name,
    height_cm,
    weight_kg,
    goal,
    experience,
    maintenance_kcal,
    target_kcal,
    protein_goal_g,
    carbs_goal_g,
    fat_goal_g,
    water_goal_ml,
    step_goal,
    workout_days_per_week
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'FitCore Athlete'),
    162.5,
    63,
    'Fat Loss',
    'Intermediate',
    2200,
    1800,
    120,
    180,
    55,
    3000,
    9000,
    5
  )
  on conflict (id) do nothing;

  insert into public.streaks (user_id, current_streak, longest_streak)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  insert into public.daily_logs (user_id, date, weight_kg)
  values (new.id, current_date, 63)
  on conflict (user_id, date) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

--------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
--------------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.meals enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_sets enable row level security;
alter table public.cardio_logs enable row level security;
alter table public.body_metrics enable row level security;
alter table public.streaks enable row level security;
alter table public.achievements enable row level security;

drop policy if exists "Users can view own user row" on public.users;
create policy "Users can view own user row" on public.users for select using (auth.uid() = id);

drop policy if exists "Users can update own user row" on public.users;
create policy "Users can update own user row" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can insert own user row" on public.users;
create policy "Users can insert own user row" on public.users for insert with check (auth.uid() = id);

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can crud own daily logs" on public.daily_logs;
create policy "Users can crud own daily logs" on public.daily_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own meals" on public.meals;
create policy "Users can crud own meals" on public.meals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own workout sessions" on public.workout_sessions;
create policy "Users can crud own workout sessions" on public.workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own exercise sets" on public.exercise_sets;
create policy "Users can crud own exercise sets" on public.exercise_sets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own cardio logs" on public.cardio_logs;
create policy "Users can crud own cardio logs" on public.cardio_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own body metrics" on public.body_metrics;
create policy "Users can crud own body metrics" on public.body_metrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own streaks" on public.streaks;
create policy "Users can crud own streaks" on public.streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own achievements" on public.achievements;
create policy "Users can crud own achievements" on public.achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 6. INDEXES
--------------------------------------------------------------------------------

create index if not exists users_email_idx on public.users(email);
create index if not exists daily_logs_user_date_idx on public.daily_logs(user_id, date);
create index if not exists meals_user_date_idx on public.meals(user_id, date);
create index if not exists meals_user_logged_at_idx on public.meals(user_id, logged_at);
create index if not exists workout_sessions_user_date_idx on public.workout_sessions(user_id, date);
create index if not exists exercise_sets_user_exercise_idx on public.exercise_sets(user_id, exercise_name);
create index if not exists cardio_logs_user_date_idx on public.cardio_logs(user_id, date);
create index if not exists body_metrics_user_date_idx on public.body_metrics(user_id, date);
create index if not exists achievements_user_earned_idx on public.achievements(user_id, earned_at);

--------------------------------------------------------------------------------
-- 7. BACKFILL EXISTING AUTH USERS
--------------------------------------------------------------------------------

insert into public.users (id, email, name, height_cm, weight_kg, goal, experience_level)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'name', 'FitCore Athlete'),
  162.5,
  63,
  'Fat Loss + Visible Abs',
  'Intermediate'
from auth.users au
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name;

insert into public.profiles (
  id,
  name,
  height_cm,
  weight_kg,
  goal,
  experience,
  maintenance_kcal,
  target_kcal,
  protein_goal_g,
  carbs_goal_g,
  fat_goal_g,
  water_goal_ml,
  step_goal,
  workout_days_per_week
)
select
  au.id,
  coalesce(au.raw_user_meta_data->>'name', 'FitCore Athlete'),
  162.5,
  63,
  'Fat Loss',
  'Intermediate',
  2200,
  1800,
  120,
  180,
  55,
  3000,
  9000,
  5
from auth.users au
on conflict (id) do nothing;

insert into public.streaks (user_id, current_streak, longest_streak)
select au.id, 0, 0
from auth.users au
on conflict (user_id) do nothing;

insert into public.daily_logs (user_id, date, weight_kg)
select au.id, current_date, 63
from auth.users au
on conflict (user_id, date) do nothing;
