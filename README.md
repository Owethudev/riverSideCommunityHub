# Riverside Community Hub

Initial full-stack TypeScript monorepo for the Riverside Community Hub.

## Requirements

- Node.js 20+
- npm 10+

## Local setup

```powershell
npm install
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env
npm run build
npm run dev
```

Replace the Supabase placeholders in both `.env` files with the project URL and anon key. Keep `SUPABASE_SERVICE_ROLE_KEY` and `API_MAIL_KEY` in the backend `.env` only. Apply the versioned database migrations with `supabase db push` before using signup, profile, email, resource, or booking routes. The booking workflow migration is `20260908130000_booking_workflows.sql`.

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:4000`. Check API readiness at `http://localhost:4000/api/health`.

The combined development command is also available as `npm run rundev`.

Run focused checks with `npm run typecheck`, `npm run lint`, or the full `npm run validate` command.

## Structure

- `apps/frontend`: React, Vite, React Router, and Tailwind UI
- `apps/backend`: Express API and validated server configuration
- `packages/shared`: shared TypeScript types and Zod schemas
- `docs`: initial product and API planning documents

Supabase clients, Auth session handling, protected profile routes, versioned SQL migrations, seeds, RLS policies, and Promailer email delivery are included. See [docs/schema.md](docs/schema.md), [docs/permissions.md](docs/permissions.md), [docs/authentication-flow.md](docs/authentication-flow.md), and [docs/email-delivery.md](docs/email-delivery.md).

For development test users, follow [docs/test-accounts.md](docs/test-accounts.md) and run [supabase/seed/test-roles.sql](supabase/seed/test-roles.sql) after creating the three Auth accounts.
