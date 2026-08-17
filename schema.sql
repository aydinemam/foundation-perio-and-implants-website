-- Foundation Periodontics and Implants — Supabase schema
-- Run this once in Supabase → SQL Editor (on your project) to set up the backend.
-- Holds only contact/scheduling info (name, phone, email, requested service/time) 
-- never store clinical/patient health information in these tables.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text not null,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  source text default 'contact_form'
);

create table if not exists appointment_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text not null,
  requested_service text,
  preferred_date date,
  preferred_time text,
  notes text,
  status text not null default 'new' check (status in ('new', 'scheduled', 'contacted', 'closed'))
);

create table if not exists page_views (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  page text not null,
  referrer text
);

-- Row Level Security: the public "anon" key may only INSERT (submit forms).
-- Reading, updating, and deleting requires an authenticated admin login.

alter table leads enable row level security;
alter table appointment_requests enable row level security;
alter table page_views enable row level security;

create policy "Anyone can submit a lead" on leads
  for insert to anon with check (true);

create policy "Only authenticated staff can read leads" on leads
  for select to authenticated using (true);

create policy "Only authenticated staff can update leads" on leads
  for update to authenticated using (true);

create policy "Only authenticated staff can delete leads" on leads
  for delete to authenticated using (true);

create policy "Anyone can submit an appointment request" on appointment_requests
  for insert to anon with check (true);

create policy "Only authenticated staff can read appointment requests" on appointment_requests
  for select to authenticated using (true);

create policy "Only authenticated staff can update appointment requests" on appointment_requests
  for update to authenticated using (true);

create policy "Only authenticated staff can delete appointment requests" on appointment_requests
  for delete to authenticated using (true);

create policy "Anyone can log a page view" on page_views
  for insert to anon with check (true);

create policy "Only authenticated staff can read page views" on page_views
  for select to authenticated using (true);

-- After running this file:
-- 1. Go to Authentication → Users in the Supabase dashboard and manually create
--    one login (email + password) for the office. That's the only account that
--    should ever be able to sign in to admin.html.
-- 2. Copy your Project URL and anon public key from Project Settings → API into
--    js/supabase-config.js.
