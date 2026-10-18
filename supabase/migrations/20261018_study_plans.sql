create table if not exists public.study_plans (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_plans enable row level security;

drop policy if exists "Study plans are manageable by owner only" on public.study_plans;
create policy "Study plans are manageable by owner only" on public.study_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);