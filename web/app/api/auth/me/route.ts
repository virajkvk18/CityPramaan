import { authErrorJson, authJson } from "@/src/server/auth/http";
import { AuthApiError, updateSupabaseProfile } from "@/src/server/auth/supabase-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    const body = await request.json();
    return authJson(await updateSupabaseProfile(accessToken, body));
  } catch (error) {
    return authErrorJson(error);
  }
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    throw new AuthApiError(401, "Login required before updating profile.", "LOGIN_REQUIRED");
  }

  return match[1];
}
