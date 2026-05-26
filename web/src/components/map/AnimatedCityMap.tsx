"use client";

import type { DemoCity } from "@/src/lib/city-context";
import type { CivicReport, ReportStatus } from "@/src/lib/mock-data";
import { useLanguage } from "@/src/lib/use-language";

type AnimatedCityMapProps = {
  reports: CivicReport[];
  city: DemoCity;
};

const pinTone: Record<
  ReportStatus,
  {
    label: string;
    dot: string;
    pulse: string;
    stem: string;
    text: string;
  }
> = {
  OPEN: {
    label: "Open",
    dot: "bg-[#ffb4ab]",
    pulse: "stitch-pin-rose",
    stem: "from-[#ffb4ab]",
    text: "text-[#ffb4ab]",
  },
  PENDING_PROOF: {
    label: "Pending Proof",
    dot: "bg-[#00dbe9]",
    pulse: "stitch-pin-cyan",
    stem: "from-[#00dbe9]",
    text: "text-[#7df4ff]",
  },
  REPAIR_SUBMITTED: {
    label: "Repair Submitted",
    dot: "bg-[#ff9933]",
    pulse: "stitch-pin-amber",
    stem: "from-[#ff9933]",
    text: "text-[#ffc08d]",
  },
  UNDER_WARRANTY: {
    label: "Under Warranty",
    dot: "bg-[#3b82f6]",
    pulse: "stitch-pin-blue",
    stem: "from-[#3b82f6]",
    text: "text-[#93c5fd]",
  },
  REPEAT_FAILURE: {
    label: "Repeat Failure",
    dot: "bg-[#d946ef]",
    pulse: "stitch-pin-fuchsia",
    stem: "from-[#d946ef]",
    text: "text-[#f0abfc]",
  },
  CLOSED: {
    label: "Closed",
    dot: "bg-[#00eb88]",
    pulse: "stitch-pin-emerald",
    stem: "from-[#00eb88]",
    text: "text-[#5bffa1]",
  },
};

const mockOffsets = [
  { lat: 0.0048, lng: -0.0064 },
  { lat: 0.0061, lng: 0.0072 },
  { lat: -0.0032, lng: 0.0044 },
  { lat: -0.0065, lng: -0.005 },
  { lat: 0.0012, lng: 0.009 },
  { lat: -0.0018, lng: -0.0084 },
  { lat: 0.0076, lng: -0.001 },
];

export function AnimatedCityMap({ reports, city }: AnimatedCityMapProps) {
  const { t } = useLanguage();
  const visibleReports = reports.filter((report) => report.status !== "CLOSED");
  const mapSpan = 0.028;
  const minLat = city.lat - mapSpan;
  const maxLat = city.lat + mapSpan;
  const minLng = city.lng - mapSpan;
  const maxLng = city.lng + mapSpan;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${city.lat}%2C${city.lng}`;
  const statusLabels: Record<ReportStatus, string> = {
    OPEN: t("openIssues"),
    PENDING_PROOF: t("pendingProof"),
    REPAIR_SUBMITTED: t("repairSubmitted"),
    UNDER_WARRANTY: t("underWarranty"),
    REPEAT_FAILURE: t("repeatFailure"),
    CLOSED: "Closed",
  };
  const visibleStatuses = (Object.keys(pinTone) as ReportStatus[]).filter(
    (status) => status !== "CLOSED"
  );

  return (
    <div className="glass-panel relative min-h-[430px] flex-1 overflow-hidden rounded-md border border-white/10 bg-[#101014] shadow-[0_0_36px_rgba(0,0,0,0.55)] sm:min-h-[540px] lg:min-h-[620px]">
      <iframe
        title={`${city.name} OpenStreetMap civic repair mock layer`}
        src={osmSrc}
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.01] border-0 opacity-75 grayscale contrast-125 brightness-75 saturate-50"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(0,219,233,0.12),transparent_34%),linear-gradient(180deg,rgba(5,5,5,0.03),rgba(5,5,5,0.58))]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,219,233,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,219,233,0.12)_1px,transparent_1px)] bg-[size:46px_46px] opacity-18" />
      <div className="cp-map-radar pointer-events-none absolute left-1/2 top-1/2 z-10 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[360px] sm:w-[360px]" />
      <div className="cp-map-sweep pointer-events-none absolute inset-0 z-10" />

      <svg className="absolute inset-0 z-10 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1000 620">
        <path d="M 420 180 Q 520 90 720 120" fill="none" stroke="rgba(0,219,233,0.18)" strokeWidth="2" />
        <path className="data-flow-line" d="M 420 180 Q 520 90 720 120" fill="none" stroke="#00dbe9" strokeWidth="2" />

        <path d="M 610 300 Q 510 250 420 180" fill="none" stroke="rgba(217,70,239,0.18)" strokeWidth="2" />
        <path
          className="data-flow-line"
          d="M 610 300 Q 510 250 420 180"
          fill="none"
          stroke="#d946ef"
          strokeWidth="2"
          style={{ animationDelay: "1.4s", animationDuration: "3s" }}
        />

        <path d="M 205 520 Q 395 410 610 300" fill="none" stroke="rgba(255,153,51,0.18)" strokeWidth="2" />
        <path
          className="data-flow-line"
          d="M 205 520 Q 395 410 610 300"
          fill="none"
          stroke="#ff9933"
          strokeWidth="2"
          style={{ animationDelay: "2s", animationDuration: "4.5s" }}
        />

        <path d="M 120 220 Q 250 160 420 180" fill="none" stroke="rgba(0,235,136,0.15)" strokeWidth="2" />
        <path
          className="data-flow-line"
          d="M 120 220 Q 250 160 420 180"
          fill="none"
          stroke="#00eb88"
          strokeWidth="2"
          style={{ animationDelay: "0.8s", animationDuration: "3.7s" }}
        />

        <path d="M 720 120 Q 835 260 790 430" fill="none" stroke="rgba(59,130,246,0.16)" strokeWidth="2" />
        <path
          className="data-flow-line"
          d="M 720 120 Q 835 260 790 430"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          style={{ animationDelay: "1.9s", animationDuration: "4.2s" }}
        />
      </svg>

      <div className="absolute left-3 right-3 top-3 z-30 grid grid-cols-3 gap-2 sm:left-5 sm:right-auto sm:top-5 sm:flex sm:flex-wrap">
        <SignalPill label="Map Layer" value="OSM Mock" tone="text-[#00dbe9]" />
        <SignalPill label="Nodes Verified" value={`${214 + visibleReports.length}`} tone="text-[#00eb88]" />
        <SignalPill label="Risk Index" value="High" tone="text-[#ffc08d]" />
      </div>

      <div className="absolute right-5 top-5 z-30 hidden max-w-xs rounded-md border border-[#ffc08d]/30 bg-black/65 p-3 backdrop-blur-md sm:block">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffc08d]">
          Mock civic issue layer
        </p>
        <p className="mt-1 text-xs leading-5 text-[#dbc2b0]">
          Pins are generated around {city.primaryArea}. Real MVP can replace this with GPS reports.
        </p>
      </div>

      <div className="absolute inset-0 z-20">
        {visibleReports.map((report, index) => {
          const tone = pinTone[report.status];
          const offset = mockOffsets[index % mockOffsets.length];
          const lat = city.lat + offset.lat;
          const lng = city.lng + offset.lng;
          const x = clamp(((lng - minLng) / (maxLng - minLng)) * 100, 8, 92);
          const y = clamp((1 - (lat - minLat) / (maxLat - minLat)) * 100, 12, 88);

          return (
            <div
              key={`${report.id}-${city.key}`}
              className="sensor-flicker group absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center"
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${index * 0.22}s` }}
            >
              <div className={`h-3.5 w-3.5 rounded-full ${tone.dot} ${tone.pulse} sm:h-4 sm:w-4`} />
              <div className={`h-6 w-px bg-gradient-to-b ${tone.stem} to-transparent sm:h-9`} />
              <div className="hidden translate-y-1 rounded-md border border-white/10 bg-[#131314]/90 px-3 py-2 text-xs opacity-90 shadow-[0_0_18px_rgba(0,0,0,0.45)] backdrop-blur-md transition group-hover:-translate-y-1 group-hover:opacity-100 sm:block">
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold ${tone.text}`}>{report.id}</span>
                  <span className="text-[#dbc2b0]">{statusLabels[report.status]}</span>
                </div>
                <p className="mt-1 max-w-44 truncate text-[#a38d7c]">{report.location}</p>
                <p className="mt-1 font-mono text-[10px] text-[#dbc2b0]/50">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 h-44 bg-gradient-to-t from-black via-black/55 to-transparent" />

      <div className="absolute bottom-3 left-3 z-30 max-w-[calc(100%-1.5rem)] rounded-md border border-white/10 bg-[#131314]/85 p-3 text-[11px] text-[#dbc2b0] backdrop-blur-md sm:bottom-5 sm:left-5 sm:p-4 sm:text-xs">
        <div className="mb-2 font-mono font-bold uppercase tracking-[0.16em] text-[#e5e2e3] sm:mb-3 sm:tracking-[0.18em]">{t("publicStatus")}</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-1">
          {visibleStatuses.map((status) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${pinTone[status].dot}`} />
              {statusLabels[status]}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-5 right-5 z-30 hidden rounded-md border border-[#00dbe9]/20 bg-[#050505]/70 p-4 text-right backdrop-blur-md md:block">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#00dbe9]">
          {t("liveCivicStream")}
        </p>
        <p className="mt-2 text-2xl font-black text-white">{visibleReports.length}</p>
        <p className="mt-1 text-xs text-[#dbc2b0]">{t("activeReports")}: {city.primaryArea}</p>
      </div>
    </div>
  );
}

function SignalPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-black/55 px-2 py-2 backdrop-blur-md sm:px-3">
      <p className="truncate font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-[#a38d7c] sm:text-[10px] sm:tracking-[0.18em]">{label}</p>
      <p className={`mt-1 truncate font-mono text-xs font-bold sm:text-sm ${tone}`}>{value}</p>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
