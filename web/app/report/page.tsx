/* eslint-disable @next/next/no-img-element */
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Camera,
  CheckCircle2,
  Droplets,
  FileImage,
  Fingerprint,
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
  Wrench,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { NotificationBell } from "@/src/components/layout/NotificationBell";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import {
  DEFAULT_CITY_KEY,
  demoCities,
  formatCityLocation,
  getCityByKey,
  type CityKey,
} from "@/src/lib/city-context";
import { getCitySnapshot, setSelectedCityKey, subscribeCity } from "@/src/lib/city-storage";
import { type InfrastructureAnalysis } from "@/src/lib/infrastructure-analyzer";
import { getLanguageSnapshot, subscribeLanguage } from "@/src/lib/language-storage";
import { translate } from "@/src/lib/language-context";
import { buildGoogleMapsUrl, type CivicReport } from "@/src/lib/mock-data";
import {
  createLocalReportId,
  readFileAsDataUrl,
} from "@/src/lib/report-storage";
import { saveReportEverywhere } from "@/src/lib/report-sync";
import { requestInfrastructureAnalysis } from "@/src/lib/ai-analysis-client";
import { getCurrentUser } from "@/src/lib/auth-storage";
import { createProofBundleHash, deriveTransactionHash, sha256Hex } from "@/src/lib/proof-hashing";
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";

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
    label: "Transformer outage",
    icon: Zap,
    text: "Transformer failed after heavy rainfall and homes nearby have no electricity. Citizens need restoration ETA and progress updates.",
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

function getNearestCity(latitude: number, longitude: number) {
  return demoCities
    .map((city) => ({
      city,
      distance: getDistanceKm(latitude, longitude, city.lat, city.lng),
    }))
    .sort((first, second) => first.distance - second.distance)[0].city;
}

function getDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const startLat = toRadians(fromLat);
  const endLat = toRadians(toLat);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

async function reverseGeocodeArea(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return "";
    }

    const data = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };
    const address = data.address ?? {};
    const areaParts = [
      address.road,
      address.neighbourhood,
      address.suburb,
      address.city_district,
      address.city ?? address.town ?? address.village,
      address.state,
    ].filter(Boolean);

    return areaParts.length ? areaParts.join(", ") : data.display_name ?? "";
  } catch {
    return "";
  }
}

export default function ReportIssuePage() {
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => DEFAULT_CITY_KEY);
  const languageSnapshot = useSyncExternalStore(
    subscribeLanguage,
    getLanguageSnapshot,
    () => "en"
  );
  const selectedCity = getCityByKey(citySnapshot);
  const cityDisplay = useDetectedLocationDisplay(selectedCity);
  const tr = (key: Parameters<typeof translate>[1]) => translate(languageSnapshot, key);
  const [imageName, setImageName] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [location, setLocation] = useState(() => formatCityLocation(getCityByKey(getCitySnapshot())));
  const [latitude, setLatitude] = useState(selectedCity.lat);
  const [longitude, setLongitude] = useState(selectedCity.lng);
  const [mapsLink, setMapsLink] = useState("");
  const [locationMessage, setLocationMessage] = useState("Waiting for browser location permission...");
  const [locationDetecting, setLocationDetecting] = useState(true);
  const [locationSource, setLocationSource] = useState<"default" | "browser" | "manual" | "maps">("default");
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [description, setDescription] = useState(
    "Large pothole appeared again near the same repaired road segment."
  );
  const [verified, setVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [proofCreating, setProofCreating] = useState(false);
  const [proofError, setProofError] = useState("");
  const [createdTxHash, setCreatedTxHash] = useState("");
  const [createdProofHash, setCreatedProofHash] = useState("");
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<InfrastructureAnalysis | null>(null);
  const googleMapsUrl = buildGoogleMapsUrl(latitude, longitude);
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=16&output=embed`;
  const autoLocationRequested = useRef(false);
  const locationSourceLabel = {
    default: "Default city pin",
    browser: "Browser GPS",
    manual: "Manual coordinates",
    maps: "Google Maps link",
  }[locationSource];

  async function runAiVerification() {
    setVerified(false);
    setAiResult(null);
    setAiProcessing(true);
    setProofError("");

    try {
      const result = await requestInfrastructureAnalysis({
        description,
        imageName,
        imageDataUrl,
        location,
        cityName: cityDisplay.cityName,
      });

      setAiResult(result);
      setVerified(true);
    } finally {
      setAiProcessing(false);
    }
  }

  async function handleIssueFile(file?: File) {
    if (!file) {
      return;
    }

    setImageName(file.name);
    setImageDataUrl("");
    setImageLoading(true);
    setVerified(false);
    setAiResult(null);
    setSubmitted(false);
    setProofError("");
    setCreatedTxHash("");
    setCreatedProofHash("");

    try {
      setImageDataUrl(await readFileAsDataUrl(file));
    } catch {
      setImageName("");
      setProofError("Could not prepare this image. Please capture again or choose another photo.");
    } finally {
      setImageLoading(false);
    }
  }

  function pinManualLocation(nextLatitude = latitude, nextLongitude = longitude) {
    const nearestCity = getNearestCity(nextLatitude, nextLongitude);
    const pinnedLocation = `${nearestCity.primaryArea}, ${nearestCity.name} (${nextLatitude.toFixed(
      5
    )}, ${nextLongitude.toFixed(5)})`;

    setSelectedCityKey(nearestCity.key);
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setLocationSource("manual");
    setLocationAccuracy(null);
    setLocation(pinnedLocation);
    setLocationMessage(`Manual coordinates pinned. Nearest CityPramaan city context: ${nearestCity.name}.`);
    setSubmitted(false);
    setProofError("");
    setCreatedTxHash("");
    setCreatedProofHash("");
  }

  const applyRealCoordinates = useCallback(async (
    nextLatitude: number,
    nextLongitude: number,
    source: "auto" | "manual",
    accuracy?: number
  ) => {
    const nearestCity = getNearestCity(nextLatitude, nextLongitude);

    setSelectedCityKey(nearestCity.key);
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setLocationSource("browser");
    setLocationAccuracy(Number.isFinite(accuracy) ? Math.round(accuracy ?? 0) : null);
    setLocation(`Live GPS location (${nextLatitude.toFixed(5)}, ${nextLongitude.toFixed(5)})`);
    setLocationMessage("Live GPS coordinates captured. Detecting area name...");
    setSubmitted(false);
    setProofError("");
    setCreatedTxHash("");
    setCreatedProofHash("");

    const detectedArea = await reverseGeocodeArea(nextLatitude, nextLongitude);

    if (detectedArea) {
      setLocation(`${detectedArea} (${nextLatitude.toFixed(5)}, ${nextLongitude.toFixed(5)})`);
      setLocationMessage(
        `Real location detected from browser ${source === "auto" ? "permission" : "GPS"}: ${detectedArea}. Nearest supported CityPramaan city: ${nearestCity.name}.`
      );
      return;
    }

    setLocationMessage(
      `Real GPS locked at ${nextLatitude.toFixed(5)}, ${nextLongitude.toFixed(5)}. Area lookup failed, but exact coordinates are saved. Nearest supported CityPramaan city: ${nearestCity.name}.`
    );
  }, []);

  const requestBrowserLocation = useCallback((source: "auto" | "manual") => {
    if (!navigator.geolocation) {
      setLocationMessage("GPS is not available in this browser. Enter coordinates manually.");
      setLocationDetecting(false);
      return;
    }

    setLocationDetecting(true);
    setLocationMessage(
      source === "auto"
        ? "Requesting real browser location permission..."
        : "Requesting live GPS permission..."
    );
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = Number(position.coords.latitude.toFixed(6));
        const nextLongitude = Number(position.coords.longitude.toFixed(6));

        void applyRealCoordinates(nextLatitude, nextLongitude, source, position.coords.accuracy).finally(() =>
          setLocationDetecting(false)
        );
      },
      (error) => {
        setLocationDetecting(false);
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was blocked. CityPramaan cannot auto-detect your area without browser permission."
            : "Could not read live GPS right now. Try again, or paste a Google Maps link."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [applyRealCoordinates]);

  function useCurrentGps() {
    requestBrowserLocation("manual");
  }

  useEffect(() => {
    if (autoLocationRequested.current) {
      return;
    }

    autoLocationRequested.current = true;
    requestBrowserLocation("auto");
  }, [requestBrowserLocation]);

  function applyGoogleMapsLink() {
    const decodedLink = decodeURIComponent(mapsLink);
    const coordinateMatch =
      decodedLink.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ??
      decodedLink.match(/[?&](?:q|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ??
      decodedLink.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);

    if (!coordinateMatch) {
      setLocationMessage("Could not read coordinates from that Google Maps link. Try GPS or manual coordinates.");
      return;
    }

    const nextLatitude = Number(coordinateMatch[1]);
    const nextLongitude = Number(coordinateMatch[2]);
    const nearestCity = getNearestCity(nextLatitude, nextLongitude);

    setSelectedCityKey(nearestCity.key);
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setLocationSource("maps");
    setLocationAccuracy(null);
    setLocation(`Google Maps pinned location (${nextLatitude.toFixed(5)}, ${nextLongitude.toFixed(5)})`);
    setLocationMessage(`Google Maps link parsed. Nearest CityPramaan city context: ${nearestCity.name}.`);
    setSubmitted(false);
    setProofError("");
    setCreatedTxHash("");
    setCreatedProofHash("");
  }

  async function createProof() {
    if (submitted || proofCreating) {
      return;
    }

    if (imageLoading) {
      setProofError("Photo is still being prepared. Please wait a moment, then sign again.");
      return;
    }

    if (!imageDataUrl) {
      setProofError("Capture or upload a civic issue photo before creating public proof.");
      return;
    }

    setProofCreating(true);
    setProofError("");
    try {
      const reportCity = getNearestCity(latitude, longitude);
      const savedLocation = location.includes(latitude.toFixed(5))
        ? location
        : `${location} (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      const result =
        aiResult ??
        (await requestInfrastructureAnalysis({
          description,
          imageName,
          imageDataUrl,
          location: savedLocation,
          cityName: reportCity.name,
        }));

      const now = new Date().toISOString();
      const reportId = createLocalReportId();
      const currentUser = getCurrentUser();
      const evidenceHash = await sha256Hex(imageDataUrl);
      const proofBundleHash = await createProofBundleHash([
        reportId,
        evidenceHash,
        result.category,
        result.severity,
        result.confidence,
        latitude,
        longitude,
        savedLocation,
        now,
      ]);
      const txHash = await deriveTransactionHash(`fabric-pending:${reportId}:${proofBundleHash}`);

      const aiTxHash = await deriveTransactionHash(`${reportId}:${result.proofTag}:aiVerification`);

      const newReport: CivicReport = {
        id: reportId,
        cityKey: reportCity.key,
        title: `${result.issueType} awaiting repair in ${reportCity.name}`,
        ward: reportCity.repairWard,
        status: "PENDING_PROOF",
        severity: result.severity,
        confidence: result.confidence,
        contractor: "Awaiting assignment",
        citizenId: currentUser?.id,
        citizenName: currentUser?.name ?? "Citizen reporter",
        citizenContact: currentUser?.contactNumber,
        adminApprovalStatus: "PENDING",
        citizenFinalApproval: "PENDING",
        warrantyStatus: "NOT_ACTIVE",
        txHash,
        warrantyDaysLeft: null,
        location: savedLocation,
        latitude,
        longitude,
        mapUrl: googleMapsUrl,
        issueCategory: result.category,
        assetType: result.assetType,
        aiSummary: result.publicSummary,
        recommendedAction: result.recommendedAction,
        slaHours: result.slaHours,
        aiPriorityScore: result.aiPriorityScore,
        imageEvidenceScore: result.imageEvidenceScore,
        aiModelVersion: result.modelVersion,
        estimatedImpact: result.estimatedImpact,
        createdAt: now,
        updatedAt: now,
        utilityRestoration:
          result.category === "POWER_OUTAGE"
            ? {
                cause: "Weather casualty / suspected transformer or feeder fault",
                affectedArea: `${reportCity.primaryArea} residential pocket`,
                estimatedRestoration: "4-6 hours",
                progressStage: "Fault reported",
                department: "Electricity Maintenance",
                citizenUpdate:
                  "Outage reported and awaiting utility crew acknowledgement. Restoration ETA must stay visible to citizens.",
              }
            : undefined,
        issueImageName: imageName || "citizen-issue-evidence.jpg",
        issueImageDataUrl: imageDataUrl,
        evidenceHash,
        proofBundleHash,
        history: [
          {
            label: "Citizen report created",
            detail: `${result.issueType} submitted from ${savedLocation}.`,
            time: new Date(now).toLocaleString(),
            tx: txHash,
          },
          {
            label: "AI verified civic issue",
            detail: `${result.category} classified with ${result.confidence}% confidence, ${result.severity} severity, and ${result.aiPriorityScore}/100 priority score.`,
            time: new Date(now).toLocaleString(),
            tx: aiTxHash,
          },
          ...(result.category === "POWER_OUTAGE"
            ? [
                {
                  label: "Restoration ETA required",
                  detail:
                    "Power outage report requires public progress updates: fault acknowledged, crew dispatched, repair in progress, power restored.",
                  time: new Date(now).toLocaleString(),
                  tx: "0xeta...pwr",
                },
              ]
            : []),
        ],
      };

      await saveReportEverywhere(newReport);

      setAiResult(result);
      setSelectedCityKey(reportCity.key);
      setVerified(true);
      setSubmitted(true);
      setCreatedTxHash(txHash);
      setCreatedProofHash(proofBundleHash);
      setProofError("AI/RAG proof created. Fabric anchoring is ready for teammate integration.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not create the AI/RAG proof bundle. Please try again.";

      setProofError(message);
      setLocationMessage(message);
    } finally {
      setProofCreating(false);
    }
  }

  function chooseCity(cityKey: CityKey) {
    const city = getCityByKey(cityKey);

    setSelectedCityKey(city.key);
    setLocation(formatCityLocation(city));
    setLatitude(city.lat);
    setLongitude(city.lng);
    setLocationSource("default");
    setLocationAccuracy(null);
    setMapsLink("");
    setLocationMessage(`${city.name} default Google Maps pin selected.`);
    setImageName("");
    setImageDataUrl("");
    setImageLoading(false);
    setDescription(`Large pothole appeared again near the repaired road segment at ${city.primaryArea}.`);
    setVerified(false);
    setAiResult(null);
    setSubmitted(false);
    setProofCreating(false);
    setProofError("");
    setCreatedTxHash("");
    setCreatedProofHash("");
  }

  return (
    <main className="cp-page-shell relative min-h-screen overflow-hidden bg-[#050505] text-[#e5e2e3]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="fixed top-0 z-50 flex min-h-16 w-full flex-wrap items-center justify-between gap-3 border-b border-[#ff9933]/15 bg-[#030507]/75 px-3 py-3 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl md:h-16 md:flex-nowrap md:px-8 md:py-0">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0] transition hover:border-[#00dbe9]/60 hover:text-[#00dbe9]"
            aria-label="Back to command center"
          >
            <ArrowLeft size={17} />
          </Link>
          <BrandLogo size="sm" subtitle={tr("citizenReport")} />
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="input-recessed flex h-9 w-64 items-center rounded px-3">
            <Search size={14} className="mr-2 text-[#dbc2b0]/60" />
            <input
              className="w-full border-none bg-transparent p-0 font-mono text-xs text-[#e5e2e3] outline-none placeholder:text-[#dbc2b0]/45"
              placeholder={tr("publicIssueHistory")}
            />
          </div>
          <NotificationBell />
          <button className="grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/70 transition hover:text-[#00eb88]">
            <Settings size={16} />
          </button>
          <LanguageSelector compact />
          <ThemeToggle />
          <span className="rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-2 font-mono text-xs text-[#00dbe9]">
            AI/RAG active
          </span>
        </div>
      </header>

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-[#ff9933]/15 bg-[linear-gradient(180deg,rgba(255,153,51,0.08),rgba(0,0,0,0.5)_22%,rgba(0,219,233,0.045))] px-4 pb-5 pt-20 shadow-[5px_0_24px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:flex">
        <div className="mt-2 border-b border-white/10 px-2 pb-5">
          <BrandLogo size="sm" subtitle="AI proof flow" />
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-1">
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label={tr("commandCenter")} />
          <NavItem href="/proof/CP-004" icon={<BadgeCheck size={18} />} label={tr("verifiedRepairs")} />
          <NavItem
            href="/report"
            icon={<Camera size={18} />}
            label={tr("reportIssue")}
            active
          />
          <NavItem href="/warranty" icon={<ShieldCheck size={18} />} label={tr("warrantyScanner")} />
          <NavItem href="/pending" icon={<FileImage size={18} />} label={tr("pendingProof")} />
        </nav>

        <Link
          href="/report"
          className="btn-primary-shimmer grid rounded bg-[#ffc08d] px-4 py-3 text-center font-mono text-xs font-semibold text-[#4c2700]"
        >
          {tr("submitReport")}
        </Link>

        <div className="mt-5 border-t border-white/5 pt-4">
          <NavItem href="/" icon={<Router size={15} />} label={tr("systemStatus")} small />
          <NavItem href="/about" icon={<BookOpen size={15} />} label={tr("documentation")} small />
        </div>
      </aside>

      <section className="relative z-10 min-h-screen px-4 pb-10 pt-24 md:ml-64 md:px-8 md:pt-20">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-7 flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase text-[#00dbe9]">{tr("universalInfrastructureEvidence")}</p>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-5xl">{tr("reportIssue")}</h1>
              <p className="mt-2 text-sm text-[#dbc2b0]">
                {tr("filingNode")}: {cityDisplay.cityName}, {cityDisplay.regionName}. You can also type any exact
                landmark or GPS-backed address below.
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="pulse-indicator h-2 w-2 rounded-full bg-[#00eb88]" />
              <span className="font-mono text-xs text-[#00eb88]">{tr("nodeSynced")}</span>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-8">
              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#00dbe9]">
                    <Camera size={22} />
                    {tr("universalInfrastructureEvidence")}
                  </h2>
                  <span className="rounded border border-white/10 bg-black/35 px-2 py-1 font-mono text-[10px] text-[#dbc2b0]">
                    MAX 5MB | IPFS READY
                  </span>
                </div>

                <div className="mb-5 rounded border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-4">
                  <label className="mb-2 block font-mono text-xs uppercase text-[#00dbe9]">
                    {tr("cityCoverage")}
                  </label>
                  <select
                    value={selectedCity.key}
                    onChange={(event) => chooseCity(event.target.value as CityKey)}
                    className="input-recessed w-full rounded px-4 py-3 font-mono text-sm text-white"
                  >
                    {demoCities.map((city) => (
                      <option key={city.key} value={city.key} className="bg-[#050505] text-white">
                        {cityDisplay.isDetectedForSelected && city.key === selectedCity.key
                          ? `${cityDisplay.cityName} GPS | ${cityDisplay.regionName}`
                          : `${city.name} | ${city.state}`}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="group relative grid min-h-52 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-[#554336] bg-black/25 p-5 text-center transition hover:border-[#00dbe9]/80 sm:min-h-60 sm:p-8">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => void handleIssueFile(event.target.files?.[0])}
                  />
                  {imageDataUrl ? (
                    <img
                      src={imageDataUrl}
                      alt="Uploaded civic issue evidence"
                      className="absolute inset-0 h-full w-full object-cover opacity-70"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 evidence-asphalt opacity-25" />
                      <div className="absolute left-1/2 top-1/2 h-20 w-36 -translate-x-1/2 -translate-y-1/2 rounded-[48%] border border-[#ffb4ab]/25 bg-[#3a1515]/70 opacity-45 blur-[1px]" />
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/35" />

                  <div className="relative">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#00dbe9] shadow-[0_0_28px_rgba(0,219,233,0.18)]">
                      {imageLoading ? (
                        <Sparkles size={28} className="animate-spin" />
                      ) : imageName ? (
                        <FileImage size={28} />
                      ) : (
                        <UploadCloud size={28} />
                      )}
                    </div>
                    <p className="mt-4 font-medium text-white">
                      {imageLoading ? "Preparing captured photo..." : imageName || tr("uploadCivicEvidence")}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[#dbc2b0]/65">
                      {imageDataUrl ? "This image will travel to contractor, pending proof, warranty, and public proof." : tr("uploadClickBrowse")}
                    </p>
                  </div>
                </label>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-[#00eb88]/45 bg-[#00eb88]/10 px-4 py-3 font-mono text-xs font-semibold text-[#5bffa1] transition hover:bg-[#00eb88]/15">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(event) => void handleIssueFile(event.target.files?.[0])}
                    />
                    <Camera size={16} />
                    Capture Live Photo
                  </label>

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-4 py-3 font-mono text-xs font-semibold text-[#7df4ff] transition hover:bg-[#00dbe9]/15">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void handleIssueFile(event.target.files?.[0])}
                    />
                    <UploadCloud size={16} />
                    Upload From Gallery
                  </label>
                </div>

                <p className="mt-3 rounded border border-white/10 bg-black/25 p-3 text-xs leading-5 text-[#dbc2b0]/75">
                  On mobile, <span className="text-[#5bffa1]">Capture Live Photo</span> opens the device camera so a citizen standing at the location can submit fresh evidence directly.
                </p>
                {proofError && (
                  <p className="mt-3 rounded border border-[#ffb4ab]/25 bg-[#ffb4ab]/10 px-3 py-2 text-sm text-[#ffdad6]">
                    {proofError}
                  </p>
                )}
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="grid gap-6">
                  <div>
                    <label className="mb-3 block font-mono text-xs uppercase text-[#00dbe9]">
                      {tr("quickIssueTypes")}
                    </label>
                    <div className="cp-stagger-grid grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
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
                              setCreatedTxHash("");
                              setCreatedProofHash("");
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
                    <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                      <div>
                        <label className="block font-mono text-xs uppercase text-[#00dbe9]">
                          {tr("mapLocation")}
                        </label>
                        <p className="mt-1 text-xs text-[#dbc2b0]/70">{tr("mapLocationSubtitle")}</p>
                      </div>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-3 py-2 font-mono text-xs text-[#00dbe9] transition hover:bg-[#00dbe9]/15"
                      >
                        <MapPin size={14} />
                        {tr("openGoogleMaps")}
                      </a>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="flex overflow-hidden rounded-lg border border-[#00dbe9]/20 bg-black/35">
                        <div className="flex min-h-full w-full flex-col">
                        <iframe
                          title="Selected Google Maps location"
                          src={googleMapsEmbedUrl}
                          className="h-72 w-full shrink-0 grayscale-[0.15]"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />

                        <div className="grid flex-1 gap-3 border-t border-[#00dbe9]/15 bg-[linear-gradient(135deg,rgba(0,219,233,0.09),rgba(255,153,51,0.045))] p-4 sm:grid-cols-2">
                          <div className="rounded border border-white/10 bg-black/30 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#dbc2b0]/60">
                              Location source
                            </p>
                            <p className="mt-1 font-mono text-sm font-semibold text-[#7df4ff]">
                              {locationSourceLabel}
                            </p>
                          </div>
                          <div className="rounded border border-white/10 bg-black/30 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#dbc2b0]/60">
                              GPS accuracy
                            </p>
                            <p className="mt-1 font-mono text-sm font-semibold text-[#5bffa1]">
                              {locationAccuracy ? `~${locationAccuracy} m` : locationSource === "browser" ? "Captured" : "Manual"}
                            </p>
                          </div>
                          <div className="rounded border border-white/10 bg-black/30 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#dbc2b0]/60">
                              Proof coordinates
                            </p>
                            <p className="mt-1 font-mono text-sm font-semibold text-white">
                              {latitude.toFixed(5)}, {longitude.toFixed(5)}
                            </p>
                          </div>
                          <div className="rounded border border-white/10 bg-black/30 p-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#dbc2b0]/60">
                              Nearest city node
                            </p>
                            <p className="mt-1 font-mono text-sm font-semibold text-[#ffc08d]">
                              {cityDisplay.cityName}
                            </p>
                          </div>
                          <div className="rounded border border-[#00eb88]/20 bg-[#00eb88]/10 p-3 sm:col-span-2">
                            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#5bffa1]">
                              Location proof packet
                            </p>
                            <p className="mt-2 text-xs leading-5 text-[#d3fbff]">
                              This report will store the exact latitude/longitude with the issue image, so the contractor, issuer, and public proof page can verify where the evidence was captured.
                            </p>
                          </div>
                        </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="input-recessed flex items-center rounded px-4 py-3">
                          <MapPin size={17} className="mr-2 text-[#ffc08d]" />
                          <input
                            value={location}
                            onChange={(event) => {
                              setLocation(event.target.value);
                              setSubmitted(false);
                              setCreatedTxHash("");
                              setCreatedProofHash("");
                            }}
                            className="w-full bg-transparent font-mono text-sm text-white outline-none"
                            aria-label={tr("selectedAddress")}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <label className="rounded border border-white/10 bg-black/25 p-2">
                            <span className="block font-mono text-[10px] uppercase text-[#dbc2b0]/60">Lat</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={latitude}
                              onChange={(event) => setLatitude(Number(event.target.value))}
                              onBlur={() => pinManualLocation()}
                              className="mt-1 w-full bg-transparent font-mono text-sm text-white outline-none"
                            />
                          </label>
                          <label className="rounded border border-white/10 bg-black/25 p-2">
                            <span className="block font-mono text-[10px] uppercase text-[#dbc2b0]/60">Lng</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={longitude}
                              onChange={(event) => setLongitude(Number(event.target.value))}
                              onBlur={() => pinManualLocation()}
                              className="mt-1 w-full bg-transparent font-mono text-sm text-white outline-none"
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={useCurrentGps}
                          disabled={locationDetecting}
                          className="radar-pulse flex w-full items-center justify-center gap-2 rounded border border-[#00eb88] bg-[#00eb88]/5 px-4 py-3 font-mono text-xs text-[#00eb88] transition hover:bg-[#00eb88]/10"
                        >
                          <LocateFixed size={16} className={locationDetecting ? "animate-spin" : ""} />
                          {locationDetecting ? "Detecting real location..." : tr("useCurrentGps")}
                        </button>

                        <button
                          type="button"
                          onClick={() => pinManualLocation()}
                          className="flex w-full items-center justify-center gap-2 rounded border border-[#ffc08d]/35 bg-[#ffc08d]/10 px-4 py-3 font-mono text-xs text-[#ffc08d] transition hover:bg-[#ffc08d]/15"
                        >
                          {tr("manualCoordinates")}
                        </button>

                        <div className="rounded border border-white/10 bg-black/25 p-3">
                          <label className="mb-2 block font-mono text-[10px] uppercase text-[#dbc2b0]/60">
                            {tr("openGoogleMaps")}
                          </label>
                          <input
                            value={mapsLink}
                            onChange={(event) => setMapsLink(event.target.value)}
                            placeholder="https://www.google.com/maps/..."
                            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe9]/60"
                          />
                          <button
                            type="button"
                            onClick={applyGoogleMapsLink}
                            className="mt-2 w-full rounded border border-[#00dbe9]/35 bg-[#00dbe9]/10 px-3 py-2 font-mono text-xs text-[#00dbe9] transition hover:bg-[#00dbe9]/15"
                          >
                            {tr("manualCoordinates")}
                          </button>
                        </div>

                        <p className="rounded border border-white/10 bg-black/25 p-3 text-xs leading-5 text-[#dbc2b0]/75">
                          {locationMessage}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block font-mono text-xs uppercase text-[#00dbe9]">
                        {tr("technicalObservation")}
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
                        setCreatedTxHash("");
                        setCreatedProofHash("");
                      }}
                      className="input-recessed min-h-36 w-full resize-none rounded px-4 py-3 text-sm text-white"
                      placeholder={tr("reportIssuePlaceholder")}
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
                    {tr("aiPreVerification")}
                  </h3>
                  <span className="rounded bg-black/35 px-2 py-1 font-mono text-[10px] text-[#dbc2b0]/70">
                    {tr("aiIssueBrain")}
                  </span>
                </div>

                {aiProcessing ? (
                  <div className="space-y-3">
                    <div className="shimmer-bg h-4 w-3/4 rounded" />
                    <div className="shimmer-bg h-4 w-1/2 rounded" />
                    <div className="shimmer-bg mt-2 h-4 w-full rounded" />
                    <p className="text-shimmer mt-3 font-mono text-xs font-semibold">
                      {tr("unifiedAnalysis")}...
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
                      <span className="mb-1 font-mono text-xs text-[#00eb88]">{tr("aiConfidence")}</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <AnalysisRow label={tr("asset")} value={aiResult.assetType} />
                      <AnalysisRow label={tr("severity")} value={aiResult.severity} />
                      <AnalysisRow label="SLA" value={`${aiResult.slaHours} hours`} />
                      <AnalysisRow label={tr("duplicateRisk")} value={aiResult.duplicateRisk} />
                      <AnalysisRow label="AI Priority Score" value={`${aiResult.aiPriorityScore}/100`} />
                      <AnalysisRow label="Image Evidence Score" value={`${aiResult.imageEvidenceScore}/100`} />
                      <AnalysisRow label="Model" value={aiResult.modelVersion} />
                    </div>
                    <div className="mt-4 rounded border border-white/10 bg-black/25 p-3">
                      <p className="font-mono text-[10px] uppercase text-[#00dbe9]">{tr("aiVerdict")}</p>
                      <p className="mt-2 text-sm leading-6 text-[#dbc2b0]">{aiResult.recommendedAction}</p>
                      <p className="mt-2 text-xs leading-5 text-[#dbc2b0]/75">
                        Impact: {aiResult.estimatedImpact}
                      </p>
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
                      onClick={() => void runAiVerification()}
                      disabled={aiProcessing}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-[#00dbe9] px-4 py-3 text-sm font-semibold text-[#00363a] transition hover:bg-[#7df4ff] disabled:cursor-wait disabled:opacity-70"
                    >
                      <Sparkles size={16} />
                      {tr("analyzeIssue")}
                    </button>
                  </div>
                )}

                {verified && (
                  <button
                    onClick={() => void runAiVerification()}
                    className="mt-4 w-full rounded border border-[#00dbe9]/40 bg-[#00dbe9]/10 px-4 py-2 font-mono text-xs text-[#00dbe9] transition hover:bg-[#00dbe9]/15"
                  >
                    Re-run unified analysis
                  </button>
                )}
              </section>

              <section className="cp-cyber-card cp-cyber-card-hover rounded-lg p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-mono text-xs uppercase text-[#dbc2b0]">{tr("citizenIdentity")}</h3>
                  <span className="flex items-center gap-1 rounded border border-[#00eb88]/30 bg-[#00eb88]/10 px-2 py-1 font-mono text-[10px] text-[#00eb88]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00eb88]" />
                    {tr("active")}
                  </span>
                </div>
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="grid h-12 w-12 place-items-center rounded border border-white/10 bg-[#201f20] text-[#dbc2b0]">
                    <Fingerprint size={25} />
                  </div>
                  <div>
                    <p className="break-all font-mono text-sm text-white">
                      {getCurrentUser()?.email ?? "citizen-session"}
                    </p>
                    <p className="font-mono text-xs text-[#dbc2b0]/60">
                      Node ID: {selectedCity.key.toUpperCase()}-9942
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between">
                    <span className="font-mono text-[10px] uppercase text-[#dbc2b0]/60">
                      {tr("resolverReputationActive")}
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
                  type="button"
                  onClick={() => {
                    if (imageLoading) {
                      setProofError("Photo is still being prepared. Please wait a moment.");
                      return;
                    }

                    if (!imageDataUrl) {
                      setProofError("Capture or upload a civic issue photo before creating public proof.");
                      return;
                    }

                    setProofError("");
                    void createProof();
                  }}
                  disabled={aiProcessing || submitted || proofCreating}
                  className="royal-blue-glow flex w-full items-center justify-center gap-2 rounded border border-[#2A2D35] bg-[#1A1C23] px-4 py-4 font-mono text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ShieldCheck size={16} />
                  {imageLoading
                    ? "Preparing photo..."
                    : proofCreating
                      ? `${tr("createProof")}...`
                      : submitted
                        ? tr("newProofCreated")
                        : tr("createProof")}
                </button>
                {proofError && (
                  <p className="mt-3 rounded border border-[#ffb4ab]/25 bg-[#ffb4ab]/10 px-3 py-2 text-sm text-[#ffdad6]">
                    {proofError}
                  </p>
                )}
                {!verified && (
                  <p className="mt-3 text-center text-xs text-[#dbc2b0]/60">
                    {tr("unifiedAnalysis")}. {tr("readyToSign")}.
                  </p>
                )}
              </section>

              {submitted && (
                <section className="cp-cyber-card rounded-lg border-[#00eb88]/30 bg-[#00eb88]/10 p-6">
                  <div className="flex items-center gap-2 text-[#00eb88]">
                    <CheckCircle2 size={18} />
                    <p className="font-semibold">{tr("newProofCreated")}</p>
                  </div>
                  <p className="mt-3 text-sm text-[#dbc2b0]">
                  {tr("latestCitizenReport")} {tr("viewOnCommandCenter")}. Fabric anchoring is ready for teammate integration.
                  </p>
                  {aiResult && (
                    <p className="mt-2 text-sm text-[#dbc2b0]">
                      Classified as <span className="text-[#00eb88]">{aiResult.issueType}</span>.
                    </p>
                  )}
                  <div className="mt-3 space-y-2 rounded bg-black/45 p-3 font-mono text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="uppercase text-[#dbc2b0]/55">Proof mode</span>
                      <span className="text-[#ffc08d]">AI/RAG + Fabric pending</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="uppercase text-[#dbc2b0]/55">Fabric-ready hash</span>
                      <span className="truncate text-[#00eb88]">{createdTxHash || "Created"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="uppercase text-[#dbc2b0]/55">Proof bundle</span>
                      <span className="truncate text-[#7df4ff]">{createdProofHash || "Stored"}</span>
                    </div>
                  </div>
                  <Link
                    href="/"
                    className="mt-4 inline-flex w-full items-center justify-center rounded border border-[#00eb88]/30 bg-[#00eb88]/10 px-4 py-2 text-sm font-semibold text-[#00eb88] transition hover:bg-[#00eb88]/20"
                  >
                    {tr("viewOnCommandCenter")}
                  </Link>
                </section>
              )}
            </aside>
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

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-white/10 bg-black/25 px-3 py-2">
      <span className="font-mono text-[10px] uppercase text-[#dbc2b0]/55">{label}</span>
      <span className="text-right text-xs font-semibold text-white">{value}</span>
    </div>
  );
}

