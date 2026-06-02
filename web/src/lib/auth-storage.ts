"use client";

export type AuthRole = "USER" | "WARD_ADMIN" | "CONTRACTOR";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  contactNumber: string;
  role: AuthRole;
  passwordHash: string;
  passwordSalt: string;
  walletAddress: string;
  address?: string;
  city?: string;
  ward?: string;
  department?: string;
  contractorLicense?: string;
  profileHash?: string;
  profileChainTxHash?: string;
  profileCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicUserProfile = Omit<UserProfile, "passwordHash" | "passwordSalt">;

export const AUTH_USERS_KEY = "city-pramaan:auth-users";
export const AUTH_SESSION_KEY = "city-pramaan:auth-session";
export const AUTH_UPDATED_EVENT = "city-pramaan:auth-updated";

export const roleLabels: Record<AuthRole, string> = {
  USER: "Citizen user",
  WARD_ADMIN: "Ward admin",
  CONTRACTOR: "Contractor",
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
}) {
  const email = normalizeEmail(input.email);
  const users = loadUsers();

  if (users.some((user) => user.email === email)) {
    throw new Error("An account already exists with this email address.");
  }

  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const now = new Date().toISOString();
  const salt = createId();
  const passwordHash = await hashText(`${salt}:${input.password}`);
  const walletAddress = await createProfileWallet(email);
  const user: UserProfile = {
    id: createId(),
    email,
    name: input.name.trim(),
    contactNumber: input.contactNumber.trim(),
    role: input.role,
    passwordHash,
    passwordSalt: salt,
    walletAddress,
    createdAt: now,
    updatedAt: now,
  };
  const profileProof = await createProfileProof(user);
  const saved = {
    ...user,
    ...profileProof,
  };

  saveUsers([...users, saved]);
  setSession(saved.id);
  return stripPrivateFields(saved);
}

export async function loginUser(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const user = loadUsers().find((item) => item.email === email);

  if (!user) {
    throw new Error("No account found for this email address.");
  }

  const passwordHash = await hashText(`${user.passwordSalt}:${password}`);

  if (passwordHash !== user.passwordHash) {
    throw new Error("Incorrect password.");
  }

  setSession(user.id);
  return stripPrivateFields(user);
}

export function logoutUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

export async function updateCurrentProfile(
  changes: Partial<Pick<UserProfile, "name" | "contactNumber" | "address" | "city" | "ward" | "department" | "contractorLicense">>
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

  saveUsers(users.map((user) => (user.id === sessionId ? updated : user)));
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
      user.updatedAt,
    ].join("|")
  );

  return {
    profileHash,
    profileChainTxHash: `${profileHash.slice(0, 14)}...${profileHash.slice(-8)}`,
  };
}

async function createProfileWallet(seed: string) {
  const hash = await hashText(`profile-wallet:${seed}`);
  return `0x${hash.slice(2, 10)}...${hash.slice(-6)}`;
}

async function hashText(input: string) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));

  return `0x${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
