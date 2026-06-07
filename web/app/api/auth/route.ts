import { proxyBackendRequest } from "@/src/server/auth/backend-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  return proxyBackendRequest(request, "/api/auth");
}
