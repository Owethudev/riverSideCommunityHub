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

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:4000`. Check API readiness at `http://localhost:4000/api/health`.

The combined development command is also available as `npm run rundev`.

Run focused checks with `npm run typecheck`, `npm run lint`, or the full `npm run validate` command.

## Structure

- `apps/frontend`: React, Vite, React Router, and Tailwind UI
- `apps/backend`: Express API and validated server configuration
- `packages/shared`: shared TypeScript types and Zod schemas
- `docs`: initial product and API planning documents

Supabase configuration is represented by environment placeholders only. No Supabase client or database connection is active yet.
