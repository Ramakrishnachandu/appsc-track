# APPSC Track

APPSC Track is a focused digital preparation platform for Andhra Pradesh Public Service Commission (APPSC) aspirants. It brings together revision planning, syllabus coverage, mock test performance, and exam analytics into one clean dashboard for efficient exam readiness.

## Business purpose

This application helps APPSC aspirants:
- organize their daily and weekly study plan
- track syllabus coverage for prelims and mains
- practice subject-wise MCQs and mock tests
- revise important topics through notes and summaries
- monitor performance trends and weak areas
- manage content and test publishing through an admin panel

## Core features

- User authentication with login and registration
- Role-based access for normal users and admins
- Per-user study dashboard with daily plan, actual study time, topic progress, and review queue
- APPSC Group-II syllabus map organized by paper, subject, unit, topic, and suggested subtopics
- Personalized study schedules with preparation level, medium, daily hours, and optional target date
- Focus timer, topic notes/bookmarks, confidence ratings, curated practice checks, and spaced revisions
- Practice/test assessment pages with timers and scoring
- Notes management with subject and paper-type filtering
- Analytics for accuracy, weak areas, and recent mock attempts
- Supabase persistence with owner-only row-level security and user-scoped demo fallback

## Tech stack

- React + TypeScript + Vite
- Material UI for the product interface
- Zustand for application state
- Supabase for authentication and backend persistence
- Local storage fallback for demo and offline-friendly usage

## Project structure

- src/App.tsx — app shell, auth gate, route configuration, and layout
- src/components — reusable UI pieces such as sidebar, header, and auth shell
- src/pages — page-level features for dashboard, notes, subjects, tests, analytics, and admin
- src/lib — Supabase and local data integrations
- src/data — syllabus, exam countdown, and dashboard data
- src/store — global auth state and session management

## Local setup

1. Install dependencies:
   npm install
2. Configure environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
3. Apply the database SQL in the Supabase SQL editor:
   - New Supabase project: run `supabase/schema.sql` once.
   - Existing project: run `supabase/migrations/20261018_study_plans.sql`.
4. Start the app:
   npm run dev
5. Production build:
   npm run build

## Environment variables

Create a .env file in the project root with:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

## Admin access

The app supports admin access to configure syllabus content and publish mock tests. Admin-only tabs are visible when the authenticated role is admin.

## Planner persistence

With Supabase configured, each authenticated user has one `public.study_plans` JSONB record. Row-level security restricts reads and writes to `auth.uid() = user_id`. The planner stores settings, scheduled and historical sessions, topic progress, timer checkpoints, quiz attempts, and revision dates together so schedule changes do not erase completed history.

Without Supabase configuration, the app uses per-demo-user localStorage for development only. That data is limited to the current browser and is not a cloud backup. The UI labels this mode explicitly.

## Syllabus and practice sources

The APPSC portal links the Group-II syllabus published on 27 April 2023 and Notification No. 37/2026, dated 13 October 2026. The 37/2026 notification's scheme specifies a 150-question, 150-minute, 150-mark Screening Test and two Mains papers, each 150 questions, 150 minutes, and 150 marks. It prescribes a one-third mark penalty for each wrong answer. The syllabus map source-labels the official paper, subject, and screening-section headings; topic-level organization and subtopics are suggested study detail. Recheck APPSC's portal for later corrigenda or notifications.

The topic quick-check bank contains original planner practice questions only. It is not a previous-year question bank and does not label generated questions as official APPSC questions. Existing in-app mock tests are short practice sets that score correct answers only; they are not full-pattern exam simulations and do not apply official negative marking. Topics without a curated quick check still support study sessions, notes, status, confidence, and revisions.

## Study workflow

- The planner distributes syllabus topics across the available daily study hours and retains old sessions when preferences change.
- Overdue sessions are redistributed into available daily capacity; their original scheduled records remain visible in the long-term view.
- Finishing a topic schedules revisions at 1, 3, 7, 14, and 30 days. Repeated wrong answers or low confidence shorten later intervals; strong recent recall can extend them.
- A running timer checkpoints every 10 seconds. After an interruption, time after the last checkpoint is excluded; actual study time is added to totals only when the user finishes the session.
- Applying the migration is required for Supabase-backed plans. Demo-mode plans do not require a database.

## SEO and discoverability

The app is designed to be discoverable for APPSC-related searches through structured site metadata and relevant keywords in the HTML head section.

## Notes

This app is suitable for APPSC preparation workflows and can be customized further for state service-specific content, practice questions, and live data integrations.
