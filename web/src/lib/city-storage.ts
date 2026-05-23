import { DEFAULT_CITY_KEY, type CityKey } from "./city-context";

export const SELECTED_CITY_KEY = "city-pramaan:selected-city";

export function getCitySnapshot() {
  if (typeof window === "undefined") {
    return DEFAULT_CITY_KEY;
  }

  return window.localStorage.getItem(SELECTED_CITY_KEY) ?? DEFAULT_CITY_KEY;
}

export function setSelectedCityKey(cityKey: CityKey) {
  window.localStorage.setItem(SELECTED_CITY_KEY, cityKey);
  window.dispatchEvent(new Event("city-pramaan:city-updated"));
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
  window.addEventListener("city-pramaan:city-updated", callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("city-pramaan:city-updated", callback);
  };
}
