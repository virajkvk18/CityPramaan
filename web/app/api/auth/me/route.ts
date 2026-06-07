import { proxyBackendRequest } from "@/src/server/auth/backend-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return proxyBackendRequest(request, "/api/auth/me");
}

export async function PATCH(request: Request) {
  return proxyBackendRequest(request, "/api/auth/me");
}
