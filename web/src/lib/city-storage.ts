import { DEFAULT_CITY_KEY, type CityKey } from "./city-context";

export const SELECTED_CITY_KEY = "city-pramaan:selected-city";
export const SELECTED_CITY_SOURCE_KEY = "city-pramaan:selected-city-source";
export const CITY_UPDATED_EVENT = "city-pramaan:city-updated";

export type CitySelectionSource = "manual" | "auto";

export function getCitySnapshot() {
  if (typeof window === "undefined") {
    return DEFAULT_CITY_KEY;
  }

  return window.localStorage.getItem(SELECTED_CITY_KEY) ?? DEFAULT_CITY_KEY;
}

export function getCitySelectionSourceSnapshot(): CitySelectionSource | "default" {
  if (typeof window === "undefined") {
    return "default";
  }

  const source = window.localStorage.getItem(SELECTED_CITY_SOURCE_KEY);

  return source === "manual" || source === "auto" ? source : "default";
}

export function setSelectedCityKey(cityKey: CityKey) {
  setCityKey(cityKey, "manual");
}

export function setAutoSelectedCityKey(cityKey: CityKey) {
  if (typeof window === "undefined") {
    return;
  }

  setCityKey(cityKey, "auto");
}

function setCityKey(cityKey: CityKey, source: CitySelectionSource) {
  window.localStorage.setItem(SELECTED_CITY_KEY, cityKey);
  window.localStorage.setItem(SELECTED_CITY_SOURCE_KEY, source);
  window.dispatchEvent(new Event(CITY_UPDATED_EVENT));
}

export function subscribeCity(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === SELECTED_CITY_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(CITY_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CITY_UPDATED_EVENT, callback);
  };
}
