/**
 * brevo-auth.ts
 * Self-contained auth: file-based user store + Web Crypto JWT + Brevo email OTP.
 * No external auth provider required.
 */

import { createHash, randomBytes } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthRole = "USER" | "WARD_ADMIN" | "CONTRACTOR";

export interface PublicUserProfile {
  id: string;
  email: string;
  name: string;
  contactNumber: string;
  role: AuthRole;
  emailVerified: boolean;
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
}

interface StoredUser extends PublicUserProfile {
  passwordHash: string;
  otpHash?: string;
  otpExpiresAt?: string;
  otpAttempts?: number;
}

interface UserStore {
  users: StoredUser[];
}

export class AuthApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "AUTH_ERROR"
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// User store (JSON file)
// ---------------------------------------------------------------------------

function getStoreDir(): string {
  return process.env.AUTH_DATA_DIR || path.join(process.cwd(), "data");
}

function getStorePath(): string {
  return path.join(getStoreDir(), "citypramaan-auth.json");
}

function loadStore(): UserStore {
  const p = getStorePath();
  if (!existsSync(p)) return { users: [] };
  try {
    return JSON.parse(readFileSync(p, "utf8")) as UserStore;
  } catch {
    return { users: [] };
  }
}

function saveStore(store: UserStore): void {
  const dir = getStoreDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(getStorePath(), JSON.stringify(store, null, 2), "utf8");
}

function findUserByEmail(email: string): StoredUser | undefined {
  return loadStore().users.find((u) => u.email === email);
}

function findUserById(id: string): StoredUser | undefined {
  return loadStore().users.find((u) => u.id === id);
}

function saveUser(user: StoredUser): void {
  const store = loadStore();
  const idx = store.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    store.users[idx] = user;
  } else {
    store.users.push(user);
  }
  saveStore(store);
}

// ---------------------------------------------------------------------------
// Password hashing (SHA-256 + salt — no bcrypt dep needed for hackathon)
// ---------------------------------------------------------------------------

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = createHash("sha256").update(salt + password).digest("hex");
  return attempt === hash;
}

// ---------------------------------------------------------------------------
// JWT (HS256 via Web Crypto)
// ---------------------------------------------------------------------------

function getJwtSecret(): string {
  return (
    process.env.AUTH_JWT_SECRET ||
    process.env.JWT_SECRET ||
    "dev-only-citypramaan-web-secret-change-in-production"
  );
}

function base64url(buf: ArrayBuffer | string): string {
  const str =
    typeof buf === "string" ? buf : Buffer.from(buf).toString("base64");
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function signJwt(payload: Record<string, unknown>): Promise<string> {
  const secret = getJwtSecret();
  const header = base64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64"));
  const body = base64url(Buffer.from(JSON.stringify(payload)).toString("base64"));
  const data = `${header}.${body}`;

  const key = await crypto.subtle.importKey(
    "raw",
    Buffer.from(secret, "utf8"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, Buffer.from(data, "utf8"));
  return `${data}.${base64url(sig)}`;
}

async function verifyJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const secret = getJwtSecret();
    const data = `${header}.${body}`;
    const key = await crypto.subtle.importKey(
      "raw",
      Buffer.from(secret, "utf8"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBuf = Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const valid = await crypto.subtle.verify("HMAC", key, sigBuf, Buffer.from(data, "utf8"));
    if (!valid) return null;
    const payload = JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

const ACCESS_TTL_SECONDS = 15 * 60; // 15 min
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

async function issueTokens(userId: string) {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = await signJwt({
    sub: userId,
    iat: now,
    exp: now + ACCESS_TTL_SECONDS,
    type: "access",
  });
  const refreshToken = await signJwt({
    sub: userId,
    iat: now,
    exp: now + REFRESH_TTL_SECONDS,
    type: "refresh",
  });
  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer" as const,
    expiresIn: "15m",
  };
}

// ---------------------------------------------------------------------------
// OTP
// ---------------------------------------------------------------------------

const OTP_TTL_MS = 15 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

// ---------------------------------------------------------------------------
// Brevo email
// ---------------------------------------------------------------------------

async function sendBrevoEmail(to: string, toName: string, otp: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY || "";
  const fromEmail = process.env.BREVO_FROM_EMAIL || "";
  const fromName = process.env.BREVO_FROM_NAME || "CityPramaan";

  if (!apiKey || !fromEmail) {
    // Dev fallback — log to console
    console.log(`[CityPramaan] Email OTP for ${to}: ${otp}`);
    return;
  }

  const minutes = Math.ceil(OTP_TTL_MS / 60000);
  const html = [
    `<p>Hi ${escapeHtml(toName || "there")},</p>`,
    `<p>Your CityPramaan verification code is:</p>`,
    `<p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p>`,
    `<p>It expires in ${minutes} minutes.</p>`,
    `<p>If you did not request this, you can ignore this email.</p>`,
  ].join("");

  const text = [
    `Hi ${toName || "there"},`,
    "",
    `Your CityPramaan verification code is ${otp}.`,
    `It expires in ${minutes} minutes.`,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to, name: toName || undefined }],
      subject: "Verify your CityPramaan email",
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AuthApiError(
      503,
      `Could not send verification email (Brevo ${res.status}): ${body}`,
      "EMAIL_DELIVERY_FAILED"
    );
  }
}

// ---------------------------------------------------------------------------
// Email domain MX check
// ---------------------------------------------------------------------------

import { resolveMx } from "dns/promises";

async function assertEmailDomainAcceptsMail(email: string): Promise<void> {
  const domain = email.split("@")[1];
  if (!domain) throw new AuthApiError(400, "Invalid email address.", "INVALID_EMAIL");

  try {
    const records = await resolveMx(domain);
    const ok = records.some((r) => r.exchange && r.exchange !== ".");
    if (!ok) throw new AuthApiError(400, "Invalid email address.", "INVALID_EMAIL");
  } catch (err) {
    if (err instanceof AuthApiError) throw err;
    const code = (err as { code?: string }).code ?? "";
    if (["ENODATA", "ENOTFOUND", "ENODOMAIN"].includes(code)) {
      throw new AuthApiError(400, "Invalid email address.", "INVALID_EMAIL");
    }
    // DNS unavailable — allow through
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const VALID_ROLES: AuthRole[] = ["USER", "WARD_ADMIN", "CONTRACTOR"];

function normalizeEmail(raw?: string): string {
  const e = (raw ?? "").trim().toLowerCase();
  if (!e) throw new AuthApiError(400, "Email is required.", "EMAIL_REQUIRED");
  if (!EMAIL_RE.test(e) || e.length > 254) {
    throw new AuthApiError(400, "A valid email address is required.", "INVALID_EMAIL");
  }
  return e;
}

function normalizeRole(raw?: string): AuthRole {
  const r = ((raw ?? "USER").trim().toUpperCase()) as AuthRole;
  if (r === ("CITIZEN" as AuthRole)) return "USER";
  if (VALID_ROLES.includes(r)) return r;
  throw new AuthApiError(400, "Invalid role.", "INVALID_ROLE");
}

function clean(v?: string): string {
  return typeof v === "string" ? v.trim() : "";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toPublicProfile(u: StoredUser): PublicUserProfile {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, otpHash, otpExpiresAt, otpAttempts, ...pub } = u;
  return pub;
}

function makeProfileWallet(email: string): string {
  const h = createHash("sha256").update(`profile-wallet:${email}`).digest("hex");
  return `0x${h.slice(2, 10)}...${h.slice(-6)}`;
}

function makeProfileHash(u: StoredUser): string {
  const h = createHash("sha256")
    .update(
      [u.id, u.email, u.emailVerified, u.name, u.role, u.walletAddress, u.updatedAt].join("|")
    )
    .digest("hex");
  return `0x${h}`;
}

// ---------------------------------------------------------------------------
// Public API — same function signatures as supabase-auth.ts
// ---------------------------------------------------------------------------

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

type LoginPayload = { email?: string; password?: string };
type VerifyPayload = { email?: string; code?: string };

export async function registerWithBrevo(payload: RegisterPayload) {
  const email = normalizeEmail(payload.email);
  await assertEmailDomainAcceptsMail(email);

  if (!payload.name?.trim()) throw new AuthApiError(400, "Name is required.", "NAME_REQUIRED");
  if (!payload.contactNumber?.trim())
    throw new AuthApiError(400, "Contact number is required.", "CONTACT_REQUIRED");
  if ((payload.password ?? "").length < 8)
    throw new AuthApiError(400, "Password must be at least 8 characters.", "WEAK_PASSWORD");

  if (findUserByEmail(email)) {
    throw new AuthApiError(
      409,
      "An account already exists with this email address.",
      "EMAIL_EXISTS"
    );
  }

  const now = new Date().toISOString();
  const id = randomBytes(16).toString("hex");
  const role = normalizeRole(payload.role);
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const user: StoredUser = {
    id,
    email,
    name: payload.name.trim(),
    contactNumber: payload.contactNumber.trim(),
    role,
    emailVerified: false,
    walletAddress: makeProfileWallet(email),
    contractorIdentityNumber: clean(payload.contractorIdentityNumber),
    contractorArea: clean(payload.contractorArea),
    ward: clean(payload.contractorWard),
    contractorSpecialization: clean(payload.contractorSpecialization),
    agencyName: clean(payload.agencyName),
    verificationStatus: role === "CONTRACTOR" ? "Verified" : undefined,
    availabilityStatus: role === "CONTRACTOR" ? "Available" : undefined,
    createdAt: now,
    updatedAt: now,
    passwordHash: hashPassword(payload.password!),
    otpHash: hashOtp(otp),
    otpExpiresAt: expiresAt,
    otpAttempts: 0,
  };
  user.profileHash = makeProfileHash(user);
  user.profileChainTxHash = `${user.profileHash!.slice(0, 14)}...${user.profileHash!.slice(-8)}`;

  saveUser(user);
  await sendBrevoEmail(email, user.name, otp);

  const delivery = process.env.BREVO_API_KEY ? "brevo" : "console";
  const devCode =
    !process.env.BREVO_API_KEY || process.env.EXPOSE_DEV_VERIFICATION_CODE === "true"
      ? otp
      : undefined;

  return {
    user: toPublicProfile(user),
    emailVerificationRequired: true as const,
    verificationExpiresAt: expiresAt,
    delivery,
    ...(devCode ? { devVerificationCode: devCode } : {}),
  };
}

export async function loginWithBrevo(payload: LoginPayload) {
  const email = normalizeEmail(payload.email);
  if (!payload.password)
    throw new AuthApiError(400, "Password is required.", "PASSWORD_REQUIRED");

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
    throw new AuthApiError(401, "Incorrect email or password.", "INVALID_CREDENTIALS");
  }
  if (!user.emailVerified) {
    throw new AuthApiError(403, "Please verify your email before logging in.", "EMAIL_NOT_VERIFIED");
  }

  const tokens = await issueTokens(user.id);
  return { user: toPublicProfile(user), ...tokens };
}

export async function verifyBrevoEmail(payload: VerifyPayload) {
  const email = normalizeEmail(payload.email);
  const code = (payload.code ?? "").trim();

  if (!/^\d{4,10}$/.test(code)) {
    throw new AuthApiError(400, "A valid numeric verification code is required.", "INVALID_CODE");
  }

  const user = findUserByEmail(email);
  if (!user) throw new AuthApiError(404, "No account found with that email.", "USER_NOT_FOUND");
  if (user.emailVerified) {
    const tokens = await issueTokens(user.id);
    return { user: toPublicProfile(user), ...tokens };
  }
  if (!user.otpHash || !user.otpExpiresAt) {
    throw new AuthApiError(400, "No pending verification. Request a new code.", "NO_OTP");
  }
  if (new Date(user.otpExpiresAt) < new Date()) {
    throw new AuthApiError(400, "Verification code expired. Request a new one.", "OTP_EXPIRED");
  }
  if ((user.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
    throw new AuthApiError(429, "Too many attempts. Request a new code.", "OTP_MAX_ATTEMPTS");
  }
  if (user.otpHash !== hashOtp(code)) {
    user.otpAttempts = (user.otpAttempts ?? 0) + 1;
    saveUser(user);
    throw new AuthApiError(401, "Incorrect verification code.", "INVALID_CODE");
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date().toISOString();
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  user.updatedAt = new Date().toISOString();
  saveUser(user);

  const tokens = await issueTokens(user.id);
  return { user: toPublicProfile(user), ...tokens };
}

export async function resendBrevoVerification(payload: { email?: string }) {
  const email = normalizeEmail(payload.email);
  await assertEmailDomainAcceptsMail(email);

  const user = findUserByEmail(email);
  if (!user) throw new AuthApiError(404, "No account found with that email.", "USER_NOT_FOUND");
  if (user.emailVerified) {
    return { emailVerificationRequired: false, alreadyVerified: true, delivery: "brevo" };
  }

  // Cooldown check
  if (user.otpExpiresAt) {
    const issued = new Date(user.otpExpiresAt).getTime() - OTP_TTL_MS;
    if (Date.now() - issued < OTP_RESEND_COOLDOWN_MS) {
      throw new AuthApiError(
        429,
        "Please wait 60 seconds before requesting another code.",
        "RESEND_COOLDOWN"
      );
    }
  }

  const otp = generateOtp();
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  user.otpAttempts = 0;
  user.updatedAt = new Date().toISOString();
  saveUser(user);

  await sendBrevoEmail(email, user.name, otp);

  const delivery = process.env.BREVO_API_KEY ? "brevo" : "console";
  return {
    emailVerificationRequired: true as const,
    verificationExpiresAt: user.otpExpiresAt,
    delivery,
  };
}

export async function getBrevoUserFromToken(accessToken: string): Promise<PublicUserProfile> {
  const payload = await verifyJwt(accessToken);
  if (!payload || payload.type !== "access" || typeof payload.sub !== "string") {
    throw new AuthApiError(401, "Invalid or expired token.", "INVALID_TOKEN");
  }
  const user = findUserById(payload.sub);
  if (!user) throw new AuthApiError(401, "Account not found.", "USER_NOT_FOUND");
  return toPublicProfile(user);
}

type ProfilePatch = Partial<
  Pick<
    PublicUserProfile,
    | "name" | "contactNumber" | "walletAddress" | "address" | "city" | "ward"
    | "department" | "contractorLicense" | "contractorIdentityNumber"
    | "contractorArea" | "contractorSpecialization" | "agencyName"
    | "verificationStatus" | "availabilityStatus" | "profileChainTxHash"
  >
>;

export async function updateBrevoProfile(accessToken: string, changes: ProfilePatch) {
  const profile = await getBrevoUserFromToken(accessToken);
  const user = findUserById(profile.id)!;

  const allowed = [
    "name", "contactNumber", "walletAddress", "address", "city", "ward",
    "department", "contractorLicense", "contractorIdentityNumber",
    "contractorArea", "contractorSpecialization", "agencyName",
    "verificationStatus", "availabilityStatus", "profileChainTxHash",
  ] as const;

  for (const key of allowed) {
    const v = changes[key];
    if (typeof v === "string") (user as unknown as Record<string, unknown>)[key] = v.trim();
  }

  user.updatedAt = new Date().toISOString();
  user.profileHash = makeProfileHash(user);
  saveUser(user);

  return { user: toPublicProfile(user) };
}
