create table if not exists public.profiles (
  "id" text primary key,
  "email" text unique not null,
  "name" text not null,
  "contactNumber" text,
  "role" text not null default 'USER',
  "emailVerified" boolean not null default false,
  "emailVerifiedAt" timestamptz,
  "walletAddress" text,
  "address" text,
  "city" text,
  "ward" text,
  "department" text,
  "contractorLicense" text,
  "contractorIdentityNumber" text,
  "contractorArea" text,
  "contractorSpecialization" text,
  "agencyName" text,
  "verificationStatus" text,
  "availabilityStatus" text,
  "profileHash" text,
  "profileChainTxHash" text,
  "profileCompletedAt" timestamptz,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table if not exists public.contractors (
  "contractorId" text primary key,
  "userId" text,
  "name" text not null,
  "identityNumber" text,
  "email" text unique,
  "phone" text,
  "area" text,
  "ward" text,
  "specialization" text,
  "agencyName" text,
  "verificationStatus" text default 'Verified',
  "availabilityStatus" text default 'Available',
  "assignedReports" jsonb default '[]'::jsonb,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

alter table public.profiles
  add column if not exists "emailVerified" boolean not null default false,
  add column if not exists "emailVerifiedAt" timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'passwordHash'
  ) then
    alter table public.profiles alter column "passwordHash" drop not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'passwordSalt'
  ) then
    alter table public.profiles alter column "passwordSalt" drop not null;
  end if;
end $$;

create index if not exists profiles_email_idx on public.profiles ("email");
create index if not exists profiles_role_idx on public.profiles ("role");
create index if not exists contractors_email_idx on public.contractors ("email");
create index if not exists contractors_specialization_idx on public.contractors ("specialization");

alter table public.profiles enable row level security;
alter table public.contractors enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid()::text = "id");

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid()::text = "id")
with check (auth.uid()::text = "id");

drop policy if exists "Public can read contractors" on public.contractors;
create policy "Public can read contractors"
on public.contractors
for select
using (true);
