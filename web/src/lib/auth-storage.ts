"use client";

import { buildContractorFromSignup, syncContractorProfileToBackend, upsertContractorProfile } from "./contractor-storage";

export type AuthRole = "USER" | "WARD_ADMIN" | "CONTRACTOR";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  contactNumber: string;
  role: AuthRole;
  passwordHash: string;
  passwordSalt: string;
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

export type PublicUserProfile = Omit<UserProfile, "passwordHash" | "passwordSalt">;

export const AUTH_USERS_KEY = "city-pramaan:auth-users";
export const AUTH_SESSION_KEY = "city-pramaan:auth-session";
export const AUTH_ACCESS_TOKEN_KEY = "city-pramaan:auth-access-token";
export const AUTH_REFRESH_TOKEN_KEY = "city-pramaan:auth-refresh-token";
export const AUTH_UPDATED_EVENT = "city-pramaan:auth-updated";

export const roleLabels: Record<AuthRole, string> = {
  USER: "Citizen user",
  WARD_ADMIN: "Ward admin",
  CONTRACTOR: "Contractor",
};

class BackendAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type BackendAuthPayload = {
  user?: PublicUserProfile;
  accessToken?: string;
  refreshToken?: string;
  emailVerificationRequired?: boolean;
  verificationExpiresAt?: string;
  delivery?: "brevo" | "resend" | "smtp" | "console";
  devVerificationCode?: string;
  error?: string;
};

export type SignUpResult =
  | {
      status: "verification_required";
      user: PublicUserProfile;
      email: string;
      verificationExpiresAt?: string;
      delivery?: "brevo" | "resend" | "smtp" | "console";
      devVerificationCode?: string;
    }
  | {
      status: "authenticated";
      user: PublicUserProfile;
    };

export function getAuthSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(AUTH_SESSION_KEY) ?? "";
}

export function subscribeAuth(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === AUTH_SESSION_KEY || event.key === AUTH_USERS_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_UPDATED_EVENT, callback);
  };
}

export function getCurrentUser(sessionIdOverride?: string): PublicUserProfile | null {
  const sessionId = sessionIdOverride ?? getAuthSnapshot();

  if (!sessionId) {
    return null;
  }

  const user = loadUsers().find((item) => item.id === sessionId);
  return user ? stripPrivateFields(user) : null;
}

export async function signUpUser(input: {
  email: string;
  password: string;
  name: string;
  contactNumber: string;
  role: AuthRole;
  contractorIdentityNumber?: string;
  contractorArea?: string;
  contractorWard?: string;
  contractorSpecialization?: string;
  agencyName?: string;
}): Promise<SignUpResult> {
  const email = normalizeEmail(input.email);

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const backendSignup = await registerWithBackend({
    ...input,
    email,
  });

  if (backendSignup.emailVerificationRequired) {
    if (!backendSignup.user) {
      throw new BackendAuthError("Signup did not return a user profile.", 500);
    }

    savePublicUser(backendSignup.user);
    return {
      status: "verification_required",
      user: backendSignup.user,
      email: backendSignup.user.email,
      verificationExpiresAt: backendSignup.verificationExpiresAt,
      delivery: backendSignup.delivery,
      devVerificationCode: backendSignup.devVerificationCode,
    };
  }

  const user = saveAuthenticatedBackendSession(backendSignup);
  syncContractorProfile(publicToLocalUser(user));
  return { status: "authenticated", user };
}

export async function loginUser(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);

  const backendLogin = await loginWithBackend({
    email,
    password,
  });
  const user = saveAuthenticatedBackendSession(backendLogin);
  syncContractorProfile(publicToLocalUser(user));
  return user;
}

export async function verifyEmailCode(emailInput: string, code: string) {
  const email = normalizeEmail(emailInput);
  const response = await backendAuthFetch("/api/auth/verify-email", {
    email,
    code: code.trim(),
  });
  const user = saveAuthenticatedBackendSession(response);
  syncContractorProfile(publicToLocalUser(user));
  return user;
}

export async function resendVerificationCode(emailInput: string) {
  const email = normalizeEmail(emailInput);
  return backendAuthFetch("/api/auth/resend-verification", { email });
}

export function logoutUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

export async function updateCurrentProfile(
  changes: Partial<Pick<UserProfile, "name" | "contactNumber" | "walletAddress" | "address" | "city" | "ward" | "department" | "contractorLicense" | "contractorIdentityNumber" | "contractorArea" | "contractorSpecialization" | "agencyName" | "verificationStatus" | "availabilityStatus">>
) {
  const sessionId = getAuthSnapshot();

  if (!sessionId) {
    throw new Error("Login required before updating profile.");
  }

  const users = loadUsers();
  const existing = users.find((user) => user.id === sessionId);

  if (!existing) {
    throw new Error("Current account could not be found.");
  }

  const updatedBase: UserProfile = {
    ...existing,
    ...Object.fromEntries(
      Object.entries(changes).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
    ),
    updatedAt: new Date().toISOString(),
  };
  const profileProof = await createProfileProof(updatedBase);
  const updated = {
    ...updatedBase,
    ...profileProof,
    profileCompletedAt: isProfileComplete(updatedBase) ? new Date().toISOString() : updatedBase.profileCompletedAt,
  };
  const synced = await updateBackendProfile(stripPrivateFields(updated));
  const syncedLocalUser = publicToLocalUser(synced, existing);

  saveUsers(users.map((user) => (user.id === sessionId ? syncedLocalUser : user)));
  syncContractorProfile(syncedLocalUser);
  setSession(syncedLocalUser.id);
  return stripPrivateFields(syncedLocalUser);
}

export function updateCurrentProfileChainProof(profileChainTxHash: string, walletAddress?: string) {
  const sessionId = getAuthSnapshot();

  if (!sessionId) {
    throw new Error("Login required before updating profile proof.");
  }

  const users = loadUsers();
  const existing = users.find((user) => user.id === sessionId);

  if (!existing) {
    throw new Error("Current account could not be found.");
  }

  const updated: UserProfile = {
    ...existing,
    walletAddress: walletAddress ?? existing.walletAddress,
    profileChainTxHash,
    updatedAt: new Date().toISOString(),
  };

  saveUsers(users.map((user) => (user.id === sessionId ? updated : user)));
  void updateBackendProfile(stripPrivateFields(updated))
    .then((synced) => {
      savePublicUser(synced);
    })
    .catch((error) => {
      console.warn("Profile chain proof backend sync failed:", error);
    });
  syncContractorProfile(updated);
  setSession(updated.id);
  return stripPrivateFields(updated);
}

export function isProfileComplete(profile: Pick<UserProfile, "name" | "contactNumber" | "address" | "city" | "ward" | "role" | "contractorLicense" | "department">) {
  const baseComplete = Boolean(profile.name && profile.contactNumber && profile.address && profile.city && profile.ward);

  if (profile.role === "CONTRACTOR") {
    return baseComplete && Boolean(profile.contractorLicense);
  }

  if (profile.role === "WARD_ADMIN") {
    return baseComplete && Boolean(profile.department);
  }

  return baseComplete;
}

function loadUsers(): UserProfile[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(AUTH_USERS_KEY);
    return raw ? (JSON.parse(raw) as UserProfile[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: UserProfile[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

function savePublicUser(user: PublicUserProfile) {
  const users = loadUsers();
  const existing = users.find((item) => item.id === user.id || item.email === user.email);
  const localUser = publicToLocalUser(user, existing);
  const nextUsers = [localUser, ...users.filter((item) => item.id !== localUser.id && item.email !== localUser.email)];

  saveUsers(nextUsers);
  return localUser;
}

function savePublicUserSession(user: PublicUserProfile) {
  const localUser = savePublicUser(user);
  setSession(localUser.id);
}

function saveAuthenticatedBackendSession(payload: BackendAuthPayload) {
  if (!payload.user) {
    throw new BackendAuthError("Authentication did not return a user profile.", 500);
  }

  savePublicUserSession(payload.user);
  saveBackendTokens(payload.accessToken, payload.refreshToken);
  return payload.user;
}

function publicToLocalUser(user: PublicUserProfile, existing?: UserProfile): UserProfile {
  const now = new Date().toISOString();

  return {
    ...existing,
    ...user,
    passwordHash: existing?.passwordHash ?? "",
    passwordSalt: existing?.passwordSalt ?? "",
    walletAddress: user.walletAddress || existing?.walletAddress || "",
    createdAt: user.createdAt ?? existing?.createdAt ?? now,
    updatedAt: user.updatedAt ?? existing?.updatedAt ?? now,
  };
}

function setSession(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, userId);
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

function stripPrivateFields(user: UserProfile): PublicUserProfile {
  const { passwordHash, passwordSalt, ...publicUser } = user;
  void passwordHash;
  void passwordSalt;
  return publicUser;
}

async function registerWithBackend(
  payload: {
    email: string;
    password: string;
    name?: string;
    contactNumber?: string;
    role?: AuthRole;
    contractorIdentityNumber?: string;
    contractorArea?: string;
    contractorWard?: string;
    contractorSpecialization?: string;
    agencyName?: string;
  }
) {
  return backendAuthFetch("/api/auth/register", payload);
}

async function loginWithBackend(payload: { email: string; password: string }) {
  return backendAuthFetch("/api/auth/login", payload);
}

async function backendAuthFetch(path: string, payload: Record<string, unknown>) {
  const response = await fetch(`${getAuthApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => ({}))) as BackendAuthPayload;

  if (!response.ok) {
    throw new BackendAuthError(body.error || `Authentication failed with status ${response.status}`, response.status);
  }

  return body;
}

async function updateBackendProfile(user: PublicUserProfile) {
  const accessToken = getBackendAccessToken();

  if (!accessToken) {
    throw new BackendAuthError("Login required before updating profile.", 401);
  }

  const response = await fetch(`${getAuthApiBaseUrl()}/api/auth/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });
  const body = (await response.json().catch(() => ({}))) as BackendAuthPayload;

  if (!response.ok || !body.user) {
    throw new BackendAuthError(body.error || `Profile update failed with status ${response.status}`, response.status);
  }

  return body.user;
}

function getBackendAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(AUTH_ACCESS_TOKEN_KEY) ?? "";
}

function saveBackendTokens(accessToken?: string, refreshToken?: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (accessToken) {
    window.localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    window.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  }
}

function getAuthApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_AUTH_API_URL?.replace(/\/$/, "");
  return configured || "";
}

async function createProfileProof(user: UserProfile) {
  const profileHash = await hashText(
    [
      user.id,
      user.email,
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
    profileChainTxHash: `${profileHash.slice(0, 14)}...${profileHash.slice(-8)}`,
  };
}

function syncContractorProfile(user: UserProfile) {
  if (user.role !== "CONTRACTOR") {
    return;
  }

  const contractor = buildContractorFromSignup({
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.contactNumber,
    identityNumber: user.contractorIdentityNumber || user.contractorLicense,
    area: user.contractorArea || user.address || user.city,
    ward: user.ward,
    specialization: user.contractorSpecialization,
    agencyName: user.agencyName,
  });

  upsertContractorProfile(contractor);
  void syncContractorProfileToBackend(contractor);
}

async function hashText(input: string) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));

  return `0x${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
