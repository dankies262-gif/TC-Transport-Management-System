# Triumphant College — Transport Management System

A booking and fleet-management system for Triumphant College: staff request a
vehicle, approvers (HODs/Transport Office) approve or decline, and the
Transport Office assigns a vehicle and driver.

Stack: **React + TypeScript + Vite + Tailwind CSS v4 + Supabase** (Postgres,
Auth, Row Level Security).

## Structure

- **Vehicle Bookings** — every signed-in user can request a vehicle and see
  their own requests; approvers see everyone's.
- **Vehicle Approvals** — approvers approve/decline requests, then assign a
  vehicle (and optionally a driver).
- **User Configurations** — User Accounts (assign role/department/office),
  User Roles (define who can approve or manage).
- **Location Configurations** — Departments, Sections, Locations/Offices.
- **Vehicle Configurations** — the fleet: registration, make, model, year,
  odometer, seats, status.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. In the SQL editor, run everything in [`supabase/schema.sql`](./supabase/schema.sql).
   This creates all tables, the auto-profile trigger, and Row Level Security
   policies, and seeds five starter roles (Admin, Transport Officer,
   Approver, Staff, Driver).
3. In **Project Settings → API**, copy the **Project URL** and **anon public
   key**.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open the printed local URL. Go to **Create an account** to sign up as the
first user, then in the Supabase dashboard (**Table Editor → profiles**),
set that user's `role_id` to the **Admin** role's id (Admin is seeded by the
schema). From then on, that admin can assign roles to everyone else from the
**User Accounts** screen in the app.

> New accounts default to the **Staff** role automatically via a database
> trigger, so nobody can grant themselves elevated access — an existing
> Admin/manager always has to promote them first.

## 4. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Triumphant College transport management system"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 5. Deploy to Vercel

1. [vercel.com](https://vercel.com) → **New Project** → import the GitHub repo.
2. Framework preset: **Vite**.
3. Add environment variables (same as `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

## Notes

- Auth uses Supabase's own email/password sign-up — there's no separate
  admin-created-user flow, since that requires a service-role key which
  should never live in a browser bundle. If you'd rather have the Transport
  Office create accounts directly (instead of self sign-up), that needs a
  small server-side function (e.g. a Supabase Edge Function) using the
  service-role key — happy to add that next if you want it.
- Departments/Sections/Locations seed empty — add your college's real
  faculties, offices, and campuses from the **Location Configurations**
  screens after first login.
- Row Level Security is on for every table: staff only see their own
  bookings, approvers see all bookings, and only Admin/Transport Officer
  (`can_manage` roles) can edit configuration.
