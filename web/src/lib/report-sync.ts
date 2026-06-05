import type { CivicReport } from "./mock-data";
import { upsertLocalReport } from "./report-storage";

type ReportsResponse = {
  reports?: CivicReport[];
};

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
    }
  } catch (error) {
    console.warn("CityPramaan report backend sync unavailable:", error);
  }
}

export function saveReportEverywhere(report: CivicReport) {
  upsertLocalReport(report);
  return syncReportToBackend(report);
}

export function mergeReportsById(...groups: CivicReport[][]) {
  const reportsById = new Map<string, CivicReport>();

  for (const group of groups) {
    for (const report of group) {
      reportsById.set(report.id, report);
    }
  }

  return Array.from(reportsById.values());
}

function stripReportMedia(report: CivicReport) {
  const metadataReport: Partial<CivicReport> = { ...report };

  delete metadataReport.issueImageDataUrl;
  delete metadataReport.repairImageDataUrl;

  return metadataReport;
}
