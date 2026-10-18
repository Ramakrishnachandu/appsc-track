create extension if not exists "uuid-ossp";

create table if not exists public.app_content (
  key text primary key,
  content jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.app_content enable row level security;

create policy "App content is viewable by everyone" on public.app_content
  for select using (true);

create policy "App content can be managed by admins only" on public.app_content
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_name text not null,
  status text not null default 'demo',
  overall_progress integer not null default 0,
  study_streak integer not null default 0,
  mcq_accuracy integer not null default 0,
  daily_hours numeric(5,2) not null default 0,
  exam_countdown integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topic_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  topic text not null,
  percent integer not null default 0,
  status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempted integer not null default 0,
  correct integer not null default 0,
  wrong integer not null default 0,
  skipped integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text,
  subject_id text,
  subject_name text,
  paper_type text not null default 'Prelims' check (paper_type in ('Prelims', 'Mains')),
  kind text not null default 'revision' check (kind in ('revision', 'current-affairs')),
  topic_id text,
  source_title text,
  source_url text,
  source_published_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revision_queue (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  due_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.study_plans (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mock_tests (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  schedule text not null check (schedule in ('Daily', 'Weekly')),
  paper_type text not null default 'Prelims' check (paper_type in ('Prelims', 'Mains')),
  subject_id text,
  subject_name text,
  duration_minutes integer not null default 30,
  assessment_mode text not null default 'practice' check (assessment_mode in ('practice', 'official-pattern')),
  questions jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.mock_attempts (
  id uuid primary key default uuid_generate_v4(),
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score numeric(7,2) not null default 0,
  total integer not null default 0,
  correct integer not null default 0,
  wrong integer not null default 0,
  skipped integer not null default 0,
  accuracy integer not null default 0,
  assessment_mode text not null default 'practice' check (assessment_mode in ('practice', 'official-pattern')),
  marks_per_question numeric(7,6) not null default 1,
  negative_marks_per_wrong numeric(7,6) not null default 0,
  submitted_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.study_sessions enable row level security;
alter table public.topic_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.notes enable row level security;
alter table public.revision_queue enable row level security;
alter table public.study_plans enable row level security;
alter table public.mock_tests enable row level security;
alter table public.mock_attempts enable row level security;

create policy "Profiles are viewable by owner only" on public.profiles
  for select using (auth.uid() = id);
create policy "Profiles can be updated by owner only" on public.profiles
  for update using (auth.uid() = id);
create policy "Profiles can be inserted by owner only" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Study sessions are viewable by owner only" on public.study_sessions
  for select using (auth.uid() = user_id);
create policy "Study sessions can be managed by owner only" on public.study_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Topic progress is viewable by owner only" on public.topic_progress
  for select using (auth.uid() = user_id);
create policy "Topic progress can be managed by owner only" on public.topic_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Quiz attempts are viewable by owner only" on public.quiz_attempts
  for select using (auth.uid() = user_id);
create policy "Quiz attempts can be managed by owner only" on public.quiz_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Notes are viewable by owner only" on public.notes
  for select using (auth.uid() = user_id);
create policy "Notes can be managed by owner only" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Revision queue is viewable by owner only" on public.revision_queue
  for select using (auth.uid() = user_id);
create policy "Revision queue can be managed by owner only" on public.revision_queue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Study plans are manageable by owner only" on public.study_plans;
create policy "Study plans are manageable by owner only" on public.study_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Mock tests are readable by authenticated users" on public.mock_tests
  for select using (auth.uid() is not null);
create policy "Mock tests are managed by admins only" on public.mock_tests
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Mock attempts are readable by owner or admin" on public.mock_attempts
  for select using (
    auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Mock attempts can be inserted by owner" on public.mock_attempts
  for insert with check (auth.uid() = user_id);
create policy "Mock attempts can be updated by owner" on public.mock_attempts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    role = coalesce(excluded.role, public.profiles.role),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create index if not exists idx_study_sessions_user_id on public.study_sessions(user_id);
create index if not exists idx_topic_progress_user_id on public.topic_progress(user_id);
create index if not exists idx_quiz_attempts_user_id on public.quiz_attempts(user_id);
create index if not exists idx_notes_user_id on public.notes(user_id);
create index if not exists idx_revision_queue_user_id on public.revision_queue(user_id);
create index if not exists idx_mock_tests_created_by on public.mock_tests(created_by);
create index if not exists idx_mock_attempts_user_id on public.mock_attempts(user_id);
