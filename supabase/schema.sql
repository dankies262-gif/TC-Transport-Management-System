-- =====================================================================
-- Triumphant College Transport Management System
-- Supabase schema: tables, relationships, RLS policies, triggers
-- Run this once in the Supabase SQL editor (or via `supabase db push`)
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Lookup tables ----------

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  department_id uuid references departments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,          -- e.g. Admin, Transport Officer, Approver, Staff, Driver
  description text,
  can_approve boolean not null default false,
  can_manage boolean not null default false, -- manage users/vehicles/config
  created_at timestamptz not null default now()
);

insert into roles (name, description, can_approve, can_manage) values
  ('Admin', 'Full system access', true, true),
  ('Transport Officer', 'Assigns vehicles and drivers to approved bookings', true, true),
  ('Approver', 'Approves or declines booking requests (HODs, Deans)', true, false),
  ('Staff', 'Can request vehicle bookings', false, false),
  ('Driver', 'Assigned to trips', false, false)
on conflict (name) do nothing;

-- ---------- Profiles (extends Supabase auth.users) ----------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  first_name text not null,
  surname text not null,
  id_number text,
  contact_number text,
  photo_url text,
  department_id uuid references departments(id) on delete set null,
  section_id uuid references sections(id) on delete set null,
  location_id uuid references locations(id) on delete set null,
  role_id uuid references roles(id) on delete set null,
  status text not null default 'Active' check (status in ('Active','Inactive','Suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Vehicles ----------

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  make text not null,
  model text not null,
  year int,
  no_of_passengers int,
  km int default 0,
  location_id uuid references locations(id) on delete set null,
  status text not null default 'Available' check (status in ('Available','Booked','Maintenance','Out of Service')),
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Bookings ----------

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  purpose text not null,
  destination text not null,
  departure_date date not null,
  departure_time time,
  return_date date,
  return_time time,
  no_of_passengers int default 1,
  department_id uuid references departments(id) on delete set null,
  status text not null default 'Pending'
    check (status in ('Pending','Approved','Declined','Assigned','In Progress','Completed','Cancelled')),
  vehicle_id uuid references vehicles(id) on delete set null,
  driver_id uuid references profiles(id) on delete set null,
  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  decline_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_requester on bookings(requester_id);

-- ---------- updated_at trigger helper ----------

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_vehicles_updated on vehicles;
create trigger trg_vehicles_updated before update on vehicles
  for each row execute function set_updated_at();

drop trigger if exists trg_bookings_updated on bookings;
create trigger trg_bookings_updated before update on bookings
  for each row execute function set_updated_at();

-- ---------- Auto-create profile on signup ----------

create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  staff_role_id uuid;
begin
  select id into staff_role_id from public.roles where name = 'Staff' limit 1;
  insert into public.profiles (id, username, first_name, surname, role_id, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'surname', ''),
    staff_role_id,
    'Active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- Row Level Security ----------

alter table departments enable row level security;
alter table sections enable row level security;
alter table locations enable row level security;
alter table roles enable row level security;
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table bookings enable row level security;

-- Helper: does the current user manage / approve
create or replace function is_manager()
returns boolean language sql stable security definer as $$
  select coalesce((
    select r.can_manage from profiles p
    join roles r on r.id = p.role_id
    where p.id = auth.uid()
  ), false);
$$;

create or replace function is_approver()
returns boolean language sql stable security definer as $$
  select coalesce((
    select r.can_approve from profiles p
    join roles r on r.id = p.role_id
    where p.id = auth.uid()
  ), false);
$$;

-- Lookup tables: everyone signed in can read, only managers can write
create policy "read lookups" on departments for select using (auth.uid() is not null);
create policy "write lookups" on departments for all using (is_manager()) with check (is_manager());

create policy "read sections" on sections for select using (auth.uid() is not null);
create policy "write sections" on sections for all using (is_manager()) with check (is_manager());

create policy "read locations" on locations for select using (auth.uid() is not null);
create policy "write locations" on locations for all using (is_manager()) with check (is_manager());

create policy "read roles" on roles for select using (auth.uid() is not null);
create policy "write roles" on roles for all using (is_manager()) with check (is_manager());

-- Profiles: everyone can read (needed for dropdowns/driver lists); users edit own; managers edit all
create policy "read profiles" on profiles for select using (auth.uid() is not null);
create policy "update own profile" on profiles for update using (auth.uid() = id);
create policy "managers write profiles" on profiles for all using (is_manager()) with check (is_manager());

-- Vehicles: everyone reads; managers write
create policy "read vehicles" on vehicles for select using (auth.uid() is not null);
create policy "managers write vehicles" on vehicles for all using (is_manager()) with check (is_manager());

-- Bookings: requester sees own; approvers/managers see all; requester can create/cancel own pending
create policy "read own bookings" on bookings for select
  using (requester_id = auth.uid() or is_approver() or is_manager());

create policy "create own bookings" on bookings for insert
  with check (requester_id = auth.uid());

create policy "update own pending bookings" on bookings for update
  using (requester_id = auth.uid() and status = 'Pending')
  with check (requester_id = auth.uid());

create policy "approvers update bookings" on bookings for update
  using (is_approver() or is_manager())
  with check (true);

create policy "managers delete bookings" on bookings for delete using (is_manager());
