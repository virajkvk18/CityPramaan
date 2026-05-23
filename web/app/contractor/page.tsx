"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Camera,
  CheckCircle2,
  Hammer,
  LayoutDashboard,
  LocateFixed,
  MapPin,
  Router,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";

export default function ContractorPage() {
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => "bhopal");
  const selectedCity = getCityByKey(citySnapshot);
  const [repairImage, setRepairImage] = useState("");
  const [audited, setAudited] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [auditProcessing, setAuditProcessing] = useState(false);

  function runRepairAudit() {
    setAudited(false);
    setAuditProcessing(true);

    window.setTimeout(() => {
      setAudited(true);
      setAuditProcessing(false);
    }, 900);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="fixed top-0 z-50 hidden h-16 w-full items-center justify-between border-b border-[#ff9933]/15 bg-[#030507]/75 px-8 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl md:flex">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:border-[#00dbe9]/60 hover:text-[#00dbe9]"
            aria-label="Back to command center"
          >
            <ArrowLeft size={17} />
          </Link>
          <BrandLogo size="sm" subtitle="Contractor repair node" />
        </div>
        <div className="flex items-center gap-3">
          <button className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/70 transition hover:text-[#00eb88]">
            <Bell size={16} />
          </button>
          <button className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/70 transition hover:text-[#00eb88]">
            <Settings size={16} />
          </button>
          <ThemeToggle />
          <button className="rounded border border-[#ffc08d]/50 bg-[#ffc08d]/10 px-4 py-2 font-mono text-xs text-[#ffc08d] transition hover:bg-[#ffc08d]/20">
            Connect Wallet
          </button>
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#ff9933]/15 bg-[linear-gradient(180deg,rgba(255,153,51,0.08),rgba(0,0,0,0.5)_22%,rgba(0,219,233,0.045))] px-4 pb-5 pt-20 shadow-[5px_0_24px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:flex">
        <div className="mt-2 border-b border-white/10 px-2 pb-5">
          <BrandLogo size="sm" subtitle="Verified repair node" />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Command Center" />
          <NavItem
            href="/contractor"
            icon={<BadgeCheck size={18} />}
            label="Verified Repairs"
            active
          />
          <NavItem href="/report" icon={<Camera size={18} />} label="Active Reports" />
          <NavItem href="/proof/CP-004" icon={<ShieldCheck size={18} />} label="Urban Ledger" />
          <NavItem href="/warranty" icon={<BarChart3 size={18} />} label="Warranty Scanner" />
        </nav>

        <Link
          href="/report"
          className="btn-primary-shimmer grid rounded bg-[#ffc08d] px-4 py-3 text-center font-mono text-xs font-semibold text-[#4c2700]"
        >
          Submit Report
        </Link>

        <div className="mt-5 border-t border-white/5 pt-4">
          <NavItem href="/" icon={<Router size={15} />} label="System Status" small />
          <NavItem href="/about" icon={<BookOpen size={15} />} label="Documentation" small />
        </div>
      </aside>

      <section className="relative z-10 min-h-screen px-4 pb-10 pt-6 md:ml-64 md:px-8 md:pt-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-7 flex flex-col justify-between gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-end">
            <div>
              <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-[#dbc2b0] md:hidden">
                <ArrowLeft size={16} />
                Back to Command Center
              </Link>
              <p className="font-mono text-xs uppercase text-[#00dbe9]">
                Job ID: RPR-8892-XT | Block Height: 849201
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
                Repair Execution
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="pulse-indicator h-2 w-2 rounded-full bg-[#00eb88]" />
              <span className="font-mono text-xs text-[#00eb88]">
                {submitted ? "Proof submitted" : "Awaiting proof"}
              </span>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase text-[#00dbe9]">Repair city node</p>
              <p className="mt-1 text-sm text-[#dbc2b0]">
                Contractor flow adapts to {selectedCity.name}, {selectedCity.state}.
              </p>
            </div>
            <select
              value={selectedCity.key}
              onChange={(event) => {
                setSelectedCityKey(event.target.value as CityKey);
                setAudited(false);
                setSubmitted(false);
              }}
              className="input-recessed rounded px-4 py-3 font-mono text-sm text-white"
            >
              {demoCities.map((city) => (
                <option key={city.key} value={city.key} className="bg-[#050505] text-white">
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <aside className="flex flex-col gap-6 xl:col-span-4">
              <section className="cp-cyber-card cp-cyber-card-hover relative overflow-hidden rounded-lg p-6">
                <div className="pointer-events-none absolute right-4 top-4 text-white/5">
                  <BadgeCheck size={82} />
                </div>
                <div className="relative flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-lg border-2 border-[#00dbe9] bg-[#00dbe9]/10 text-[#00dbe9]">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{selectedCity.contractor}</h3>
                    <p className="mt-1 font-mono text-sm text-[#00dbe9]">ID: CNT-44X-99</p>
                  </div>
                </div>

                <div className="relative mt-6 grid grid-cols-2 gap-3">
                  <Metric icon={<ShieldCheck size={15} />} label="Status" value="Verified Node" tone="emerald" />
                  <Metric icon={<Star size={15} />} label="Rating" value="4.92 / 5.0" tone="amber" />
                  <Metric icon={<Hammer size={15} />} label="Open Cases" value="04" tone="cyan" />
                  <Metric icon={<BadgeCheck size={15} />} label="SLA" value="96%" tone="emerald" />
                </div>
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <h4 className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3 font-mono text-xs uppercase text-white">
                  <MapPin size={16} />
                  Job Coordinates
                </h4>
                <div className="relative h-36 overflow-hidden rounded-lg border border-white/10 bg-black/55">
                  <div className="absolute inset-0 animated-city-grid opacity-55" />
                  <div className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#ffc08d]/40 bg-[#ffc08d]/10 text-[#ffc08d]">
                    <LocateFixed size={20} />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between rounded bg-black/55 px-2 py-1 font-mono text-[10px] text-[#00dbe9]">
                    <span>Lat: {selectedCity.lat.toFixed(4)} N</span>
                    <span>Lng: {selectedCity.lng.toFixed(4)} E</span>
                  </div>
                </div>
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg border-[#d946ef]/30 bg-[#d946ef]/10 p-6">
                <p className="font-semibold text-[#f0abfc]">Priority Case</p>
                <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">
                  CP-004 at {selectedCity.primaryArea} is a repeat failure inside an active warranty zone. The repair proof must
                  pass AI visual audit before the ledger is updated.
                </p>
              </section>
            </aside>

            <section className="flex flex-col gap-6 xl:col-span-8">
              <div className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-mono text-xs uppercase text-[#ffc08d]">
                      Repair proof submission
                    </p>
                    <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                      <Sparkles className="text-[#00dbe9]" size={22} />
                      Visual Audit Interface
                    </h2>
                  </div>
                  <button
                    onClick={runRepairAudit}
                    disabled={!repairImage || auditProcessing}
                    className="rounded border border-[#00dbe9] bg-[#00dbe9]/10 px-4 py-3 font-mono text-xs text-[#00dbe9] transition hover:bg-[#00dbe9]/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {auditProcessing ? "Scanning..." : audited ? "Verified" : "Run AI Verification"}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="relative min-h-72 overflow-hidden rounded-lg border border-white/10 bg-black/45">
                    <div className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded border border-[#ffb4ab]/30 bg-black/80 px-2 py-1 font-mono text-xs text-[#ffb4ab] backdrop-blur">
                      <Camera size={14} />
                      Citizen Report Before
                    </div>
                    <div className="absolute inset-0 evidence-asphalt opacity-75" />
                    <div className="cp-road-crater absolute left-1/2 top-1/2 h-24 w-40 -translate-x-1/2 -translate-y-1/2 border border-[#ffb4ab]/40 bg-[#2a0d0d]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,180,171,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,180,171,0.1)_1px,transparent_1px)] bg-[size:24px_24px] opacity-35" />
                    <div className="absolute bottom-3 left-3 right-3 rounded border border-[#ffb4ab]/20 bg-black/65 p-3">
                      <p className="font-semibold text-[#ffb4ab]">Road Damage Detected</p>
                      <p className="mt-1 font-mono text-xs text-[#dbc2b0]/70">
                        CP-004 | {selectedCity.primaryArea} | Critical
                      </p>
                    </div>
                  </div>

                  <label
                    className={`relative min-h-72 cursor-pointer overflow-hidden rounded-lg border bg-black/45 transition hover:bg-[#00dbe9]/5 ${
                      repairImage
                        ? "border-[#00eb88]/50"
                        : "border-dashed border-[#00dbe9]/45"
                    } ${auditProcessing ? "scan-active" : ""}`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        setRepairImage(event.target.files?.[0]?.name || "");
                        setAudited(false);
                        setSubmitted(false);
                      }}
                    />

                    {repairImage && (
                      <div className="absolute left-2 top-2 z-20 flex items-center gap-1 rounded border border-[#00eb88]/30 bg-black/80 px-2 py-1 font-mono text-xs text-[#00eb88] backdrop-blur">
                        <CheckCircle2 size={14} />
                        Contractor Proof After
                      </div>
                    )}

                    {repairImage ? (
                      <>
                        <div className="absolute inset-0 evidence-asphalt opacity-72" />
                        <div className="cp-road-patch absolute left-1/2 top-1/2 h-24 w-44 -translate-x-1/2 -translate-y-1/2 border border-[#00eb88]/35 bg-[#042b18]/85" />
                        <div className="scanner-line z-30" />
                        <div className="absolute bottom-3 left-3 right-3 rounded border border-[#00eb88]/20 bg-black/65 p-3">
                          <p className="font-semibold text-[#00eb88]">{repairImage}</p>
                          <p className="mt-1 font-mono text-xs text-[#dbc2b0]/70">
                            GPS EXIF and repair image attached
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="grid h-full min-h-72 place-items-center p-6 text-center">
                        <div>
                          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#00dbe9]/35 bg-[#00dbe9]/10 text-[#00dbe9]">
                            <UploadCloud size={28} />
                          </div>
                          <p className="mt-4 font-mono text-sm text-[#00dbe9]">
                            Upload Repair Evidence
                          </p>
                          <p className="mt-1 text-xs text-[#dbc2b0]/55">Must include GPS context</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {(auditProcessing || audited) && (
                  <div className="mt-6 rounded-lg border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-5">
                    <div className="flex items-center gap-2 text-[#00dbe9]">
                      <Sparkles size={18} className={auditProcessing ? "animate-spin" : ""} />
                      <p className="font-semibold">AI Before/After Audit</p>
                    </div>

                    {auditProcessing ? (
                      <div className="mt-4 space-y-3">
                        <ProcessingStep label="Comparing before and after evidence" />
                        <ProcessingStep label="Estimating surface quality and closure risk" />
                        <ProcessingStep label="Preparing warranty recommendation" />
                      </div>
                    ) : (
                      <>
                        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                          <Audit label="Material Match" value="95.4%" tone="emerald" />
                          <Audit label="Repair Integrity" value="High" tone="emerald" />
                          <Audit label="Volume Est." value="1.2 m3" tone="amber" />
                          <Audit label="Geo-Variance" value="+/-0.5 m" tone="cyan" />
                        </div>

                        <p className="mt-4 rounded border border-[#00dbe9]/20 bg-black/35 p-3 text-sm leading-6 text-[#dbc2b0]">
                          AI detects that the pothole appears patched and the uploaded image matches
                          the repair location. The proof can be submitted to activate warranty
                          monitoring.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="cp-cyber-card rounded-lg border-t border-[#00eb88]/30 bg-gradient-to-r from-[#201f20]/75 to-black/25 p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="text-2xl font-semibold text-white">Finalize Ledger Entry</h4>
                    <p className="mt-1 font-mono text-sm text-[#dbc2b0]/70">
                      Transaction will be signed via the mock Web3 wallet.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitted(true)}
                    disabled={!audited}
                    className="btn-primary-shimmer flex items-center justify-center gap-2 rounded bg-[#00eb88] px-6 py-4 font-mono text-xs font-semibold text-[#00210e] shadow-[0_0_22px_rgba(0,235,136,0.28)] transition disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ShieldCheck size={16} />
                    Submit Proof
                  </button>
                </div>

                {submitted && (
                  <div className="mt-5 rounded border border-[#00eb88]/25 bg-[#00eb88]/10 p-4">
                    <div className="flex items-center gap-2 text-[#00eb88]">
                      <CheckCircle2 size={18} />
                      <p className="font-semibold">Repair Proof Submitted</p>
                    </div>
                    <p className="mt-2 text-sm text-[#dbc2b0]">
                      The repair proof has been recorded and the case is now under warranty.
                    </p>
                    <p className="mt-3 rounded bg-black/45 p-3 font-mono text-xs text-[#00eb88]">
                      Tx: 0x93ac...72fd
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
  small = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded px-4 py-3 transition ${
        active
          ? "border-r-2 border-[#ffc08d] bg-[#ffc08d]/10 text-[#ffc08d] shadow-[inset_0_0_12px_rgba(255,183,122,0.18)]"
          : "text-[#dbc2b0]/60 hover:bg-white/[0.04] hover:text-[#d3fbff]"
      } ${small ? "py-2 text-xs" : "font-mono text-xs"}`}
    >
      {icon}
      {label}
    </Link>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "cyan";
}) {
  const colors = {
    emerald: "text-[#00eb88]",
    amber: "text-[#ffc08d]",
    cyan: "text-[#00dbe9]",
  };

  return (
    <div className="rounded border border-white/10 bg-black/35 p-3">
      <span className="mb-1 block font-mono text-[10px] uppercase text-[#dbc2b0]/60">
        {label}
      </span>
      <div className={`flex items-center gap-1 font-mono text-sm font-semibold ${colors[tone]}`}>
        {icon}
        {value}
      </div>
    </div>
  );
}

function Audit({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "cyan";
}) {
  const colors = {
    emerald: "border-[#00eb88] text-[#00eb88]",
    amber: "border-[#ffc08d] text-[#ffc08d]",
    cyan: "border-[#00dbe9] text-[#00dbe9]",
  };

  return (
    <div className={`rounded border-l-2 bg-black/50 p-3 ${colors[tone]}`}>
      <p className="font-mono text-[10px] uppercase text-[#dbc2b0]/60">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
    </div>
  );
}

function ProcessingStep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded border border-[#00dbe9]/20 bg-black/35 px-3 py-2 text-sm text-[#dbc2b0]">
      <span className="h-2 w-2 animate-pulse rounded-full bg-[#00dbe9]" />
      {label}
    </div>
  );
}
