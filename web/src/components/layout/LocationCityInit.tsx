"use client";

import { useEffect } from "react";
import { getNearestSupportedCity } from "@/src/lib/city-context";
import { setAutoSelectedCityKey } from "@/src/lib/city-storage";
import { setDetectedLocation } from "@/src/lib/detected-location-storage";

const LOCATION_REQUESTED_SESSION_KEY = "city-pramaan:location-requested-this-session";

export function LocationCityInit() {
  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    if (window.sessionStorage.getItem(LOCATION_REQUESTED_SESSION_KEY) === "true") {
      return;
    }

    window.sessionStorage.setItem(LOCATION_REQUESTED_SESSION_KEY, "true");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void applyDetectedPosition(position);
      },
      (error) => {
        const fallback = getNearestSupportedCity(23.2599, 77.4126);

        setDetectedLocation({
          cityName: fallback.name,
          regionName: fallback.state,
          countryName: "India",
          displayName:
            error.code === error.PERMISSION_DENIED
              ? "Location permission blocked"
              : "Location unavailable",
          latitude: fallback.lat,
          longitude: fallback.lng,
          nearestCityKey: fallback.key,
          status: error.code === error.PERMISSION_DENIED ? "denied" : "failed",
          updatedAt: new Date().toISOString(),
        });
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60_000 }
    );
  }, []);

  return null;
}

async function applyDetectedPosition(position: GeolocationPosition) {
  const latitude = Number(position.coords.latitude.toFixed(6));
  const longitude = Number(position.coords.longitude.toFixed(6));
  const nearestCity = getNearestSupportedCity(latitude, longitude);
  const geocoded = await reverseGeocodeCity(latitude, longitude);

  setDetectedLocation({
    cityName: geocoded.cityName || nearestCity.name,
    regionName: geocoded.regionName || nearestCity.state,
    countryName: geocoded.countryName || "India",
    displayName:
      geocoded.displayName ||
      `${geocoded.cityName || nearestCity.name}, ${geocoded.regionName || nearestCity.state}`,
    latitude,
    longitude,
    accuracy: Number.isFinite(position.coords.accuracy)
      ? Math.round(position.coords.accuracy)
      : undefined,
    nearestCityKey: nearestCity.key,
    status: "detected",
    updatedAt: new Date().toISOString(),
  });
  setAutoSelectedCityKey(nearestCity.key);
}

type ReverseGeocodeCityResult = {
  cityName: string;
  regionName: string;
  countryName: string;
  displayName: string;
};

async function reverseGeocodeCity(latitude: number, longitude: number): Promise<ReverseGeocodeCityResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return emptyReverseGeocode();
    }

    const data = (await response.json()) as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };
    const address = data.address ?? {};
    const cityName =
      address.city ??
      address.town ??
      address.municipality ??
      address.city_district ??
      address.county ??
      address.state_district ??
      address.village ??
      firstDisplaySegment(data.display_name);
    const regionName = address.state ?? address.region ?? address.state_district ?? "";
    const countryName = address.country ?? "India";
    const displayName = [cityName, regionName, countryName].filter(Boolean).join(", ");

    return {
      cityName: cityName ?? "",
      regionName,
      countryName,
      displayName: displayName || data.display_name || "",
    };
  } catch {
    return emptyReverseGeocode();
  }
}

function firstDisplaySegment(displayName = "") {
  return displayName.split(",").map((part) => part.trim()).find(Boolean) ?? "";
}

function emptyReverseGeocode(): ReverseGeocodeCityResult {
  return {
    cityName: "",
    regionName: "",
    countryName: "",
    displayName: "",
  };
}
