"use client";

import { useEffect } from "react";
import { detectCurrentCity } from "@/src/lib/location-detection";
import {
  getDetectedLocationSnapshot,
  parseDetectedLocation,
} from "@/src/lib/detected-location-storage";
import { setAutoSelectedCityKey } from "@/src/lib/city-storage";

let automaticLocationRequestStarted = false;

export function LocationCityInit() {
  useEffect(() => {
    if (automaticLocationRequestStarted) {
      return;
    }

    automaticLocationRequestStarted = true;
    const savedLocation = parseDetectedLocation(getDetectedLocationSnapshot());

    if (savedLocation?.status === "detected") {
      setAutoSelectedCityKey(savedLocation.nearestCityKey);
    }

    void detectCurrentCity();
  }, []);

  return null;
}
