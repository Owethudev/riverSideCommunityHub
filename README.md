# Riverside Community Hub

Full-stack TypeScript community-centre platform.

## Production architecture

- Frontend: React, Vite, React Router, Tailwind on Vercel.
- Backend: Node.js, Express, TypeScript on Render.
- Data/auth/storage: Supabase Auth, Postgres, RLS, and Storage.
- Email: Promailer, called only by the backend.
- Shared contracts: `packages/shared`.

See [docs/architecture.md](docs/architecture.md) for the trust boundaries and service diagram.

## Local development

Requirements: Node.js 20+ and npm 10+.

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:4000`. The API health check is `http://localhost:4000/api/health`.

Local environment files are intentionally ignored by Git. Create them locally from your own secure configuration. Do not commit `.env`, `.env.*`, or service credentials.

## Supabase setup

Apply all migrations in timestamp order:

```text
supabase/migrations/20260908120000_initial_schema.sql
supabase/migrations/20260908121000_seed_resources.sql
supabase/migrations/20260908122000_email_delivery.sql
supabase/migrations/20260908130000_booking_workflows.sql
supabase/migrations/20260908140000_staff_booking_audit.sql
supabase/migrations/20260908141000_admin_lists.sql
supabase/migrations/20260908142000_community_events.sql
supabase/migrations/20260908143000_event_posters_storage.sql
```

Configure Supabase Auth URL settings before testing production email redirects. See [docs/deployment-verification.md](docs/deployment-verification.md).

## Deployment

### Vercel frontend

Create a Vercel project connected to this repository:

- Root Directory: repository root (`.`)
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Add `VITE_API_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.
- `vercel.json` builds the shared package before the frontend and provides the SPA rewrite for React Router refreshes.

### Render backend

Create a Render Web Service from this repository. `render.yaml` contains the build, start, health-check, and environment-variable blueprint:

- Build: `npm ci && npm run build --workspace=@riverside/shared && npm run build --workspace=@riverside/backend`
- Start: `npm run start --workspace=@riverside/backend`
- Health: `/api/health`

Set the backend variables from [docs/environment-reference.md](docs/environment-reference.md). Set `CORS_ORIGIN` to the exact Vercel production URL, including `https://` and without a trailing slash. Multiple origins may be comma-separated.

## Manual settings checklist

You must manually change these values for your deployment:

1. Vercel: set the three `VITE_*` variables to the production API and Supabase values.
2. Render: set Supabase URL/keys, service-role key, Promailer key, sender, and the Vercel origin.
3. Supabase Authentication > URL Configuration: set Site URL to the Vercel URL and add the Vercel URL plus `/login` to Redirect URLs. Add your custom domain if applicable.
4. Supabase Auth email settings: configure a production email provider and verification templates.
5. Supabase Storage: confirm the `event-posters` bucket is public-read and its upload policy is present.
6. Promailer: verify the sender/domain and place only the API key in Render.
7. Apply all SQL migrations before enabling production traffic.

## Security confirmation

No server secrets are used by frontend code. `SUPABASE_SERVICE_ROLE_KEY` and `API_MAIL_KEY` are backend-only. The frontend receives only the Supabase anon key, which is intended for browser use, and the public API URL. Environment files are ignored by Git. Run a repository secret scan before pushing:

```powershell
git grep -n -I -E "SUPABASE_SERVICE_ROLE_KEY=|API_MAIL_KEY=|eyJhbGciOiJIUzI1Ni"
```

An empty result is expected for tracked source files.

## Documentation

- [Architecture](docs/architecture.md)
- [Environment reference](docs/environment-reference.md)
- [API reference](docs/api-reference.md)
- [Staff handover](docs/staff-handover.md)
- [Deployment verification](docs/deployment-verification.md)
- [Client demo walkthrough](docs/client-demo.md)
- [Authentication flow](docs/authentication-flow.md)
- [Permissions](docs/permissions.md)
- [Booking rules](docs/booking-rules.md)
- [Email delivery](docs/email-delivery.md)
