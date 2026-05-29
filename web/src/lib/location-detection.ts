import { getNearestSupportedCity } from "./city-context";
import { setAutoSelectedCityKey } from "./city-storage";
import {
  type DetectedLocation,
  setDetectedLocation,
} from "./detected-location-storage";

export function detectCurrentCity() {
  return new Promise<DetectedLocation>((resolve) => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      resolve(saveUnavailableLocation("Location can only be detected in a browser."));
      return;
    }

    if (!window.isSecureContext) {
      resolve(saveUnavailableLocation("Location requires HTTPS or localhost."));
      return;
    }

    if (!navigator.geolocation) {
      resolve(saveUnavailableLocation("This browser does not support location detection."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void applyDetectedPosition(position).then(resolve);
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;

        resolve(
          saveUnavailableLocation(
            denied
              ? "Location permission blocked. Enable site location permission in your browser."
              : "Location unavailable. Try again or check GPS/network settings.",
            denied ? "denied" : "failed"
          )
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 15_000 }
    );
  });
}

async function applyDetectedPosition(position: GeolocationPosition) {
  const latitude = Number(position.coords.latitude.toFixed(6));
  const longitude = Number(position.coords.longitude.toFixed(6));
  const nearestCity = getNearestSupportedCity(latitude, longitude);
  const geocoded = await reverseGeocodeCity(latitude, longitude);
  const location: DetectedLocation = {
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
  };

  setDetectedLocation(location);
  setAutoSelectedCityKey(nearestCity.key);

  return location;
}

function saveUnavailableLocation(
  displayName: string,
  status: DetectedLocation["status"] = "unavailable"
) {
  const fallback = getNearestSupportedCity(23.2599, 77.4126);
  const location: DetectedLocation = {
    cityName: fallback.name,
    regionName: fallback.state,
    countryName: "India",
    displayName,
    latitude: fallback.lat,
    longitude: fallback.lng,
    nearestCityKey: fallback.key,
    status,
    updatedAt: new Date().toISOString(),
  };

  setDetectedLocation(location);
  return location;
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
