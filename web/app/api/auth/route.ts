import { authErrorJson, authJson } from "@/src/server/auth/http";
import { loginWithSupabase, registerWithSupabase } from "@/src/server/auth/supabase-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action === "signup" ? "signup" : "login";

    return authJson(
      action === "signup"
        ? await registerWithSupabase(body)
        : await loginWithSupabase(body)
    );
  } catch (error) {
    return authErrorJson(error);
  }
}
