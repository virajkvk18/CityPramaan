alter table public.reports
  add column if not exists "fabricProof" jsonb,
  add column if not exists "fabricProofs" jsonb default '[]'::jsonb,
  add column if not exists "repairNotes" text,
  add column if not exists "rejectionReason" text,
  add column if not exists "assignedContractorDetails" jsonb,
  add column if not exists "publicFeedback" jsonb default '[]'::jsonb,
  add column if not exists "utilityRestoration" jsonb,
  add column if not exists "repairAudit" jsonb,
  add column if not exists "history" jsonb default '[]'::jsonb;

create index if not exists reports_assigned_contractor_idx
on public.reports ("assignedContractorId");

create index if not exists reports_updated_at_idx
on public.reports ("updatedAt" desc);
