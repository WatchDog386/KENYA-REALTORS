# KENYA-REALTORS Architecture

This repository is organized into two primary application layers:

## Frontend

- Path: `frontend/`
- Stack: React + Vite + TypeScript
- Purpose: UI, routing, user interactions, and calling backend APIs

## Backend

- Path: `backend/`
- Stack: Node.js + Express
- Purpose: API/business logic, auth checks, and Supabase access/proxying

## Runtime Commands (from repository root)

- `npm run dev:frontend` -> starts frontend from `frontend/`
- `npm run dev:backend` -> starts backend from `backend/`
- `npm run dev` -> alias of frontend dev
- `npm run dev:full` -> starts frontend and backend together
- `npm run build` -> builds frontend from `frontend/`

## Deployment Split

- Frontend deploy target: Vercel (`frontend/`)
- Backend deploy target: Render (`backend/`)
- Database/Auth/Storage: Supabase

## Notes

- Root contains workspace-level config/scripts only.
- Frontend app source should live under `frontend/`.
- Backend app source should live under `backend/`.
