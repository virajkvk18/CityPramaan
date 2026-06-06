"use client";

import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    try {
      window.localStorage.setItem("citypramaan-theme", "bright");
      document.documentElement.dataset.theme = "bright";
      document.documentElement.style.colorScheme = "light";
    } catch {
      document.documentElement.dataset.theme = "bright";
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  return null;
}
