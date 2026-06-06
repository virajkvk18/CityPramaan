"use client";

import Image from "next/image";
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
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { LocationDetectButton } from "@/src/components/layout/LocationDetectButton";
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
const CITY_HERO_VIDEO_URL = "/videos/indian-cities-loop.mp4";
const CITY_HERO_MOBILE_VIDEO_URL = "/videos/indian-cities-loop-mobile.mp4";

const CIVIC_EVIDENCE_PATH = "/images/civic-evidence";

const civicProblemCards = [
  {
    icon: AlertTriangle,
    title: "Road repairs without proof",
    detail: "Potholes, road caves, and open cuts are often marked resolved before citizens see real repair evidence.",
    value: "9,438",
    label: "lives lost in pothole-linked incidents over five years",
    tone: "rose",
  },
  {
    icon: ShieldAlert,
    title: "Sewage and drainage risk",
    detail: "Waterlogging, untreated sewage, and weak sewer networks damage health, roads, and public trust.",
    value: "50%",
    label: "sewage still flowing untreated in reported coverage",
    tone: "cyan",
  },
  {
    icon: Clock3,
    title: "No clear restoration timeline",
    detail: "Streetlights, transformer failures, and dark roads leave people calling helplines without visible progress.",
    value: "24x7",
    label: "need for public status and SLA tracking",
    tone: "amber",
  },
  {
    icon: RotateCcw,
    title: "Repeat failures stay invisible",
    detail: "A repaired issue can fail again, but most systems do not lock warranty memory or contractor history.",
    value: "0",
    label: "public warranty trail in normal complaint apps",
    tone: "emerald",
  },
] as const;

const civicEvidenceArticles = [
  {
    title: "Potholes claimed 9,438 lives",
    tag: "Road safety",
    src: `${CIVIC_EVIDENCE_PATH}/potholes-lives-lost.jpg`,
    caption: "Road quality is not a small inconvenience; it directly affects public safety.",
  },
  {
    title: "Contractors fined for pothole damage",
    tag: "Accountability",
    src: `${CIVIC_EVIDENCE_PATH}/contractors-fined-potholes.jpg`,
    caption: "Poor repair quality needs contractor-level visibility, not only complaint IDs.",
  },
  {
    title: "Sewage still flows untreated",
    tag: "Public health",
    src: `${CIVIC_EVIDENCE_PATH}/sewage-water-bodies.jpg`,
    caption: "Infrastructure issues become health issues when evidence and action are not tracked.",
  },
  {
    title: "Poor sewer network hurts growth",
    tag: "Basic infrastructure",
    src: `${CIVIC_EVIDENCE_PATH}/poor-sewer-network.jpg`,
    caption: "Growing cities need proof-led civic maintenance, not opaque escalation chains.",
  },
  {
    title: "Defunct lights keep roads dark",
    tag: "Night safety",
    src: `${CIVIC_EVIDENCE_PATH}/streetlights-dark.jpg`,
    caption: "Dark zones need public progress tracking and repair confirmation.",
  },
  {
    title: "Dying lakes and wetland notices",
    tag: "Environment",
    src: `${CIVIC_EVIDENCE_PATH}/dying-lakes.jpg`,
    caption: "Civic proof can extend beyond roads to water bodies and public assets.",
  },
  {
    title: "Two road deaths per hour",
    tag: "Impact",
    src: `${CIVIC_EVIDENCE_PATH}/road-deaths-per-hour.jpg`,
    caption: "The problem is large enough to need technology, transparency, and accountability.",
  },
  {
    title: "Bus tragedy after gorge collapse",
    tag: "Disaster risk",
    src: `${CIVIC_EVIDENCE_PATH}/bus-gorge-accident.jpg`,
    caption: "Critical public infrastructure failures need early reporting and visible resolution.",
  },
  {
    title: "Another pothole death",
    tag: "Citizen risk",
    src: `${CIVIC_EVIDENCE_PATH}/pothole-another-life.jpg`,
    caption: "Every unresolved hazard has a human cost.",
  },
] as const;

const impactBars = [
  { label: "Road potholes", value: 32, color: "bg-[#ff4d6d]" },
  { label: "Water leakage", value: 22, color: "bg-[#00dbe9]" },
  { label: "Drainage / sewage", value: 17, color: "bg-[#00eb88]" },
  { label: "Streetlights", value: 13, color: "bg-[#a855f7]" },
  { label: "Garbage and waste", value: 9, color: "bg-[#ff9933]" },
] as const;

const workflowSteps = [
  "Citizen report",
  "AI analysis",
  "Ward admin review",
  "Contractor assigned",
  "Repair proof uploaded",
  "Admin approval",
  "Citizen confirmation",
  "Public proof timeline",
  "Warranty activated",
] as const;

const publicProofTimeline = [
  "Issue created with GPS and photo proof",
  "AI analysis generated",
  "Contractor assigned",
  "Repair proof uploaded",
  "Admin approved",
  "Citizen confirmed",
  "Report closed",
  "Warranty active",
] as const;

const civicSignalChips = [
  { label: "AI Verification", tone: "cyan" },
  { label: "Fabric-ready Proof", tone: "violet" },
  { label: "Warranty Memory", tone: "emerald" },
  { label: "Public Timeline", tone: "amber" },
  { label: "Citizen Feedback", tone: "rose" },
] as const;

const landingImpactStats = [
  { label: "Active demo reports", value: "dynamic", detail: "Live civic stream for the selected city", tone: "amber" },
  { label: "Public proof records", value: "dynamic", detail: "Indexed repair events and hashes", tone: "cyan" },
  { label: "Trust gap", value: "High", detail: "Resolved labels without evidence reduce public trust", tone: "rose" },
  { label: "Warranty memory", value: "On", detail: "Repeat failures can be traced after repair", tone: "emerald" },
] as const;

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
        title: "Ward admin control room",
        detail: "Review pending repair proof, activate warranties, monitor SLA risk, and keep public status transparent for your ward.",
        action: "Review pending proof",
        href: "/ward-admin",
      };
    case "CONTRACTOR":
      return {
        title: "Contractor repair workspace",
        detail: "See assigned issues, compare before/after evidence, upload repair proof, and send it for issuer approval.",
        action: "Open repair queue",
        href: "/contractor",
      };
    case "USER":
    default:
      return {
        title: "Citizen issue desk",
        detail: "Report civic issues, track your issue progress, review proof history, and verify warranties after repair.",
        action: "Open citizen dashboard",
        href: "/citizen",
      };
  }
}

function getRoleNavItems(role: AuthRole, proofHref: string): RoleNavItem[] {
  const profile = { label: "Profile proof", icon: UserRound, href: "/profile" };

  if (role === "CONTRACTOR") {
    return [
      { label: "Workspace", icon: Gauge, href: "/contractor", active: true },
      { label: "Submit proof", icon: BadgeCheck, href: "/contractor", tone: "gold" },
      { label: "Public proof", icon: Blocks, href: proofHref, tone: "glass" },
      profile,
    ];
  }

  if (role === "WARD_ADMIN") {
    return [
      { label: "Workspace", icon: Gauge, href: "/ward-admin", active: true },
      { label: "Pending approvals", icon: ScanSearch, href: "/ward-admin", tone: "glass" },
      { label: "Warranty scanner", icon: ShieldCheck, href: "/warranty", tone: "gold" },
      { label: "Public reports", icon: Blocks, href: proofHref, tone: "cyan" },
      profile,
    ];
  }

  return [
    { label: "Workspace", icon: Gauge, href: "/citizen", active: true },
    { label: "Report issue", icon: AlertTriangle, href: "/report", tone: "gold" },
    { label: "My progress", icon: Clock3, href: "/warranty", tone: "cyan" },
    { label: "Public proof", icon: Blocks, href: proofHref, tone: "glass" },
    profile,
  ];
}

function getRoleWorkspaceTitle(role?: AuthRole) {
  switch (role) {
    case "WARD_ADMIN":
      return "Ward Admin Console";
    case "CONTRACTOR":
      return "Contractor Console";
    case "USER":
      return "Citizen Console";
    default:
      return "Command Center";
  }
}

function getRoleWorkspaceSubtitle(role?: AuthRole) {
  switch (role) {
    case "WARD_ADMIN":
      return "Approval queue | warranty risk | ward SLA";
    case "CONTRACTOR":
      return "Assigned repairs | AI audit | proof upload";
    case "USER":
      return "Report issue | track progress | verify proof";
    default:
      return "Public civic proof network";
  }
}

function getRoleAuditMetrics(role: AuthRole | undefined, activeCount: number, localCount: number) {
  switch (role) {
    case "WARD_ADMIN":
      return [
        { label: "Pending approvals", value: `${2 + localCount}`, tone: "text-[#ffc08d]" },
        { label: "SLA risks", value: "11", tone: "text-[#ffb4ab]" },
        { label: "Warranty cases", value: "31", tone: "text-[#00eb88]" },
        { label: "Proof records", value: `${214 + localCount}`, tone: "text-[#00dbe9]" },
      ];
    case "CONTRACTOR":
      return [
        { label: "Repair queue", value: `${5 + activeCount}`, tone: "text-[#ffc08d]" },
        { label: "Proof submitted", value: "18", tone: "text-[#00eb88]" },
        { label: "AI audits", value: "42", tone: "text-[#00dbe9]" },
        { label: "Rating", value: "4.8", tone: "text-[#ffc08d]" },
      ];
    case "USER":
    default:
      return [
        { label: "My active reports", value: `${activeCount}`, tone: "text-[#ffc08d]" },
        { label: "Awaiting proof", value: `${Math.max(1, activeCount)}`, tone: "text-[#00dbe9]" },
        { label: "Warranty watch", value: "Ready", tone: "text-[#00eb88]" },
        { label: "Public proofs", value: `${214 + localCount}`, tone: "text-[#00dbe9]" },
      ];
  }
}

function getRoleIncidentActions(role: AuthRole | undefined, selectedId: string): RoleNavItem[] {
  switch (role) {
    case "WARD_ADMIN":
      return [
        { label: "Review proof", icon: ScanSearch, href: "/ward-admin", tone: "gold" },
        { label: "Public reports", icon: Blocks, href: "/public-proof", tone: "cyan" },
      ];
    case "CONTRACTOR":
      return [
        { label: "Open repair queue", icon: Building2, href: "/contractor", tone: "cyan" },
        { label: "Upload proof", icon: BadgeCheck, href: "/contractor", tone: "gold" },
      ];
    case "USER":
      return [
        { label: "Track progress", icon: Clock3, href: `/warranty?issue=${selectedId}#issue-progress`, tone: "gold" },
        { label: "Public proof", icon: FileImage, href: `/proof/${selectedId}`, tone: "cyan" },
      ];
    default:
      return [
        { label: "Public reports", icon: Blocks, href: "/public-proof", tone: "cyan" },
        { label: "Login / signup", icon: LogIn, href: "/auth", tone: "gold" },
      ];
  }
}

function getRoleMobileNavItems(role: AuthRole | undefined): RoleNavItem[] {
  switch (role) {
    case "WARD_ADMIN":
      return [
        { label: "Home", icon: Gauge, href: "/ward-admin", active: true },
        { label: "Review", icon: ScanSearch, href: "/ward-admin" },
        { label: "Warranty", icon: ShieldCheck, href: "/warranty" },
        { label: "Reports", icon: Blocks, href: "/public-proof" },
        { label: "Profile", icon: UserRound, href: "/profile" },
      ];
    case "CONTRACTOR":
      return [
        { label: "Home", icon: Gauge, href: "/contractor", active: true },
        { label: "Queue", icon: Building2, href: "/contractor" },
        { label: "Proof", icon: BadgeCheck, href: "/contractor" },
        { label: "Public", icon: Blocks, href: "/public-proof" },
        { label: "Profile", icon: UserRound, href: "/profile" },
      ];
    case "USER":
      return [
        { label: "Home", icon: Gauge, href: "/citizen", active: true },
        { label: "Report", icon: AlertTriangle, href: "/report" },
        { label: "Track", icon: Clock3, href: "/warranty" },
        { label: "Proof", icon: Blocks, href: "/public-proof" },
        { label: "Profile", icon: UserRound, href: "/profile" },
      ];
    default:
      return [
        { label: "Home", icon: Gauge, href: "/", active: true },
        { label: "Reports", icon: Blocks, href: "/public-proof" },
        { label: "Story", icon: FileImage, href: "/story" },
        { label: "About", icon: ShieldCheck, href: "/about" },
        { label: "Login", icon: LogIn, href: "/auth" },
      ];
  }
}

export default function Home() {
  const { t } = useLanguage();
  const [showSafetyIntro, setShowSafetyIntro] = useState(false);
  const [backendReports, setBackendReports] = useState<CivicReport[]>([]);
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
  const authSnapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => "");
  const selectedCity = getCityByKey(citySnapshot);
  const cityDisplay = useDetectedLocationDisplay(selectedCity);
  const waitingForAutoCity = !cityDisplay.detectedLocation && citySourceSnapshot !== "manual";
  const dashboardCityName = waitingForAutoCity ? "Current City" : cityDisplay.cityName;
  const landingHeroAreaName = "MP Nagar, Bhopal";
  const currentUser = useMemo(() => getCurrentUser(authSnapshot), [authSnapshot]);
  const profileComplete = currentUser ? isProfileComplete(currentUser) : false;
  const roleDashboard = getRoleDashboard(currentUser?.role);
  const localReports = useMemo(
    () => JSON.parse(localReportsSnapshot) as CivicReport[],
    [localReportsSnapshot]
  );
  useEffect(() => {
    let active = true;

    async function loadBackendReports() {
      try {
        const response = await fetch(`/api/reports?cityKey=${encodeURIComponent(selectedCity.key)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          setBackendReports([]);
          return;
        }

        const result = (await response.json()) as { reports?: CivicReport[] };

        if (active) {
          setBackendReports(Array.isArray(result.reports) ? result.reports : []);
        }
      } catch (error) {
        console.warn("CityPramaan backend reports unavailable:", error);

        if (active) {
          setBackendReports([]);
        }
      }
    }

    void loadBackendReports();

    return () => {
      active = false;
    };
  }, [selectedCity.key]);

  const cityReports = useMemo(() => getReportsForCity(citySnapshot), [citySnapshot]);
  const savedReports = useMemo(() => {
    const reportsById = new Map<string, CivicReport>();

    for (const report of backendReports) {
      reportsById.set(report.id, report);
    }

    for (const report of localReports) {
      reportsById.set(report.id, report);
    }

    return Array.from(reportsById.values());
  }, [backendReports, localReports]);
  const localCityReports = useMemo(
    () => savedReports.filter((report) => !report.cityKey || report.cityKey === selectedCity.key),
    [savedReports, selectedCity.key]
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
  const roleNavItems = currentUser ? getRoleNavItems(currentUser.role, "/public-proof") : [];
  const roleActionLinks = roleNavItems.filter((item) => !item.active).slice(0, 5);
  const roleAuditMetrics = getRoleAuditMetrics(
    currentUser?.role,
    activeLocalReports.length,
    localCityReports.length
  );
  const roleIncidentActions = getRoleIncidentActions(currentUser?.role, selected.id);
  const mobileNavItems = getRoleMobileNavItems(currentUser?.role);
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
      <main className="cp-page-shell cp-official-landing relative min-h-screen overflow-x-hidden bg-[#f6f8fb] text-[#1a1c1c]">
        <section className="cp-official-hero relative overflow-hidden border-b border-[#c6c5d5] bg-[linear-gradient(135deg,#ffffff_0%,#f7f9fc_54%,#eef3ff_100%)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(254,152,50,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(29,78,216,0.12),transparent_30%),radial-gradient(circle_at_20px_20px,rgba(0,0,60,0.045)_1px,transparent_1.5px)] bg-[size:auto,auto,40px_40px]" />
          <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-4 pb-7 pt-4 sm:px-6 lg:px-10">
            <header className="cp-official-nav flex flex-col gap-3 rounded-2xl border border-[#d9e2f2] bg-white/96 px-4 py-4 shadow-[0_14px_42px_rgba(15,23,42,0.08)] sm:px-6">
              <div className="flex w-full items-center justify-between gap-2">
                <Link href="/" className="flex min-w-0 flex-1 items-center gap-3">
                  <BrandLogo className="min-w-0" size="sm" />
                </Link>

                <nav className="hidden items-center gap-5 text-[13px] font-extrabold text-[#00003c] lg:flex xl:gap-8">
                  <Link href="/" className="transition hover:text-[#1d4ed8]">
                    Dashboard
                  </Link>
                  <Link href="/auth" className="transition hover:text-[#1d4ed8]">
                    Report an Issue
                  </Link>
                  <Link href="/public-proof" className="transition hover:text-[#1d4ed8]">
                    Track Complaint
                  </Link>
                  <Link href="/auth" className="transition hover:text-[#1d4ed8]">
                    Contractors
                  </Link>
                  <Link href="/story" className="transition hover:text-[#1d4ed8]">
                    Resources
                  </Link>
                  <Link href="/about" className="transition hover:text-[#1d4ed8]">
                    About
                  </Link>
                </nav>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href="/auth"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#00003c] px-5 py-3 text-sm font-extrabold !text-white shadow-[0_12px_24px_rgba(0,0,60,0.18)] transition hover:bg-[#111b63]"
                  >
                    <LogIn size={14} />
                    Sign Up
                  </Link>
                </div>
              </div>

              <nav className="cp-mobile-landing-nav grid w-full grid-cols-2 gap-2 pt-1 min-[520px]:grid-cols-5 lg:hidden">
                <Link href="/" className="landing-nav-chip">
                  Dashboard
                </Link>
                <Link href="/auth" className="landing-nav-chip">
                  Report
                </Link>
                <Link href="/auth" className="landing-nav-chip">
                  Contractors
                </Link>
                <Link href="/public-proof" className="landing-nav-chip">
                  Track
                </Link>
                <Link href="/about" className="landing-nav-chip">
                  About
                </Link>
              </nav>
            </header>

            <section className="grid items-center gap-10 py-7 sm:py-9 lg:grid-cols-[minmax(0,470px)_minmax(0,1fr)] lg:gap-20 lg:py-8 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
              <div className="max-w-[520px]">
                <div>
                  <p className="mb-4 inline-flex rounded-full border border-[#1d4ed8]/25 bg-[#edf4ff] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#00003c]">
                    CityPramaan
                  </p>
                  <AnimatedHeading
                    text={`Proof of\nrepair\nfor\naccountable\ncities.`}
                    className="cp-landing-title mb-5 max-w-[520px] text-[3rem] font-black leading-[0.92] text-[#00003c] min-[390px]:text-[3.45rem] sm:text-[4.3rem] md:text-[4.75rem] lg:text-[4.35rem] xl:text-[4.85rem]"
                  />
                  <FadeIn delay={800} duration={1000}>
                    <p className="cp-landing-subtitle mb-6 max-w-xl rounded-xl border border-[#c6c5d5] bg-white px-5 py-4 text-base font-semibold leading-7 text-[#263548] shadow-[0_12px_30px_rgba(0,0,60,0.08)]">
                      A simple civic service portal to report public infrastructure issues, track
                      complaint progress, verify contractor repairs, and keep public proof open for every city.
                    </p>
                  </FadeIn>
                  <FadeIn delay={1200} duration={1000}>
                    <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                      <Link
                        href="/auth"
                        className="cp-landing-primary-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#00003c] px-5 py-3 text-center text-sm font-extrabold !text-white shadow-[0_10px_24px_rgba(0,0,60,0.18)] transition hover:bg-[#111b63]"
                      >
                        <UserRound size={16} />
                        Report an Issue
                      </Link>
                      <Link
                        href="/public-proof"
                        className="cp-landing-secondary-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#c6c5d5] bg-white px-5 py-3 text-center text-sm font-extrabold text-[#00003c] transition hover:border-[#1d4ed8] hover:bg-[#edf4ff]"
                      >
                        <ScanSearch size={16} />
                        Track Complaint
                      </Link>
                      <Link
                        href="/auth"
                        className="cp-landing-secondary-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#c6c5d5] bg-white px-5 py-3 text-center text-sm font-extrabold text-[#00003c] transition hover:border-[#1d4ed8] hover:bg-[#edf4ff]"
                      >
                        <ShieldCheck size={16} />
                        Sign Up
                      </Link>
                      <Link
                        href="/auth"
                        className="cp-landing-secondary-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#c6c5d5] bg-white px-5 py-3 text-center text-sm font-extrabold text-[#00003c] transition hover:border-[#1d4ed8] hover:bg-[#edf4ff] sm:col-span-1"
                      >
                        <Building2 size={16} />
                        Contractor Panel
                      </Link>
                    </div>
                  </FadeIn>

                  <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-3">
                    <HeroTrustChip tone="blue" label="Open Public Proof" />
                    <HeroTrustChip tone="green" label="Contractor Visible" />
                    <HeroTrustChip tone="saffron" label="Warranty Memory" />
                  </div>
                </div>
              </div>

              <FadeIn delay={1100} duration={1000}>
                <div className="cp-hero-visual-panel relative overflow-hidden rounded-3xl border border-[#d8deeb] bg-white p-3 shadow-[0_28px_80px_rgba(15,23,42,0.16)]">
                  <div className="relative min-h-[370px] overflow-hidden rounded-2xl bg-[#00003c] sm:min-h-[405px] lg:min-h-[370px] xl:min-h-[405px]">
                    <video
                      className="absolute inset-0 h-full w-full object-cover opacity-70"
                      autoPlay
                      loop
                      muted
                      preload="auto"
                      playsInline
                      aria-hidden="true"
                    >
                      <source src={CITY_HERO_MOBILE_VIDEO_URL} type="video/mp4" media="(max-width: 639px)" />
                      <source src={CITY_HERO_VIDEO_URL} type="video/mp4" media="(min-width: 640px)" />
                    </video>
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.92),rgba(255,255,255,0.76)_34%,rgba(255,255,255,0.08)_72%),linear-gradient(180deg,rgba(0,0,60,0),rgba(0,0,60,0.22))]" />
                    <div className="absolute left-4 right-4 top-4 rounded-xl border border-[#d8deeb] bg-white/90 p-4 shadow-[0_16px_36px_rgba(0,0,0,0.12)] backdrop-blur sm:left-6 sm:right-auto sm:w-[335px]">
                      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#344154]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#2edc76]" />
                        Live civic node
                      </p>
                      <h2 className="mt-2 text-3xl font-black text-[#00003c]">{landingHeroAreaName}</h2>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#344154]">
                        Reports stay visible until repair proof, issuer approval, and warranty status are recorded.
                      </p>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-[#d8deeb] bg-white/96 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.16)] backdrop-blur sm:bottom-6 sm:left-6 sm:right-6">
                      <p className="text-xl font-black text-[#00003c]">Report. Repair. Verify.</p>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <PublicMetric label="Active" value={`${activeDashboardReports.length}`} />
                        <PublicMetric label="Proofs" value={`${214 + localCityReports.length}`} />
                        <PublicMetric label="Node" value={landingHeroAreaName} wide />
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </section>

            <section className="mb-5 grid gap-4 rounded-2xl border border-[#d8deeb] bg-[#edf6ff]/78 p-4 shadow-[0_16px_48px_rgba(15,23,42,0.08)] sm:grid-cols-2 lg:grid-cols-4">
              <LandingFeature icon={<FileImage size={22} />} title="Report Issues" detail="Submit infrastructure issues with photos, location, and details in minutes." />
              <LandingFeature icon={<Clock3 size={22} />} title="Track Progress" detail="Follow complaint status from submission to verification in real time." />
              <LandingFeature icon={<BadgeCheck size={22} />} title="Verify Repairs" detail="Contractors upload proof. Public can verify and approvals are recorded." />
              <LandingFeature icon={<ShieldCheck size={22} />} title="Warranty Memory" detail="Warranty periods are tracked and visible for long-term accountability." />
            </section>
          </div>
        </section>

        <LandingEvidenceSections
          activeReports={activeDashboardReports.length}
          proofRecords={214 + localCityReports.length}
          cityName={dashboardCityName}
          locationLabel={cityDisplay.locationLabel}
          coordinates={cityDisplay.coordinates}
          locationIsDetected={cityDisplay.isDetectedForSelected}
        />
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
          <div
            className="relative min-h-9 max-w-[150px] overflow-hidden truncate rounded-sm border border-[#00eb88]/45 bg-[#00eb88]/12 px-3 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#5bffa1] shadow-[0_0_24px_rgba(0,235,136,0.14)] sm:min-h-0 sm:max-w-none sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.2em]"
          >
            <span className="stitch-shimmer" />
            AI/RAG active
          </div>
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
              {currentUser ? "Role metrics" : t("publicAudit")}
            </p>
            <div className="space-y-4 px-3">
              {roleAuditMetrics.map((metric) => (
                <AuditMetric
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  tone={metric.tone}
                />
              ))}
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

          <div className="mt-5 rounded-md border border-[#00eb88]/30 bg-[linear-gradient(135deg,rgba(0,235,136,0.13),rgba(0,219,233,0.06))] p-5 shadow-[0_0_22px_rgba(0,235,136,0.08)]">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#5bffa1]">AI/RAG proof layer</p>
            <p className="mt-2 text-sm text-[#e5e2e3]">Issue analysis, RAG civic rules, contractor matching, repair audit, and warranty risk agents are active.</p>
            <p className="mt-1 text-xs text-[#dbc2b0]">Fabric ledger anchoring is ready for teammate integration.</p>
          </div>

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
                  {getRoleWorkspaceSubtitle(currentUser?.role)}
                </p>
                <h2 className="mt-2 max-w-xl text-[2rem] font-black leading-[1.05] tracking-tight text-white sm:text-4xl">
                  {dashboardCityName} {getRoleWorkspaceTitle(currentUser?.role)}
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
                  label="Fabric-ready proof"
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
                  icon={<Blocks size={17} />}
                  label={t("citizenNode")}
                  value="Fabric pending"
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
                {roleIncidentActions.map((action) => {
                  const Icon = action.icon;
                  const tone =
                    action.tone === "gold"
                      ? "border-[#ffc08d]/35 bg-[#ffc08d]/10 text-[#ffdcc2] hover:bg-[#ffc08d]/15"
                      : "border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff] hover:bg-[#00dbe9]/15";

                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={`group flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition ${tone}`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon size={16} />
                        {action.label}
                      </span>
                      <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                    </Link>
                  );
                })}
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
        {mobileNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <MobileNavLink
              key={item.label}
              href={item.href}
              label={item.label}
              icon={<Icon size={17} />}
              active={item.active}
            />
          );
        })}
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
    <h1 className={className} style={{ color: "var(--gov-navy)", letterSpacing: "-0.035em" }}>
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

function LandingEvidenceSections({
  activeReports,
  proofRecords,
  cityName,
  locationLabel,
  coordinates,
  locationIsDetected,
}: {
  activeReports: number;
  proofRecords: number;
  cityName: string;
  locationLabel: string;
  coordinates: string;
  locationIsDetected: boolean;
}) {
  return (
    <div className="cp-light-landing-content relative z-10 bg-[#f6f8fb] text-[#1a1c1c]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,153,51,0.12),transparent_28%),radial-gradient(circle_at_86%_20%,rgba(29,78,216,0.1),transparent_28%),radial-gradient(circle_at_20px_20px,rgba(0,0,60,0.035)_1px,transparent_1.5px)] bg-[size:auto,auto,40px_40px]" />
      <div className="cp-landing-aurora pointer-events-none absolute inset-0" />

        <section className="cp-landing-section relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="cp-scroll-reveal cp-public-proof-spotlight overflow-hidden rounded-3xl border border-[#00dbe9]/24 bg-[radial-gradient(circle_at_16%_18%,rgba(0,219,233,0.2),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,153,51,0.18),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.085),rgba(255,255,255,0.025))] p-5 shadow-[0_34px_90px_rgba(0,0,0,0.46)] backdrop-blur-xl sm:p-7 lg:p-9">
          <div className="grid gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="cp-kicker-glow font-mono text-xs font-black uppercase tracking-[0.22em] text-[#7df4ff]">
                Public Proof | Open Civic Registry
              </p>
              <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl">
                Anyone can verify what is happening in their own city.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#e5e2e3] sm:text-lg">
                Public Proof is the open view of CityPramaan. After location permission, people can see
                anonymous citizen reports from their area, repair status, AI analysis, contractor identity,
                proof hashes, and warranty history without login.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/public-proof"
                  className="cp-landing-cta-link inline-flex min-h-12 items-center justify-center rounded-lg border border-[#00dbe9]/45 bg-[#00dbe9]/14 px-5 py-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-[#7df4ff] transition hover:bg-[#00dbe9]/22"
                >
                  View Public Proof
                </Link>
                <LocationDetectButton compact />
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#ffc08d]">
                      Current public city
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">{cityName}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${
                    locationIsDetected
                      ? "border-[#00eb88]/35 bg-[#00eb88]/10 text-[#5bffa1]"
                      : "border-[#ffc08d]/35 bg-[#ffc08d]/10 text-[#ffdcc2]"
                  }`}>
                    {locationIsDetected ? "GPS matched" : "Permission pending"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#dbc2b0]">{locationLabel}</p>
                <p className="mt-2 font-mono text-xs text-[#7df4ff]">{coordinates}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <PublicProofRule icon={<MapPin size={18} />} title="City-only feed" detail="Default view shows reports from the detected or selected city." />
                <PublicProofRule icon={<UserRound size={18} />} title="Reporter hidden" detail="Citizen name and contact stay anonymous in public view." />
                <PublicProofRule icon={<Building2 size={18} />} title="Contractor visible" detail="Public can see the assigned contractor and repair responsibility." />
                <PublicProofRule icon={<Blocks size={18} />} title="Proof timeline" detail="Issue, repair proof, warranty, and repeat failure history stay open." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cp-landing-section relative mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-24">
        <div className="cp-scroll-reveal">
          <p className="cp-kicker-glow font-mono text-xs font-black uppercase tracking-[0.22em] text-[#00dbe9]">
            India Civic Problem
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-white sm:text-5xl">
            The issue is not reporting. The issue is proving what happened after reporting.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#dbc2b0] sm:text-lg">
            Cities already have complaint apps, IDs, and status labels. CityPramaan focuses on the missing part:
            verified repair evidence, contractor accountability, public history, and warranty memory.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {civicSignalChips.map((chip) => (
              <LandingSignalChip key={chip.label} label={chip.label} tone={chip.tone} />
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {civicProblemCards.map((card) => {
              const Icon = card.icon;

              return (
                <ProblemEvidenceCard key={card.title} card={card} icon={<Icon size={20} />} />
              );
            })}
          </div>
        </div>

        <div className="cp-scroll-reveal cp-float-card cp-rainbow-frame cp-collage-shell relative min-h-[420px] overflow-hidden rounded-2xl border border-white/12 bg-white/[0.045] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <div className="cp-collage-visual relative h-full min-h-[390px] overflow-hidden rounded-xl border border-[#ffc08d]/25 bg-black/40">
            <Image
              src={`${CIVIC_EVIDENCE_PATH}/infrastructure-failure-collage.jpg`}
              alt="Civic infrastructure failure newspaper collage"
              fill
              sizes="(min-width: 1024px) 46vw, 92vw"
              className="object-cover opacity-90"
              priority={false}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.82))]" />
            <div className="cp-map-scan absolute inset-0" />
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#ffc08d]">
                Real problem, real need
              </p>
              <h3 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
                Strong infrastructure needs proof, not promises.
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/80">
                Every unresolved pothole, dark street, sewage leak, and failed repair should leave a traceable public record.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cp-landing-section relative px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="cp-scroll-reveal flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="cp-kicker-glow font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ff9933]">
                Evidence Wall
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
                The newspapers already tell the story.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#dbc2b0] sm:text-base">
              These visuals are not decoration. They show why civic systems need a proof layer that citizens can verify.
            </p>
          </div>

          <div className="cp-evidence-marquee mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {civicEvidenceArticles.map((article, index) => (
              <ArticleEvidenceCard key={article.title} article={article} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="cp-landing-section relative mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-10 lg:py-24">
        <div className="cp-scroll-reveal cp-color-panel rounded-2xl border border-[#00dbe9]/20 bg-[linear-gradient(145deg,rgba(0,219,233,0.12),rgba(255,153,51,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-7">
          <p className="cp-kicker-glow font-mono text-xs font-black uppercase tracking-[0.22em] text-[#7df4ff]">
            Impact Dashboard
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Civic issues are daily-life risk, not minor complaints.
          </h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {landingImpactStats.map((stat) => (
              <LandingStatCard
                key={stat.label}
                label={stat.label}
                value={stat.value === "dynamic" && stat.label.includes("Active") ? `${activeReports}` : stat.value === "dynamic" ? `${proofRecords}` : stat.value}
                detail={stat.label.includes("Active") ? `Live civic stream for ${cityName}` : stat.detail}
                tone={stat.tone}
              />
            ))}
          </div>

          <div className="mt-8 space-y-4 rounded-xl border border-white/10 bg-black/28 p-4">
            {impactBars.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-[#e5e2e3]">{item.label}</span>
                  <span className="font-mono text-xs font-bold text-[#dbc2b0]">{item.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`cp-impact-bar h-full rounded-full ${item.color}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cp-scroll-reveal cp-rainbow-frame relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.045] p-3 backdrop-blur-xl">
          <div className="cp-impact-visual relative min-h-[460px] overflow-hidden rounded-xl bg-white">
            <Image
              src={`${CIVIC_EVIDENCE_PATH}/civic-impact-score.jpg`}
              alt="Civic infrastructure crisis impact score infographic"
              fill
              sizes="(min-width: 1024px) 42vw, 92vw"
              className="object-contain p-2"
            />
          </div>
        </div>
      </section>

      <section className="cp-landing-section relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="cp-scroll-reveal text-center">
          <p className="cp-kicker-glow font-mono text-xs font-black uppercase tracking-[0.22em] text-[#00eb88]">
            Why Existing Apps Are Not Enough
          </p>
          <h2 className="mx-auto mt-3 max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl">
            A complaint ID is not accountability.
          </h2>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          <ComparisonPanel
            title="Current complaint apps"
            tone="muted"
            items={["Photo upload", "Complaint ID", "Status updates", "Resolved label", "Limited public verification"]}
          />
          <ComparisonPanel
            title="CityPramaan proof layer"
            tone="active"
            items={[
              "AI issue analysis",
              "Contractor assignment proof",
              "Repair photo proof",
              "Citizen final confirmation",
              "Public proof timeline",
              "Warranty activation",
              "Tamper-proof audit trail",
            ]}
          />
        </div>
      </section>

      <section className="cp-landing-section relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="cp-scroll-reveal cp-color-panel rounded-2xl border border-[#ffc08d]/22 bg-[radial-gradient(circle_at_15%_10%,rgba(255,153,51,0.15),transparent_32%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(0,219,233,0.045))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="cp-kicker-glow font-mono text-xs font-black uppercase tracking-[0.22em] text-[#ffc08d]">
                CityPramaan Workflow
              </p>
              <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl">
                One connected civic repair lifecycle.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#dbc2b0] sm:text-base">
              Every action updates the same public history: report, repair, approval, closure, warranty, and re-reporting.
            </p>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <WorkflowStepCard key={step} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="cp-landing-section relative mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-24">
        <div className="cp-scroll-reveal">
          <p className="cp-kicker-glow font-mono text-xs font-black uppercase tracking-[0.22em] text-[#d946ef]">
            Public Trust Layer
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
            Every repair has proof. Every proof has history.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#dbc2b0]">
            The public proof page becomes the hero demo: before image, after image, AI result, location,
            proof hash, transaction hash, timeline, warranty status, and citizen feedback.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {["Before image", "After image", "AI result", "Location", "Proof hash", "Warranty status"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-semibold text-[#e5e2e3]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="cp-scroll-reveal cp-color-panel rounded-2xl border border-[#00dbe9]/22 bg-black/34 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#7df4ff]">
                Sample Public Proof Timeline
              </p>
              <h3 className="mt-2 text-2xl font-black text-white">CP-009 Road Damage / Pothole</h3>
            </div>
            <span className="rounded-full border border-[#00eb88]/30 bg-[#00eb88]/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#5bffa1]">
              Verifiable
            </span>
          </div>

          <div className="space-y-0 border-l border-white/12 pl-5">
            {publicProofTimeline.map((event, index) => (
              <div key={event} className="cp-proof-node relative pb-6 last:pb-0">
                <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full border border-[#00dbe9] bg-[#020304] shadow-[0_0_16px_rgba(0,219,233,0.7)]" />
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#a38d7c]">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#e5e2e3]">{event}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-xl border border-[#ffc08d]/22 bg-[#ffc08d]/10 p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#ffc08d]">
              Proof tag
            </p>
            <p className="mt-2 break-all font-mono text-xs text-white/80">
              0x5e0f60e963a17775744bc8be859c1dc21e500e30e43f93495ab01671fffe8f
            </p>
          </div>
        </div>
      </section>

      <section className="cp-landing-section relative px-4 pb-20 pt-10 sm:px-6 lg:px-10 lg:pb-28">
        <div className="cp-scroll-reveal cp-final-cta-glow mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/12 bg-[radial-gradient(circle_at_15%_20%,rgba(255,153,51,0.2),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-5 shadow-[0_34px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#00eb88]">
                Start the proof network
              </p>
              <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl">
                From complaint tracking to accountable city repair.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#dbc2b0]">
                Report issues, verify repairs, activate warranties, and let the public see exactly what happened.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <LandingCta href="/auth" label="Start Reporting" tone="gold" />
              <LandingCta href="/public-proof" label="View Public Proof" tone="cyan" />
              <LandingCta href="/auth" label="Enter Citizen Panel" tone="glass" />
              <LandingCta href="/auth" label="Enter Ward Admin Panel" tone="glass" />
              <LandingCta href="/auth" label="Enter Contractor Panel" tone="glass" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProblemEvidenceCard({
  card,
  icon,
}: {
  card: (typeof civicProblemCards)[number];
  icon: React.ReactNode;
}) {
  const tones = {
    rose: "border-[#ffb4ab]/25 bg-[#ffb4ab]/10 text-[#ffb4ab]",
    cyan: "border-[#00dbe9]/25 bg-[#00dbe9]/10 text-[#7df4ff]",
    amber: "border-[#ffc08d]/25 bg-[#ffc08d]/10 text-[#ffc08d]",
    emerald: "border-[#00eb88]/25 bg-[#00eb88]/10 text-[#5bffa1]",
  };

  return (
    <article className={`cp-article-card rounded-2xl border p-4 backdrop-blur-xl ${tones[card.tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-current/25 bg-black/24">
          {icon}
        </span>
        <span className="text-right text-3xl font-black leading-none text-white">{card.value}</span>
      </div>
      <h3 className="mt-4 text-lg font-black text-white">{card.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">{card.detail}</p>
      <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] opacity-85">{card.label}</p>
    </article>
  );
}

function LandingSignalChip({
  label,
  tone,
}: {
  label: string;
  tone: (typeof civicSignalChips)[number]["tone"];
}) {
  const tones = {
    cyan: "border-[#00dbe9]/35 bg-[#00dbe9]/12 text-[#7df4ff] shadow-[0_0_22px_rgba(0,219,233,0.08)]",
    violet: "border-[#d946ef]/35 bg-[#d946ef]/12 text-[#f0abfc] shadow-[0_0_22px_rgba(217,70,239,0.1)]",
    emerald: "border-[#00eb88]/35 bg-[#00eb88]/12 text-[#8fffc1] shadow-[0_0_22px_rgba(0,235,136,0.08)]",
    amber: "border-[#ffc08d]/35 bg-[#ff9933]/12 text-[#ffdcc2] shadow-[0_0_22px_rgba(255,153,51,0.1)]",
    rose: "border-[#ff4d6d]/35 bg-[#ff4d6d]/12 text-[#ffb4c2] shadow-[0_0_22px_rgba(255,77,109,0.1)]",
  };

  return (
    <span className={`cp-signal-chip inline-flex min-h-9 items-center rounded-full border px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] ${tones[tone]}`}>
      {label}
    </span>
  );
}

function PublicProofRule({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="cp-public-proof-rule rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_14px_36px_rgba(0,0,0,0.22)]">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg border border-[#00dbe9]/24 bg-[#00dbe9]/10 text-[#7df4ff]">
        {icon}
      </div>
      <p className="font-mono text-[11px] font-black uppercase tracking-[0.15em] text-white">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">{detail}</p>
    </div>
  );
}

function ArticleEvidenceCard({
  article,
  index,
}: {
  article: (typeof civicEvidenceArticles)[number];
  index: number;
}) {
  return (
    <article
      className="cp-article-card cp-scroll-reveal group overflow-hidden rounded-2xl border border-white/12 bg-white/[0.045] shadow-[0_20px_64px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f3eee5]">
        <div className="cp-article-color-wash absolute inset-0 z-10 opacity-0 transition duration-500 group-hover:opacity-100" />
        <Image
          src={article.src}
          alt={article.title}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 92vw"
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.58))]" />
        <span className="cp-evidence-badge absolute left-4 top-4 z-20 rounded-full border border-white/20 bg-black/45 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.15em] text-[#ffc08d] backdrop-blur">
          {article.tag}
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-black text-white">{article.title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">{article.caption}</p>
      </div>
    </article>
  );
}

function LandingStatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: (typeof landingImpactStats)[number]["tone"];
}) {
  const tones = {
    amber: "border-[#ffc08d]/24 bg-[radial-gradient(circle_at_85%_15%,rgba(255,153,51,0.22),transparent_36%),rgba(255,153,51,0.08)] text-[#ffc08d]",
    cyan: "border-[#00dbe9]/24 bg-[radial-gradient(circle_at_85%_15%,rgba(0,219,233,0.22),transparent_36%),rgba(0,219,233,0.08)] text-[#7df4ff]",
    rose: "border-[#ff4d6d]/24 bg-[radial-gradient(circle_at_85%_15%,rgba(255,77,109,0.22),transparent_36%),rgba(255,77,109,0.08)] text-[#ffb4c2]",
    emerald: "border-[#00eb88]/24 bg-[radial-gradient(circle_at_85%_15%,rgba(0,235,136,0.2),transparent_36%),rgba(0,235,136,0.08)] text-[#8fffc1]",
  };

  return (
    <div className={`cp-article-card cp-stat-color-card rounded-xl border p-4 ${tones[tone]}`}>
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] opacity-85">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">{detail}</p>
    </div>
  );
}

function ComparisonPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "muted" | "active";
}) {
  const isActive = tone === "active";

  return (
    <div
      className={`cp-scroll-reveal rounded-2xl border p-5 shadow-[0_24px_72px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-7 ${
        isActive
          ? "border-[#00eb88]/28 bg-[linear-gradient(145deg,rgba(0,235,136,0.13),rgba(0,219,233,0.05))]"
          : "border-white/12 bg-white/[0.04]"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-2xl font-black text-white">{title}</h3>
        <span
          className={`rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${
            isActive
              ? "border-[#00eb88]/30 bg-[#00eb88]/10 text-[#5bffa1]"
              : "border-[#ffb4ab]/25 bg-[#ffb4ab]/10 text-[#ffb4ab]"
          }`}
        >
          {isActive ? "Proof based" : "Status based"}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/24 px-4 py-3">
            {isActive ? (
              <CheckCircle2 size={18} className="shrink-0 text-[#00eb88]" />
            ) : (
              <AlertTriangle size={18} className="shrink-0 text-[#ffc08d]" />
            )}
            <span className="text-sm font-semibold text-[#e5e2e3]">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowStepCard({ step, index }: { step: string; index: number }) {
  const tones = [
    "border-[#00dbe9]/22 bg-[linear-gradient(145deg,rgba(0,219,233,0.12),rgba(0,0,0,0.22))] text-[#7df4ff]",
    "border-[#ff9933]/22 bg-[linear-gradient(145deg,rgba(255,153,51,0.12),rgba(0,0,0,0.22))] text-[#ffc08d]",
    "border-[#00eb88]/22 bg-[linear-gradient(145deg,rgba(0,235,136,0.11),rgba(0,0,0,0.22))] text-[#8fffc1]",
    "border-[#d946ef]/22 bg-[linear-gradient(145deg,rgba(217,70,239,0.12),rgba(0,0,0,0.22))] text-[#f0abfc]",
  ];
  const tone = tones[index % tones.length];

  return (
    <div className={`cp-article-card cp-workflow-card relative overflow-hidden rounded-xl border p-4 ${tone}`}>
      <span className="cp-workflow-spark absolute right-4 top-4 h-2 w-2 rounded-full bg-current shadow-[0_0_16px_currentColor]" />
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-current/25 bg-black/20 font-mono text-xs font-black">
          {String(index + 1).padStart(2, "0")}
        </span>
        <ArrowRight size={16} className="hidden opacity-80 sm:block" />
      </div>
      <h3 className="mt-4 text-base font-black text-white">{step}</h3>
      <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">
        {index === 0
          ? "Citizen starts the record with image and location."
          : index === workflowSteps.length - 1
            ? "Warranty memory protects the repair after closure."
            : "Status, evidence, and proof metadata move forward together."}
      </p>
    </div>
  );
}

function LandingCta({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: "gold" | "cyan" | "glass";
}) {
  const tones = {
    gold: "border-[#ffc08d]/45 bg-[linear-gradient(135deg,#ffdcc2,#ff9933,#ff7a1a)] text-[#4c2700] shadow-[0_0_28px_rgba(255,153,51,0.22)]",
    cyan: "border-[#00dbe9]/35 bg-[linear-gradient(135deg,rgba(0,219,233,0.22),rgba(0,235,136,0.12))] text-[#7df4ff] shadow-[0_0_28px_rgba(0,219,233,0.16)]",
    glass: "border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(217,70,239,0.09),rgba(0,0,0,0.24))] text-white",
  };

  return (
    <Link
      href={href}
      className={`cp-command-link cp-landing-cta-link inline-flex min-h-12 items-center justify-center rounded-xl border px-4 py-3 text-center font-mono text-[11px] font-black uppercase tracking-[0.16em] transition hover:brightness-110 ${tones[tone]}`}
    >
      {label}
    </Link>
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

function HeroTrustChip({
  label,
  tone,
}: {
  label: string;
  tone: "blue" | "green" | "saffron";
}) {
  const tones = {
    blue: "border-[#1d4ed8]/24 bg-[#edf4ff] text-[#1d4ed8]",
    green: "border-[#1f8a3b]/24 bg-[#eaf7ee] text-[#0d5f28]",
    saffron: "border-[#fe9832]/28 bg-[#fff3e7] text-[#9a4f00]",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-extrabold ${tones[tone]}`}>
      {label}
    </div>
  );
}

function PublicMetric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div
      className={`min-h-[74px] rounded-xl border border-[#c6c5d5] bg-[#f8fafc] p-3 sm:min-h-24 sm:p-4 ${
        wide ? "col-span-2 min-w-0 text-left" : "min-w-0 text-center sm:text-left"
      }`}
      title={value}
    >
      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#1d4ed8] sm:text-[10px]">{label}</p>
      <p className={`mt-1 font-black leading-tight text-[#00003c] sm:mt-2 ${
        wide
          ? "block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl sm:text-2xl"
          : "text-lg sm:text-2xl"
      }`}>
        {value}
      </p>
    </div>
  );
}

function LandingFeature({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="grid grid-cols-[48px_1fr] gap-4 rounded-xl border border-transparent p-3">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-[#b7d1ff] bg-[#e9f2ff] text-[#1d4ed8]">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-black text-[#00003c]">{title}</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#344154]">{detail}</p>
      </div>
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
