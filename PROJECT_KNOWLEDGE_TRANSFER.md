# NAG CRM - Project Knowledge Transfer

Last updated: 3 July 2026

## 1. Project Goal

NAG CRM is an enterprise-oriented, strictly read-only CRM portal built on an existing PostgreSQL development database.

The application authenticates users through Auth0 and renders CRM information through Next.js Server Components. Database access is isolated behind repository classes.

## 2. Non-Negotiable Safety Rules

- The application is read-only.
- Use only `SELECT` statements.
- Never use `SELECT *`; explicitly list every returned column.
- Use Prisma tagged `$queryRaw`.
- Never use `$queryRawUnsafe` or `$executeRaw`.
- Parameterize every dynamic SQL value.
- Never execute `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`, `TRUNCATE`, `CREATE`, `GRANT`, or `REVOKE`.
- Never run `prisma db pull`, `prisma db push`, or Prisma migrations.
- Never create or modify Prisma models for the existing database.
- Never modify database data or schema.
- Never access production.
- The active database is selected exclusively through `DATABASE_URL`.
- Never hardcode environment-specific database names in repositories.
- Only repositories may import the Prisma singleton.
- Pages, components, and features must never import Prisma directly.
- Do not expose or commit `.env.local`.
- Do not create API routes, Server Actions, or client-side data fetching unless a later approved phase explicitly changes the architecture.

## 3. Current Technology

Resolved versions at the time of this report:

- Next.js `15.5.20` with App Router
- React `19.2.7`
- TypeScript `5.9.3`
- Auth0 Next.js SDK `4.24.0`
- Prisma CLI and Prisma Client `6.19.0`
- Tailwind CSS `3.4.17`
- shadcn/ui configuration
- PostgreSQL
- ESLint and Prettier

Some dependencies use caret ranges, so a clean install may resolve compatible newer patch versions.

## 4. Environment Configuration

`.env.local` exists and is excluded from Git. Never include its values in documentation, source control, chat, or logs.

Required Auth0 variables:

```env
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_SECRET=
APP_BASE_URL=http://localhost:3000
```

Required database variable:

```env
DATABASE_URL=postgresql://...
```

Prisma reads `DATABASE_URL`. Separate values such as `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` are not automatically consumed by Prisma.

The current environment targets the development database. Repositories remain environment-agnostic.

Auth0 local application configuration:

- Application type: Regular Web Application
- Allowed callback URL: `http://localhost:3000/auth/callback`
- Allowed logout URL: `http://localhost:3000`

## 5. Current Project Structure

```text
src/
|-- app/
|   |-- layout.tsx
|   |-- login/page.tsx
|   |-- dashboard/page.tsx
|   |-- contacts/page.tsx
|   |-- activities/page.tsx
|   `-- activities/[dealerId]/page.tsx
|-- components/
|   |-- layout/
|   `-- ui/
|-- config/
|-- features/
|   `-- auth/
|       |-- components/
|       |   |-- login-button.tsx
|       |   `-- logout-button.tsx
|       `-- server/
|           `-- auth0.ts
|-- hooks/
|-- lib/
|   `-- utils.ts
|-- server/
|   |-- db/
|   |   |-- prisma.ts
|   |   `-- index.ts
|   |-- repositories/
|   |   |-- contacts.repository.ts
|   |   |-- activities.repository.ts
|   |   |-- attendance.repository.ts
|   |   `-- tracking.repository.ts
|   `-- services/
|-- styles/
|   `-- globals.css
|-- types/
`-- middleware.ts
```

There is no `src/app/api` directory.

## 6. Completed Phases

### Phase 1 - Project Initialization

Initialized Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL support, ESLint, Prettier, and the scalable `src/` architecture.

### Phase 2 - Auth0 Authentication

Implemented:

- Auth0 SDK singleton in `src/features/auth/server/auth0.ts`
- Login page and login control
- Logout control
- SDK-managed encrypted cookie sessions
- Auth0 routes under `/auth/*`
- Route protection in `src/middleware.ts`
- Unauthenticated redirect to `/login`
- Authenticated redirect from `/` and `/login` to `/dashboard`

The broad middleware matcher is intentional because Auth0 uses it to maintain rolling sessions.

### Phase 3 - Prisma Infrastructure

Current schema:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

There are no Prisma models.

`src/server/db/prisma.ts` creates one lazy Prisma Client and caches it on `globalThis` outside production. Constructing the client does not connect to PostgreSQL. A connection opens only when a repository method executes a query or `$connect()` is called. No explicit `$connect()` exists.

`src/server/db/index.ts` exports the shared client:

```ts
export { prisma } from './prisma';
```

`prisma generate` succeeds and writes generated code to `src/generated/prisma`. Generation does not query PostgreSQL.

### Phase 4 - Repository Foundation

Repository classes and singleton instances exist for Contacts, Activities, Attendance, and Tracking.

Current status:

- Contacts repository: implemented
- Activities repository: implemented with pagination and search
- Attendance repository: inert `Not implemented` stub
- Tracking repository: dealer timeline implemented; original getTracking() stub preserved

### Phase 5 - Contacts Repository

Method:

```ts
contactsRepository.getContacts((limit = 20));
```

The method accepts integer limits from 1 through 20.

Query:

```sql
SELECT
  "id",
  "personName",
  "companyName",
  "phone",
  "email",
  "contactType",
  "createdAt"
FROM "dealers"
ORDER BY "createdAt" DESC
LIMIT $1;
```

The limit is parameterized through Prisma tagged `$queryRaw`.

Known `dealers` columns: `id`, `personName`, `companyName`, `phone`, `phone2`, `landline`, `email`, `contactType`, `address`, `description`, `gstNumber`, `userId`, `displayPicture`, `createdAt`, and `updatedAt`.

### Phase 6 - Dashboard with Live Contacts

`src/app/dashboard/page.tsx`:

- Is an authenticated async Server Component.
- Calls `contactsRepository.getContacts(5)` once per authenticated request.
- Displays a welcome message and the five newest contacts.
- Handles empty results and repository errors.
- Has no client-side fetching or API route.
- Links to `/contacts` with `prefetch={false}`.

### Phase 7 - Contacts Page

`src/app/contacts/page.tsx`:

- Is an authenticated async Server Component.
- Calls `contactsRepository.getContacts(20)` exactly once.
- Displays Person Name, Company Name, Phone, Email, Contact Type, and Created Date.
- Handles empty results and repository errors.
- Contains no create, edit, delete, search, filter, import, export, pagination, checkbox, bulk, or row actions.
- Links to `/dashboard` with prefetch disabled.

### Phase 8 - Activities Analysis and Revision

The first Activities implementation used `activityTasks`. Read-only schema analysis later showed that the client-required business view should instead use `followUps`.

The repository and page were revised together and now use the correct source.

### Phase 8.4 - Dealer Activity Timeline

Implemented:

- `trackingRepository.getDealerTimeline(dealerId)`
- Dynamic route `src/app/activities/[dealerId]/page.tsx`
- Dealer heading and newest-first tracking timeline
- Creator, address, coordinates, tracking type, distance, notes, and images
- Empty, invalid dealer, dealer-not-found, and repository-error states
- Public image thumbnails linked to original image references

The implementation uses one parameterized read-only query. The original `getTracking()` method remains unchanged.

### Phase 8.5 - Dealer Navigation

The Activities repository now returns `dealerId` as internal routing metadata. Dealer Name is the only clickable table field and links to `/activities/[dealerId]` with prefetch disabled.

### Phase 8.6 - Activities Pagination

Extended `src/server/repositories/activities.repository.ts`:

- `getActivities(limit, offset)` — added `offset` parameter with validation (`Number.isInteger && >= 0`).
- `getActivitiesCount()` — new method returning the total row count as `number`. PostgreSQL returns `COUNT(*)` as `bigint`; the method converts it with `Number()`.

Both methods use the same INNER JOINs so the count always matches the row set.

`src/app/activities/page.tsx`:

- Reads `searchParams.page`.
- Validates page: `Number.isInteger(rawPage) && rawPage >= 1` — any non-integer, negative, zero, decimal, or NaN input defaults to `1`.
- Computes `offset = (page - 1) * PAGE_SIZE` where `PAGE_SIZE = 20`.
- Calls both repository methods in parallel via `Promise.all`.
- Computes `totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))` to always show at least page 1 of 1 when there are no rows.
- Renders Previous and Next `<Link prefetch={false}>` controls; disabled state uses `<span aria-disabled="true">` with `opacity-50 cursor-not-allowed`.
- Preserves all existing table, dealer navigation, error handling, and empty state.

### Phase 8.7 - Activities Search

Extended `src/server/repositories/activities.repository.ts`:

- `getActivities(limit, offset, search)` — added optional `search` parameter (default `''`).
- `getActivitiesCount(search)` — extended with optional `search` parameter.

Search implementation:

- Trims the search value before use.
- When `term` is empty, executes the original query with no WHERE clause (preserving all existing behaviour).
- When `term` is non-empty, adds a parameterized WHERE block using PostgreSQL `ILIKE` for case-insensitive partial matching across four fields:
  - `dealer."personName"`
  - `salesperson."name"`
  - `dealer."contactType"`
  - `follow_up."notes"`
- Pattern is `%term%`, passed as a parameterized value via `$queryRaw`.
- Both `getActivities` and `getActivitiesCount` use the same branch logic so pagination always operates within the filtered result set.

**Known incompatibility — `Prisma.sql` / `Prisma.empty`:**
An attempt was made to use `Prisma.sql` and `Prisma.empty` to compose a single query template and avoid duplicating the SQL. This caused a runtime error (`Raw query failed. Code: 42601. Message: ERROR: syntax error at or near "$1"`). PostgreSQL received `$1` as a literal token at the end of the JOIN block because `$queryRaw` at this custom generated output path treats interpolated `Sql` objects as parameter values rather than SQL fragments. The fix is separate `if (!term)` branches — do not attempt `Prisma.sql`/`Prisma.empty` interpolation in `$queryRaw` in this project.

`src/app/activities/page.tsx`:

- Reads `searchParams.search` alongside `searchParams.page`.
- Trims the search value on the page before passing it to repositories.
- Renders a `<form method="get" action="/activities">` search bar above the table — plain HTML GET form, no Client Component, no Server Action.
- Clear button uses `<Link href="/activities" prefetch={false}>` (not a raw `<a>` tag) for consistency.
- Submitting the form navigates to `/activities?search=term`, which omits `page` and therefore always resets to page 1.
- Previous and Next links include `&search=encodeURIComponent(search)` when search is active, preserving the filter across pages.
- Section subtitle reflects search state: result count and search term when filtering, total and page otherwise.

## 7. Current Routes

| Route                   | Access        | Purpose                                              |
| ----------------------- | ------------- | ---------------------------------------------------- |
| `/login`                | Public        | Auth0 login entry                                    |
| `/dashboard`            | Authenticated | Welcome and five newest contacts                     |
| `/contacts`             | Authenticated | Up to twenty newest contacts                         |
| `/activities`           | Authenticated | Paginated follow-up activities with server-side search |
| `/activities/[dealerId]`| Authenticated | Dealer tracking timeline with notes and images       |
| `/auth/*`               | Auth0 SDK     | Login, callback, logout, profile, and session routes |

The Activities list links Dealer Name to its dealer timeline. The dashboard does not yet contain an Activities navigation link.

## 8. Application Data Flow

```text
Authenticated Server Component
        |
        v
Repository singleton
        |
        v
Shared Prisma singleton
        |
        v
Parameterized SELECT through DATABASE_URL
        |
        v
Existing PostgreSQL development database
```

Imports do not execute queries. Queries run only when an authenticated route explicitly invokes a repository method.

## 9. Activities Data Model

### Correct primary table: `followUps`

| Column         | PostgreSQL type         | Nullable | Default             |
| -------------- | ----------------------- | -------: | ------------------- |
| `id`           | `integer`               |       No | Sequence            |
| `dealerId`     | `integer`               |       No | None                |
| `userId`       | `integer`               |       No | None                |
| `delete`       | `integer`               |      Yes | `0`                 |
| `followUpDate` | `varchar(255)`          |       No | None                |
| `notes`        | `varchar(255)`          |      Yes | None                |
| `status`       | `enum_followUps_status` |       No | `pending`           |
| `createdAt`    | `timestamptz`           |      Yes | `CURRENT_TIMESTAMP` |
| `updatedAt`    | `timestamptz`           |      Yes | `CURRENT_TIMESTAMP` |

Primary key: `followUps.id`.

Enforced relationships:

```text
followUps.dealerId = dealers.id
followUps.userId = users.id
```

Both foreign keys use `ON UPDATE CASCADE` and `NO ACTION` for deletion.

Display-field mapping:

| Activities UI field | Source                   |
| ------------------- | ------------------------ |
| Dealer Name         | `dealers.personName`     |
| Date & Time         | `followUps.followUpDate` |
| Contact Type        | `dealers.contactType`    |
| Salesperson         | `users.name`             |
| Notes               | `followUps.notes`        |

`followUps.followUpDate` is a string, not a PostgreSQL timestamp. The current UI displays it as stored.

The meaning of `followUps.delete` was not confirmed by legacy source or database metadata. The approved implementation intentionally does not filter this column.

### Why `activityTasks` is not used

`activityTasks` contains subject, priority, due date, assigned user, and dealer references. It does not provide notes, contact type, or the required follow-up date/time business view.

The database also contains a separate `tasks` table, but no relationship is declared between `tasks` and `followUps` or `activityTasks`. It is not used by the current Activities module.

## 10. Activities Repository

Current method signatures:

```ts
activitiesRepository.getActivities(limit = 20, offset = 0, search = '');
activitiesRepository.getActivitiesCount(search = '');
```

Validation:
- `limit`: integer between 1 and 20.
- `offset`: non-negative integer.
- `search`: trimmed before use; empty string preserves no-WHERE behaviour.

Queries (no search):

```sql
-- getActivities
SELECT
  dealer."id"              AS "dealerId",
  dealer."personName"      AS "dealerName",
  follow_up."followUpDate" AS "dateTime",
  dealer."contactType",
  salesperson."name"       AS "salesperson",
  follow_up."notes"
FROM "followUps" AS follow_up
INNER JOIN "dealers" AS dealer ON follow_up."dealerId" = dealer."id"
INNER JOIN "users"   AS salesperson ON follow_up."userId" = salesperson."id"
ORDER BY follow_up."createdAt" DESC NULLS LAST, follow_up."id" DESC
LIMIT $1 OFFSET $2;

-- getActivitiesCount
SELECT COUNT(*) AS "count"
FROM "followUps" AS follow_up
INNER JOIN "dealers" AS dealer ON follow_up."dealerId" = dealer."id"
INNER JOIN "users"   AS salesperson ON follow_up."userId" = salesperson."id";
```

Queries (with search — WHERE block added, same joins and ordering):

```sql
WHERE (
  dealer."personName"     ILIKE $1
  OR salesperson."name"   ILIKE $1
  OR dealer."contactType" ILIKE $1
  OR follow_up."notes"    ILIKE $1
)
```

Pattern value is `%term%`. All values are parameterized. No `SELECT *`, no writes.

`dealerId` is returned only for routing and is not displayed as a visible column.

## 11. Activities Page

`src/app/activities/page.tsx`:

- Is an authenticated async Server Component.
- Reads `searchParams.page` and `searchParams.search`.
- Validates page using `Number.isInteger(rawPage) && rawPage >= 1`; any invalid value defaults to `1`.
- Trims search value; passes it to both repository methods.
- Calls `getActivities` and `getActivitiesCount` in parallel via `Promise.all`.
- Displays Dealer Name, Date & Time, Contact Type, Salesperson, and Notes.
- Renders a plain HTML `<form method="get">` search bar; no Client Component or Server Action.
- Clear uses `<Link href="/activities" prefetch={false}>`.
- Previous and Next pagination links preserve the active search via `&search=...`.
- Handles empty results and repository errors.
- Uses no client component, API route, client fetch, or Server Action.
- Contains no filters, sorting, export, bulk actions, row actions, or checkboxes.

## 12. Dealer Activity Timeline

`trackingRepository.getDealerTimeline(dealerId)`:

- Preserves the original `getTracking()` stub.
- Validates that `dealerId` is a positive integer.
- Uses one parameterized Prisma tagged `$queryRaw`.
- Uses `dealers` as the outer dealer source.
- Reads tracking entries from `trackingInfo`.
- Joins `users` for the creator name.
- Aggregates zero or more `trackingNotes` and `trackingImages`.
- Orders entries by `trackingInfo.createdAt DESC NULLS LAST` and `trackingInfo.id DESC`.
- Returns `null` when the dealer does not exist.
- Returns an empty `entries` array when the dealer exists without tracking data.

Verified relationships:

```text
trackingInfo.dealerId = dealers.id
trackingInfo.userId = users.id
trackingNotes.trackingInfoId = trackingInfo.id
trackingImages.trackingInfoId = trackingInfo.id
```

`src/app/activities/[dealerId]/page.tsx`:

- Is an authenticated async Server Component.
- Rejects invalid dealer IDs before querying.
- Calls `trackingRepository.getDealerTimeline(dealerId)` exactly once.
- Displays dealer name, date/time, creator, address, latitude, longitude, tracking type, distance, notes, and image thumbnails.
- Opens public image references in a new browser tab.
- Shows explicit empty states for missing notes, images, and timeline entries.
- Contains no map, upload, edit, delete, API route, Server Action, or client fetch.

## 13. Query and Database Safety Status

Queries executed per authenticated route render:

- `/dashboard`: one contacts `SELECT`, limit 5.
- `/contacts`: one contacts `SELECT`, limit 20.
- `/activities`: two parallel SELECTs — paginated activities and count — both optionally filtered by search.
- `/activities/[dealerId]`: one dealer tracking timeline SELECT.
- Attendance: no query; repository is a stub.
- Tracking: timeline query implemented; original generic method remains a stub.

No repository contains a database write operation, `$queryRawUnsafe`, `$executeRaw`, an explicit `$connect()`, or a migration/schema command.

Schema investigations used metadata queries in sessions forced to `default_transaction_read_only=on`. No schema or data modification occurred.

## 14. Verification Status and Known Warnings

After Phase 8.7 implementation, these commands passed:

```bash
npm run typecheck
npm run lint
npm run build
```

The production build includes `/activities` and `/activities/[dealerId]` as dynamic server-rendered routes.

Existing warnings (present before Phase 8.6; unchanged):

- Auth0's DPoP utility produces a dynamic dependency warning during bundling.
- Next's internal build-time ESLint integration reports obsolete options.

These are existing dependency warnings. Standalone `npm run lint` passes, and the production build exits successfully.

## 15. Known Issues

- The dashboard source currently contains malformed fallback text (`ï¿½`) for some null contact values due to an earlier file-encoding problem. Fix this only in a separately authorized UI cleanup.
- The dashboard currently links to Contacts but not Activities.
- The Attendance repository is a stub that throws `Not implemented`. No Attendance page exists.
- `trackingRepository.getTracking()` is a stub that throws `Not implemented`.
- `Prisma.sql` / `Prisma.empty` interpolation into `$queryRaw` does not work in this project (see Phase 8.7 notes). Use separate query branches for conditional WHERE logic.
- Update this KT file whenever a later phase changes repository queries, routes, or completed-module status.

## 16. Commands

Normal commands:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run prisma:generate
```

Forbidden commands:

```text
prisma db pull
prisma db push
prisma migrate ...
```

## 17. Instructions for the Next Assistant

1. Read this document before acting.
2. Preserve the strict read-only architecture.
3. Never print or expose `.env.local`.
4. Never invent table or column names.
5. Use forced read-only catalog inspection when schema information is unknown.
6. Present exact SQL and complete code before applying database work whenever the user requests an approval-first workflow.
7. Wait for explicit approval when requested.
8. Modify only files authorized by the current phase.
9. Keep repository and UI types consistent when a data contract changes.
10. Run typecheck, lint, and build after implementation.
11. Report existing warnings separately from new errors.
12. Do not silently continue to another phase.
13. Do not attempt `Prisma.sql` / `Prisma.empty` interpolation inside `$queryRaw` — use separate query branches for conditional WHERE logic instead.
