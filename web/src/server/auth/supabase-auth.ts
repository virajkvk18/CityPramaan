/**
 * supabase-auth.ts — now delegates to Brevo-based auth (no Supabase dependency).
 * All original exports kept so existing route files don't need changes.
 */

export { AuthApiError } from "./brevo-auth";
export type { PublicUserProfile, AuthRole } from "./brevo-auth";

export {
  registerWithBrevo   as registerWithSupabase,
  loginWithBrevo      as loginWithSupabase,
  verifyBrevoEmail    as verifySupabaseEmail,
  resendBrevoVerification as resendSupabaseVerification,
  updateBrevoProfile  as updateSupabaseProfile,
  getBrevoUserFromToken,
} from "./brevo-auth";
