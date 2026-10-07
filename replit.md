# DIAMANT

## Project Overview
Full-stack investment and payments platform. Express + TypeScript backend, React + Vite frontend, PostgreSQL (Supabase) via Drizzle ORM, Passport.js session auth, NowPayments crypto integration.

## Stack
- **Backend**: Express 5, TypeScript, Passport.js (local strategy), Drizzle ORM
- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI, TanStack Query, Wouter
- **Database**: PostgreSQL via Supabase (pooler connection)
- **Payments**: NowPayments (crypto)

## Running the app
```bash
npm run dev       # development (port 5000)
npm run build     # production build
npm start         # serve production build
npm run db:push   # push schema to database
```

## Required Secrets
- `SUPABASE_DATABASE_URL` — Supabase PostgreSQL pooler connection string
- `SESSION_SECRET` — express-session secret

## Environment Variables
- `PORT` — defaults to 5000
- `APP_URL` / `PUBLIC_URL` — optional public HTTPS URL overrides (set in the Plesk environment for production; `APP_URL` has priority; the verified production URL is used if both are missing)

## Notes
- The seed script runs on every startup and is idempotent (preserves existing data)
- Production deployment targets Plesk (nginx reverse proxy + Passenger)
- See `.agents/memory/` for architecture decisions and known quirks

## User Preferences
- After each requested change is complete and verified, commit the finished project changes and push them to `origin/main` on `devappmanagement40-debug/Deva`. Do not push unfinished intermediate work. This repository is public, so never commit secrets or sensitive data.
