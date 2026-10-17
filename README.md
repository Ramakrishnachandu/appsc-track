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
- Fixed learning dashboard with progress and countdown insights
- APPSC subject cards mapped to prelims and mains syllabus
- Study plan tracking and revision workflow
- Practice/test assessment pages with timers and scoring
- Notes management with subject and paper-type filtering
- Analytics for accuracy, weak areas, and recent mock attempts
- Supabase-ready data model with local fallback for demo mode

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
3. Start the app:
   npm run dev
4. Production build:
   npm run build

## Environment variables

Create a .env file in the project root with:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

## Admin access

The app supports admin access to configure syllabus content and publish mock tests. Admin-only tabs are visible when the authenticated role is admin.

## SEO and discoverability

The app is designed to be discoverable for APPSC-related searches through structured site metadata and relevant keywords in the HTML head section.

## Notes

This app is suitable for APPSC preparation workflows and can be customized further for state service-specific content, practice questions, and live data integrations.
