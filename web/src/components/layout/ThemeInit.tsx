"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("citypramaan-theme");
      const theme = savedTheme === "bright" ? "bright" : "dark";

      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme === "bright" ? "light" : "dark";
    } catch {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.style.colorScheme = "dark";
    }
  }, []);

  return null;
}
