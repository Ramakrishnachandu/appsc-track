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
- First-login guided tour of the preparation workflow, replayable from the app header
- Collapsible desktop navigation and an overlay navigation drawer on mobile
- Per-user study dashboard with daily plan, actual study time, topic progress, and review queue
- APPSC Group-II syllabus map organized by paper, subject, unit, topic, and suggested subtopics
- Personalized study schedules with preparation level, medium, daily hours, and optional target date
- Focus timer, topic notes/bookmarks, confidence ratings, curated practice checks, and spaced revisions
- Practice/test assessment pages with timers and scoring
- Notes management with subject and paper-type filtering
- Candidate-facing source-attributed APPSC notices and curated resources
- Candidate help requests with private status tracking and admin responses
- Analytics for accuracy, weak areas, and recent mock attempts
- Supabase persistence with owner-only row-level security and user-scoped demo fallback
- Admin-managed practice questions, notices, and resources with draft/review/publish/archive states and revision history
- Privacy-preserving aggregate admin metrics and a support inbox

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
   - Existing project: run `supabase/migrations/20261018_study_plans.sql`, `supabase/migrations/20261019_preparation_workflow.sql`, then `supabase/migrations/20261020_admin_content_management.sql`.
4. Start the app:
   npm run dev
5. Production build:
   npm run build

## Environment variables

Create a .env file in the project root with:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

## Admin access

The app supports admin access to configure syllabus content, publish mock tests, manage a question bank, publish notices and curated resources, review content revisions, and handle candidate support requests. Question, notice, and resource entries use a draft → review → publish/archive workflow; candidates see only the active published version. Editing published content creates a replacement draft, leaving the current version visible until the replacement is approved. Revision history records each save. These entries require a source title and HTTPS source URL, but administrators remain responsible for verifying accuracy and rights to use the material. Existing syllabus and mock-test controls retain their current save/publish behavior.

The admin operations overview uses aggregate counts only. It does not expose candidate notes, study plans, or individual practice histories. Account-role and credential changes are intentionally not available in the client admin panel; those require a trusted server-side administrative workflow. Candidate support requests are visible only to their owner and admins. In local/demo mode, admin content and support requests are stored in the current browser and are not shared between accounts or devices.

## Planner persistence

With Supabase configured, each authenticated user has one `public.study_plans` JSONB record. Row-level security restricts reads and writes to `auth.uid() = user_id`. The planner stores settings, scheduled and historical sessions, topic progress, timer checkpoints, quiz attempts, and revision dates together so schedule changes do not erase completed history.

Without Supabase configuration, the app uses per-demo-user localStorage for development only. That data is limited to the current browser and is not a cloud backup. The UI labels this mode explicitly.

## Syllabus and practice sources

The APPSC portal links the Group-II syllabus published on 27 April 2023 and Notification No. 37/2026, dated 13 October 2026. The 37/2026 notification's scheme specifies a 150-question, 150-minute, 150-mark Screening Test and two Mains papers, each 150 questions, 150 minutes, and 150 marks. It prescribes a one-third mark penalty for each wrong answer. The syllabus map source-labels the official paper, subject, and screening-section headings; topic-level organization and subtopics are suggested study detail. Recheck APPSC's portal for later corrigenda or notifications.

The topic quick-check bank contains original planner practice questions only. It is not a previous-year question bank and does not label generated questions as official APPSC questions. Short mock tests are practice-only and do not apply negative marking. Admins can import manually verified questions as JSON; an assessment is eligible for the official-pattern label and one-third penalty scoring only when it contains exactly 150 questions, lasts 150 minutes, and every question has a publication date, source title, and HTTPS URL on `psc.ap.gov.in`. The app does not generate or independently verify imported content. Topics without a curated quick check still support study sessions, notes, status, confidence, and revisions.

Current-affairs notes are candidate-maintained records. Each entry stores its source title, URL, and publication date; the app does not generate, verify, or automatically refresh news.

## Study workflow

- The planner distributes syllabus topics across the selected available weekdays and each day's capacity; changing preferences preserves completed history and explicitly reschedules remaining topic sessions.
- Missed sessions remain visible until the candidate chooses a suggested reschedule date or skips the session; opening the plan does not silently rewrite overdue work.
- Finishing a topic schedules revisions at 1, 3, 7, 14, and 30 days. Repeated wrong answers or low confidence shorten later intervals; strong recent recall can extend them.
- A running timer checkpoints every 10 seconds. After an interruption, time after the last checkpoint is excluded; actual study time is added to totals only when the user finishes the session.
- Both existing-project migrations are required for Supabase-backed preparation features. Demo-mode plans and notes do not require a database.

## Guided tour

The first authenticated visit in a browser opens a short tour of the dashboard, study plan, syllabus, practice and mock tests, notes and revision, and analytics. Users can skip it, open a related feature, or replay it at any time using **App tour** in the page header. Completion is stored in browser localStorage, scoped to the signed-in user; it is not synchronized across browsers or devices and does not require a Supabase migration.

## SEO and discoverability

The app is designed to be discoverable for APPSC-related searches through structured site metadata and relevant keywords in the HTML head section.

## Notes

This app is suitable for APPSC preparation workflows and can be customized further for state service-specific content, practice questions, and live data integrations.
