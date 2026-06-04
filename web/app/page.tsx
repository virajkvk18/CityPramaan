"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Blocks,
  Building2,
  CheckCircle2,
  Clock3,
  FileImage,
  Gauge,
  LogIn,
  LogOut,
  MapPin,
  RotateCcw,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { NotificationBell } from "@/src/components/layout/NotificationBell";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { AnimatedCityMap } from "@/src/components/map/AnimatedCityMap";
import { ChainProofCard } from "@/src/components/proof/ChainProofCard";
import { DEFAULT_CITY_KEY, demoCities, getCityByKey, type CityKey } from "@/src/lib/city-context";
import {
  getCitySelectionSourceSnapshot,
  getCitySnapshot,
  setSelectedCityKey,
  subscribeCity,
} from "@/src/lib/city-storage";
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
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";
import type { TranslationKey } from "@/src/lib/language-context";
import {
  type AuthRole,
  getAuthSnapshot,
  getCurrentUser,
  isProfileComplete,
  logoutUser,
  roleLabels,
  subscribeAuth,
} from "@/src/lib/auth-storage";

const timelineDefaultKeys: TranslationKey[] = [
  "citizenReport",
  "aiPreVerification",
  "repairProof",
  "warrantyActivated",
  "repeatFailure",
];

const SAFETY_INTRO_STORAGE_KEY = "citypramaan-safety-intro-seen";
const CITY_HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4";

type RoleNavItem = {
  label: string;
  icon: typeof Gauge;
  href: string;
  active?: boolean;
  tone?: "cyan" | "gold" | "glass";
};

function getRoleDashboard(role?: AuthRole) {
  switch (role) {
    case "WARD_ADMIN":
      return {
        title: "Ward review console active",
        detail: "Approve contractor proof, monitor warranty risk, and track repeat failures for your assigned ward.",
        action: "Review pending proof",
        href: "/pending",
      };
    case "CONTRACTOR":
      return {
        title: "Contractor repair queue active",
        detail: "Open assigned civic issues, upload after-repair evidence, and generate repair proof hashes.",
        action: "Open repair queue",
        href: "/contractor",
      };
    case "USER":
    default:
      return {
        title: "Citizen reporting dashboard active",
        detail: "Report civic issues, follow proof timelines, and verify warranty status after repairs.",
        action: "Report issue",
        href: "/report",
      };
  }
}

function getRoleNavItems(role: AuthRole, proofHref: string): RoleNavItem[] {
  const profile = { label: "Your profile", icon: UserRound, href: "/profile" };
  const activeReports = { label: "Active reports", icon: Gauge, href: "/", active: true };

  if (role === "CONTRACTOR") {
    return [
      activeReports,
      { label: "Contractor view", icon: Building2, href: "/contractor", tone: "cyan" },
      { label: "Upload repair proof", icon: BadgeCheck, href: "/contractor", tone: "gold" },
      { label: "Public proof", icon: Blocks, href: proofHref, tone: "glass" },
      profile,
    ];
  }

  if (role === "WARD_ADMIN") {
    return [
      activeReports,
      { label: "Pending approvals", icon: ScanSearch, href: "/pending", tone: "glass" },
      { label: "Contractor view", icon: Building2, href: "/contractor", tone: "cyan" },
      { label: "Warranty scanner", icon: Wallet, href: "/warranty", tone: "gold" },
      { label: "Report issue", icon: AlertTriangle, href: "/report", tone: "gold" },
      { label: "Public proof", icon: Blocks, href: proofHref, tone: "glass" },
      profile,
    ];
  }

  return [
    activeReports,
    { label: "Report new issue", icon: AlertTriangle, href: "/report", tone: "gold" },
    { label: "Public proof", icon: Blocks, href: proofHref, tone: "glass" },
    { label: "Warranty status", icon: Wallet, href: "/warranty", tone: "cyan" },
    profile,
  ];
}

export default function Home() {
  const { t } = useLanguage();
  const [showSafetyIntro, setShowSafetyIntro] = useState(false);
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => DEFAULT_CITY_KEY);
  const citySourceSnapshot = useSyncExternalStore(
    subscribeCity,
    getCitySelectionSourceSnapshot,
    () => "default"
  );
  const walletSnapshot = useSyncExternalStore(subscribeWallet, getWalletSnapshot, () => "false");
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => "");
  const selectedCity = getCityByKey(citySnapshot);
  const cityDisplay = useDetectedLocationDisplay(selectedCity);
  const waitingForAutoCity = !cityDisplay.detectedLocation && citySourceSnapshot !== "manual";
  const dashboardCityName = waitingForAutoCity ? "Current City" : cityDisplay.cityName;
  const walletConnected = walletSnapshot === "true";
  const currentUser = useMemo(() => getCurrentUser(authSnapshot), [authSnapshot]);
  const profileComplete = currentUser ? isProfileComplete(currentUser) : false;
  const roleDashboard = getRoleDashboard(currentUser?.role);
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
  const roleNavItems = currentUser ? getRoleNavItems(currentUser.role, `/proof/${selected.id}`) : [];
  const roleActionLinks = roleNavItems.filter((item) => !item.active).slice(0, 5);
  const isNewLocalReport = selected.status === "PENDING_PROOF";
  const isPowerIncident = selected.issueCategory === "POWER_OUTAGE";
  const timelineEvents = isNewLocalReport
    ? [t("citizenReport"), t("aiPreVerification"), t("newProof"), t("awaitingContractorAssignment")]
    : timelineDefaultKeys.map((key) => t(key));

  useEffect(() => {
    try {
      const introSeen = window.localStorage.getItem(SAFETY_INTRO_STORAGE_KEY);

      if (introSeen) {
        return;
      }
    } catch {
      // If storage is blocked, still show the intro for the current visit.
    }

    const timer = window.setTimeout(() => {
      setShowSafetyIntro(true);
    }, 450);

    return () => window.clearTimeout(timer);
  }, []);

  const closeSafetyIntro = () => {
    try {
      window.localStorage.setItem(SAFETY_INTRO_STORAGE_KEY, "true");
    } catch {
      // Storage may be unavailable in strict privacy modes.
    }

    setShowSafetyIntro(false);
  };

  if (!currentUser) {
    return (
      <main className="cp-page-shell cp-video-landing relative min-h-screen overflow-hidden bg-black text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={CITY_HERO_VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />

        <div className="relative z-10 flex min-h-screen flex-col px-4 pb-7 pt-4 sm:px-6 md:px-10 lg:px-14">
          <header className="liquid-glass flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-3 sm:px-4">
            <Link href="/" className="flex min-w-0 max-w-[calc(100%-6.5rem)] items-center gap-3 sm:max-w-none">
              <BrandLogo className="min-w-0" size="sm" />
            </Link>

            <nav className="hidden items-center gap-5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78 lg:flex xl:gap-8">
              <Link href="/story" className="transition hover:text-white">
                Story
              </Link>
              <Link href="/auth" className="transition hover:text-white">
                Warranty
              </Link>
              <Link href="/auth" className="transition hover:text-white">
                Public Proof
              </Link>
              <Link href="/auth" className="transition hover:text-white">
                Report
              </Link>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/about"
                className="hidden min-h-10 items-center justify-center rounded-lg border border-white/20 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white hover:text-black sm:inline-flex"
              >
                About
              </Link>
              <Link
                href="/auth"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-black transition hover:bg-gray-100 sm:px-5"
              >
                <LogIn size={15} />
                Start
              </Link>
            </div>
          </header>

          <section className="flex flex-1 flex-col justify-end py-10 sm:py-12 lg:py-14">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-end">
              <div className="max-w-4xl">
                <AnimatedHeading
                  text={`Proof of repair\nfor accountable cities.`}
                  className="mb-4 text-[2.25rem] font-black leading-[1.05] text-white sm:text-[2.9rem] md:text-[3.55rem] lg:text-[4.1rem] xl:text-[4.85rem]"
                />
                <FadeIn delay={800} duration={1000}>
                  <p className="mb-5 max-w-2xl text-sm leading-6 text-gray-300 sm:text-base md:text-lg md:leading-7">
                    CityPramaan turns civic complaints into verifiable repair histories with public
                    proof, contractor accountability, and warranty memory for every city issue.
                  </p>
                </FadeIn>
                <FadeIn delay={1200} duration={1000}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link
                      href="/auth"
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-6 py-3 text-center font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-gray-100 sm:px-8"
                    >
                      Start a Report
                    </Link>
                    <Link
                      href="/auth"
                      className="liquid-glass inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-center font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black sm:px-8"
                    >
                      Explore Proof
                    </Link>
                  </div>
                </FadeIn>
              </div>

              <div className="flex items-end justify-start lg:justify-end">
                <FadeIn delay={1400} duration={1000}>
                  <div className="liquid-glass w-full max-w-md rounded-xl border border-white/20 px-5 py-4 sm:px-6">
                    <p className="text-base font-semibold text-white sm:text-lg md:text-xl">
                      Report. Repair. Verify.
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:gap-3">
                      <PublicMetric label="Active" value={`${activeDashboardReports.length}`} />
                      <PublicMetric label="Proofs" value={`${214 + localCityReports.length}`} />
                      <PublicMetric label="Node" value={dashboardCityName} />
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="cp-page-shell relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="cp-ambient-mesh pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="cp-grid-drift pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:34px_34px] opacity-70" />

      <header className="fixed left-0 right-0 top-0 z-50 flex min-h-16 flex-col items-stretch gap-3 border-b border-[#ff9933]/15 bg-[#030507]/85 px-3 py-3 shadow-[0_0_34px_rgba(0,219,233,0.08)] backdrop-blur-2xl sm:h-20 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-10">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <BrandLogo className="min-w-0" />
        </Link>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:gap-3">
          <Link
            href="/about"
            className="hidden rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#ffdcc2] transition hover:border-[#00dbe9]/35 hover:bg-[#00dbe9]/10 hover:text-[#7df4ff] md:inline-flex"
          >
            {t("about")}
          </Link>
          <NotificationBell />
          <ThemeToggle />
          <LanguageSelector compact />
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="inline-flex min-h-9 max-w-[150px] items-center gap-2 overflow-hidden truncate rounded-sm border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#b8f9ff] transition hover:border-[#00dbe9]/60 sm:max-w-none sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.14em]"
              >
                <UserRound size={15} />
                <span className="truncate">{currentUser.name}</span>
              </Link>
              <button
                onClick={logoutUser}
                className="hidden min-h-9 items-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#dbc2b0] transition hover:border-[#ffb4ab]/35 hover:text-[#ffcec7] sm:inline-flex"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="inline-flex min-h-9 items-center gap-2 rounded-sm border border-[#00eb88]/35 bg-[#00eb88]/10 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#8fffc1] transition hover:border-[#00eb88]/60 sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.14em]"
            >
              <LogIn size={15} />
              Login
            </Link>
          )}
          <button
            onClick={walletConnected ? disconnectMockWallet : connectMockWallet}
            className={`relative min-h-9 max-w-[136px] overflow-hidden truncate rounded-sm border px-3 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition sm:min-h-0 sm:max-w-none sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.2em] ${
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

      <section className="grid min-h-screen grid-cols-1 pb-24 pt-36 sm:pb-0 sm:pt-20 xl:grid-cols-[320px_1fr_400px]">
        <aside className="hidden border-r border-[#ff9933]/15 bg-[linear-gradient(180deg,rgba(255,153,51,0.08),rgba(0,0,0,0.5)_22%,rgba(0,219,233,0.045))] p-5 shadow-[8px_0_40px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:flex xl:flex-col">
          <nav className="cp-stagger-nav space-y-3">
            {roleNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex w-full items-center gap-4 rounded-md border px-4 py-4 text-left transition ${
                    item.active
                      ? "border-[#ffc08d]/65 bg-[linear-gradient(135deg,rgba(255,153,51,0.18),rgba(255,192,141,0.06))] text-[#ffc08d] shadow-[inset_0_0_18px_rgba(255,183,122,0.16),0_0_18px_rgba(255,153,51,0.08)]"
                      : "border-white/[0.03] text-[#a38d7c] hover:border-[#00dbe9]/25 hover:bg-[#00dbe9]/8 hover:text-[#d3fbff]"
                  }`}
                >
                  <Icon size={22} />
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.18em]">
                    {item.label}
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
            <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div className="cp-fade-up">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#00dbe9] sm:text-xs sm:tracking-[0.24em]">
                  {t("commandCenterSubtitle")}
                </p>
                <h2 className="mt-2 max-w-xl text-[2rem] font-black leading-[1.05] tracking-tight text-white sm:text-4xl">
                  {dashboardCityName} {t("commandCenter")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">
                  {waitingForAutoCity
                    ? "Browser location permission will set this dashboard to your current city automatically."
                    : cityDisplay.isDetectedForSelected
                    ? `Detected from browser GPS: ${cityDisplay.locationLabel}. Mock civic data is mapped to the nearest supported CityPramaan node.`
                    : `Selected city node: ${selectedCity.primaryArea}, ${selectedCity.state}. Allow location access to auto-set your city.`}
                </p>
              </div>

              <div className="cp-action-row grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
                <CitySelector
                  value={selectedCity.key}
                  displayCityName={dashboardCityName}
                  useDisplayName={waitingForAutoCity || cityDisplay.isDetectedForSelected}
                />
                {roleActionLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <CommandLink
                      key={item.label}
                      href={item.href}
                      label={item.label}
                      icon={<Icon size={16} />}
                      tone={item.tone ?? "glass"}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mb-4 rounded-md border border-white/10 bg-black/28 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:mb-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-md border ${currentUser ? "border-[#00eb88]/35 bg-[#00eb88]/10 text-[#8fffc1]" : "border-[#ffc08d]/35 bg-[#ff9933]/10 text-[#ffc08d]"}`}>
                    {currentUser ? <UserRound size={21} /> : <ShieldCheck size={21} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#00dbe9]">
                      {currentUser ? roleLabels[currentUser.role] : "Guest access"}
                    </p>
                    <h3 className="mt-1 text-xl font-black text-white">{currentUser ? roleDashboard.title : "Login to open your role dashboard"}</h3>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[#dbc2b0]">
                      {currentUser ? roleDashboard.detail : "Create a citizen, ward admin, or contractor profile to unlock the right workflow and profile proof hash."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {currentUser && (
                    <span className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] ${profileComplete ? "border-[#00eb88]/35 bg-[#00eb88]/10 text-[#8fffc1]" : "border-[#ffc08d]/35 bg-[#ff9933]/10 text-[#ffc08d]"}`}>
                      <CheckCircle2 size={15} />
                      {profileComplete ? "Profile complete" : "Complete profile"}
                    </span>
                  )}
                  <Link
                    href={currentUser ? roleDashboard.href : "/auth"}
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-4 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#4c2700] transition hover:brightness-110"
                  >
                    {currentUser ? roleDashboard.action : "Login / Signup"}
                  </Link>
                  {currentUser && !profileComplete && (
                    <Link
                      href="/profile"
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#b8f9ff] transition hover:border-[#00dbe9]/60"
                    >
                      Complete profile
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="cp-stagger-grid mb-4 grid grid-cols-2 gap-2 sm:mb-5 sm:gap-3 lg:grid-cols-4">
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

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 sm:mb-5 sm:flex-wrap sm:overflow-visible">
              <FilterChip label={t("openIssues")} color="bg-[#ffb4ab]" />
              <FilterChip label={t("pendingProof")} color="bg-[#00dbe9]" />
              <FilterChip label={t("repairSubmitted")} color="bg-[#ff9933]" />
              <FilterChip label={t("underWarranty")} color="bg-[#3b82f6]" />
              <FilterChip label={t("repeatFailure")} color="bg-[#d946ef]" active />
            </div>

            <div className="cp-command-frame cp-map-enter relative">
              <AnimatedCityMap
                reports={activeDashboardReports}
                city={selectedCity}
                displayCityName={cityDisplay.cityName}
                displayAreaName={cityDisplay.locationLabel}
                center={
                  cityDisplay.isDetectedForSelected && cityDisplay.detectedLocation
                    ? {
                        lat: cityDisplay.detectedLocation.latitude,
                        lng: cityDisplay.detectedLocation.longitude,
                      }
                    : undefined
                }
              />
            </div>

            <div className="cp-live-strip mt-5 overflow-hidden rounded-md border border-white/10 bg-black/30 backdrop-blur-xl">
              <div className="cp-live-track flex min-w-max items-center gap-8 px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] text-[#dbc2b0]">
                <span className="text-[#00eb88]">{t("liveCivicStream")}</span>
                <span>{dashboardCityName} {t("nodeSynced")}</span>
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

        <aside className="cp-stagger-col max-h-none overflow-y-auto bg-[#181615]/95 p-4 backdrop-blur-xl sm:p-5 xl:max-h-screen">
          <section className="cp-incident-card relative overflow-hidden rounded-2xl border border-[#ffb4ab]/30 bg-[radial-gradient(circle_at_14%_10%,rgba(255,180,171,0.18),transparent_28%),linear-gradient(145deg,rgba(255,153,51,0.12),rgba(217,70,239,0.08),rgba(0,0,0,0.3))] p-5 shadow-[0_0_36px_rgba(255,77,109,0.12)]">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-[#ffb4ab]/10 blur-sm" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${
                    isNewLocalReport
                      ? "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]"
                      : "border-[#ffb4ab]/35 bg-[#ffb4ab]/10 text-[#ffb4ab]"
                  }`}
                >
                  {isNewLocalReport ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  {isPowerIncident ? "Utility outage" : isNewLocalReport ? t("newProof") : t("highPriority")}
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#00eb88]/25 bg-[#00eb88]/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#5bffa1]">
                  <span className="cp-live-pulse h-2 w-2 rounded-full bg-[#00eb88] shadow-[0_0_12px_rgba(0,235,136,0.8)]" />
                  Live
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-black leading-tight tracking-tight text-white">
                {isPowerIncident
                  ? "Transformer outage / power failure"
                  : isNewLocalReport
                    ? t("newProofCreated")
                    : t("repeatFailureDetected")}
              </h3>
              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[#dbc2b0]">
                <MapPin size={16} className="mt-1 shrink-0 text-[#ffc08d]" />
                {selected.location}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <IncidentChip label={selected.issueCategory ?? "ROAD_DAMAGE"} tone="amber" />
                <IncidentChip label={selected.status.replaceAll("_", " ")} tone="rose" />
                <IncidentChip label={`Ward ${selected.ward}`} tone="cyan" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <InfoCard label={t("severity")} value={selected.severity} accent="text-[#ffb4ab]" />
                <InfoCard label={t("aiConfidence")} value={`${selected.confidence}%`} accent="text-[#00eb88]" />
                <InfoCard
                  label="AI priority"
                  value={`${selected.aiPriorityScore ?? selected.confidence}/100`}
                  accent="text-[#d3fbff]"
                />
                <InfoCard label="SLA" value={`${selected.slaHours ?? 24} hrs`} accent="text-[#ffc08d]" />
                <InfoCard
                  label={isPowerIncident ? "Restoration ETA" : t("warranty")}
                  value={
                    isPowerIncident
                      ? selected.utilityRestoration?.estimatedRestoration ?? `${selected.slaHours ?? 6} hrs`
                      : selected.warrantyDaysLeft === null
                        ? t("notActive")
                        : `${selected.warrantyDaysLeft} days`
                  }
                  accent="text-[#7df4ff]"
                />
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#dbc2b0]/70">
                    AI escalation score
                  </span>
                  <span className="font-mono text-xs font-bold text-[#ffb4ab]">
                    {selected.aiPriorityScore ?? selected.confidence}/100
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="cp-bar-fill h-full rounded-full bg-[linear-gradient(90deg,#ff9933,#ff4d6d,#d946ef)] shadow-[0_0_18px_rgba(255,77,109,0.45)]"
                    style={{ width: `${selected.aiPriorityScore ?? selected.confidence}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-[#dbc2b0]/75">
                  {isNewLocalReport
                    ? isPowerIncident
                      ? "New outage report is waiting for electricity crew update and restoration proof."
                      : "New report is waiting for contractor proof and owner-side tracking."
                    : isPowerIncident
                      ? selected.utilityRestoration?.citizenUpdate ?? "Utility casualty is being tracked with public restoration progress."
                      : "Warranty memory matched this location with an earlier repair record. Re-audit is recommended."}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <Link
                  href={`/warranty?issue=${selected.id}#issue-progress`}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-[#ffc08d]/35 bg-[#ffc08d]/10 px-4 py-3 text-sm font-semibold text-[#ffdcc2] transition hover:bg-[#ffc08d]/15"
                >
                  <span className="flex items-center gap-2">
                    <Clock3 size={16} />
                    Track progress
                  </span>
                  <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                </Link>
                <Link
                  href={`/proof/${selected.id}`}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-[#00dbe9]/30 bg-[#00dbe9]/10 px-4 py-3 text-sm font-semibold text-[#7df4ff] transition hover:bg-[#00dbe9]/15"
                >
                  <span className="flex items-center gap-2">
                    <FileImage size={16} />
                    Public proof
                  </span>
                  <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </section>

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
                ? isPowerIncident
                  ? "AI classified this as a critical transformer / feeder outage requiring public restoration ETA."
                  : "AI detected critical road damage and matched it to a previous warranty zone."
                : isPowerIncident
                  ? "Utility restoration tracker keeps fault acknowledgement, crew dispatch, and power restored status visible."
                  : "Visual signature mismatch detected. Current damage matches pre-repair state with high confidence."}
            </p>
          </div>

          <div className="mt-6">
            <p className="mb-5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#dbc2b0]">
              {t("proofTimeline")}
            </p>
            <div className="cp-timeline-stagger border-l border-white/10 pl-5">
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

      {showSafetyIntro && <SafetyRiskIntro onClose={closeSafetyIntro} />}

      <nav className="cp-mobile-dock fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 overflow-hidden rounded-2xl border border-[#ff9933]/20 bg-[#030507]/90 shadow-[0_0_34px_rgba(0,219,233,0.12)] backdrop-blur-2xl sm:hidden">
        <MobileNavLink href="/" label="Home" icon={<Gauge size={17} />} active />
        <MobileNavLink href="/report" label="Report" icon={<AlertTriangle size={17} />} />
        <MobileNavLink href="/pending" label="Review" icon={<ScanSearch size={17} />} />
        <MobileNavLink href="/warranty" label="Ledger" icon={<ShieldCheck size={17} />} />
        <MobileNavLink href={`/proof/${selected.id}`} label="Proof" icon={<Blocks size={17} />} />
      </nav>
    </main>
  );
}

function FadeIn({
  children,
  delay = 0,
  duration = 700,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

function AnimatedHeading({ text, className = "" }: { text: string; className?: string }) {
  const [visible, setVisible] = useState(false);
  const charDelay = 30;
  const initialDelay = 200;
  const lines = text.split("\n");

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), initialDelay);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <h1 className={className} style={{ letterSpacing: "0.02em" }}>
      {lines.map((line, lineIndex) => {
        const previousLength = lines
          .slice(0, lineIndex)
          .reduce((total, currentLine) => total + currentLine.length + 1, 0);
        let runningLength = previousLength;

        return (
          <span key={`${line}-${lineIndex}`} className="block">
            {line.split(" ").map((word, wordIndex) => {
              const wordStart = runningLength;
              runningLength += word.length + 1;

              return (
                <span
                  key={`${lineIndex}-${wordIndex}-${word}`}
                  className="mr-[0.2em] inline-block whitespace-nowrap last:mr-0"
                >
                  {Array.from(word).map((char, charIndex) => (
                    <span
                      key={`${lineIndex}-${wordIndex}-${charIndex}-${char}`}
                      className="inline-block transition-all ease-out"
                      style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? "translateX(0)" : "translateX(-18px)",
                        transitionDelay: `${(wordStart + charIndex) * charDelay}ms`,
                        transitionDuration: "500ms",
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              );
            })}
          </span>
        );
      })}
    </h1>
  );
}

function SafetyRiskIntro({ onClose }: { onClose: () => void }) {
  return (
    <div className="cp-safety-intro fixed inset-0 z-[1000] flex items-center justify-center bg-[#020304]/82 px-4 py-6 backdrop-blur-xl">
      <section className="cp-safety-card relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#ffc08d]/30 bg-[linear-gradient(145deg,rgba(10,8,6,0.96),rgba(0,22,24,0.94))] p-5 shadow-[0_0_60px_rgba(255,153,51,0.16)] sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#dbc2b0] hover:border-[#00dbe9]/45 hover:text-[#7df4ff]"
        >
          Skip
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="cp-safety-scene relative min-h-[260px] overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_18%,rgba(255,153,51,0.18),transparent_32%),linear-gradient(180deg,#071013,#020304)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,219,233,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div className="cp-safety-road absolute inset-x-0 bottom-0 h-28" />
            <div className="cp-safety-pothole absolute bottom-12 left-1/2 h-14 w-36 -translate-x-1/2 rounded-[50%] bg-black shadow-[inset_0_14px_28px_rgba(0,0,0,0.95),0_0_28px_rgba(255,180,171,0.2)]" />
            <div className="cp-safety-impact absolute bottom-[92px] left-1/2 h-14 w-14 -translate-x-1/2 rounded-full border border-[#ffb4ab]/45" />
            <div className="cp-safety-car absolute bottom-24 left-8 h-16 w-28 rounded-[18px_26px_12px_12px] bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] shadow-[0_0_24px_rgba(255,153,51,0.4)]">
              <div className="absolute left-5 top-3 h-6 w-10 rounded-md bg-[#071013]/75" />
              <div className="absolute right-4 top-4 h-5 w-7 rounded-md bg-[#071013]/75" />
              <div className="absolute -bottom-3 left-5 h-6 w-6 rounded-full border-[5px] border-[#050505] bg-[#00dbe9]" />
              <div className="absolute -bottom-3 right-5 h-6 w-6 rounded-full border-[5px] border-[#050505] bg-[#00dbe9]" />
              <div className="cp-safety-crack absolute -right-2 top-6 h-7 w-7 border-r-2 border-t-2 border-[#ffb4ab]" />
            </div>
            <div className="absolute left-5 top-5 rounded-full border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#ffb4ab]">
              High Risk Zone
            </div>
          </div>

          <div className="relative z-10">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#00dbe9] sm:text-xs">
              Why CityPramaan Matters
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
              A pothole can become a serious accident in seconds.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#dbc2b0] sm:text-base">
              Road damage creates risk for riders, cars, pedestrians, and emergency vehicles. Report it early so the issue gets tracked with location, proof, repair status, and public accountability.
            </p>
            <div className="cp-safety-message mt-5 rounded-xl border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 p-4">
              <p className="font-semibold text-[#ffdcc2]">
                Spot a dangerous pothole or damaged road? Report it as soon as possible.
              </p>
            </div>
            <div className="cp-safety-actions mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/report"
                onClick={onClose}
                className="cp-command-link inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#4c2700] shadow-[0_0_28px_rgba(255,153,51,0.26)]"
              >
                Report Issue
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="min-h-12 rounded-md border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#7df4ff] hover:bg-[#00dbe9]/15"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
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

function PublicMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-24 rounded-md border border-white/10 bg-black/28 p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a38d7c]">{label}</p>
      <p className="mt-2 break-words text-2xl font-black text-white">{value}</p>
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
    <div className={`cp-pulse-stat min-h-[142px] rounded-md border p-3 ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="cp-stat-icon grid h-8 w-8 place-items-center rounded-sm border border-current/25 bg-black/20">
          {icon}
        </span>
        <span className="cp-pulse-dot h-2 w-2 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
      </div>
      <p className="mt-3 font-mono text-[9px] font-bold uppercase tracking-[0.14em] opacity-80 sm:tracking-[0.16em]">{label}</p>
      <p className="mt-1 text-[1.45rem] font-black leading-tight tracking-tight text-white sm:text-xl">{value}</p>
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
      className={`cp-trust-signal cp-hover-lift flex items-center gap-3 rounded-md border bg-white/[0.035] px-4 py-3 ${tones[tone]}`}
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
      className={`cp-command-link flex min-h-14 items-center justify-center gap-2 rounded-md border px-2 py-2 text-center text-[12px] font-semibold leading-tight transition sm:min-h-0 sm:flex-none sm:px-5 sm:py-3 sm:text-sm ${tones[tone]}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 break-words">{label}</span>
    </Link>
  );
}

function IncidentChip({ label, tone }: { label: string; tone: "amber" | "rose" | "cyan" }) {
  const tones = {
    amber: "border-[#ffc08d]/30 bg-[#ffc08d]/10 text-[#ffc08d]",
    rose: "border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab]",
    cyan: "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]",
  };

  return (
    <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${tones[tone]}`}>
      {label}
    </span>
  );
}

function CitySelector({
  value,
  displayCityName,
  useDisplayName,
}: {
  value: CityKey;
  displayCityName: string;
  useDisplayName: boolean;
}) {
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
            {useDisplayName && city.key === value ? displayCityName : city.name}
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
          ? "cp-filter-active border-[#ffc08d]/50 bg-[#ffc08d]/10 text-[#ffc08d] shadow-[0_0_18px_rgba(255,192,141,0.1)]"
          : "border-white/15 bg-white/[0.04] text-[#e5e2e3] hover:border-white/30"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </button>
  );
}

function MobileNavLink({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-16 flex-col items-center justify-center gap-1 border-r border-white/5 px-1 text-center font-mono text-[10px] font-bold uppercase tracking-[0.08em] last:border-r-0 ${
        active
          ? "bg-[#ffc08d]/12 text-[#ffc08d]"
          : "text-[#dbc2b0]/72 active:bg-white/[0.05]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
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
