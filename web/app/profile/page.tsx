"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Building2, Fingerprint, Home, LogOut, MapPin, Phone, Save, ShieldCheck, User, Wrench } from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import {
  getCurrentUser,
  isProfileComplete,
  logoutUser,
  type PublicUserProfile,
  roleLabels,
  updateCurrentProfile,
} from "@/src/lib/auth-storage";

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
      setProfile(getCurrentUser());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleLogout() {
    logoutUser();
    router.push("/auth");
  }

  if (!mounted) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] text-[#e5e2e3]">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#dbc2b0]">Loading profile...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-4 text-[#e5e2e3]">
        <div className="w-full max-w-md rounded-md border border-white/10 bg-[#061015]/88 p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
          <BrandLogo className="justify-center" size="sm" subtitle="Profile Registry" />
          <h1 className="mt-6 text-2xl font-black text-white">Login required</h1>
          <p className="mt-3 text-sm leading-6 text-[#dbc2b0]">
            Create or login to your CityPramaan account before completing your profile.
          </p>
          <Link
            href="/auth"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-[#4c2700]"
          >
            Login / Signup
          </Link>
        </div>
      </main>
    );
  }

  return <ProfileEditor initialProfile={profile} onLogout={handleLogout} />;
}

function ProfileEditor({ initialProfile, onLogout }: { initialProfile: PublicUserProfile; onLogout: () => void }) {
  const [profile, setProfile] = useState(initialProfile);
  const [name, setName] = useState(() => initialProfile.name ?? "");
  const [contactNumber, setContactNumber] = useState(() => initialProfile.contactNumber ?? "");
  const [address, setAddress] = useState(() => initialProfile.address ?? "");
  const [city, setCity] = useState(() => initialProfile.city ?? "");
  const [ward, setWard] = useState(() => initialProfile.ward ?? "");
  const [department, setDepartment] = useState(() => initialProfile.department ?? "");
  const [contractorLicense, setContractorLicense] = useState(() => initialProfile.contractorLicense ?? "");
  const [contractorIdentityNumber, setContractorIdentityNumber] = useState(
    () => initialProfile.contractorIdentityNumber ?? initialProfile.contractorLicense ?? ""
  );
  const [contractorArea, setContractorArea] = useState(() => initialProfile.contractorArea ?? initialProfile.address ?? "");
  const [contractorSpecialization, setContractorSpecialization] = useState(
    () => initialProfile.contractorSpecialization ?? "ROAD_DAMAGE"
  );
  const [agencyName, setAgencyName] = useState(() => initialProfile.agencyName ?? "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const updated = await updateCurrentProfile({
        name,
        contactNumber,
        walletAddress: profile.walletAddress,
        address,
        city,
        ward,
        department,
        contractorLicense,
        contractorIdentityNumber,
        contractorArea,
        contractorSpecialization,
        agencyName,
      });
      setProfile(updated);
      setMessage("Profile saved to Supabase.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const complete = isProfileComplete({
    ...profile,
    address,
    city,
    ward,
    department,
    contractorLicense,
  });
  const RoleIcon = profile.role === "CONTRACTOR" ? Wrench : profile.role === "WARD_ADMIN" ? Building2 : User;

  return (
    <main className="cp-page-shell relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(255,153,51,0.14),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(0,219,233,0.12),transparent_30%),radial-gradient(circle_at_50%_95%,rgba(0,235,136,0.08),transparent_32%)]" />
      <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <BrandLogo size="sm" subtitle="Profile Registry" />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-md border border-[#ffb4ab]/25 bg-[#ffb4ab]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#ffcec7] transition hover:border-[#ffb4ab]/50"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-6 px-4 pb-12 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#ffdcc2] transition hover:border-[#00dbe9]/35"
          >
            <ArrowLeft size={15} />
            Dashboard
          </Link>

          <div className="rounded-md border border-white/10 bg-[#061015]/88 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-md border border-[#00dbe9]/35 bg-[#00dbe9]/10 text-[#7df4ff]">
                <RoleIcon size={25} />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black text-white">{profile.name}</h1>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#dbc2b0]">{roleLabels[profile.role]}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <ProofRow icon={<BadgeCheck size={16} />} label="Status" value={complete ? "Complete" : "Incomplete"} tone={complete ? "text-[#8fffc1]" : "text-[#ffc08d]"} />
              <ProofRow icon={<Fingerprint size={16} />} label="Profile hash" value={profile.profileHash ?? "Pending"} />
            </div>

            <p className="mt-5 rounded-md border border-[#00eb88]/20 bg-[#00eb88]/8 p-4 text-sm leading-6 text-[#c8ffe1]">
              Your identity details stay in app storage/database. The profile hash helps detect profile changes without exposing private details publicly.
            </p>
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="rounded-md border border-white/10 bg-[#061015]/88 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-7">
          <div className="mb-6">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#00dbe9]">Complete profile</p>
            <h2 className="mt-2 text-3xl font-black text-white">Address, ward, and verification details</h2>
            <p className="mt-2 text-sm leading-6 text-[#a38d7c]">
              These fields decide assignment, approvals, contractor accountability, and ward-level reporting.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field icon={<User size={17} />} label="Full name" value={name} onChange={setName} required />
            <Field icon={<Phone size={17} />} label="Contact number" value={contactNumber} onChange={setContactNumber} required />
            <Field icon={<MapPin size={17} />} label="City" value={city} onChange={setCity} required />
            <Field icon={<Building2 size={17} />} label="Ward / zone" value={ward} onChange={setWard} required />
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#dbc2b0]">Full address</span>
            <span className="flex items-start gap-3 rounded-md border border-white/10 bg-black/35 px-3 py-3 transition focus-within:border-[#00dbe9]/55">
              <Home size={17} className="mt-1 text-[#00dbe9]" />
              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                required
                rows={4}
                className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none"
              />
            </span>
          </label>

          {profile.role === "WARD_ADMIN" && (
            <Field icon={<ShieldCheck size={17} />} label="Department / office" value={department} onChange={setDepartment} required />
          )}

          {profile.role === "CONTRACTOR" && (
            <>
              <Field icon={<Wrench size={17} />} label="Contractor license / registration ID" value={contractorLicense} onChange={setContractorLicense} required />
              <Field icon={<Fingerprint size={17} />} label="Contractor identity number" value={contractorIdentityNumber} onChange={setContractorIdentityNumber} required />
              <Field icon={<MapPin size={17} />} label="Assigned contractor area" value={contractorArea} onChange={setContractorArea} required />
              <Field icon={<Building2 size={17} />} label="Agency / company name" value={agencyName} onChange={setAgencyName} required />
              <label className="mt-4 block">
                <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#dbc2b0]">Work specialization</span>
                <span className="flex items-center gap-3 rounded-md border border-white/10 bg-black/35 px-3 transition focus-within:border-[#00dbe9]/55">
                  <Wrench size={17} className="text-[#00dbe9]" />
                  <select
                    value={contractorSpecialization}
                    onChange={(event) => setContractorSpecialization(event.target.value)}
                    className="min-h-12 w-full bg-transparent text-sm text-white outline-none"
                  >
                    <option value="ROAD_DAMAGE" className="bg-[#050505] text-white">Road repair</option>
                    <option value="DRAINAGE" className="bg-[#050505] text-white">Drainage</option>
                    <option value="STREETLIGHT" className="bg-[#050505] text-white">Streetlight</option>
                    <option value="GARBAGE" className="bg-[#050505] text-white">Garbage cleanup</option>
                    <option value="WATER_LEAKAGE" className="bg-[#050505] text-white">Water leakage</option>
                    <option value="FOOTPATH" className="bg-[#050505] text-white">Footpath repair</option>
                    <option value="POWER_OUTAGE" className="bg-[#050505] text-white">Power outage</option>
                    <option value="GENERAL" className="bg-[#050505] text-white">General civic repair</option>
                  </select>
                </span>
              </label>
            </>
          )}

          {message && <p className="mt-4 rounded-md border border-[#00dbe9]/25 bg-[#00dbe9]/10 px-4 py-3 text-sm text-[#b8f9ff]">{message}</p>}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-5 py-4 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#4c2700] shadow-[0_0_26px_rgba(255,153,51,0.18)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
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
  required,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#dbc2b0]">{label}</span>
      <span className="flex items-center gap-3 rounded-md border border-white/10 bg-black/35 px-3 transition focus-within:border-[#00dbe9]/55">
        <span className="text-[#00dbe9]">{icon}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className="min-h-12 w-full bg-transparent text-sm text-white outline-none"
        />
      </span>
    </label>
  );
}

function ProofRow({
  icon,
  label,
  value,
  tone = "text-[#e5e2e3]",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/26 p-3">
      <div className="mb-2 flex items-center gap-2 text-[#00dbe9]">
        {icon}
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a38d7c]">
          {label}
        </span>
      </div>
      <p className={`break-all font-mono text-xs ${tone}`}>{value}</p>
    </div>
  );
}
