import type { CivicReport } from "./mock-data";
import { loadLocalReports, saveLocalReports, upsertLocalReport } from "./report-storage";

type ReportsResponse = {
  reports?: CivicReport[];
  report?: CivicReport;
};

const DEFAULT_REPORT_POLL_MS = 6000;

export async function fetchBackendReports(cityKey?: string) {
  const query = cityKey ? `?cityKey=${encodeURIComponent(cityKey)}` : "";

  try {
    const response = await fetch(`/api/reports${query}`, { cache: "no-store" });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as ReportsResponse;
    return Array.isArray(payload.reports) ? payload.reports : [];
  } catch (error) {
    console.warn("CityPramaan backend reports unavailable:", error);
    return [];
  }
}

export async function syncReportToBackend(report: CivicReport) {
  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(stripReportMedia(report)),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      console.warn("CityPramaan report backend sync failed:", errorBody ?? response.statusText);
      return;
    }

    const payload = (await response.json().catch(() => null)) as ReportsResponse | null;
    if (payload?.report) {
      mergeReportsIntoLocalCache([payload.report]);
    }
  } catch (error) {
    console.warn("CityPramaan report backend sync unavailable:", error);
  }
}

export function saveReportEverywhere(report: CivicReport) {
  const syncedReport = {
    ...report,
    updatedAt: new Date().toISOString(),
  };

  upsertLocalReport(syncedReport);
  return syncReportToBackend(syncedReport);
}

export function mergeReportsById(...groups: CivicReport[][]) {
  const reportsById = new Map<string, CivicReport>();

  for (const group of groups) {
    for (const report of group) {
      const existing = reportsById.get(report.id);
      reportsById.set(report.id, existing ? mergeReportByFreshness(existing, report) : report);
    }
  }

  return Array.from(reportsById.values());
}

export function mergeReportsIntoLocalCache(reports: CivicReport[]) {
  if (typeof window === "undefined" || !reports.length) {
    return;
  }

  const existingReports = loadLocalReports();
  const mergedReports = mergeReportsById(existingReports, reports).sort(sortNewestFirst);

  if (JSON.stringify(existingReports) !== JSON.stringify(mergedReports)) {
    saveLocalReports(mergedReports);
  }
}

export function watchBackendReports(
  cityKey: string | undefined,
  onReports: (reports: CivicReport[]) => void,
  pollMs = DEFAULT_REPORT_POLL_MS
) {
  let active = true;
  let intervalId: number | undefined;

  async function loadReports() {
    const reports = await fetchBackendReports(cityKey);

    if (!active) {
      return;
    }

    onReports(reports);
    mergeReportsIntoLocalCache(reports);
  }

  void loadReports();

  if (typeof window !== "undefined") {
    intervalId = window.setInterval(() => {
      void loadReports();
    }, pollMs);
  }

  return () => {
    active = false;

    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}

function mergeReportByFreshness(first: CivicReport, second: CivicReport) {
  const newest = reportTime(second) >= reportTime(first) ? second : first;
  const oldest = newest === second ? first : second;

  return {
    ...oldest,
    ...newest,
    issueImageDataUrl: newest.issueImageDataUrl ?? oldest.issueImageDataUrl,
    repairImageDataUrl: newest.repairImageDataUrl ?? oldest.repairImageDataUrl,
  };
}

function sortNewestFirst(first: CivicReport, second: CivicReport) {
  return reportTime(second) - reportTime(first);
}

function reportTime(report: CivicReport) {
  return Date.parse(report.updatedAt || report.createdAt || "") || 0;
}

function stripReportMedia(report: CivicReport) {
  const metadataReport: Partial<CivicReport> = { ...report };

  delete metadataReport.issueImageDataUrl;
  delete metadataReport.repairImageDataUrl;

  return metadataReport;
}
