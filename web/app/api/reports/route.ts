import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/src/lib/supabase";

export const dynamic = "force-dynamic";

type ReportPayload = Record<string, unknown>;

const reportColumns = [
  "id",
  "cityKey",
  "title",
  "ward",
  "status",
  "severity",
  "confidence",
  "contractor",
  "txHash",
  "warrantyDaysLeft",
  "location",
  "latitude",
  "longitude",
  "mapUrl",
  "issueCategory",
  "assetType",
  "aiSummary",
  "recommendedAction",
  "slaHours",
  "createdAt",
  "updatedAt",
  "issueImageName",
  "repairImageName",
  "repairProofAt",
  "warrantyActivatedAt",
  "warrantyExpiresAt",
  "warrantyPeriodDays",
  "evidenceHash",
  "proofBundleHash",
  "repairEvidenceHash",
  "repairTxHash",
  "aiPriorityScore",
  "imageEvidenceScore",
  "aiModelVersion",
  "estimatedImpact",
  "ownerVerified",
  "closedAt",
  "closureNote",
  "publicFeedback",
  "utilityRestoration",
  "repairAudit",
  "history",
] as const;

function getMissingSupabaseResponse() {
  return NextResponse.json(
    {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      reports: [],
    },
    { status: 503 }
  );
}

function sanitizeReportPayload(body: ReportPayload) {
  const sanitized: Record<string, unknown> = {};

  for (const column of reportColumns) {
    if (body[column] !== undefined) {
      sanitized[column] = body[column];
    }
  }

  return sanitized;
}

export async function GET(request: Request) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return getMissingSupabaseResponse();
  }

  const { searchParams } = new URL(request.url);
  const cityKey = searchParams.get("cityKey") ?? searchParams.get("city");

  let query = supabase.from("reports").select("*").order("createdAt", { ascending: false });

  if (cityKey) {
    query = query.eq("cityKey", cityKey);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase reports GET error:", error.message);
    return NextResponse.json({ error: error.message, reports: [] }, { status: 500 });
  }

  return NextResponse.json({
    message: "Reports fetched from Supabase",
    count: data?.length ?? 0,
    reports: data ?? [],
  });
}

export async function POST(request: Request) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return getMissingSupabaseResponse();
  }

  const body = (await request.json()) as ReportPayload;
  const sanitizedReport = sanitizeReportPayload(body);

  if (!sanitizedReport.id || !sanitizedReport.title || !sanitizedReport.status) {
    return NextResponse.json(
      { error: "Missing required report fields: id, title, status" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("reports")
    .upsert(sanitizedReport, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Supabase reports POST error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Report saved to Supabase",
    report: data,
  });
}
