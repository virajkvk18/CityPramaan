"use client";

import { useEffect } from "react";
import { detectCurrentCity } from "@/src/lib/location-detection";

let automaticLocationRequestStarted = false;

export function LocationCityInit() {
  useEffect(() => {
    if (automaticLocationRequestStarted) {
      return;
    }

    automaticLocationRequestStarted = true;
    void detectCurrentCity();
  }, []);

  return null;
}
