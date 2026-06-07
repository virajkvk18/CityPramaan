import { authErrorJson, authJson } from "@/src/server/auth/http";
import { AuthApiError, updateSupabaseProfile, getBrevoUserFromToken } from "@/src/server/auth/supabase-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const accessToken = getBearerToken(request);
    const { getBrevoUserFromToken: getUser } = await import("@/src/server/auth/brevo-auth");
    const user = await getUser(accessToken);
    return authJson({ user });
  } catch (error) {
    return authErrorJson(error);
  }
}

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
    throw new AuthApiError(401, "Login required.", "LOGIN_REQUIRED");
  }

  return match[1];
}
