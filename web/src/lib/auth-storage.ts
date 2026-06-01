"use client";

export type AuthMode = "signIn" | "signUp";
export type AuthChannel = "email" | "phone";

export type AuthUser = {
  id: string;
  name: string;
  contact: string;
  channel: AuthChannel;
  role: "citizen";
  createdAt: string;
};

type AuthSessionInput = {
  mode: AuthMode;
  channel: AuthChannel;
  name?: string;
  contact: string;
};

const AUTH_STORAGE_KEY = "citypramaan-auth-session";
const listeners = new Set<() => void>();

function readAuthSession(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function emitAuthChange() {
  listeners.forEach((listener) => listener());
}

function getDefaultName(contact: string, channel: AuthChannel) {
  if (channel === "email") {
    return contact.split("@")[0] || "CityPramaan User";
  }

  return `Citizen ${contact.slice(-4)}`;
}

export function getAuthSnapshot() {
  return JSON.stringify(readAuthSession());
}

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);

  const storageListener = (event: StorageEvent) => {
    if (event.key === AUTH_STORAGE_KEY) {
      listener();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", storageListener);
  }

  return () => {
    listeners.delete(listener);

    if (typeof window !== "undefined") {
      window.removeEventListener("storage", storageListener);
    }
  };
}

export function createAuthSession(input: AuthSessionInput) {
  const normalizedContact = input.contact.trim();
  const session: AuthUser = {
    id: `cp-user-${Date.now()}`,
    name: input.name?.trim() || getDefaultName(normalizedContact, input.channel),
    contact: normalizedContact,
    channel: input.channel,
    role: "citizen",
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  emitAuthChange();
  return session;
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthChange();
}
