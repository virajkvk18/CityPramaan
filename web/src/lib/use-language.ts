"use client";

import { useSyncExternalStore } from "react";
import { getLanguageSnapshot, subscribeLanguage } from "./language-storage";
import { translate, type TranslationKey } from "./language-context";

export function useLanguage() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguageSnapshot, () => "en");

  return {
    language,
    t: (key: TranslationKey) => translate(language, key),
  };
}
