# Kenya Realtors Node Backend (Render)

This backend is a Node/Express API gateway that proxies frontend Supabase traffic.

## Why this exists

- Frontend no longer needs to call Supabase directly from every hook/service endpoint.
- You can host frontend on Vercel, backend on Render, and keep Supabase as the database.
- Existing frontend logic can stay intact while traffic is routed through this backend.

## Local run

1. Copy `.env.example` to `.env` inside `backend/`.
2. Fill in values.
3. Install dependencies:

```bash
npm --prefix backend install
```

4. Start backend:

```bash
npm --prefix backend run dev
```

Health check:

```bash
GET http://localhost:8080/api/health
```

## Frontend env

Set in your frontend `.env`:

```bash
VITE_BACKEND_URL=http://localhost:8080
```

When deployed:

```bash
VITE_BACKEND_URL=https://your-render-service.onrender.com
```

## Render deployment

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Required env vars on Render:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (recommended)
- `SUPABASE_SERVICE_ROLE_KEY` (optional, used for cleanup when user profile insert fails)
- `CORS_ORIGINS` (comma-separated, include your Vercel URL)
- `PORT` (Render sets automatically; optional)

## Business API routes (Phase 2)

These endpoints now hold backend logic that used to run directly in frontend services:

- `GET /api/properties`
- `POST /api/properties` (super_admin)
- `PATCH /api/properties/:id` (super_admin)
- `DELETE /api/properties/:id` (super_admin)
- `GET /api/users` (super_admin)
- `POST /api/users` (super_admin)
- `PATCH /api/users/:userId?userType=tenant|...` (super_admin)
- `DELETE /api/users/:userId?userType=tenant|...` (super_admin)

## Exposed proxy routes

- `/auth/v1/*`
- `/rest/v1/*`
- `/storage/v1/*`
- `/functions/v1/*`
- `/realtime/v1/*`

## Security note

This backend keeps browser-to-database logic decoupled and centralizes CORS/routing, but Supabase RLS still enforces data access rules via user JWT bearer tokens.
