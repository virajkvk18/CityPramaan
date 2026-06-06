import { authErrorJson, authJson } from "@/src/server/auth/http";
import { loginWithSupabase } from "@/src/server/auth/supabase-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return authJson(await loginWithSupabase(body));
  } catch (error) {
    return authErrorJson(error);
  }
}
