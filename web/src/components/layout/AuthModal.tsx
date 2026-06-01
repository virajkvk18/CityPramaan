"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { LockKeyhole, Mail, Phone, ShieldCheck, UserPlus, X } from "lucide-react";
import {
  createAuthSession,
  type AuthChannel,
  type AuthMode,
} from "@/src/lib/auth-storage";

type AuthModalProps = {
  open: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
};

export function AuthModal({ open, initialMode = "signIn", onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [channel, setChannel] = useState<AuthChannel>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!open) {
    return null;
  }

  const isSignUp = mode === "signUp";
  const contact = channel === "email" ? email : phone;
  const title = isSignUp ? "Create your CityPramaan account" : "Sign in to CityPramaan";
  const subtitle = isSignUp
    ? "Track your reports, approvals, warranty claims, and public proof history from one secure identity."
    : "Continue with email or phone to track your civic reports and repair proof updates.";

  const submitAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (isSignUp && name.trim().length < 2) {
      setError("Enter your name to create an account.");
      return;
    }

    if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    if (channel === "phone" && phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid mobile number.");
      return;
    }

    if (secret.trim().length < 4) {
      setError(channel === "email" ? "Enter your password." : "Enter the verification code.");
      return;
    }

    createAuthSession({
      mode,
      channel,
      name,
      contact,
    });
    setSuccess(true);
    window.setTimeout(onClose, 450);
  };

  return (
    <div className="cp-auth-overlay fixed inset-0 z-[1100] flex items-center justify-center bg-[#020304]/84 px-4 py-6 backdrop-blur-xl">
      <section className="cp-auth-card relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#00dbe9]/30 bg-[linear-gradient(145deg,rgba(5,7,8,0.98),rgba(17,10,4,0.96))] p-5 shadow-[0_0_70px_rgba(0,219,233,0.16)] sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:border-[#ffb4ab]/45 hover:text-[#ffb4ab]"
          aria-label="Close authentication"
        >
          <X size={17} />
        </button>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00eb88]/25 bg-[#00eb88]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#5bffa1]">
            <ShieldCheck size={13} />
            Secure citizen access
          </div>

          <h2 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-[#dbc2b0]">{subtitle}</p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setMode("signIn")}
              className={`rounded-lg px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                mode === "signIn"
                  ? "bg-[#00dbe9]/15 text-[#7df4ff] shadow-[0_0_18px_rgba(0,219,233,0.12)]"
                  : "text-[#dbc2b0] hover:bg-white/[0.04]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signUp")}
              className={`rounded-lg px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition ${
                mode === "signUp"
                  ? "bg-[#ff9933]/18 text-[#ffdcc2] shadow-[0_0_18px_rgba(255,153,51,0.12)]"
                  : "text-[#dbc2b0] hover:bg-white/[0.04]"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] transition ${
                channel === "email"
                  ? "border-[#00dbe9]/45 bg-[#00dbe9]/12 text-[#7df4ff]"
                  : "border-white/10 bg-white/[0.035] text-[#dbc2b0] hover:border-[#00dbe9]/30"
              }`}
            >
              <Mail size={15} />
              Email
            </button>
            <button
              type="button"
              onClick={() => setChannel("phone")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] transition ${
                channel === "phone"
                  ? "border-[#ff9933]/50 bg-[#ff9933]/12 text-[#ffdcc2]"
                  : "border-white/10 bg-white/[0.035] text-[#dbc2b0] hover:border-[#ff9933]/30"
              }`}
            >
              <Phone size={15} />
              Phone
            </button>
          </div>

          <form onSubmit={submitAuth} className="mt-5 space-y-4">
            {isSignUp && (
              <label className="block">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#00dbe9]">
                  Full Name
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#a38d7c]/60 focus:border-[#00dbe9]/55 focus:ring-2 focus:ring-[#00dbe9]/10"
                  placeholder="Enter your name"
                />
              </label>
            )}

            <label className="block">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#00dbe9]">
                {channel === "email" ? "Email Address" : "Mobile Number"}
              </span>
              <input
                value={channel === "email" ? email : phone}
                onChange={(event) =>
                  channel === "email" ? setEmail(event.target.value) : setPhone(event.target.value)
                }
                type={channel === "email" ? "email" : "tel"}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#a38d7c]/60 focus:border-[#00dbe9]/55 focus:ring-2 focus:ring-[#00dbe9]/10"
                placeholder={channel === "email" ? "you@example.com" : "+91 98765 43210"}
              />
            </label>

            <label className="block">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#00dbe9]">
                {channel === "email" ? "Password" : "Verification Code"}
              </span>
              <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/35 px-4 py-3 transition focus-within:border-[#00dbe9]/55 focus-within:ring-2 focus-within:ring-[#00dbe9]/10">
                <LockKeyhole size={15} className="mr-3 text-[#dbc2b0]" />
                <input
                  value={secret}
                  onChange={(event) => setSecret(event.target.value)}
                  type={channel === "email" ? "password" : "text"}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#a38d7c]/60"
                  placeholder={channel === "email" ? "Enter password" : "Enter 6-digit code"}
                />
              </div>
            </label>

            {error && (
              <p className="rounded-xl border border-[#ffb4ab]/25 bg-[#ffb4ab]/10 px-4 py-3 text-sm text-[#ffb4ab]">
                {error}
              </p>
            )}

            {success && (
              <p className="rounded-xl border border-[#00eb88]/25 bg-[#00eb88]/10 px-4 py-3 text-sm text-[#5bffa1]">
                Access confirmed. Opening your CityPramaan workspace...
              </p>
            )}

            <button
              type="submit"
              className="cp-command-link flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-5 py-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#4c2700] shadow-[0_0_28px_rgba(255,153,51,0.22)]"
            >
              {isSignUp ? <UserPlus size={16} /> : <ShieldCheck size={16} />}
              {isSignUp ? "Create Account" : "Continue Securely"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs leading-5 text-[#a38d7c]">
            Your account is used to track reports, approve repair proof, and receive warranty updates.
          </p>
        </div>
      </section>
    </div>
  );
}
