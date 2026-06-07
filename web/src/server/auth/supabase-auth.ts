import { createHash } from "crypto";
import { resolveMx } from "dns/promises";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  getSupabaseAdminClient,
  getSupabaseAuthClient,
} from "@/src/server/db/supabase-admin";

export type AuthRole = "USER" | "WARD_ADMIN" | "CONTRACTOR";

export type PublicUserProfile = {
  id: string;
  email: string;
  name: string;
  contactNumber: string;
  role: AuthRole;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  walletAddress: string;
  address?: string;
  city?: string;
  ward?: string;
  department?: string;
  contractorLicense?: string;
  contractorIdentityNumber?: string;
  contractorArea?: string;
  contractorSpecialization?: string;
  agencyName?: string;
  verificationStatus?: "Verified" | "Pending" | "Suspended";
  availabilityStatus?: "Available" | "Busy" | "Offline";
  profileHash?: string;
  profileChainTxHash?: string;
  profileCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type SupabaseProfileRecord = Record<string, unknown> & PublicUserProfile;

type RegisterPayload = {
  email?: string;
  password?: string;
  name?: string;
  contactNumber?: string;
  role?: AuthRole;
  contractorIdentityNumber?: string;
  contractorArea?: string;
  contractorWard?: string;
  contractorSpecialization?: string;
  agencyName?: string;
};

type LoginPayload = {
  email?: string;
  password?: string;
};

type VerifyPayload = {
  email?: string;
  code?: string;
};

type ProfilePatch = Partial<
  Pick<
    PublicUserProfile,
    | "name"
    | "contactNumber"
    | "walletAddress"
    | "address"
    | "city"
    | "ward"
    | "department"
    | "contractorLicense"
    | "contractorIdentityNumber"
    | "contractorArea"
    | "contractorSpecialization"
    | "agencyName"
    | "verificationStatus"
    | "availabilityStatus"
    | "profileChainTxHash"
  >
>;

export class AuthApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "AUTH_ERROR"
  ) {
    super(message);
  }
}

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const VALID_ROLES: AuthRole[] = ["USER", "WARD_ADMIN", "CONTRACTOR"];

export async function registerWithSupabase(payload: RegisterPayload) {
  const { auth, admin } = getClients();
  const email = normalizeEmailStrict(payload.email);
  const password = payload.password || "";
  const role = normalizeRole(payload.role);

  await assertEmailDomainAcceptsMail(email);

  if (!payload.name?.trim()) throw new AuthApiError(400, "Name is required.", "NAME_REQUIRED");
  if (!payload.contactNumber?.trim()) {
    throw new AuthApiError(400, "Contact number is required.", "CONTACT_REQUIRED");
  }
  if (password.length < 8) {
    throw new AuthApiError(400, "Password must be at least 8 characters.", "WEAK_PASSWORD");
  }

  const { data: existingProfile, error: existingError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingError) throwSupabaseDataError(existingError);
  if (existingProfile) {
    throw new AuthApiError(409, "An account already exists with this email address.", "EMAIL_EXISTS");
  }

  const metadata = {
    name: payload.name.trim(),
    contactNumber: payload.contactNumber.trim(),
    role,
    contractorIdentityNumber: clean(payload.contractorIdentityNumber),
    contractorArea: clean(payload.contractorArea),
    contractorWard: clean(payload.contractorWard),
    contractorSpecialization: clean(payload.contractorSpecialization),
    agencyName: clean(payload.agencyName),
  };
  const emailRedirectTo = getEmailRedirectTo();
  const { data, error } = await auth.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
    },
  });

  if (error) throwSupabaseAuthError(error);
  if (!data.user) {
    throw new AuthApiError(500, "Signup did not return a Supabase user.", "SUPABASE_SIGNUP_FAILED");
  }

  const emailVerified = Boolean(data.user.email_confirmed_at || data.session);
  const profile = await upsertProfileForUser(admin, data.user, {
    ...metadata,
    email,
    emailVerified,
    emailVerifiedAt: emailVerified ? new Date().toISOString() : undefined,
  });

  if (data.session) {
    return toAuthResponse(profile, data.session.access_token, data.session.refresh_token);
  }

  return {
    user: profile,
    emailVerificationRequired: true,
    verificationExpiresAt: getFallbackVerificationExpiry(),
    delivery: "supabase" as const,
  };
}

export async function loginWithSupabase(payload: LoginPayload) {
  const { auth, admin } = getClients();
  const email = normalizeEmailStrict(payload.email);

  if (!payload.password) {
    throw new AuthApiError(400, "Password is required.", "PASSWORD_REQUIRED");
  }

  const { data, error } = await auth.auth.signInWithPassword({
    email,
    password: payload.password,
  });

  if (error) throwSupabaseAuthError(error);
  if (!data.user || !data.session) {
    throw new AuthApiError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
  }

  const profile = await getOrCreateProfileForUser(admin, data.user, true);
  return toAuthResponse(profile, data.session.access_token, data.session.refresh_token);
}

export async function verifySupabaseEmail(payload: VerifyPayload) {
  const { auth, admin } = getClients();
  const email = normalizeEmailStrict(payload.email);
  const token = clean(payload.code);

  if (!/^\d{4,10}$/.test(token)) {
    throw new AuthApiError(400, "A valid numeric verification code is required.", "INVALID_VERIFICATION_CODE");
  }

  const { data, error } = await auth.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) throwSupabaseAuthError(error);
  if (!data.user || !data.session) {
    throw new AuthApiError(401, "Verification failed. Request a new code.", "INVALID_CODE");
  }

  const profile = await getOrCreateProfileForUser(admin, data.user, true);
  return toAuthResponse(profile, data.session.access_token, data.session.refresh_token);
}

export async function resendSupabaseVerification(payload: { email?: string }) {
  const { auth } = getClients();
  const email = normalizeEmailStrict(payload.email);
  await assertEmailDomainAcceptsMail(email);

  const emailRedirectTo = getEmailRedirectTo();
  const { error } = await auth.auth.resend({
    type: "signup",
    email,
    options: {
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
    },
  });

  if (error) throwSupabaseAuthError(error);

  return {
    emailVerificationRequired: true,
    verificationExpiresAt: getFallbackVerificationExpiry(),
    delivery: "supabase" as const,
  };
}

export async function updateSupabaseProfile(accessToken: string, changes: ProfilePatch) {
  const { auth, admin } = getClients();
  const { data, error } = await auth.auth.getUser(accessToken);

  if (error) throwSupabaseAuthError(error);
  if (!data.user) {
    throw new AuthApiError(401, "Login required before updating profile.", "LOGIN_REQUIRED");
  }

  const existing = await getOrCreateProfileForUser(admin, data.user, true);
  const patch = sanitizeProfilePatch(changes);
  const updatedBase = {
    ...existing,
    ...patch,
    id: data.user.id,
    email: data.user.email || existing.email,
    role: existing.role,
    emailVerified: Boolean(data.user.email_confirmed_at || existing.emailVerified),
    emailVerifiedAt: data.user.email_confirmed_at || existing.emailVerifiedAt,
    updatedAt: new Date().toISOString(),
  };
  const profile = await upsertProfileForUser(admin, data.user, updatedBase);

  return { user: profile };
}

function getClients() {
  const auth = getSupabaseAuthClient();
  const admin = getSupabaseAdminClient();

  if (!auth || !admin) {
    throw new AuthApiError(
      503,
      "Supabase Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
      "SUPABASE_NOT_CONFIGURED"
    );
  }

  return { auth, admin };
}

async function getOrCreateProfileForUser(
  admin: SupabaseClient,
  user: User,
  markVerified: boolean
): Promise<PublicUserProfile> {
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throwSupabaseDataError(error);

  if (data) {
    const profile = data as SupabaseProfileRecord;
    const shouldMarkVerified = markVerified && (!profile.emailVerified || !profile.emailVerifiedAt);

    if (!shouldMarkVerified) {
      return toPublicProfile(profile);
    }

    return upsertProfileForUser(admin, user, {
      ...profile,
      emailVerified: true,
      emailVerifiedAt: user.email_confirmed_at || new Date().toISOString(),
    });
  }

  return upsertProfileForUser(admin, user, {
    email: user.email || "",
    ...profileFromUserMetadata(user),
    emailVerified: markVerified,
    emailVerifiedAt: markVerified ? user.email_confirmed_at || new Date().toISOString() : undefined,
  });
}

async function upsertProfileForUser(
  admin: SupabaseClient,
  user: User,
  input: Partial<PublicUserProfile> & {
    contractorWard?: string;
  }
): Promise<PublicUserProfile> {
  const now = new Date().toISOString();
  const role = normalizeRole(input.role);
  const email = normalizeEmailStrict(input.email || user.email);
  const profileBase: PublicUserProfile = {
    id: user.id,
    email,
    name: clean(input.name) || email.split("@")[0],
    contactNumber: clean(input.contactNumber),
    role,
    emailVerified: Boolean(input.emailVerified || user.email_confirmed_at),
    emailVerifiedAt: input.emailVerifiedAt || user.email_confirmed_at || undefined,
    walletAddress: clean(input.walletAddress) || createProfileWallet(email),
    address: clean(input.address),
    city: clean(input.city),
    ward: clean(input.contractorWard) || clean(input.ward),
    department: clean(input.department),
    contractorLicense: clean(input.contractorLicense),
    contractorIdentityNumber: clean(input.contractorIdentityNumber),
    contractorArea: clean(input.contractorArea),
    contractorSpecialization: clean(input.contractorSpecialization),
    agencyName: clean(input.agencyName),
    verificationStatus:
      input.verificationStatus || (role === "CONTRACTOR" ? "Verified" : undefined),
    availabilityStatus:
      input.availabilityStatus || (role === "CONTRACTOR" ? "Available" : undefined),
    profileChainTxHash: clean(input.profileChainTxHash),
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
  const profile: PublicUserProfile = {
    ...profileBase,
    ...createProfileProof(profileBase),
  };
  const { data, error } = await admin
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throwSupabaseDataError(error);

  const publicProfile = toPublicProfile(data as SupabaseProfileRecord);

  if (publicProfile.role === "CONTRACTOR") {
    await upsertContractor(admin, publicProfile);
  }

  return publicProfile;
}

async function upsertContractor(admin: SupabaseClient, profile: PublicUserProfile) {
  const contractorId =
    clean(profile.contractorIdentityNumber) ||
    clean(profile.contractorLicense) ||
    `CTR-${Math.abs(hashNumber(profile.email)).toString().padStart(4, "0").slice(0, 4)}`;

  const { error } = await admin.from("contractors").upsert(
    {
      contractorId,
      userId: profile.id,
      name: profile.name,
      identityNumber: contractorId,
      email: profile.email,
      phone: clean(profile.contactNumber) || "+91 demo contractor",
      area: clean(profile.contractorArea) || clean(profile.address) || clean(profile.city) || "City service area",
      ward: clean(profile.ward) || "Ward service zone",
      specialization: clean(profile.contractorSpecialization) || "GENERAL",
      agencyName: clean(profile.agencyName) || "Independent contractor",
      verificationStatus: profile.verificationStatus || "Verified",
      availabilityStatus: profile.availabilityStatus || "Available",
      updatedAt: new Date().toISOString(),
    },
    { onConflict: "contractorId" }
  );

  if (error) throwSupabaseDataError(error);
}

function profileFromUserMetadata(user: User): Partial<PublicUserProfile> {
  const metadata = user.user_metadata || {};

  return {
    email: user.email || "",
    name: clean(metadata.name as string),
    contactNumber: clean(metadata.contactNumber as string),
    role: normalizeRole(metadata.role as AuthRole | undefined),
    contractorIdentityNumber: clean(metadata.contractorIdentityNumber as string),
    contractorArea: clean(metadata.contractorArea as string),
    ward: clean(metadata.contractorWard as string),
    contractorSpecialization: clean(metadata.contractorSpecialization as string),
    agencyName: clean(metadata.agencyName as string),
  };
}

function sanitizeProfilePatch(changes: ProfilePatch): ProfilePatch {
  const allowed: Array<keyof ProfilePatch> = [
    "name",
    "contactNumber",
    "walletAddress",
    "address",
    "city",
    "ward",
    "department",
    "contractorLicense",
    "contractorIdentityNumber",
    "contractorArea",
    "contractorSpecialization",
    "agencyName",
    "verificationStatus",
    "availabilityStatus",
    "profileChainTxHash",
  ];
  const sanitized: ProfilePatch = {};

  for (const key of allowed) {
    const value = changes[key];
    if (typeof value === "string") {
      sanitized[key] = value.trim() as never;
    }
  }

  return sanitized;
}

async function assertEmailDomainAcceptsMail(email: string): Promise<void> {
  const domain = email.split("@")[1];

  if (!domain) {
    throw new AuthApiError(400, "Invalid email address.", "INVALID_EMAIL");
  }

  try {
    const records = await resolveMx(domain);
    const hasMailExchange = records.some((record) => record.exchange && record.exchange !== ".");

    if (!hasMailExchange) {
      throw new AuthApiError(400, "Invalid email address.", "INVALID_EMAIL");
    }
  } catch (error) {
    if (error instanceof AuthApiError) throw error;

    const dnsCode = getErrorCode(error);
    if (["ENODATA", "ENOTFOUND", "ENODOMAIN"].includes(dnsCode)) {
      throw new AuthApiError(400, "Invalid email address.", "INVALID_EMAIL");
    }

    console.warn("Email domain MX check unavailable, allowing Supabase verification attempt:", error);
  }
}

function toAuthResponse(profile: PublicUserProfile, accessToken: string, refreshToken: string) {
  return {
    user: profile,
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: "supabase-session",
  };
}

function toPublicProfile(profile: SupabaseProfileRecord): PublicUserProfile {
  return {
    id: String(profile.id),
    email: String(profile.email),
    name: String(profile.name || ""),
    contactNumber: String(profile.contactNumber || ""),
    role: normalizeRole(profile.role as AuthRole | undefined),
    emailVerified: Boolean(profile.emailVerified),
    emailVerifiedAt: clean(profile.emailVerifiedAt as string) || undefined,
    walletAddress: String(profile.walletAddress || ""),
    address: clean(profile.address as string),
    city: clean(profile.city as string),
    ward: clean(profile.ward as string),
    department: clean(profile.department as string),
    contractorLicense: clean(profile.contractorLicense as string),
    contractorIdentityNumber: clean(profile.contractorIdentityNumber as string),
    contractorArea: clean(profile.contractorArea as string),
    contractorSpecialization: clean(profile.contractorSpecialization as string),
    agencyName: clean(profile.agencyName as string),
    verificationStatus: profile.verificationStatus as PublicUserProfile["verificationStatus"],
    availabilityStatus: profile.availabilityStatus as PublicUserProfile["availabilityStatus"],
    profileHash: clean(profile.profileHash as string),
    profileChainTxHash: clean(profile.profileChainTxHash as string),
    profileCompletedAt: clean(profile.profileCompletedAt as string) || undefined,
    createdAt: String(profile.createdAt || new Date().toISOString()),
    updatedAt: String(profile.updatedAt || new Date().toISOString()),
  };
}

function normalizeEmailStrict(email?: string): string {
  const normalized = clean(email).toLowerCase();

  if (!normalized) {
    throw new AuthApiError(400, "Email is required.", "EMAIL_REQUIRED");
  }

  if (!isValidEmail(normalized)) {
    throw new AuthApiError(400, "A valid email address is required.", "INVALID_EMAIL");
  }

  return normalized;
}

function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const [localPart] = email.split("@");
  if (!localPart || localPart.length > 64 || localPart.includes("..")) return false;
  return EMAIL_PATTERN.test(email);
}

function normalizeRole(roleInput?: AuthRole): AuthRole {
  const role = (roleInput || "USER").toUpperCase();
  if (role === "CITIZEN") return "USER";
  if (VALID_ROLES.includes(role as AuthRole)) return role as AuthRole;
  throw new AuthApiError(400, "Invalid role.", "INVALID_ROLE");
}

function createProfileProof(user: PublicUserProfile): Pick<PublicUserProfile, "profileHash" | "profileChainTxHash"> {
  const profileHash = hashText(
    [
      user.id,
      user.email,
      user.emailVerified,
      user.emailVerifiedAt,
      user.name,
      user.contactNumber,
      user.role,
      user.walletAddress,
      user.address,
      user.city,
      user.ward,
      user.department,
      user.contractorLicense,
      user.contractorIdentityNumber,
      user.contractorArea,
      user.contractorSpecialization,
      user.agencyName,
      user.verificationStatus,
      user.availabilityStatus,
      user.updatedAt,
    ].join("|")
  );

  return {
    profileHash,
    profileChainTxHash: user.profileChainTxHash || `${profileHash.slice(0, 14)}...${profileHash.slice(-8)}`,
  };
}

function createProfileWallet(seed: string): string {
  const hash = hashText(`profile-wallet:${seed}`);
  return `0x${hash.slice(2, 10)}...${hash.slice(-6)}`;
}

function hashText(value: string): string {
  return `0x${createHash("sha256").update(value).digest("hex")}`;
}

function hashNumber(value: string): number {
  return Array.from(value).reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
}

function getFallbackVerificationExpiry() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

function getEmailRedirectTo() {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (!configuredSiteUrl) {
    return undefined;
  }

  return `${configuredSiteUrl.replace(/\/$/, "")}/auth`;
}

function throwSupabaseAuthError(error: { message?: string; status?: number; code?: string }): never {
  const message = error.message || "Supabase authentication failed.";
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    throw new AuthApiError(403, "Please verify your email before logging in.", "EMAIL_NOT_VERIFIED");
  }

  if (normalized.includes("invalid login credentials")) {
    throw new AuthApiError(401, "Incorrect email or password.", "INVALID_CREDENTIALS");
  }

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    throw new AuthApiError(409, "An account already exists with this email address.", "EMAIL_EXISTS");
  }

  if (normalized.includes("invalid") || error.status === 400) {
    throw new AuthApiError(400, message, error.code || "SUPABASE_AUTH_ERROR");
  }

  throw new AuthApiError(error.status || 500, message, error.code || "SUPABASE_AUTH_ERROR");
}

function throwSupabaseDataError(error: { message?: string; code?: string }): never {
  const message = error.message || "Supabase database operation failed.";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("could not find the table") ||
    normalized.includes("schema cache") ||
    (normalized.includes("relation") && normalized.includes("does not exist")) ||
    error.code === "42P01" ||
    error.code === "PGRST205"
  ) {
    throw new AuthApiError(
      500,
      "Supabase database tables are missing. Run docs/database/supabase-schema.sql in the Supabase SQL Editor, then redeploy/retry.",
      "SUPABASE_SCHEMA_MISSING"
    );
  }

  throw new AuthApiError(500, message, error.code || "SUPABASE_DATA_ERROR");
}

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return "";
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

function clean(value?: string): string {
  return typeof value === "string" ? value.trim() : "";
}
