-- CityPramaan Supabase schema
-- Run this in Supabase Dashboard -> SQL Editor -> New query.
-- It creates the tables used by auth/profile, reports, and contractors APIs.

create table if not exists public.profiles (
  "id" uuid primary key,
  "email" text not null unique,
  "name" text not null default '',
  "contactNumber" text not null default '',
  "role" text not null default 'USER' check ("role" in ('USER', 'WARD_ADMIN', 'CONTRACTOR')),
  "emailVerified" boolean not null default false,
  "emailVerifiedAt" timestamptz,
  "walletAddress" text not null default '',
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
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.contractors (
  "contractorId" text primary key,
  "userId" uuid,
  "name" text not null,
  "identityNumber" text,
  "email" text,
  "phone" text,
  "area" text,
  "ward" text,
  "specialization" text,
  "agencyName" text,
  "verificationStatus" text not null default 'Verified',
  "availabilityStatus" text not null default 'Available',
  "assignedReports" jsonb not null default '[]'::jsonb,
  "updatedAt" timestamptz not null default now()
);

create table if not exists public.reports (
  "id" text primary key,
  "cityKey" text,
  "title" text not null,
  "ward" text,
  "status" text not null,
  "severity" text,
  "confidence" integer,
  "contractor" text,
  "citizenId" text,
  "citizenName" text,
  "citizenContact" text,
  "assignedContractorId" text,
  "assignedContractorDetails" jsonb,
  "assignedByAdmin" text,
  "assignedByAdminId" text,
  "adminApprovalStatus" text,
  "citizenFinalApproval" text,
  "warrantyStatus" text,
  "txHash" text,
  "warrantyDaysLeft" integer,
  "location" text,
  "latitude" numeric,
  "longitude" numeric,
  "mapUrl" text,
  "issueCategory" text,
  "assetType" text,
  "aiSummary" text,
  "recommendedAction" text,
  "slaHours" integer,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "issueImageName" text,
  "repairImageName" text,
  "repairProofAt" timestamptz,
  "repairNotes" text,
  "rejectionReason" text,
  "assignedAt" timestamptz,
  "acceptedAt" timestamptz,
  "workStartedAt" timestamptz,
  "workCompletedAt" timestamptz,
  "warrantyActivatedAt" timestamptz,
  "warrantyExpiresAt" timestamptz,
  "warrantyPeriodDays" integer,
  "evidenceHash" text,
  "proofBundleHash" text,
  "fabricProof" jsonb,
  "fabricProofs" jsonb,
  "repairEvidenceHash" text,
  "repairTxHash" text,
  "aiPriorityScore" integer,
  "imageEvidenceScore" integer,
  "aiModelVersion" text,
  "estimatedImpact" text,
  "ownerVerified" boolean,
  "closedAt" timestamptz,
  "closureNote" text,
  "publicFeedback" jsonb,
  "utilityRestoration" jsonb,
  "repairAudit" jsonb,
  "history" jsonb
);

create index if not exists "profiles_email_idx" on public.profiles ("email");
create index if not exists "reports_city_created_idx" on public.reports ("cityKey", "createdAt" desc);
create index if not exists "reports_status_idx" on public.reports ("status");
create index if not exists "contractors_area_idx" on public.contractors ("area", "ward");

alter table public.profiles enable row level security;
alter table public.contractors enable row level security;
alter table public.reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'service role can manage profiles'
  ) then
    create policy "service role can manage profiles"
      on public.profiles
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'contractors' and policyname = 'service role can manage contractors'
  ) then
    create policy "service role can manage contractors"
      on public.contractors
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'reports' and policyname = 'service role can manage reports'
  ) then
    create policy "service role can manage reports"
      on public.reports
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;
