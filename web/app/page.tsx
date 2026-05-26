"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Blocks,
  Building2,
  Gauge,
  MapPin,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { AnimatedCityMap } from "@/src/components/map/AnimatedCityMap";
import { ChainProofCard } from "@/src/components/proof/ChainProofCard";
import { demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";
import { getReportsForCity, type CivicReport } from "@/src/lib/mock-data";
import {
  clearLocalReports,
  getLocalReportsSnapshot,
  subscribeLocalReports,
} from "@/src/lib/report-storage";
import {
  connectMockWallet,
  disconnectMockWallet,
  getWalletSnapshot,
  MOCK_WALLET_ADDRESS,
  subscribeWallet,
} from "@/src/lib/wallet-storage";
import { useLanguage } from "@/src/lib/use-language";
import type { TranslationKey } from "@/src/lib/language-context";

const timelineDefaultKeys: TranslationKey[] = [
  "citizenReport",
  "aiPreVerification",
  "repairProof",
  "warrantyActivated",
  "repeatFailure",
];

const navItems = [
  { labelKey: "commandCenter" as const, icon: Gauge, href: "/", active: true },
  { labelKey: "verifiedRepairs" as const, icon: BadgeCheck, href: "/proof/CP-004" },
  { labelKey: "activeReports" as const, icon: AlertTriangle, href: "/report" },
  { labelKey: "urbanLedger" as const, icon: Wallet, href: "/warranty" },
  { labelKey: "pendingProof" as const, icon: ScanSearch, href: "/pending" },
];

export default function Home() {
  const { t } = useLanguage();
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => "bhopal");
  const walletSnapshot = useSyncExternalStore(subscribeWallet, getWalletSnapshot, () => "false");
  const selectedCity = getCityByKey(citySnapshot);
  const walletConnected = walletSnapshot === "true";
  const localReports = useMemo(
    () => JSON.parse(localReportsSnapshot) as CivicReport[],
    [localReportsSnapshot]
  );
  const cityReports = useMemo(() => getReportsForCity(citySnapshot), [citySnapshot]);
  const localCityReports = useMemo(
    () => localReports.filter((report) => !report.cityKey || report.cityKey === selectedCity.key),
    [localReports, selectedCity.key]
  );
  const dashboardReports = useMemo(
    () => {
      const localIds = new Set(localCityReports.map((report) => report.id));
      return [...localCityReports, ...cityReports.filter((report) => !localIds.has(report.id))];
    },
    [localCityReports, cityReports]
  );
  const activeDashboardReports = useMemo(
    () => dashboardReports.filter((report) => report.status !== "CLOSED"),
    [dashboardReports]
  );
  const activeLocalReports = useMemo(
    () => localCityReports.filter((report) => report.status !== "CLOSED"),
    [localCityReports]
  );
  const selected = activeLocalReports[0] ?? activeDashboardReports[0] ?? cityReports[3];
  const isNewLocalReport = selected.status === "PENDING_PROOF";
  const timelineEvents = isNewLocalReport
    ? [t("citizenReport"), t("aiPreVerification"), t("newProof"), t("awaitingContractorAssignment")]
    : timelineDefaultKeys.map((key) => t(key));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:34px_34px] opacity-70" />

      <header className="fixed left-0 right-0 top-0 z-50 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#ff9933]/15 bg-[#030507]/75 px-3 py-3 shadow-[0_0_34px_rgba(0,219,233,0.08)] backdrop-blur-2xl sm:h-20 sm:flex-nowrap sm:px-5 lg:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <BrandLogo className="min-w-0" />
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/about"
            className="hidden rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#ffdcc2] transition hover:border-[#00dbe9]/35 hover:bg-[#00dbe9]/10 hover:text-[#7df4ff] md:inline-flex"
          >
            {t("about")}
          </Link>
          <button className="hidden h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:border-[#00dbe9]/40 hover:text-[#7df4ff] hover:shadow-[0_0_18px_rgba(0,219,233,0.16)] sm:grid">
            <Bell size={18} />
          </button>
          <ThemeToggle />
          <LanguageSelector compact />
          <button
            onClick={walletConnected ? disconnectMockWallet : connectMockWallet}
            className={`relative max-w-[128px] overflow-hidden truncate rounded-sm border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition sm:max-w-none sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.2em] ${
              walletConnected
                ? "border-[#00eb88]/45 bg-[#00eb88]/12 text-[#5bffa1] shadow-[0_0_24px_rgba(0,235,136,0.14)]"
                : "border-[#ffc08d]/60 bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] text-[#4c2700] shadow-[0_0_26px_rgba(255,153,51,0.2)]"
            }`}
          >
            <span className="stitch-shimmer" />
            {walletConnected ? MOCK_WALLET_ADDRESS : t("connectWallet")}
          </button>
        </div>
      </header>

      <section className="grid min-h-screen grid-cols-1 pt-24 sm:pt-20 xl:grid-cols-[320px_1fr_400px]">
        <aside className="hidden border-r border-[#ff9933]/15 bg-[linear-gradient(180deg,rgba(255,153,51,0.08),rgba(0,0,0,0.5)_22%,rgba(0,219,233,0.045))] p-5 shadow-[8px_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:flex xl:flex-col">
          <nav className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.labelKey}
                  href={item.href}
                  className={`flex w-full items-center gap-4 rounded-md border px-4 py-4 text-left transition ${
                    item.active
                      ? "border-[#ffc08d]/65 bg-[linear-gradient(135deg,rgba(255,153,51,0.18),rgba(255,192,141,0.06))] text-[#ffc08d] shadow-[inset_0_0_18px_rgba(255,183,122,0.16),0_0_18px_rgba(255,153,51,0.08)]"
                      : "border-white/[0.03] text-[#a38d7c] hover:border-[#00dbe9]/25 hover:bg-[#00dbe9]/8 hover:text-[#d3fbff]"
                  }`}
                >
                  <Icon size={22} />
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.18em]">
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="mb-5 px-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#dbc2b0]">
              {t("publicAudit")}
            </p>
            <div className="space-y-4 px-3">
              <AuditMetric label={t("activeReports")} value={`${128 + activeLocalReports.length}`} tone="text-[#ffc08d]" />
              <AuditMetric label={t("verifiedRepairs")} value="76" tone="text-[#00eb88]" />
              <AuditMetric label={t("repeatFailure")} value="09" tone="text-[#ffb4ab]" />
              <AuditMetric label={t("onChainProofs")} value={`${214 + localCityReports.length}`} tone="text-[#00dbe9]" />
            </div>
          </div>

          <div className="mt-8 rounded-md border border-[#00dbe9]/30 bg-[linear-gradient(145deg,rgba(0,219,233,0.09),rgba(255,255,255,0.035))] p-5 shadow-[0_0_24px_rgba(0,219,233,0.1)]">
            <div className="flex items-center gap-2 text-[#00eefc]">
              <ScanSearch size={18} />
              <p className="font-semibold">{t("notJustReporting")}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#e5e2e3]/80">
              {t("notJustReportingText")}
            </p>
          </div>

          {walletConnected && (
            <div className="mt-5 rounded-md border border-[#00eb88]/30 bg-[linear-gradient(135deg,rgba(0,235,136,0.13),rgba(0,219,233,0.06))] p-5 shadow-[0_0_22px_rgba(0,235,136,0.08)]">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#5bffa1]">{t("citizenWallet")}</p>
              <p className="mt-2 font-mono text-sm text-[#e5e2e3]">{MOCK_WALLET_ADDRESS}</p>
              <p className="mt-1 text-xs text-[#dbc2b0]">{t("readyToSign")}</p>
            </div>
          )}

          {activeLocalReports.length > 0 && (
            <div className="mt-5 rounded-md border border-[#00dbe9]/30 bg-[linear-gradient(135deg,rgba(0,219,233,0.12),rgba(0,0,0,0.18))] p-5">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#7df4ff]">
                {t("latestCitizenReport")}
              </p>
              <p className="mt-3 text-sm text-[#e5e2e3]">{activeLocalReports[0].title}</p>
              <p className="mt-1 text-xs text-[#dbc2b0]">{activeLocalReports[0].location}</p>
              <button
                onClick={clearLocalReports}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-sm border border-[#00dbe9]/40 bg-black/30 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#7df4ff] hover:bg-black/60"
              >
                <RotateCcw size={13} />
                {t("resetDemo")}
              </button>
            </div>
          )}
        </aside>

        <section className="cp-dashboard-canvas relative overflow-hidden border-r border-white/10 p-4 sm:p-5 lg:p-8">
          <div className="absolute inset-0 stitch-bg-grid opacity-80" />
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#00dbe9]/55 to-transparent" />
          <div className="relative z-10 flex h-full min-h-[calc(100vh-5rem)] flex-col">
            <div className="mb-6 flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#00dbe9]">
                  {t("commandCenterSubtitle")}
                </p>
                <h2 className="mt-2 max-w-xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                  {selectedCity.name} {t("commandCenter")}
                </h2>
                <p className="mt-2 text-sm text-[#dbc2b0]">
                  Demo node: {selectedCity.primaryArea}, {selectedCity.state}. Switch cities to
                  show CityPramaan works beyond one municipal area.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
                <CitySelector value={selectedCity.key} />
                <CommandLink href="/contractor" label={t("contractorView")} icon={<Building2 size={16} />} tone="cyan" />
                <CommandLink href="/pending" label={t("pendingProof")} icon={<ScanSearch size={16} />} tone="glass" />
                <CommandLink href="/warranty" label={t("warrantyScanner")} icon={<ScanSearch size={16} />} tone="gold" />
                <CommandLink
                  href={`/proof/${selected.id}`}
                  label={t("publicProof")}
                  icon={<Blocks size={16} />}
                  tone="glass"
                />
                <Link
                  href="/report"
                  className="relative col-span-2 flex min-h-12 items-center justify-center overflow-hidden rounded-sm bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-5 py-3 text-center font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#4c2700] shadow-[0_0_24px_rgba(255,153,51,0.2)] hover:shadow-[0_0_30px_rgba(255,153,51,0.3)] sm:col-auto"
                >
                  <span className="stitch-shimmer" />
                  {t("reportIssue")}
                </Link>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <PulseStat
                icon={<Gauge size={17} />}
                label={t("activeReports")}
                value={`${128 + activeLocalReports.length}`}
                detail={t("liveCivicStream")}
                tone="amber"
              />
              <PulseStat
                icon={<Sparkles size={17} />}
                label={t("aiConfidence")}
                value={`${selected.confidence}%`}
                detail={t("unifiedAnalysis")}
                tone="cyan"
              />
              <PulseStat
                icon={<ShieldCheck size={17} />}
                label={t("warrantyWatch")}
                value={selected.warrantyDaysLeft === null ? t("ready") : `${selected.warrantyDaysLeft}d`}
                detail={t("repeatFailureScan")}
                tone="emerald"
              />
              <PulseStat
                icon={<Blocks size={17} />}
                label={t("chainStatus")}
                value={`${214 + localCityReports.length}`}
                detail={t("proofEventsIndexed")}
                tone="violet"
              />
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <FilterChip label={t("openIssues")} color="bg-[#ffb4ab]" />
              <FilterChip label={t("pendingProof")} color="bg-[#00dbe9]" />
              <FilterChip label={t("repairSubmitted")} color="bg-[#ff9933]" />
              <FilterChip label={t("underWarranty")} color="bg-[#3b82f6]" />
              <FilterChip label={t("repeatFailure")} color="bg-[#d946ef]" active />
            </div>

            <div className="cp-command-frame relative">
              <AnimatedCityMap reports={activeDashboardReports} city={selectedCity} />
            </div>

            <div className="cp-live-strip mt-5 overflow-hidden rounded-md border border-white/10 bg-black/30 backdrop-blur-xl">
              <div className="cp-live-track flex min-w-max items-center gap-8 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[#dbc2b0]">
                <span className="text-[#00eb88]">{t("liveCivicStream")}</span>
                <span>{selectedCity.name} {t("nodeSynced")}</span>
                <span>{t("aiClassifierOnline")}</span>
                <span>{t("warrantyOracleListening")}</span>
                <span>{t("publicLedgerReady")}</span>
                <span>{t("resolverReputationActive")}</span>
              </div>
            </div>

            <div className="cp-trust-band mt-5 overflow-hidden rounded-md border border-white/10 bg-black/25 backdrop-blur-xl">
              <div className="stitch-cityline pointer-events-none absolute inset-x-0 bottom-0 h-20 opacity-20" />
              <div className="relative grid gap-3 p-4 sm:grid-cols-2 2xl:grid-cols-4">
                <TrustSignal
                  icon={<Sparkles size={17} />}
                  label={t("aiIssueBrain")}
                  value={t("oneReportFlow")}
                  tone="cyan"
                />
                <TrustSignal
                  icon={<Blocks size={17} />}
                  label={t("blockchainProof")}
                  value={t("hashAnchored")}
                  tone="amber"
                />
                <TrustSignal
                  icon={<ShieldCheck size={17} />}
                  label={t("warrantyGuard")}
                  value={t("failureTracked")}
                  tone="emerald"
                />
                <TrustSignal
                  icon={<Wallet size={17} />}
                  label={t("citizenNode")}
                  value={walletConnected ? t("walletReady") : t("demoMode")}
                  tone="violet"
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="max-h-none overflow-y-auto bg-[#181615]/95 p-4 backdrop-blur-xl sm:p-5 xl:max-h-screen">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div
                className={`inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.16em] ${
                  isNewLocalReport
                    ? "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]"
                    : "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]"
                }`}
              >
                {isNewLocalReport ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                {isNewLocalReport ? t("newProof") : t("highPriority")}
              </div>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-white">
                {isNewLocalReport ? t("newProofCreated") : t("repeatFailureDetected")}
              </h3>
              <p className="mt-2 flex items-center gap-2 text-sm text-[#dbc2b0]">
                <MapPin size={16} />
                {selected.location}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoCard label={t("severity")} value={selected.severity} />
            <InfoCard label={t("aiConfidence")} value={`${selected.confidence}%`} accent="text-[#00eb88]" />
            <InfoCard label={t("ward")} value={selected.ward} />
            <InfoCard
              label={t("warranty")}
              value={selected.warrantyDaysLeft === null ? t("notActive") : `${selected.warrantyDaysLeft} days`}
              accent="text-[#ffc08d]"
            />
          </div>

          <div className="mt-6 rounded-md border border-[#d946ef]/40 bg-[linear-gradient(145deg,rgba(217,70,239,0.18),rgba(0,219,233,0.045))] p-5 shadow-[0_0_26px_rgba(217,70,239,0.12)]">
            <div className="mb-4 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#f0abfc]">
              <Sparkles size={16} />
              {t("aiRepairAudit")}
            </div>
            <div className="relative mb-4 h-28 overflow-hidden rounded-sm border border-[#d946ef]/30 bg-black/45">
              <div className="absolute inset-4 rounded-sm border border-dashed border-[#d946ef]/70" />
              <div className="absolute left-1/2 top-1/2 h-14 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d946ef]/20 blur-xl" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#f0abfc] to-transparent" />
            </div>
            <p className="text-sm leading-6 text-[#e5e2e3]/85">
              {isNewLocalReport
                ? "AI detected critical road damage and matched it to a previous warranty zone."
                : "Visual signature mismatch detected. Current damage matches pre-repair state with high confidence."}
            </p>
          </div>

          <div className="mt-6">
            <p className="mb-5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#dbc2b0]">
              {t("proofTimeline")}
            </p>
            <div className="border-l border-white/10 pl-5">
              {timelineEvents.map((event, index) => (
                <div key={event} className="relative pb-7 last:pb-0">
                  <div
                    className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ${
                      !isNewLocalReport && index === timelineEvents.length - 1
                        ? "bg-[#ffc08d] shadow-[0_0_12px_rgba(255,192,141,0.75)]"
                        : "bg-[#00eb88] shadow-[0_0_10px_rgba(0,235,136,0.65)]"
                    }`}
                  />
                  <p className="font-mono text-xs text-[#a38d7c]">
                    {index === 0 ? "Oct 12, 2023" : index === timelineEvents.length - 1 ? "Today, 09:41 AM" : "Oct 14, 2023"}
                  </p>
                  <p className="mt-1 text-sm text-[#e5e2e3]">{event}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="rounded-xl border border-[#00eb88]/20 bg-[#00eb88]/5 p-1 shadow-[0_0_28px_rgba(0,235,136,0.08)]">
              <ChainProofCard compact />
            </div>
            <Link
              href={`/proof/${selected.id}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-sm border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#7df4ff] transition hover:bg-[#00dbe9]/15"
            >
              {t("openPublicProof")}
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}

function AuditMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-[#dbc2b0]">{label}</span>
      <span className={`font-mono text-sm font-bold ${tone}`}>{value}</span>
    </div>
  );
}

function PulseStat({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "amber" | "cyan" | "emerald" | "violet";
}) {
  const tones = {
    amber: "border-[#ff9933]/30 bg-[#ff9933]/10 text-[#ffc08d]",
    cyan: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]",
    emerald: "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#5bffa1]",
    violet: "border-[#d946ef]/30 bg-[#d946ef]/10 text-[#f0abfc]",
  };

  return (
    <div className={`cp-pulse-stat rounded-md border p-3 ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-sm border border-current/25 bg-black/20">
          {icon}
        </span>
        <span className="h-2 w-2 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
      </div>
      <p className="mt-3 font-mono text-[9px] font-bold uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-1 text-xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-[#dbc2b0]">{detail}</p>
    </div>
  );
}

function TrustSignal({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "amber" | "cyan" | "emerald" | "violet";
}) {
  const tones = {
    amber: "border-[#ff9933]/25 text-[#ffc08d]",
    cyan: "border-[#00dbe9]/25 text-[#7df4ff]",
    emerald: "border-[#00eb88]/25 text-[#5bffa1]",
    violet: "border-[#d946ef]/25 text-[#f0abfc]",
  };

  return (
    <div
      className={`cp-trust-signal flex items-center gap-3 rounded-md border bg-white/[0.035] px-4 py-3 ${tones[tone]}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-current/25 bg-black/25">
        {icon}
      </span>
      <span>
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
          {label}
        </span>
        <span className="mt-1 block text-sm font-semibold text-[#e5e2e3]">{value}</span>
      </span>
    </div>
  );
}

function CommandLink({
  href,
  label,
  icon,
  tone,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  tone: "cyan" | "gold" | "glass";
}) {
  const tones = {
    cyan: "border-[#00dbe9]/45 bg-[#00dbe9]/10 text-[#7df4ff] hover:bg-[#00dbe9]/15",
    gold: "border-[#ffc08d]/35 bg-[#ffc08d]/10 text-[#ffdcc2] hover:bg-[#ffc08d]/15",
    glass: "border-white/10 bg-white/[0.04] text-[#e5e2e3] hover:border-[#00dbe9]/30 hover:bg-white/[0.07]",
  };

  return (
    <Link
      href={href}
      className={`flex min-h-14 items-center justify-center gap-2 rounded-md border px-2 py-2 text-center text-xs font-semibold leading-tight transition sm:min-h-0 sm:flex-none sm:px-5 sm:py-3 sm:text-sm ${tones[tone]}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 break-words">{label}</span>
    </Link>
  );
}

function CitySelector({ value }: { value: CityKey }) {
  return (
    <label className="col-span-2 flex min-h-14 w-full items-center gap-2 rounded-md border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-3 py-2 text-sm text-[#7df4ff] sm:col-auto sm:w-auto">
      <MapPin size={16} />
      <select
        value={value}
        onChange={(event) => setSelectedCityKey(event.target.value as CityKey)}
        className="min-w-0 flex-1 bg-transparent font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#7df4ff] outline-none sm:flex-none"
        aria-label="Select demo city"
      >
        {demoCities.map((city) => (
          <option key={city.key} value={city.key} className="bg-[#050505] text-white">
            {city.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterChip({ label, color, active }: { label: string; color: string; active?: boolean }) {
  return (
    <button
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition sm:px-4 sm:text-sm ${
        active
          ? "border-[#ffc08d]/50 bg-[#ffc08d]/10 text-[#ffc08d] shadow-[0_0_18px_rgba(255,192,141,0.1)]"
          : "border-white/15 bg-white/[0.04] text-[#e5e2e3] hover:border-white/30"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </button>
  );
}

function InfoCard({
  label,
  value,
  accent = "text-[#e5e2e3]",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.05] p-4 shadow-[inset_0_0_20px_rgba(255,255,255,0.025)]">
      <p className="text-sm text-[#dbc2b0]">{label}</p>
      <p className={`mt-2 font-mono text-sm font-bold ${accent}`}>{value}</p>
    </div>
  );
}
