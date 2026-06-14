# BugBox routes

- `/` — redirects to dashboard or login
- `/login`, `/register` — public auth
- `/_authenticated/*` — protected app (dashboard, tickets, kanban, projects, team, reports, settings)

The auth guard lives in `_authenticated.tsx`. JWT is stored in localStorage and attached to API calls via `src/lib/api.ts`.

API base URL is configured with `VITE_API_BASE_URL` (defaults to `http://localhost:5080`).
