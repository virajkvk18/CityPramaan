"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { LogIn, LogOut, UserRound } from "lucide-react";
import {
  clearAuthSession,
  getAuthSnapshot,
  subscribeAuth,
  type AuthMode,
  type AuthUser,
} from "@/src/lib/auth-storage";
import { AuthModal } from "@/src/components/layout/AuthModal";

export function AuthStatusButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<AuthMode>("signIn");
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => "null");
  const user = useMemo(() => JSON.parse(authSnapshot) as AuthUser | null, [authSnapshot]);

  const openAuth = (mode: AuthMode) => {
    setInitialMode(mode);
    setModalOpen(true);
  };

  if (user) {
    return (
      <>
        <div className="flex min-w-0 items-center gap-2 rounded-sm border border-[#00eb88]/35 bg-[#00eb88]/10 px-2 py-2 text-[#5bffa1] shadow-[0_0_22px_rgba(0,235,136,0.1)] sm:px-3">
          <UserRound size={15} className="shrink-0" />
          <span className="hidden max-w-[120px] truncate font-mono text-[10px] font-bold uppercase tracking-[0.1em] sm:inline">
            {user.name}
          </span>
          <button
            type="button"
            onClick={clearAuthSession}
            className="grid h-6 w-6 place-items-center rounded border border-[#00eb88]/20 bg-black/20 transition hover:bg-black/40"
            aria-label="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => openAuth("signIn")}
        className="cp-command-link inline-flex min-h-9 items-center justify-center gap-2 rounded-sm border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#7df4ff] shadow-[0_0_18px_rgba(0,219,233,0.08)] hover:bg-[#00dbe9]/15 sm:px-4 sm:text-xs"
      >
        <LogIn size={14} />
        <span className="hidden sm:inline">Sign In</span>
      </button>
      {modalOpen && (
        <AuthModal open initialMode={initialMode} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
