"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarClock,
  FileImage,
  LayoutDashboard,
  Radar,
  Router,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";
import { detectRepeatFailure } from "@/src/lib/warranty";

export default function WarrantyScannerPage() {
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => "bhopal");
  const selectedCity = getCityByKey(citySnapshot);
  const [result, setResult] = useState<ReturnType<typeof detectRepeatFailure> | null>(null);
  const [scanning, setScanning] = useState(false);

  function scanForFailure() {
    setResult(null);
    setScanning(true);

    window.setTimeout(() => {
      setResult(detectRepeatFailure(selectedCity.key));
      setScanning(false);
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
          <BrandLogo size="sm" subtitle="Warranty breach scanner" />
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
          <BrandLogo size="sm" subtitle="Warranty breach scanner" />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Command Center" />
          <NavItem href="/proof/CP-004" icon={<BadgeCheck size={18} />} label="Verified Repairs" />
          <NavItem href="/report" icon={<AlertTriangle size={18} />} label="Active Reports" />
          <NavItem
            href="/warranty"
            icon={<ShieldAlert size={18} />}
            label="Warranty Scanner"
            active
          />
          <NavItem href="/contractor" icon={<ShieldCheck size={18} />} label="Contractor Audit" />
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
                Node Sector 7G | Protocol Alpha
              </p>
              <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">
                Warranty Scanner <span className="text-[#dbc2b0]/35">|</span> Public Proof
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#dbc2b0]">
                CityPramaan cross-checks new citizen reports in {selectedCity.name} against repaired road segments and
                active warranty windows, then turns repeat failures into public accountability.
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase text-[#00dbe9]">Warranty city node</p>
              <p className="mt-1 text-sm text-[#dbc2b0]">
                Scanning {selectedCity.primaryArea}, {selectedCity.state}.
              </p>
            </div>
            <select
              value={selectedCity.key}
              onChange={(event) => {
                setSelectedCityKey(event.target.value as CityKey);
                setResult(null);
                setScanning(false);
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-4">
              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="relative z-10 mb-5 flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase text-[#ffc08d]">
                    Live Scan Protocol
                  </h3>
                  <span className="flex items-center gap-2 rounded border border-[#ffb4ab]/30 bg-[#93000a]/25 px-2 py-1 font-mono text-[10px] text-[#ffb4ab]">
                    <span className="stitch-pin-rose h-1.5 w-1.5 rounded-full bg-[#ffb4ab]" />
                    Alert active
                  </span>
                </div>

                <div
                  className={`relative h-56 overflow-hidden rounded-lg border border-white/10 bg-black/65 shadow-[inset_0_0_34px_rgba(0,0,0,0.75)] ${
                    scanning ? "scan-active" : ""
                  }`}
                >
                  <div className="absolute inset-0 animated-city-grid opacity-35" />
                  <div className="absolute inset-0 evidence-asphalt opacity-45" />
                  <div className="cp-road-crater absolute left-1/2 top-1/2 h-24 w-40 -translate-x-1/2 -translate-y-1/2 border border-[#ffb4ab]/45 bg-[#2a0d0d]" />
                  <div className="scanner-line z-20 bg-[#ffb4ab]" />
                  <div className="absolute left-1/2 top-1/2 z-20 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#ffb4ab]/55">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ffb4ab] shadow-[0_0_14px_rgba(255,180,171,1)]" />
                  </div>
                  <div className="absolute left-1/2 top-0 z-10 h-full w-px -translate-x-1/2 bg-[#ffb4ab]/15" />
                  <div className="absolute left-0 top-1/2 z-10 h-px w-full -translate-y-1/2 bg-[#ffb4ab]/15" />
                </div>

                <div className="mt-4 space-y-1 font-mono text-xs text-[#dbc2b0]/70">
                  <p>Target: ID-RPR-88392</p>
                  <p>
                    Coordinates: {(selectedCity.lat + 0.0001).toFixed(4)} N,{" "}
                    {(selectedCity.lng + 0.0001).toFixed(4)} E
                  </p>
                </div>

                <button
                  onClick={scanForFailure}
                  disabled={scanning}
                  className="btn-primary-shimmer mt-5 flex w-full items-center justify-center gap-2 rounded border border-[#ffb4ab] bg-[#93000a]/40 px-4 py-3 font-mono text-xs font-semibold text-[#ffb4ab] transition hover:bg-[#93000a]/55 disabled:cursor-wait disabled:opacity-70"
                >
                  <Radar size={16} className={scanning ? "animate-spin" : ""} />
                  {scanning ? "Scanning ledger..." : "Scan For Repeat Failure"}
                </button>

                {result && (
                  <div className="mt-5 rounded-r border-l-2 border-[#ffb4ab] bg-[#93000a]/28 p-4">
                    <div className="flex items-center gap-2 text-[#ffb4ab]">
                      <ShieldAlert size={18} />
                      <p className="font-semibold">Repeat Failure Detected</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#ffdad6]/85">
                      {result.newReport.id} is {result.distance} meters from {result.repairedCase.id}
                      , with {result.repairedCase.warrantyDaysLeft} warranty days left.
                    </p>
                  </div>
                )}
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <h3 className="mb-4 flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs uppercase text-[#d3fbff]">
                  <Sparkles size={15} />
                  AI Diagnostics Verdict
                </h3>
                <div className="space-y-4">
                  <Diagnostic label="Primary Cause" value="Substandard asphalt grade" score="85%" tone="rose" />
                  <Diagnostic label="Secondary Factor" value="Base compaction issue" score="62%" tone="amber" />
                  <Diagnostic label="Weather Overlay" value="Non-causal weathering" score="12%" tone="emerald" />
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-8">
              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-end">
                  <h3 className="flex items-center gap-2 font-mono text-xs uppercase text-[#ffc08d]">
                    <FileImage size={15} />
                    Evidence Comparison
                  </h3>
                  <span className="w-max rounded border border-white/10 bg-black/40 px-2 py-1 font-mono text-xs text-[#dbc2b0]">
                    Delta: -45.2% integrity
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <EvidencePanel
                    label="Original Verification"
                    meta="Block: #89201A"
                    date="Oct 12, 2023"
                    tone="emerald"
                  />
                  <EvidencePanel
                    label="Current Failure"
                    meta="Block: Pending..."
                    date="Today, 09:41 UTC"
                    tone="rose"
                  />
                </div>
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <h3 className="mb-6 flex items-center gap-2 border-b border-white/5 pb-3 font-mono text-xs uppercase text-[#d3fbff]">
                  <CalendarClock size={15} />
                  Public Proof Ledger
                </h3>
                <div className="relative flex flex-col gap-7 border-l border-white/10 pl-6">
                  <TimelineNode
                    title="Initial Citizen Report"
                    date="Sep 28, 2023"
                    detail={`Pothole reported by verified citizen node near ${selectedCity.primaryArea}.`}
                    tone="emerald"
                  />
                  <TimelineNode
                    title="Smart Contract Execution"
                    date="Oct 02, 2023"
                    detail={`Repair funds released to ${selectedCity.contractor} after oracle validation.`}
                    tone="amber"
                  />
                  <TimelineNode
                    title="On-chain Verification and Warranty Lock"
                    date="Oct 12, 2023"
                    detail="Repair completed, verified, and locked under active warranty."
                    tone="emerald"
                  />
                  <TimelineNode
                    title="Warranty Breach Detected"
                    date="Today, 09:41 UTC"
                    detail="New report matches the same repaired segment during warranty window."
                    tone="rose"
                    active
                  />
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Impact label="Action" value={result ? "Case Reopened" : "Ready to scan"} />
                <Impact label="Contractor" value={result ? "Score Reduced" : "Awaiting audit"} />
                <Impact label="Proof" value={result ? "Event Created" : "No breach yet"} />
              </section>
            </div>
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

function Diagnostic({
  label,
  value,
  score,
  tone,
}: {
  label: string;
  value: string;
  score: string;
  tone: "rose" | "amber" | "emerald";
}) {
  const bars = {
    rose: "bg-[#ffb4ab] w-[85%] text-[#ffb4ab]",
    amber: "bg-[#ffc08d] w-[62%] text-[#ffc08d]",
    emerald: "bg-[#00eb88] w-[12%] text-[#00eb88]",
  };

  return (
    <div>
      <p className="font-mono text-[10px] uppercase text-[#dbc2b0]/55">{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full ${bars[tone].split(" ")[0]} ${bars[tone].split(" ")[1]}`} />
      </div>
      <p className={`mt-1 text-right font-mono text-[10px] ${bars[tone].split(" ")[2]}`}>
        {score} confidence
      </p>
    </div>
  );
}

function EvidencePanel({
  label,
  meta,
  date,
  tone,
}: {
  label: string;
  meta: string;
  date: string;
  tone: "emerald" | "rose";
}) {
  const isRose = tone === "rose";

  return (
    <div>
      <div className={`relative h-60 overflow-hidden rounded border bg-black ${isRose ? "border-[#ffb4ab]/35" : "border-[#00eb88]/30"}`}>
        <span
          className={`absolute left-2 top-2 z-20 rounded border bg-black/80 px-2 py-1 font-mono text-[10px] ${
            isRose ? "border-[#ffb4ab]/45 text-[#ffb4ab]" : "border-[#00eb88]/35 text-[#00eb88]"
          }`}
        >
          {label}
        </span>
        <div className="absolute inset-0 evidence-asphalt opacity-80" />
        {isRose ? (
          <>
            <div className="cp-road-patch absolute left-1/2 top-1/2 h-20 w-40 -translate-x-1/2 -translate-y-1/2 border border-[#00eb88]/15 bg-[#042b18]/30" />
            <div className="cp-road-crater absolute left-[48%] top-[52%] h-24 w-36 -translate-x-1/2 -translate-y-1/2 border border-[#ffb4ab]/45 bg-[#2a0d0d]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,180,171,0.18)_1px,transparent_1px)] bg-[size:12px_12px] opacity-55" />
          </>
        ) : (
          <div className="cp-road-patch absolute left-1/2 top-1/2 h-20 w-44 -translate-x-1/2 -translate-y-1/2 border border-[#00eb88]/35 bg-[#042b18]/85" />
        )}
      </div>
      <div className="mt-2 flex items-center justify-between px-1 font-mono text-xs">
        <span className="text-[#dbc2b0]/60">{meta}</span>
        <span className={isRose ? "text-[#ffb4ab]" : "text-[#00eb88]"}>{date}</span>
      </div>
    </div>
  );
}

function TimelineNode({
  title,
  date,
  detail,
  tone,
  active = false,
}: {
  title: string;
  date: string;
  detail: string;
  tone: "emerald" | "amber" | "rose";
  active?: boolean;
}) {
  const colors = {
    emerald: "border-[#00eb88] bg-[#00eb88]",
    amber: "border-[#ffc08d] bg-[#ffc08d]",
    rose: "border-[#ffb4ab] bg-[#ffb4ab]",
  };

  return (
    <div className="relative">
      <span
        className={`absolute -left-[33px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 bg-black ${
          colors[tone].split(" ")[0]
        } ${active ? "shadow-[0_0_12px_rgba(255,180,171,0.6)]" : ""}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${colors[tone].split(" ")[1]}`} />
      </span>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <h4 className={`text-sm font-semibold ${active ? "text-[#ffb4ab]" : "text-white"}`}>
            {title}
          </h4>
          <span className={`font-mono text-xs ${active ? "text-[#ffb4ab]" : "text-[#dbc2b0]/55"}`}>
            {date}
          </span>
        </div>
        <p className="max-w-2xl text-xs leading-5 text-[#dbc2b0]/75">{detail}</p>
      </div>
    </div>
  );
}

function Impact({ label, value }: { label: string; value: string }) {
  return (
    <div className="cp-cyber-card rounded-lg p-4">
      <p className="font-mono text-xs text-[#dbc2b0]/55">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
