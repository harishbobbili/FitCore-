-- Adds the profile table used by the FitCore app.
-- Run this in Supabase SQL Editor if the table is missing in your hosted project.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  height_cm numeric default 162.5 check (height_cm > 0),
  weight_kg numeric check (weight_kg > 0),
  goal text default 'Fat Loss',
  experience text default 'Intermediate',
  maintenance_kcal integer default 0 check (maintenance_kcal >= 0),
  target_kcal integer default 0 check (target_kcal >= 0),
  protein_goal_g integer default 0 check (protein_goal_g >= 0),
  carbs_goal_g integer default 0 check (carbs_goal_g >= 0),
  fat_goal_g integer default 0 check (fat_goal_g >= 0),
  water_goal_ml integer default 3000 check (water_goal_ml >= 0),
  step_goal integer default 9000 check (step_goal >= 0),
  workout_days_per_week integer default 5 check (workout_days_per_week between 1 and 7),
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

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
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name;

  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Gym Goer')
  )
  on conflict (id) do nothing;

  insert into public.streaks (user_id, current_streak, longest_streak)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
