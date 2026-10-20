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
  for insert with check (auth.uid() = id and role = 'user');

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role
    and coalesce(auth.role(), '') <> 'service_role'
    and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  then
    raise exception 'Only an administrator can change profile roles';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_changes on public.profiles;
create trigger protect_profile_role_changes
  before update of role on public.profiles
  for each row execute function public.prevent_profile_role_escalation();

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

create table if not exists public.admin_content_items (
  id uuid primary key default uuid_generate_v4(),
  kind text not null check (kind in ('question', 'notice', 'resource')),
  title text not null,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  source_title text,
  source_url text check (source_url is null or source_url ~* '^https://[^[:space:]]+$'),
  source_published_at date,
  replaces_id uuid references public.admin_content_items(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or (nullif(btrim(source_title), '') is not null and source_url ~* '^https://[^[:space:]]+$'))
);

create index if not exists admin_content_items_publication_idx
  on public.admin_content_items (kind, status, updated_at desc);

create table if not exists public.admin_content_revisions (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.admin_content_items(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (item_id, version)
);

create index if not exists admin_content_revisions_item_idx
  on public.admin_content_revisions (item_id, version desc);

create table if not exists public.support_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('account', 'study-data', 'content', 'technical', 'other')),
  subject text not null check (char_length(subject) between 4 and 120),
  message text not null check (char_length(message) between 10 and 3000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  admin_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_admin_queue_idx
  on public.support_requests (status, created_at desc);

alter table public.admin_content_items enable row level security;
alter table public.admin_content_revisions enable row level security;
alter table public.support_requests enable row level security;

create policy "Published admin content is readable by authenticated users" on public.admin_content_items
  for select using (status = 'published' and auth.uid() is not null);
create policy "Admin content is manageable by admins only" on public.admin_content_items
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Admin content revisions are readable by admins only" on public.admin_content_revisions
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Support requests are readable by owner or admin" on public.support_requests
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "Support requests can be created by owner" on public.support_requests
  for insert with check (auth.uid() = user_id and status = 'open' and admin_response is null);
create policy "Support requests are manageable by admins only" on public.support_requests
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create or replace function public.record_admin_content_revision()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_version integer;
begin
  select coalesce(max(version), 0) + 1
    into next_version
    from public.admin_content_revisions
    where item_id = new.id;
  insert into public.admin_content_revisions (item_id, version, snapshot, changed_by)
  values (
    new.id,
    next_version,
    jsonb_build_object(
      'kind', new.kind,
      'title', new.title,
      'content', new.content,
      'status', new.status,
      'source_title', new.source_title,
      'source_url', new.source_url,
      'source_published_at', new.source_published_at,
      'published_at', new.published_at
    ),
    auth.uid()
  );
  return new;
end;
$$;

drop trigger if exists admin_content_revision_on_change on public.admin_content_items;
create trigger admin_content_revision_on_change
  after insert or update on public.admin_content_items
  for each row execute function public.record_admin_content_revision();

create or replace function public.archive_replaced_admin_content()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'published' and new.replaces_id is not null and tg_op = 'INSERT' then
    update public.admin_content_items
      set status = 'archived', updated_at = now()
      where id = new.replaces_id and status = 'published' and kind = new.kind;
  elsif new.status = 'published' and new.replaces_id is not null and old.status is distinct from new.status then
    update public.admin_content_items
      set status = 'archived', updated_at = now()
      where id = new.replaces_id and status = 'published' and kind = new.kind;
  end if;
  return new;
end;
$$;

drop trigger if exists admin_content_archive_replaced on public.admin_content_items;
create trigger admin_content_archive_replaced
  after insert or update of status on public.admin_content_items
  for each row execute function public.archive_replaced_admin_content();

create or replace function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    raise exception 'Admin access required';
  end if;
  return jsonb_build_object(
    'candidate_count', (select count(*) from public.profiles where role = 'user'),
    'mock_attempt_count', (select count(*) from public.mock_attempts),
    'published_question_count', (select count(*) from public.admin_content_items where kind = 'question' and status = 'published'),
    'published_notice_count', (select count(*) from public.admin_content_items where kind = 'notice' and status = 'published'),
    'published_resource_count', (select count(*) from public.admin_content_items where kind = 'resource' and status = 'published'),
    'pending_review_count', (select count(*) from public.admin_content_items where status = 'review'),
    'open_support_count', (select count(*) from public.support_requests where status in ('open', 'in_progress'))
  );
end;
$$;

revoke all on function public.get_admin_dashboard_metrics() from public;
grant execute on function public.get_admin_dashboard_metrics() to authenticated;
grant select, insert, update, delete on public.admin_content_items to authenticated;
grant select on public.admin_content_revisions to authenticated;
grant select, insert, update on public.support_requests to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    'user'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
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
