import type { CivicReport } from "@/src/lib/mock-data";

function sanitizeReport(report: CivicReport) {
  const { issueImageDataUrl, repairImageDataUrl, ...sanitizedReport } = report;

  return sanitizedReport;
}

export async function syncReportToBackend(report: CivicReport) {
  try {
    const response = await fetch("/api/reports", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sanitizeReport(report)),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Report sync failed with status ${response.status}`);
    }

    return (await response.json()) as CivicReport;
  } catch (error) {
    console.warn("Report backend sync skipped.", error);
    return undefined;
  }
}
