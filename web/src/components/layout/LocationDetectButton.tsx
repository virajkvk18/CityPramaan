"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { LocateFixed } from "lucide-react";
import {
  getDetectedLocationSnapshot,
  parseDetectedLocation,
  subscribeDetectedLocation,
} from "@/src/lib/detected-location-storage";
import { detectCurrentCity } from "@/src/lib/location-detection";

type LocationDetectButtonProps = {
  compact?: boolean;
};

export function LocationDetectButton({ compact = false }: LocationDetectButtonProps) {
  const [detecting, setDetecting] = useState(false);
  const snapshot = useSyncExternalStore(
    subscribeDetectedLocation,
    getDetectedLocationSnapshot,
    () => ""
  );
  const detectedLocation = useMemo(() => parseDetectedLocation(snapshot), [snapshot]);
  const isDetected = detectedLocation?.status === "detected";
  const isBlocked = detectedLocation?.status === "denied";

  async function requestLocation() {
    setDetecting(true);

    try {
      await detectCurrentCity();
    } finally {
      setDetecting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={requestLocation}
      disabled={detecting}
      title={
        isBlocked
          ? "Location is blocked. Enable location permission for this site in your browser."
          : "Detect your current city using browser GPS"
      }
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-wait disabled:opacity-70 ${
        isDetected
          ? "border-[#00eb88]/40 bg-[#00eb88]/10 text-[#5bffa1] hover:bg-[#00eb88]/15"
          : isBlocked
            ? "border-[#ffb4ab]/40 bg-[#ffb4ab]/10 text-[#ffdad6] hover:bg-[#ffb4ab]/15"
            : "border-[#00dbe9]/40 bg-[#00dbe9]/10 text-[#7df4ff] hover:bg-[#00dbe9]/15"
      } ${compact ? "w-full sm:w-auto" : "w-full sm:w-auto"}`}
    >
      <LocateFixed size={16} className={detecting ? "animate-spin" : ""} />
      {detecting
        ? "Detecting"
        : isDetected
          ? detectedLocation.cityName
          : isBlocked
            ? "Location Blocked"
            : "Detect City"}
    </button>
  );
}
