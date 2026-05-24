-- Run this if cardio logging fails with a type/check constraint error.
-- It allows the canonical values used by the FitCore app.

alter table public.cardio_logs
  drop constraint if exists cardio_logs_type_check;

update public.cardio_logs
set type = case
  when lower(type) in ('treadmill walk', 'walk', 'walking') then 'walk'
  when lower(type) in ('running', 'run', 'jogging') then 'run'
  when lower(type) in ('hiit session', 'hiit') then 'hiit'
  when lower(type) in ('jump rope', 'jump_rope') then 'jump_rope'
  else type
end;

alter table public.cardio_logs
  add constraint cardio_logs_type_check
  check (type in ('walk', 'run', 'hiit', 'jump_rope'));
