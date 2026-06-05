alter table public.reports
  add column if not exists "citizenId" text,
  add column if not exists "citizenName" text,
  add column if not exists "citizenContact" text,
  add column if not exists "assignedContractorId" text,
  add column if not exists "assignedContractorDetails" jsonb,
  add column if not exists "assignedByAdmin" text,
  add column if not exists "assignedByAdminId" text,
  add column if not exists "adminApprovalStatus" text,
  add column if not exists "citizenFinalApproval" text,
  add column if not exists "warrantyStatus" text,
  add column if not exists "repairNotes" text,
  add column if not exists "rejectionReason" text,
  add column if not exists "assignedAt" timestamptz,
  add column if not exists "acceptedAt" timestamptz,
  add column if not exists "workStartedAt" timestamptz,
  add column if not exists "workCompletedAt" timestamptz;

create index if not exists reports_assigned_contractor_idx on public.reports ("assignedContractorId");
create index if not exists reports_admin_approval_idx on public.reports ("adminApprovalStatus");
create index if not exists reports_citizen_final_idx on public.reports ("citizenFinalApproval");
create index if not exists reports_warranty_status_idx on public.reports ("warrantyStatus");
