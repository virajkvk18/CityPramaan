"use client";

import { Languages } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  indianLanguages,
  translate,
  type LanguageKey,
} from "@/src/lib/language-context";
import {
  getLanguageSnapshot,
  setSelectedLanguageKey,
  subscribeLanguage,
} from "@/src/lib/language-storage";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const languageSnapshot = useSyncExternalStore(
    subscribeLanguage,
    getLanguageSnapshot,
    () => "en"
  );

  return (
    <label
      className={`flex items-center gap-2 rounded border border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff] ${
        compact ? "px-2 py-2" : "px-3 py-2"
      }`}
    >
      <Languages size={15} />
      {!compact && (
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">
          {translate(languageSnapshot, "language")}
        </span>
      )}
      <select
        value={languageSnapshot}
        onChange={(event) => setSelectedLanguageKey(event.target.value as LanguageKey)}
        className="bg-transparent font-mono text-xs font-bold text-[#7df4ff] outline-none"
        aria-label="Select language"
      >
        {indianLanguages.map((language) => (
          <option key={language.key} value={language.key} className="bg-[#050505] text-white">
            {language.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
