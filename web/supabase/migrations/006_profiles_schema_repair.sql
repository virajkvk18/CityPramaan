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

alter table public.profiles
  add column if not exists "id" text,
  add column if not exists "email" text,
  add column if not exists "name" text,
  add column if not exists "contactNumber" text,
  add column if not exists "role" text default 'USER',
  add column if not exists "emailVerified" boolean default false,
  add column if not exists "emailVerifiedAt" timestamptz,
  add column if not exists "walletAddress" text,
  add column if not exists "address" text,
  add column if not exists "city" text,
  add column if not exists "ward" text,
  add column if not exists "department" text,
  add column if not exists "contractorLicense" text,
  add column if not exists "contractorIdentityNumber" text,
  add column if not exists "contractorArea" text,
  add column if not exists "contractorSpecialization" text,
  add column if not exists "agencyName" text,
  add column if not exists "verificationStatus" text,
  add column if not exists "availabilityStatus" text,
  add column if not exists "profileHash" text,
  add column if not exists "profileChainTxHash" text,
  add column if not exists "profileCompletedAt" timestamptz,
  add column if not exists "createdAt" timestamptz default now(),
  add column if not exists "updatedAt" timestamptz default now();

update public.profiles
set
  "emailVerified" = coalesce("emailVerified", false),
  "role" = coalesce("role", 'USER'),
  "createdAt" = coalesce("createdAt", now()),
  "updatedAt" = coalesce("updatedAt", now());

alter table public.profiles
  alter column "emailVerified" set default false,
  alter column "emailVerified" set not null,
  alter column "role" set default 'USER',
  alter column "createdAt" set default now(),
  alter column "updatedAt" set default now();

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

alter table public.contractors
  add column if not exists "contractorId" text,
  add column if not exists "userId" text,
  add column if not exists "name" text,
  add column if not exists "identityNumber" text,
  add column if not exists "email" text,
  add column if not exists "phone" text,
  add column if not exists "area" text,
  add column if not exists "ward" text,
  add column if not exists "specialization" text,
  add column if not exists "agencyName" text,
  add column if not exists "verificationStatus" text default 'Verified',
  add column if not exists "availabilityStatus" text default 'Available',
  add column if not exists "assignedReports" jsonb default '[]'::jsonb,
  add column if not exists "createdAt" timestamptz default now(),
  add column if not exists "updatedAt" timestamptz default now();

create unique index if not exists profiles_id_unique_idx
on public.profiles ("id");

create unique index if not exists profiles_email_unique_idx
on public.profiles ("email")
where "email" is not null;

create unique index if not exists contractors_id_unique_idx
on public.contractors ("contractorId");

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

notify pgrst, 'reload schema';
