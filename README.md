# KENYA-REALTORS Architecture

This repository runs as a root-managed frontend app backed directly by Supabase.

## Frontend

- Path: `frontend/`
- Stack: React + Vite + TypeScript
- Purpose: UI, routing, business logic, and direct Supabase integration

## Backend Folder

- Path: `backend/`
- Purpose: reserved for reference artifacts and future backend work
- Runtime status: no active Node/Express server is required for app execution

## Runtime Commands (from repository root)

- `npm run dev` -> starts the app (frontend) from root
- `npm run dev:frontend` -> starts frontend explicitly
- `npm run build` -> builds frontend using `frontend/vite.config.ts`
- `npm run preview` -> previews the built frontend

## Data/Auth/Storage

- Supabase is the active source for database, auth, and storage.

## Notes

- Run the project from repository root only.
- Frontend app source lives under `frontend/`.
- Backend folder remains in place for clean project organization.
