alter table public.notes
  add column if not exists kind text not null default 'revision'
    check (kind in ('revision', 'current-affairs')),
  add column if not exists topic_id text,
  add column if not exists source_title text,
  add column if not exists source_url text,
  add column if not exists source_published_at date;

alter table public.mock_tests
  add column if not exists assessment_mode text not null default 'practice'
    check (assessment_mode in ('practice', 'official-pattern'));

alter table public.mock_attempts
  alter column score type numeric(7, 2) using score::numeric(7, 2),
  add column if not exists assessment_mode text not null default 'practice',
  add column if not exists marks_per_question numeric(7, 6) not null default 1,
  add column if not exists negative_marks_per_wrong numeric(7, 6) not null default 0;
