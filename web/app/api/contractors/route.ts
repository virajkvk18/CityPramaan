import { NextResponse } from "next/server";
import { fetchBackendJson, proxyBackendRequest } from "@/src/server/auth/backend-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, response, error } = await fetchBackendJson<{
    data?: unknown[];
    contractors?: unknown[];
    error?: string;
  }>("/api/contractors");

  if (error) {
    return NextResponse.json({ error, contractors: [] }, { status: 503 });
  }

  if (!response?.ok) {
    return NextResponse.json(
      { error: data?.error || "Could not fetch contractors from backend.", contractors: [] },
      { status: response?.status || 500 }
    );
  }

  return NextResponse.json({ contractors: data?.contractors || data?.data || [] });
}

export async function POST(request: Request) {
  return proxyBackendRequest(request, "/api/contractors");
}
