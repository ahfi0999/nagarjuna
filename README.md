# NAG CRM

Enterprise-ready foundation for an authenticated, read-only CRM portal.

## Prerequisites

- Node.js 20.9 or newer
- npm
- An Auth0 Regular Web Application
- PostgreSQL (only when database integration begins)

## Setup and run

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Replace the Auth0 placeholders in `.env.local` before starting the application.
The portal runs at `http://localhost:3000` by default.

## Auth0 configuration

Provide these server-side environment variables:

- `AUTH0_DOMAIN` � Auth0 tenant domain without a URL scheme.
- `AUTH0_CLIENT_ID` � Regular Web Application client ID.
- `AUTH0_CLIENT_SECRET` � Server-side application client secret.
- `AUTH0_SECRET` � 32-byte secret used to encrypt session and transaction
  cookies. Generate one with `openssl rand -hex 32`.
- `APP_BASE_URL` � Application origin, such as `http://localhost:3000`.

Configure these URLs in the Auth0 application settings:

- Allowed Callback URL: `http://localhost:3000/auth/callback`
- Allowed Logout URL: `http://localhost:3000`

Auth0 stores sessions in encrypted, HTTP-only cookies. The broad middleware
matcher is intentional: it allows the SDK to maintain rolling sessions while
protecting application routes.

## Quality commands

```bash
npm run typecheck
npm run lint
npm run format:check
npm run prisma:validate
npm run build
```

## Structure

- `prisma/` � Prisma schema and, later, migrations. It declares PostgreSQL
  support but contains no models and is not used by authentication.
- `public/` � Static files served directly by Next.js.
- `src/app/` � App Router layouts and routes.
- `src/app/login/` � Public login screen.
- `src/app/dashboard/` � Protected authentication-success placeholder.
- `src/components/ui/` � Reusable shadcn/ui primitives added through the shadcn
  CLI.
- `src/components/layout/` � Future shared shell components such as headers,
  sidebars, and navigation.
- `src/config/` � Future typed application configuration and environment
  contracts.
- `src/features/auth/components/` � Reusable login and logout controls.
- `src/features/auth/server/` � Server-only Auth0 SDK client singleton.
- `src/features/` � Domain-oriented feature modules for future expansion.
- `src/hooks/` � Cross-feature React hooks.
- `src/lib/` � Framework-agnostic shared utilities.
- `src/server/db/` � Future server-only database client and read repositories;
  no client or connection exists.
- `src/server/services/` � Future server-side orchestration boundaries.
- `src/styles/` � Global Tailwind layers and shadcn design tokens.
- `src/types/` � Shared TypeScript types that do not belong to one feature.
- `src/middleware.ts` � Auth0 route mounting, rolling-session handling, and the
  default-deny route protection boundary.

## Current routes

- `/login` � Public login screen; authenticated users go to `/dashboard`.
- `/dashboard` � Protected placeholder showing authentication success.
- `/auth/*` � SDK-managed login, callback, logout, profile, and session routes.
- `/` � Redirected by middleware to `/login` or `/dashboard` based on session.

## Intentional exclusions

There is no database connection, Prisma client, CRUD API, CRM business logic,
or Contacts, Tracking, Attendance, or Activities page. Authentication is fully
independent of Prisma and PostgreSQL.
