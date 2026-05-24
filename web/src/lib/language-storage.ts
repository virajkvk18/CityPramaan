import { DEFAULT_LANGUAGE_KEY, isLanguageKey, type LanguageKey } from "./language-context";

export const SELECTED_LANGUAGE_KEY = "city-pramaan:selected-language";
export const LANGUAGE_UPDATED_EVENT = "city-pramaan:language-updated";

export function getLanguageSnapshot() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE_KEY;
  }

  const stored = window.localStorage.getItem(SELECTED_LANGUAGE_KEY);
  return stored && isLanguageKey(stored) ? stored : DEFAULT_LANGUAGE_KEY;
}

export function setSelectedLanguageKey(languageKey: LanguageKey) {
  window.localStorage.setItem(SELECTED_LANGUAGE_KEY, languageKey);
  window.dispatchEvent(new Event(LANGUAGE_UPDATED_EVENT));
}

export function subscribeLanguage(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === SELECTED_LANGUAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(LANGUAGE_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(LANGUAGE_UPDATED_EVENT, callback);
  };
}
