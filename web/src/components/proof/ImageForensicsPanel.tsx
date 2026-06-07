import { AlertTriangle, BadgeCheck, Fingerprint, ScanSearch, ShieldAlert } from "lucide-react";
import type { ImageForensicsResult } from "@/src/lib/image-forensics-types";

type ImageForensicsPanelProps = {
  title: string;
  loading?: boolean;
  result?: ImageForensicsResult | null;
};

export function ImageForensicsPanel({ title, loading = false, result }: ImageForensicsPanelProps) {
  const tone = getTone(result);
  const Icon = result?.decision === "ACCEPT" ? BadgeCheck : result?.decision === "REJECT" ? ShieldAlert : ScanSearch;

  return (
    <div className={`mt-4 rounded-lg border p-4 ${tone.shell}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded border ${tone.icon}`}>
            {loading ? <ScanSearch size={18} className="animate-pulse" /> : <Icon size={18} />}
          </div>
          <div>
            <p className={`font-mono text-xs font-bold uppercase tracking-[0.16em] ${tone.heading}`}>
              {title}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#dbc2b0]">
              {loading
                ? "Scanning AI artifacts, edit risk, EXIF metadata, GPS match, duplicate reuse, and proof consistency..."
                : result?.forensicSummary ?? "Upload an image to run civic proof forensics."}
            </p>
          </div>
        </div>

        {result && (
          <div className="rounded border border-white/10 bg-black/35 px-3 py-2 text-right font-mono">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#dbc2b0]/60">Fraud Score</p>
            <p className={`mt-1 text-2xl font-black ${tone.score}`}>{result.fraudScore}/100</p>
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <ForensicsMetric label="Decision" value={formatEnum(result.decision)} tone={tone.metric} />
            <ForensicsMetric label="Risk" value={formatEnum(result.riskLevel)} tone={tone.metric} />
            <ForensicsMetric label="Authenticity" value={formatEnum(result.authenticity)} tone={tone.metric} />
            <ForensicsMetric label="Duplicate" value={formatEnum(result.duplicateStatus)} tone={tone.metric} />
            <ForensicsMetric label="Metadata" value={formatEnum(result.metadataStatus)} tone={tone.metric} />
            <ForensicsMetric label="GPS" value={formatEnum(result.gpsConsistency)} tone={tone.metric} />
            <ForensicsMetric label="AI Generated" value={`${result.aiGeneratedConfidence}%`} tone={tone.metric} />
            <ForensicsMetric label="Manipulation" value={`${result.manipulationConfidence}%`} tone={tone.metric} />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded border border-white/10 bg-black/30 p-3">
              <div className="mb-2 flex items-center gap-2 text-[#7df4ff]">
                <Fingerprint size={14} />
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">Image Proof Hash</p>
              </div>
              <p className="break-all font-mono text-xs text-white">{result.imageHash}</p>
              <p className="mt-2 break-all font-mono text-[11px] text-[#dbc2b0]/65">
                Perceptual hash: {result.perceptualHash || "Unavailable"}
              </p>
            </div>

            <div className="rounded border border-white/10 bg-black/30 p-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#dbc2b0]/70">
                Metadata
              </p>
              <div className="mt-2 grid gap-1 text-xs text-[#dbc2b0]">
                <span>Device: {result.metadata.deviceInfo || "Not available"}</span>
                <span>Taken at: {result.metadata.takenAt || "Not available"}</span>
                <span>
                  EXIF GPS:{" "}
                  {result.metadata.gpsLatitude && result.metadata.gpsLongitude
                    ? `${result.metadata.gpsLatitude.toFixed(5)}, ${result.metadata.gpsLongitude.toFixed(5)}`
                    : "Not available"}
                </span>
              </div>
            </div>
          </div>

          {(result.reasons.length > 0 || result.duplicateMatches.length > 0 || result.aiFallbackReason) && (
            <div className="mt-4 rounded border border-white/10 bg-black/25 p-3">
              <div className="flex items-center gap-2 text-[#ffc08d]">
                <AlertTriangle size={14} />
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">Review Signals</p>
              </div>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-[#dbc2b0]">
                {result.reasons.map((reason) => (
                  <li key={reason}>- {reason}</li>
                ))}
                {result.duplicateMatches.map((match) => (
                  <li key={`${match.reportId}-${match.imageRole}-${match.matchType}`}>
                    - Matches {match.reportId} {match.imageRole} image ({match.matchType}, distance {match.distance})
                  </li>
                ))}
                {result.aiFallbackReason && <li>- {result.aiFallbackReason}</li>}
              </ul>
            </div>
          )}

          <div className="mt-4 rounded border border-[#00dbe9]/15 bg-[#00dbe9]/10 p-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7df4ff]">
              Blockchain/Fabric Audit Payload
            </p>
            <p className="mt-2 text-xs leading-5 text-[#d3fbff]">
              Stores image hash, perceptual hash, fraud score, decision, timestamp, and reviewer action for a
              tamper-evident proof trail.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function ForensicsMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded border bg-black/30 px-3 py-2 ${tone}`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#dbc2b0]/55">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function getTone(result?: ImageForensicsResult | null) {
  if (!result) {
    return {
      shell: "border-[#00dbe9]/20 bg-[#00dbe9]/10",
      icon: "border-[#00dbe9]/35 bg-[#00dbe9]/10 text-[#7df4ff]",
      heading: "text-[#7df4ff]",
      score: "text-[#7df4ff]",
      metric: "border-[#00dbe9]/15",
    };
  }

  if (result.decision === "ACCEPT") {
    return {
      shell: "border-[#00eb88]/25 bg-[#00eb88]/10",
      icon: "border-[#00eb88]/35 bg-[#00eb88]/10 text-[#5bffa1]",
      heading: "text-[#5bffa1]",
      score: "text-[#5bffa1]",
      metric: "border-[#00eb88]/15",
    };
  }

  if (result.decision === "REJECT") {
    return {
      shell: "border-[#ffb4ab]/30 bg-[#ffb4ab]/10",
      icon: "border-[#ffb4ab]/35 bg-[#ffb4ab]/10 text-[#ffb4ab]",
      heading: "text-[#ffb4ab]",
      score: "text-[#ffb4ab]",
      metric: "border-[#ffb4ab]/15",
    };
  }

  return {
    shell: "border-[#ffc08d]/30 bg-[#ffc08d]/10",
    icon: "border-[#ffc08d]/35 bg-[#ffc08d]/10 text-[#ffc08d]",
    heading: "text-[#ffc08d]",
    score: "text-[#ffc08d]",
    metric: "border-[#ffc08d]/15",
  };
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
