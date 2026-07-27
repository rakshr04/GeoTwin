# GeoTwin Field Operations Demo

This implementation uses Supabase Auth for browser sessions and NestJS as the
only business-data authority. Field dashboards are empty until a supervisor
creates an assignment. Demo geometries are illustrative and are not live
government data.

## Environment

Frontend (`.env.local`):

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_MAPBOX_ACCESS_TOKEN=
```

Backend (`backend/.env`):

```text
DATABASE_URL=
DATABASE_SSL=true
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

`VITE_MAPBOX_ACCESS_TOKEN` is optional. When omitted, the assigned-land page
shows a configuration-required state without affecting the rest of the app.
Never use a Supabase service-role key in the frontend.

## Start

In separate terminals:

```powershell
cd backend
npm run migration:run
npm run start:dev
```

```powershell
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend defaults to
`http://localhost:4000/api/v1`.

## Link demo profiles

Create two email/password users in Supabase Auth. Copy their Auth user UUIDs
and emails into these ignored `backend/.env` variables:

```text
DEMO_SUPERVISOR_AUTH_USER_ID=
DEMO_SUPERVISOR_EMAIL=
DEMO_SUPERVISOR_NAME=
DEMO_FIELD_AUTH_USER_ID=
DEMO_FIELD_EMAIL=
DEMO_FIELD_NAME=
```

Then run:

```powershell
cd backend
npm run seed:profiles
```

This command is idempotent and creates or links application profiles only. It
does not create projects, sectors, assignments, or tasks.

For a controlled demo assignment, explicitly run:

```powershell
npm run seed:demo-assignment
```

The command idempotently adds one labeled demo project, one illustrative
Telangana sector, one assignment, three tasks, a notification, and an activity
entry.

## Supervisor-to-field demo

1. Sign in with the supervisor Supabase account.
2. Open the Supervisor Assignment Centre.
3. Select an active field officer, project, and optional sector.
4. Enter instructions and a due date.
5. Add one or more tasks, choose priority, and mark evidence only where it is
   explicitly required.
6. Select **Issue Assignment**.
7. Sign out and sign in with the field-officer account.
8. The assignment appears in the dashboard and notification list immediately
   after refresh, or within the 25-second polling interval.
9. Accept the assignment, open a task, and start it.
10. Use **Report Field Change** for the selected active task. Evidence metadata
    is available only inside tasks that require evidence.
11. Use **Assigned Land** or **Open Map** to inspect the read-only sector
    polygon.

## Verification

```powershell
npm run lint
npm test
npm run build

cd backend
npm run typecheck
npm test -- --runInBand
npm run build
```

Evidence file upload is intentionally not simulated. Until a storage adapter
is configured, the API stores accurate evidence metadata with
`uploadStatus: METADATA_ONLY`.
