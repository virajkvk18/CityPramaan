import type { CivicReport } from "./mock-data";

export const LOCAL_REPORTS_KEY = "city-pramaan:local-reports";
export const REPORTS_UPDATED_EVENT = "city-pramaan:reports-updated";

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
  saveLocalReports([report, ...existing]);
}

export function saveLocalReports(reports: CivicReport[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  window.dispatchEvent(new Event(REPORTS_UPDATED_EVENT));
}

export function updateLocalReport(reportId: string, updater: (report: CivicReport) => CivicReport) {
  const reports = loadLocalReports();
  const existing = reports.find((report) => report.id === reportId);

  if (!existing) {
    return undefined;
  }

  const updated = updater(existing);
  saveLocalReports(reports.map((report) => (report.id === reportId ? updated : report)));
  return updated;
}

export function upsertLocalReport(report: CivicReport) {
  saveLocalReport({
    ...report,
    updatedAt: new Date().toISOString(),
  });
}

export function createLocalReportId() {
  const existing = loadLocalReports();
  const nextNumber =
    existing.reduce((highest, report) => {
      const match = report.id.match(/^CP-(\d+)$/);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 4) + 1;

  return `CP-${String(nextNumber).padStart(3, "0")}`;
}

export function clearLocalReports() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LOCAL_REPORTS_KEY);
  window.dispatchEvent(new Event(REPORTS_UPDATED_EVENT));
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
  window.addEventListener(REPORTS_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(REPORTS_UPDATED_EVENT, callback);
  };
}

export function appendReportEvent(
  report: CivicReport,
  event: NonNullable<CivicReport["history"]>[number]
) {
  return {
    ...report,
    history: [...(report.history ?? []), event],
    updatedAt: new Date().toISOString(),
  };
}

export async function readFileAsDataUrl(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return readRawFileAsDataUrl(file);
  }

  try {
    return await readCompressedImageAsDataUrl(file);
  } catch {
    return readRawFileAsDataUrl(file);
  }
}

function readRawFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function readCompressedImageAsDataUrl(file: File) {
  const rawDataUrl = await readRawFileAsDataUrl(file);

  if (rawDataUrl.length <= 900_000) {
    return rawDataUrl;
  }

  const image = await loadImage(rawDataUrl);
  const maxSide = 1100;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    return rawDataUrl;
  }

  context.drawImage(image, 0, 0, width, height);
  const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.72);

  return compressedDataUrl.length < rawDataUrl.length ? compressedDataUrl : rawDataUrl;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image"));
    image.src = src;
  });
}
