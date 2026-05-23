"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "dark" | "bright";

const storageKey = "citypramaan-theme";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "bright" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const savedTheme = window.localStorage.getItem(storageKey) as ThemeMode | null;

    return savedTheme === "bright" ? "bright" : "dark";
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "bright" ? "dark" : "bright"));
  }

  const isBright = theme === "bright";
  const Icon = isBright ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#dbc2b0] transition hover:border-[#00dbe9]/45 hover:bg-[#00dbe9]/10 hover:text-[#7df4ff]"
      aria-label={`Switch to ${isBright ? "dark" : "bright"} theme`}
    >
      <Icon size={15} />
      <span className="hidden sm:inline">{isBright ? "Dark" : "Bright"}</span>
    </button>
  );
}
