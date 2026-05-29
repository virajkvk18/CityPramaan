"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { DemoCity } from "./city-context";
import {
  getDetectedLocationSnapshot,
  parseDetectedLocation,
  subscribeDetectedLocation,
} from "./detected-location-storage";

export function useDetectedLocationDisplay(selectedCity: DemoCity) {
  const locationSnapshot = useSyncExternalStore(
    subscribeDetectedLocation,
    getDetectedLocationSnapshot,
    () => ""
  );
  const detectedLocation = useMemo(
    () => parseDetectedLocation(locationSnapshot),
    [locationSnapshot]
  );
  const isDetectedForSelected =
    detectedLocation?.status === "detected" &&
    detectedLocation.nearestCityKey === selectedCity.key;
  const cityName = isDetectedForSelected ? detectedLocation.cityName : selectedCity.name;
  const regionName = isDetectedForSelected ? detectedLocation.regionName : selectedCity.state;
  const locationLabel = isDetectedForSelected
    ? detectedLocation.displayName
    : `${selectedCity.primaryArea}, ${selectedCity.state}`;
  const coordinates =
    isDetectedForSelected && detectedLocation
      ? `${detectedLocation.latitude.toFixed(5)}, ${detectedLocation.longitude.toFixed(5)}`
      : `${selectedCity.lat.toFixed(5)}, ${selectedCity.lng.toFixed(5)}`;

  return {
    detectedLocation,
    isDetectedForSelected,
    cityName,
    regionName,
    locationLabel,
    coordinates,
  };
}
