import type { CivicReport } from "./mock-data";

export const LOCAL_REPORTS_KEY = "city-pramaan:local-reports";

export function loadLocalReports(): CivicReport[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_REPORTS_KEY);
    return raw ? (JSON.parse(raw) as CivicReport[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalReport(report: CivicReport) {
  const existing = loadLocalReports().filter((item) => item.id !== report.id);
  window.localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify([report, ...existing]));
  window.dispatchEvent(new Event("city-pramaan:reports-updated"));
}

export function clearLocalReports() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOCAL_REPORTS_KEY);
  window.dispatchEvent(new Event("city-pramaan:reports-updated"));
}

export function getLocalReportsSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(LOCAL_REPORTS_KEY) ?? "[]";
}

export function subscribeLocalReports(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === LOCAL_REPORTS_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("city-pramaan:reports-updated", callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("city-pramaan:reports-updated", callback);
  };
}
