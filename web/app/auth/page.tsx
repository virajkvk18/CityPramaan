"use client";

import Link from "next/link";
import { useRouter } from "next/navigation"; 
import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { ArrowLeft, BadgeCheck, Building2, Eye, EyeOff, Mail, Phone, ShieldCheck, User, Wrench } from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { type AuthRole, loginUser, roleLabels, signUpUser } from "@/src/lib/auth-storage";

const roleOptions: Array<{ value: AuthRole; icon: typeof User; detail: string }> = [
  { value: "USER", icon: User, detail: "Report civic issues and track public proof." },
  { value: "WARD_ADMIN", icon: Building2, detail: "Review ward reports, approvals, and warranty cases." },
  { value: "CONTRACTOR", icon: Wrench, detail: "Submit repair evidence and proof records." },
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [role, setRole] = useState<AuthRole>("USER");
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      if (mode === "signup") {
        await signUpUser({ email, password, name, contactNumber, role });
        router.push("/profile");
      } else {
        await loginUser(email, password);
        router.push("/");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="cp-page-shell relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,153,51,0.14),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(0,219,233,0.13),transparent_28%),radial-gradient(circle_at_54%_92%,rgba(0,235,136,0.09),transparent_32%)]" />
      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo size="sm" />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#ffdcc2] transition hover:border-[#00dbe9]/35 hover:text-[#7df4ff]"
          >
            <ArrowLeft size={15} />
            Dashboard
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-6xl items-center gap-8 px-4 pb-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-md border border-[#00eb88]/25 bg-[#00eb88]/10 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#8fffc1]">
            <ShieldCheck size={16} />
            Role based access
          </div>
          <div>
            <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-normal text-white sm:text-6xl">
              Verify the person before the proof.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#dbc2b0]">
              Citizens, contractors, and ward admins get different dashboards. Every profile receives a proof hash that can later be written to your CityPramaan smart contract.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setRole(option.value);
                    setMode("signup");
                  }}
                  className={`min-h-36 rounded-md border p-4 text-left transition ${
                    role === option.value && mode === "signup"
                      ? "border-[#ffc08d]/70 bg-[#ff9933]/14 text-white"
                      : "border-white/10 bg-white/[0.035] text-[#dbc2b0] hover:border-[#00dbe9]/35"
                  }`}
                >
                  <Icon size={23} className="mb-4 text-[#00dbe9]" />
                  <p className="font-semibold">{roleLabels[option.value]}</p>
                  <p className="mt-2 text-xs leading-5 text-[#a38d7c]">{option.detail}</p>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-md border border-white/10 bg-[#061015]/86 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-7">
          <div className="mb-6 grid grid-cols-2 rounded-md border border-white/10 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] transition ${
                mode === "signup" ? "bg-[#ffc08d] text-[#4c2700]" : "text-[#dbc2b0] hover:text-white"
              }`}
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] transition ${
                mode === "login" ? "bg-[#00dbe9] text-[#002c33]" : "text-[#dbc2b0] hover:text-white"
              }`}
            >
              Login
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-2xl font-black text-white">{mode === "signup" ? "Create CityPramaan profile" : "Welcome back"}</h2>
            <p className="mt-2 text-sm text-[#a38d7c]">
              {mode === "signup" ? `Signing up as ${roleLabels[role]}.` : "Login with your registered email and password."}
            </p>
          </div>

          {mode === "signup" && (
            <>
              <div className="mb-4 grid gap-2 sm:grid-cols-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={`flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 py-2 text-center text-xs font-semibold transition ${
                        role === option.value
                          ? "border-[#ffc08d]/70 bg-[#ff9933]/16 text-[#ffdcc2]"
                          : "border-white/10 bg-black/28 text-[#dbc2b0] hover:border-[#00dbe9]/35"
                      }`}
                    >
                      <Icon size={16} />
                      {roleLabels[option.value]}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field icon={<User size={17} />} label="Full name" value={name} onChange={setName} required />
                <Field icon={<Phone size={17} />} label="Contact number" value={contactNumber} onChange={setContactNumber} required />
              </div>
            </>
          )}

          <div className="mt-4 space-y-4">
            <Field icon={<Mail size={17} />} label="Email address" type="email" value={email} onChange={setEmail} required />
            <label className="block">
              <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#dbc2b0]">Password</span>
              <span className="flex items-center gap-3 rounded-md border border-white/10 bg-black/35 px-3 transition focus-within:border-[#00dbe9]/55">
                <BadgeCheck size={17} className="text-[#00dbe9]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  className="min-h-12 flex-1 bg-transparent text-sm text-white outline-none"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[#dbc2b0] hover:text-white" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
          </div>

          {message && <p className="mt-4 rounded-md border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 px-4 py-3 text-sm text-[#ffcec7]">{message}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-md bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-5 py-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#4c2700] shadow-[0_0_26px_rgba(255,153,51,0.18)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Processing..." : mode === "signup" ? "Create account" : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#dbc2b0]">{label}</span>
      <span className="flex items-center gap-3 rounded-md border border-white/10 bg-black/35 px-3 transition focus-within:border-[#00dbe9]/55">
        <span className="text-[#00dbe9]">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className="min-h-12 w-full bg-transparent text-sm text-white outline-none"
        />
      </span>
    </label>
  );
}
