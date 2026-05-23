"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  BookOpen,
  Camera,
  CheckCircle2,
  Droplets,
  FileImage,
  Fingerprint,
  Gavel,
  LayoutDashboard,
  Moon,
  LocateFixed,
  MapPin,
  Router,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import {
  demoCities,
  formatCityLocation,
  getCityByKey,
  type CityKey,
} from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";
import {
  analyzeInfrastructureIssue,
  type InfrastructureAnalysis,
} from "@/src/lib/infrastructure-analyzer";
import { saveLocalReport } from "@/src/lib/report-storage";
import { MOCK_WALLET_ADDRESS } from "@/src/lib/wallet-storage";

const issuePresets = [
  {
    label: "Road pothole",
    icon: AlertTriangle,
    text: "Large pothole appeared again near the same repaired road segment.",
  },
  {
    label: "Clogged drain",
    icon: Droplets,
    text: "Drain is clogged and waterlogging starts during rain near the main road.",
  },
  {
    label: "Night dark zone",
    icon: Moon,
    text: "Streetlight is not working at night and the lane has become unsafe for pedestrians.",
  },
  {
    label: "Garbage blackspot",
    icon: Trash2,
    text: "Garbage is overflowing at the same corner and the area smells badly.",
  },
  {
    label: "Water leakage",
    icon: Wrench,
    text: "Water pipeline leakage is flowing onto the road and damaging the surface.",
  },
  {
    label: "Blocked footpath",
    icon: Accessibility,
    text: "Footpath ramp is blocked and wheelchair users cannot pass safely.",
  },
];

export default function ReportIssuePage() {
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => "bhopal");
  const selectedCity = getCityByKey(citySnapshot);
  const [imageName, setImageName] = useState("");
  const [location, setLocation] = useState(() => formatCityLocation(getCityByKey(getCitySnapshot())));
  const [description, setDescription] = useState(
    "Large pothole appeared again near the same repaired road segment."
  );
  const [verified, setVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [signing, setSigning] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<InfrastructureAnalysis | null>(null);

  function runAiVerification() {
    setVerified(false);
    setAiResult(null);
    setAiProcessing(true);

    window.setTimeout(() => {
      setAiResult(
        analyzeInfrastructureIssue({
          description,
          imageName,
          location,
          cityName: selectedCity.name,
        })
      );
      setVerified(true);
      setAiProcessing(false);
    }, 900);
  }

  function createProof() {
    const result =
      aiResult ??
      analyzeInfrastructureIssue({
        description,
        imageName,
        location,
        cityName: selectedCity.name,
      });

    saveLocalReport({
      id: "CP-005",
      title: `${result.issueType} awaiting repair in ${selectedCity.name}`,
      ward: selectedCity.repairWard,
      status: "PENDING_PROOF",
      severity: result.severity,
      confidence: result.confidence,
      contractor: "Awaiting assignment",
      txHash: "0x7bd9...42fa",
      warrantyDaysLeft: null,
      location,
      issueCategory: result.category,
      assetType: result.assetType,
      aiSummary: result.publicSummary,
      recommendedAction: result.recommendedAction,
      slaHours: result.slaHours,
    });

    setSubmitted(true);
  }

  function chooseCity(cityKey: CityKey) {
    const city = getCityByKey(cityKey);

    setSelectedCityKey(city.key);
    setLocation(formatCityLocation(city));
    setDescription(`Large pothole appeared again near the repaired road segment at ${city.primaryArea}.`);
    setVerified(false);
    setAiResult(null);
    setSubmitted(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#ff9933]/15 bg-[#030507]/75 px-4 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:border-[#00dbe9]/60 hover:text-[#00dbe9]"
            aria-label="Back to command center"
          >
            <ArrowLeft size={17} />
          </Link>
          <BrandLogo size="sm" subtitle="Citizen proof intake node" />
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="input-recessed flex h-9 w-64 items-center rounded px-3">
            <Search size={14} className="mr-2 text-[#dbc2b0]/60" />
            <input
              className="w-full border-none bg-transparent p-0 font-mono text-xs text-[#e5e2e3] outline-none placeholder:text-[#dbc2b0]/45"
              placeholder="Search ledgers..."
            />
          </div>
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
          <BrandLogo size="sm" subtitle="Civic proof intake" />
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Command Center" />
          <NavItem href="/proof/CP-004" icon={<BadgeCheck size={18} />} label="Verified Repairs" />
          <NavItem
            href="/report"
            icon={<Camera size={18} />}
            label="Active Reports"
            active
          />
          <NavItem href="/warranty" icon={<ShieldCheck size={18} />} label="Urban Ledger" />
          <NavItem href="/about" icon={<Gavel size={18} />} label="Governance" />
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

      <section className="relative z-10 min-h-screen px-4 pb-10 pt-20 md:ml-64 md:px-8">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-7 flex items-end justify-between border-b border-white/5 pb-4">
            <div>
              <p className="font-mono text-xs uppercase text-[#00dbe9]">Initiate verifiable infrastructure log</p>
              <h1 className="mt-2 text-4xl font-semibold text-white sm:text-5xl">Citizen Report</h1>
              <p className="mt-2 text-sm text-[#dbc2b0]">
                Filing node: {selectedCity.name}, {selectedCity.state}. You can also type any exact
                landmark or GPS-backed address below.
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="pulse-indicator h-2 w-2 rounded-full bg-[#00eb88]" />
              <span className="font-mono text-xs text-[#00eb88]">Node synced</span>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#00dbe9]">
                    <Camera size={22} />
                    Universal Infrastructure Evidence
                  </h2>
                  <span className="rounded border border-white/10 bg-black/35 px-2 py-1 font-mono text-[10px] text-[#dbc2b0]">
                    MAX 5MB | IPFS READY
                  </span>
                </div>

                <div className="mb-5 rounded border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-4">
                  <label className="mb-2 block font-mono text-xs uppercase text-[#00dbe9]">
                    Demo City Coverage
                  </label>
                  <select
                    value={selectedCity.key}
                    onChange={(event) => chooseCity(event.target.value as CityKey)}
                    className="input-recessed w-full rounded px-4 py-3 font-mono text-sm text-white"
                  >
                    {demoCities.map((city) => (
                      <option key={city.key} value={city.key} className="bg-[#050505] text-white">
                        {city.name} | {city.state}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="group relative grid min-h-60 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-[#554336] bg-black/25 p-8 text-center transition hover:border-[#00dbe9]/80">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          setImageName(event.target.files?.[0]?.name || "");
                          setVerified(false);
                          setAiResult(null);
                          setSubmitted(false);
                        }}
                      />
                  <div className="absolute inset-0 evidence-asphalt opacity-25" />
                  <div className="absolute left-1/2 top-1/2 h-20 w-36 -translate-x-1/2 -translate-y-1/2 rounded-[48%] border border-[#ffb4ab]/25 bg-[#3a1515]/70 opacity-45 blur-[1px]" />

                  <div className="relative">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#00dbe9] shadow-[0_0_28px_rgba(0,219,233,0.18)]">
                      {imageName ? <FileImage size={28} /> : <UploadCloud size={28} />}
                    </div>
                    <p className="mt-4 font-medium text-white">
                      {imageName || "Drag and drop civic issue evidence"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[#dbc2b0]/65">
                      or click to browse local device
                    </p>
                  </div>
                </label>
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="grid gap-6">
                  <div>
                    <label className="mb-3 block font-mono text-xs uppercase text-[#00dbe9]">
                      Quick Demo Issue Types
                    </label>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {issuePresets.map((preset) => {
                        const Icon = preset.icon;

                        return (
                          <button
                            key={preset.label}
                            onClick={() => {
                              setDescription(preset.text);
                              setVerified(false);
                              setAiResult(null);
                              setSubmitted(false);
                            }}
                            className="flex items-center gap-2 rounded border border-white/10 bg-black/25 px-3 py-2 text-left text-xs text-[#dbc2b0] transition hover:border-[#00dbe9]/45 hover:text-[#00dbe9]"
                          >
                            <Icon size={15} />
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-xs uppercase text-[#00dbe9]">
                      Geospatial Anchor
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="input-recessed flex flex-1 items-center rounded px-4 py-3">
                        <MapPin size={17} className="mr-2 text-[#ffc08d]" />
                    <input
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      className="w-full bg-transparent font-mono text-sm text-white outline-none"
                    />
                      </div>
                      <button className="radar-pulse flex items-center justify-center gap-2 rounded border border-[#00eb88] bg-[#00eb88]/5 px-4 py-3 font-mono text-xs text-[#00eb88] transition hover:bg-[#00eb88]/10">
                        <LocateFixed size={16} />
                        GPS Proof
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block font-mono text-xs uppercase text-[#00dbe9]">
                        Technical Observation
                      </label>
                      <span className="font-mono text-xs text-[#dbc2b0]/55">
                        {description.length} / 1024 bytes
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(event) => {
                        setDescription(event.target.value);
                        setVerified(false);
                        setAiResult(null);
                        setSubmitted(false);
                      }}
                      className="input-recessed min-h-36 w-full resize-none rounded px-4 py-3 text-sm text-white"
                      placeholder="Describe any civic infrastructure issue: road, drain, streetlight, garbage, water leakage, footpath..."
                    />
                  </div>
                </div>
              </section>
            </div>

            <aside className="flex flex-col gap-6 lg:col-span-4">
              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-mono text-xs uppercase text-[#00dbe9]">
                    <Sparkles size={15} />
                    AI Pre-Verification
                  </h3>
                  <span className="rounded bg-black/35 px-2 py-1 font-mono text-[10px] text-[#dbc2b0]/70">
                    Unified civic AI
                  </span>
                </div>

                {aiProcessing ? (
                  <div className="space-y-3">
                    <div className="shimmer-bg h-4 w-3/4 rounded" />
                    <div className="shimmer-bg h-4 w-1/2 rounded" />
                    <div className="shimmer-bg mt-2 h-4 w-full rounded" />
                    <p className="text-shimmer mt-3 font-mono text-xs font-semibold">
                      Detecting asset type, severity, SLA and warranty risk...
                    </p>
                  </div>
                ) : verified && aiResult ? (
                  <div className="rounded border border-[#00eb88]/30 bg-[#00eb88]/5 p-5">
                    <CheckCircle2 className="mx-auto text-[#00eb88]" size={40} />
                    <p className="mt-3 text-center text-lg font-semibold text-[#00eb88]">
                      {aiResult.issueType}
                    </p>
                    <div className="mt-3 flex items-end justify-center gap-1">
                      <span className="text-4xl font-semibold text-white">{aiResult.confidence}</span>
                      <span className="mb-1 font-mono text-xs text-[#00eb88]">% confidence</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <AnalysisRow label="Asset" value={aiResult.assetType} />
                      <AnalysisRow label="Severity" value={aiResult.severity} />
                      <AnalysisRow label="SLA" value={`${aiResult.slaHours} hours`} />
                      <AnalysisRow label="Duplicate Risk" value={aiResult.duplicateRisk} />
                    </div>
                    <div className="mt-4 rounded border border-white/10 bg-black/25 p-3">
                      <p className="font-mono text-[10px] uppercase text-[#00dbe9]">AI Recommendation</p>
                      <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">{aiResult.recommendedAction}</p>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {aiResult.evidenceSignals.slice(0, 3).map((signal) => (
                        <div key={signal} className="flex items-center gap-2 text-xs text-[#dbc2b0]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00eb88]" />
                          {signal}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded border border-white/10 bg-black/25 p-4">
                    <p className="text-sm text-[#dbc2b0]">
                      Upload evidence or describe any infrastructure issue. One AI function will
                      classify the asset, severity, SLA, warranty risk and proof type.
                    </p>
                    <button
                      onClick={runAiVerification}
                      disabled={aiProcessing}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-[#00dbe9] px-4 py-3 text-sm font-semibold text-[#00363a] transition hover:bg-[#7df4ff] disabled:cursor-wait disabled:opacity-70"
                    >
                      <Sparkles size={16} />
                      Analyze Infrastructure Issue
                    </button>
                  </div>
                )}

                {verified && (
                  <button
                    onClick={runAiVerification}
                    className="mt-4 w-full rounded border border-[#00dbe9]/40 bg-[#00dbe9]/10 px-4 py-2 font-mono text-xs text-[#00dbe9] transition hover:bg-[#00dbe9]/15"
                  >
                    Re-run unified analysis
                  </button>
                )}
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase text-[#dbc2b0]">Citizen Identity</h3>
                  <span className="flex items-center gap-1 rounded border border-[#00eb88]/30 bg-[#00eb88]/10 px-2 py-1 font-mono text-[10px] text-[#00eb88]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00eb88]" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="grid h-12 w-12 place-items-center rounded border border-white/10 bg-[#201f20] text-[#dbc2b0]">
                    <Fingerprint size={25} />
                  </div>
                  <div>
                    <p className="font-mono text-sm text-white">{MOCK_WALLET_ADDRESS}</p>
                    <p className="font-mono text-xs text-[#dbc2b0]/60">
                      Node ID: {selectedCity.key.toUpperCase()}-9942
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between">
                    <span className="font-mono text-[10px] uppercase text-[#dbc2b0]/60">
                      Reputation score
                    </span>
                    <span className="font-mono text-sm text-[#ffc08d]">842.50</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-[#201f20]">
                    <div className="h-full w-[84%] bg-[#ffc08d]" />
                  </div>
                </div>
              </section>

              <section className="cp-cyber-card rounded-lg p-6">
                <button
                  onClick={() => setSigning(true)}
                  disabled={!aiResult || submitted}
                  className="royal-blue-glow flex w-full items-center justify-center gap-2 rounded border border-[#2A2D35] bg-[#1A1C23] px-4 py-4 font-mono text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ShieldCheck size={16} />
                  {submitted ? "Proof Created" : "Create Blockchain Proof"}
                </button>
                {!verified && (
                  <p className="mt-3 text-center text-xs text-[#dbc2b0]/60">
                    Unified AI analysis is required before signing.
                  </p>
                )}
              </section>

              {submitted && (
                <section className="cp-cyber-card rounded-lg border-[#00eb88]/30 bg-[#00eb88]/10 p-6">
                  <div className="flex items-center gap-2 text-[#00eb88]">
                    <CheckCircle2 size={18} />
                    <p className="font-semibold">Proof Created</p>
                  </div>
                  <p className="mt-3 text-sm text-[#dbc2b0]">
                    Report CP-005 is now visible on the command center with a mock blockchain
                    transaction.
                  </p>
                  {aiResult && (
                    <p className="mt-2 text-sm text-[#dbc2b0]">
                      Classified as <span className="text-[#00eb88]">{aiResult.issueType}</span>.
                    </p>
                  )}
                  <p className="mt-3 rounded bg-black/45 p-3 font-mono text-xs text-[#00eb88]">
                    0x7bd9...42fa
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex w-full items-center justify-center rounded border border-[#00eb88]/30 bg-[#00eb88]/10 px-4 py-2 text-sm font-semibold text-[#00eb88] transition hover:bg-[#00eb88]/20"
                  >
                    View On Command Center
                  </Link>
                </section>
              )}
            </aside>
          </div>
        </div>
      </section>

      {signing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/82 p-4 backdrop-blur-xl">
          <div className="cp-cyber-card w-full max-w-md rounded-lg border-[#00dbe9]/40 p-7 shadow-[0_0_34px_rgba(0,219,233,0.16)]">
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase text-[#00dbe9]">
                <ShieldCheck size={16} />
                Sign Transaction
              </h3>
              <button
                onClick={() => setSigning(false)}
                className="grid h-8 w-8 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:text-[#ffb4ab]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mb-6 grid place-items-center py-4 text-center">
              <div className="mb-4 grid h-16 w-16 animate-spin place-items-center rounded-full border-2 border-dashed border-[#00dbe9] text-[#00dbe9]">
                <Fingerprint size={24} />
              </div>
              <div className="mb-4 h-1 w-full overflow-hidden rounded bg-[#201f20]">
                <div className="shimmer-bg h-full w-full" />
              </div>
              <p className="font-mono text-sm text-white">Awaiting signature from</p>
              <p className="font-mono text-sm text-[#ffc08d]">{MOCK_WALLET_ADDRESS}</p>
            </div>

            <div className="mb-5 space-y-2 rounded border border-white/5 bg-black/40 p-4">
              <SignRow label="Contract" value="ReportRegistry_v2" />
              <SignRow label="Method" value="submitProof()" />
              <SignRow label="Issue" value={aiResult?.issueType ?? "Infrastructure issue"} />
              <SignRow label="Proof Tag" value={aiResult?.proofTag ?? "CIVIC_ASSET_PROOF"} />
              <SignRow label="Network" value="Base Sepolia" />
              <SignRow label="Gas" value="Free MVP simulation" />
            </div>

            <div className="rounded border border-[#00eb88]/20 bg-[#00eb88]/10 p-4">
              <div className="flex items-center gap-2 text-[#00eb88]">
                <Wallet size={16} />
                <p className="font-semibold">Proof Preview</p>
              </div>
              <p className="mt-2 text-sm text-[#dbc2b0]">
                A public report record will be created for {location}.
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setSigning(false)}
                className="flex-1 rounded border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  createProof();
                  setSigning(false);
                }}
                className="btn-primary-shimmer flex-1 rounded bg-[#ffc08d] px-4 py-2 text-sm font-semibold text-[#4c2700]"
              >
                Sign and Create
              </button>
            </div>
          </div>
        </div>
      )}
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

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/25 px-3 py-2">
      <span className="font-mono text-[10px] uppercase text-[#dbc2b0]/55">{label}</span>
      <span className="text-right text-xs font-semibold text-white">{value}</span>
    </div>
  );
}

function SignRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[10px] uppercase text-[#dbc2b0]/55">{label}</span>
      <span className="text-right font-mono text-xs text-white">{value}</span>
    </div>
  );
}
