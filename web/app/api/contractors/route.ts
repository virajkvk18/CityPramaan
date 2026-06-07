import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/src/server/db/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ contractors: [] }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("contractors")
    .select("*")
    .order("updatedAt", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message, contractors: [] }, { status: 500 });
  }

  return NextResponse.json({ contractors: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const body = await request.json();

  if (!body.contractorId || !body.name) {
    return NextResponse.json({ error: "contractorId and name are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contractors")
    .upsert(
      {
        ...body,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: "contractorId" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contractor: data });
}
