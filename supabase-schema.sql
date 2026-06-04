-- ============================================================
-- Stationery Shop - Supabase Schema
-- Clerk Auth Integration with Row Level Security (RLS)
-- ============================================================

-- 1. Enable the required extensions
create extension if not exists "pgcrypto";

-- 2. Create profiles table (synced from Clerk via webhook)
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  clerk_id    text unique not null,           -- Clerk user ID (sub claim in JWT)
  email       text,
  first_name  text,
  last_name   text,
  avatar_url  text,
  role        text default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 3. Enable Row Level Security
alter table public.profiles enable row level security;

-- 4. Create RLS policies using Clerk's JWT
--    Clerk JWT has 'sub' = clerk user ID, and supabase.auth.jwt() exposes the decoded token

-- Policy: Users can read their own profile
create policy "Users can read own profile"
  on public.profiles
  for select
  using (
    clerk_id = (select current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Policy: Users can update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using (
    clerk_id = (select current_setting('request.jwt.claims', true)::json->>'sub')
  )
  with check (
    clerk_id = (select current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- 5. Index for fast lookups
create index if not exists idx_profiles_clerk_id on public.profiles (clerk_id);

-- 6. Function to handle updated_at automatically
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();
