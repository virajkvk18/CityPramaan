import type { CityKey } from "./city-context";

export const DETECTED_LOCATION_KEY = "city-pramaan:detected-location";
export const DETECTED_LOCATION_UPDATED_EVENT = "city-pramaan:detected-location-updated";

export type DetectedLocation = {
  cityName: string;
  regionName: string;
  countryName: string;
  displayName: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  nearestCityKey: CityKey;
  status: "detected" | "denied" | "unavailable" | "failed";
  updatedAt: string;
};

export function getDetectedLocationSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(DETECTED_LOCATION_KEY) ?? "";
}

export function parseDetectedLocation(snapshot: string) {
  if (!snapshot) {
    return null;
  }

  try {
    return JSON.parse(snapshot) as DetectedLocation;
  } catch {
    return null;
  }
}

export function setDetectedLocation(location: DetectedLocation) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DETECTED_LOCATION_KEY, JSON.stringify(location));
  window.dispatchEvent(new Event(DETECTED_LOCATION_UPDATED_EVENT));
}

export function subscribeDetectedLocation(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === DETECTED_LOCATION_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(DETECTED_LOCATION_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(DETECTED_LOCATION_UPDATED_EVENT, callback);
  };
}
