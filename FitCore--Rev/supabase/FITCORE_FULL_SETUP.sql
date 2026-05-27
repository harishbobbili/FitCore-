-- FitCore full Supabase setup / repair script
-- Run this entire file in Supabase Dashboard -> SQL Editor.
-- It is designed to be safe to run more than once.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

--------------------------------------------------------------------------------
-- USERS + PROFILES
--------------------------------------------------------------------------------

create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  name text,
  height_cm numeric default 162.5 check (height_cm > 0),
  weight_kg numeric check (weight_kg > 0),
  goal text default 'Fat Loss + Visible Abs',
  experience_level text default 'Intermediate',
  avatar_url text,
  created_at timestamptz default now() not null
);

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  height_cm numeric default 162.5 check (height_cm > 0),
  weight_kg numeric default 63 check (weight_kg > 0),
  goal text default 'Fat Loss',
  experience text default 'Intermediate',
  maintenance_kcal integer default 2200 check (maintenance_kcal >= 0),
  target_kcal integer default 1800 check (target_kcal >= 0),
  protein_goal_g integer default 120 check (protein_goal_g >= 0),
  carbs_goal_g integer default 180 check (carbs_goal_g >= 0),
  fat_goal_g integer default 55 check (fat_goal_g >= 0),
  water_goal_ml integer default 3000 check (water_goal_ml >= 0),
  step_goal integer default 9000 check (step_goal >= 0),
  workout_days_per_week integer default 5 check (workout_days_per_week between 1 and 7),
  created_at timestamptz default now() not null
);

alter table public.users add column if not exists email text;
alter table public.users add column if not exists name text;
alter table public.users add column if not exists height_cm numeric default 162.5;
alter table public.users add column if not exists weight_kg numeric;
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

--------------------------------------------------------------------------------
-- DAILY LOGS + MEALS
--------------------------------------------------------------------------------

create table if not exists public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date default current_date not null,
  calories_consumed integer default 0 not null check (calories_consumed >= 0),
  protein_g integer default 0 not null check (protein_g >= 0),
  carbs_g integer default 0 not null check (carbs_g >= 0),
  fat_g integer default 0 not null check (fat_g >= 0),
  water_ml integer default 0 not null check (water_ml >= 0),
  steps integer default 0 not null check (steps >= 0),
  sleep_hours numeric default 0 not null check (sleep_hours >= 0),
  mood_score integer check (mood_score >= 1 and mood_score <= 10),
  weight_kg numeric check (weight_kg > 0),
  unique (user_id, date)
);

create table if not exists public.meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  log_id uuid references public.daily_logs(id) on delete set null,
  date date default current_date not null,
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'dinner', 'pre_workout', 'post_workout', 'snack')),
  food_name text,
  name text,
  quantity_g numeric default 0 check (quantity_g >= 0),
  calories integer default 0 not null check (calories >= 0),
  protein_g integer default 0 not null check (protein_g >= 0),
  carbs_g integer default 0 not null check (carbs_g >= 0),
  fat_g integer default 0 not null check (fat_g >= 0),
  logged_at timestamptz default now() not null,
  time_logged timestamptz default now() not null
);

alter table public.meals add column if not exists date date default current_date;
alter table public.meals add column if not exists food_name text;
alter table public.meals add column if not exists name text;
alter table public.meals add column if not exists quantity_g numeric default 0;
alter table public.meals add column if not exists logged_at timestamptz default now();
alter table public.meals add column if not exists time_logged timestamptz default now();

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

--------------------------------------------------------------------------------
-- WORKOUTS + CARDIO + BODY
--------------------------------------------------------------------------------

create table if not exists public.workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date default current_date not null,
  split_name text not null,
  started_at timestamptz default now() not null,
  finished_at timestamptz,
  duration_mins integer default 0 not null check (duration_mins >= 0),
  calories_burned integer default 0 not null check (calories_burned >= 0),
  calories_burned_est integer default 0 not null check (calories_burned_est >= 0),
  notes text
);

alter table public.workout_sessions add column if not exists started_at timestamptz default now();
alter table public.workout_sessions add column if not exists finished_at timestamptz;
alter table public.workout_sessions add column if not exists calories_burned integer default 0;
alter table public.workout_sessions add column if not exists calories_burned_est integer default 0;

create table if not exists public.exercise_sets (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.workout_sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  exercise_name text not null,
  set_number integer not null check (set_number > 0),
  reps integer not null check (reps >= 0),
  weight_kg numeric not null check (weight_kg >= 0),
  rest_seconds integer default 60 not null check (rest_seconds >= 0),
  duration_secs integer,
  is_pr boolean default false not null,
  logged_at timestamptz default now() not null
);

alter table public.exercise_sets add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.exercise_sets add column if not exists duration_secs integer;
alter table public.exercise_sets add column if not exists logged_at timestamptz default now();

create or replace function public.set_exercise_set_user_id()
returns trigger as $$
begin
  if new.user_id is null then
    select ws.user_id into new.user_id
    from public.workout_sessions ws
    where ws.id = new.session_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_exercise_set_user_id_before_write on public.exercise_sets;
create trigger set_exercise_set_user_id_before_write
  before insert or update on public.exercise_sets
  for each row execute procedure public.set_exercise_set_user_id();

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

create table if not exists public.body_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date default current_date not null,
  weight_kg numeric not null check (weight_kg > 0),
  body_fat_pct numeric check (body_fat_pct >= 0),
  chest_cm numeric check (chest_cm >= 0),
  waist_cm numeric check (waist_cm >= 0),
  hip_cm numeric check (hip_cm >= 0),
  notes text,
  unique (user_id, date)
);

--------------------------------------------------------------------------------
-- STREAKS + ACHIEVEMENTS
--------------------------------------------------------------------------------

create table if not exists public.streaks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  current_streak integer default 0 not null check (current_streak >= 0),
  longest_streak integer default 0 not null check (longest_streak >= 0),
  last_workout_date date
);

create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  badge_id text not null,
  earned_at timestamptz default now() not null,
  unique (user_id, badge_id)
);

--------------------------------------------------------------------------------
-- INDEXES
--------------------------------------------------------------------------------

create index if not exists daily_logs_user_date_idx on public.daily_logs(user_id, date);
create index if not exists meals_user_date_idx on public.meals(user_id, date);
create index if not exists meals_user_logged_at_idx on public.meals(user_id, logged_at);
create index if not exists workout_sessions_user_date_idx on public.workout_sessions(user_id, date);
create index if not exists exercise_sets_user_exercise_idx on public.exercise_sets(user_id, exercise_name);
create index if not exists cardio_logs_user_date_idx on public.cardio_logs(user_id, date);
create index if not exists body_metrics_user_date_idx on public.body_metrics(user_id, date);
create index if not exists achievements_user_earned_idx on public.achievements(user_id, earned_at);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY
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
create policy "Users can view own user row" on public.users
  for select using (auth.uid() = id);

drop policy if exists "Users can update own user row" on public.users;
create policy "Users can update own user row" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can insert own user row" on public.users;
create policy "Users can insert own user row" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can crud own daily logs" on public.daily_logs;
create policy "Users can crud own daily logs" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own meals" on public.meals;
create policy "Users can crud own meals" on public.meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own workout sessions" on public.workout_sessions;
create policy "Users can crud own workout sessions" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own exercise sets" on public.exercise_sets;
create policy "Users can crud own exercise sets" on public.exercise_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own cardio logs" on public.cardio_logs;
create policy "Users can crud own cardio logs" on public.cardio_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own body metrics" on public.body_metrics;
create policy "Users can crud own body metrics" on public.body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own streaks" on public.streaks;
create policy "Users can crud own streaks" on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can crud own achievements" on public.achievements;
create policy "Users can crud own achievements" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- NEW USER BOOTSTRAP
--------------------------------------------------------------------------------

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
-- BACKFILL EXISTING AUTH USERS
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
on conflict (id) do nothing;

insert into public.profiles (id, name, height_cm, weight_kg, goal, experience, maintenance_kcal, target_kcal, protein_goal_g, carbs_goal_g, fat_goal_g, water_goal_ml, step_goal, workout_days_per_week)
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
