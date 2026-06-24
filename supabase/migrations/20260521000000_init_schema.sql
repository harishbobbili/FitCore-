-- supabase/migrations/20260521000000_init_schema.sql

-- Enable UUID extension
create extension if not exists "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. USERS TABLE
--------------------------------------------------------------------------------
create table public.users (
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

-- Enable RLS
alter table public.users enable row level security;

-- Policies for users
create policy "Users can view own profile" on public.users 
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users 
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users 
  for insert with check (auth.uid() = id);

--------------------------------------------------------------------------------
-- 2. DAILY LOGS TABLE
--------------------------------------------------------------------------------
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
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

-- Enable RLS
alter table public.daily_logs enable row level security;

-- Policies for daily_logs
create policy "Users can crud own daily logs" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 3. MEALS TABLE
--------------------------------------------------------------------------------
create table public.meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  log_id uuid references public.daily_logs(id) on delete cascade,
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'dinner', 'pre_workout', 'post_workout', 'snack')),
  name text not null,
  calories integer default 0 not null check (calories >= 0),
  protein_g integer default 0 not null check (protein_g >= 0),
  carbs_g integer default 0 not null check (carbs_g >= 0),
  fat_g integer default 0 not null check (fat_g >= 0),
  time_logged timestamptz default now() not null
);

-- Enable RLS
alter table public.meals enable row level security;

-- Policies for meals
create policy "Users can crud own meals" on public.meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 4. WORKOUT SESSIONS TABLE
--------------------------------------------------------------------------------
create table public.workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date default current_date not null,
  split_name text not null,
  duration_mins integer default 0 not null check (duration_mins >= 0),
  calories_burned_est integer default 0 not null check (calories_burned_est >= 0),
  notes text
);

-- Enable RLS
alter table public.workout_sessions enable row level security;

-- Policies for workout_sessions
create policy "Users can crud own workout sessions" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 5. EXERCISE SETS TABLE
--------------------------------------------------------------------------------
create table public.exercise_sets (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.workout_sessions(id) on delete cascade not null,
  exercise_name text not null,
  set_number integer not null check (set_number > 0),
  reps integer not null check (reps >= 0),
  weight_kg numeric not null check (weight_kg >= 0),
  rest_seconds integer default 60 not null check (rest_seconds >= 0),
  is_pr boolean default false not null
);

-- Enable RLS
alter table public.exercise_sets enable row level security;

-- Policies for exercise_sets
create policy "Users can crud own exercise sets" on public.exercise_sets
  for all using (
    exists (
      select 1 from public.workout_sessions
      where public.workout_sessions.id = session_id
      and public.workout_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions
      where public.workout_sessions.id = session_id
      and public.workout_sessions.user_id = auth.uid()
    )
  );

--------------------------------------------------------------------------------
-- 6. CARDIO LOGS TABLE
--------------------------------------------------------------------------------
create table public.cardio_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date default current_date not null,
  type text not null check (type in ('walk', 'run', 'hiit', 'jump_rope')),
  duration_mins integer default 0 not null check (duration_mins >= 0),
  distance_km numeric default 0 not null check (distance_km >= 0),
  calories_burned integer default 0 not null check (calories_burned >= 0),
  avg_heart_rate integer check (avg_heart_rate > 0),
  incline_pct numeric default 0 check (incline_pct >= 0)
);

-- Enable RLS
alter table public.cardio_logs enable row level security;

-- Policies for cardio_logs
create policy "Users can crud own cardio logs" on public.cardio_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 7. BODY METRICS TABLE
--------------------------------------------------------------------------------
create table public.body_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date default current_date not null,
  weight_kg numeric not null check (weight_kg > 0),
  body_fat_pct numeric check (body_fat_pct >= 0),
  chest_cm numeric check (chest_cm >= 0),
  waist_cm numeric check (waist_cm >= 0),
  hip_cm numeric check (hip_cm >= 0),
  notes text
);

-- Enable RLS
alter table public.body_metrics enable row level security;

-- Policies for body_metrics
create policy "Users can crud own body metrics" on public.body_metrics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 8. STREAKS TABLE
--------------------------------------------------------------------------------
create table public.streaks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  current_streak integer default 0 not null check (current_streak >= 0),
  longest_streak integer default 0 not null check (longest_streak >= 0),
  last_workout_date date
);

-- Enable RLS
alter table public.streaks enable row level security;

-- Policies for streaks
create policy "Users can crud own streaks" on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 9. ACHIEVEMENTS TABLE
--------------------------------------------------------------------------------
create table public.achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  badge_id text not null,
  earned_at timestamptz default now() not null,
  unique (user_id, badge_id)
);

-- Enable RLS
alter table public.achievements enable row level security;

-- Policies for achievements
create policy "Users can crud own achievements" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- AUTOMATIC PROFILE TRIGGER ON AUTH.SIGNUP
--------------------------------------------------------------------------------
-- Trigger to automatically create a users row and a streaks row when a new signup happens
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, height_cm, goal, experience_level)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'Gym Goer'),
    162.5,
    'Fat Loss + Visible Abs',
    'Intermediate'
  );

  insert into public.streaks (user_id, current_streak, longest_streak)
  values (new.id, 0, 0);

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
