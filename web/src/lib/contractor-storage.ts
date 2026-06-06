import { DEFAULT_CITY_KEY, getCityByKey } from "./city-context";
import type { ContractorProfile, ContractorSpecialization, CivicReport } from "./mock-data";

export const CONTRACTORS_KEY = "city-pramaan:contractors";
export const CONTRACTORS_UPDATED_EVENT = "city-pramaan:contractors-updated";

export const specializationLabels: Record<ContractorSpecialization, string> = {
  ROAD_DAMAGE: "Road repair",
  DRAINAGE: "Drainage",
  STREETLIGHT: "Streetlight",
  GARBAGE: "Garbage cleanup",
  WATER_LEAKAGE: "Water leakage",
  FOOTPATH: "Footpath repair",
  POWER_OUTAGE: "Power outage",
  GENERAL: "General civic repair",
};

export function loadContractors(): ContractorProfile[] {
  if (typeof window === "undefined") {
    return demoContractors(DEFAULT_CITY_KEY);
  }

  try {
    const raw = window.localStorage.getItem(CONTRACTORS_KEY);
    const saved = raw ? (JSON.parse(raw) as ContractorProfile[]) : [];
    return mergeContractors(saved, demoContractors());
  } catch {
    return demoContractors();
  }
}

export async function fetchBackendContractors() {
  try {
    const response = await fetch("/api/contractors", { cache: "no-store" });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { contractors?: ContractorProfile[] };
    return Array.isArray(payload.contractors) ? payload.contractors : [];
  } catch (error) {
    console.warn("CityPramaan contractor registry unavailable:", error);
    return [];
  }
}

export function mergeContractorLists(...groups: ContractorProfile[][]) {
  const map = new Map<string, ContractorProfile>();

  for (const group of groups) {
    for (const contractor of group) {
      map.set(contractor.contractorId, contractor);
    }
  }

  return Array.from(map.values());
}

export function getContractorsSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return JSON.stringify(loadContractors());
}

export function subscribeContractors(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === CONTRACTORS_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(CONTRACTORS_UPDATED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CONTRACTORS_UPDATED_EVENT, callback);
  };
}

export function upsertContractorProfile(contractor: ContractorProfile) {
  if (typeof window === "undefined") {
    return;
  }

  const existing = loadContractors().filter((item) => item.contractorId !== contractor.contractorId);
  window.localStorage.setItem(CONTRACTORS_KEY, JSON.stringify([contractor, ...existing]));
  window.dispatchEvent(new Event(CONTRACTORS_UPDATED_EVENT));
}

export async function syncContractorProfileToBackend(contractor: ContractorProfile) {
  try {
    await fetch("/api/contractors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contractor),
    });
  } catch (error) {
    console.warn("CityPramaan contractor backend sync unavailable:", error);
  }
}

export function attachReportToContractor(contractorId: string, reportId: string) {
  const contractor = loadContractors().find((item) => item.contractorId === contractorId);

  if (!contractor) {
    return;
  }

  upsertContractorProfile({
    ...contractor,
    assignedReports: Array.from(new Set([...(contractor.assignedReports ?? []), reportId])),
    availabilityStatus: contractor.availabilityStatus === "Offline" ? "Available" : contractor.availabilityStatus,
  });
}

export function findSuggestedContractors(report: CivicReport, contractors = loadContractors()) {
  const category = normalizeCategory(report.issueCategory);
  const ward = normalizeText(report.ward);
  const location = normalizeText(report.location);

  return contractors
    .map((contractor) => ({
      contractor,
      score:
        (normalizeText(contractor.ward).includes(ward) || ward.includes(normalizeText(contractor.ward)) ? 35 : 0) +
        (location.includes(normalizeText(contractor.area)) ? 25 : 0) +
        (normalizeCategory(contractor.specialization) === category ? 35 : 0) +
        (contractor.verificationStatus === "Verified" ? 5 : 0) +
        (contractor.availabilityStatus === "Available" ? 5 : 0),
    }))
    .sort((first, second) => second.score - first.score || first.contractor.name.localeCompare(second.contractor.name))
    .map((item) => item.contractor);
}

export function contractorMatchesReport(contractor: ContractorProfile, report: CivicReport) {
  const top = findSuggestedContractors(report, [contractor])[0];
  return Boolean(top);
}

export function buildContractorFromSignup(input: {
  userId?: string;
  name: string;
  email: string;
  phone: string;
  identityNumber?: string;
  area?: string;
  ward?: string;
  specialization?: string;
  agencyName?: string;
}) {
  const contractorId = input.identityNumber?.trim() || `CTR-${Math.abs(hashCode(input.email)).toString().slice(0, 4)}`;

  return {
    contractorId,
    userId: input.userId,
    name: input.name.trim(),
    identityNumber: contractorId,
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    area: input.area?.trim() || "City service area",
    ward: input.ward?.trim() || "Ward service zone",
    specialization: normalizeCategory(input.specialization || "GENERAL"),
    agencyName: input.agencyName?.trim() || "Independent contractor",
    verificationStatus: "Verified" as const,
    availabilityStatus: "Available" as const,
    assignedReports: [],
  };
}

function demoContractors(cityKey = DEFAULT_CITY_KEY): ContractorProfile[] {
  const city = getCityByKey(cityKey);

  return [
    {
      contractorId: "CTR-102",
      name: "Rajesh Kumar",
      identityNumber: "CTR-102",
      email: "rajesh.road@citypramaan.demo",
      phone: "+91 90000 11021",
      area: city.secondaryArea,
      ward: city.repairWard,
      specialization: "ROAD_DAMAGE",
      agencyName: city.contractor,
      verificationStatus: "Verified",
      availabilityStatus: "Available",
      assignedReports: [],
    },
    {
      contractorId: "CTR-205",
      name: "Nisha Verma",
      identityNumber: "CTR-205",
      email: "nisha.drainage@citypramaan.demo",
      phone: "+91 90000 22051",
      area: city.primaryArea,
      ward: city.repairWard,
      specialization: "DRAINAGE",
      agencyName: "Ward Civil Response Team",
      verificationStatus: "Verified",
      availabilityStatus: "Available",
      assignedReports: [],
    },
    {
      contractorId: "CTR-311",
      name: "Amit Power Works",
      identityNumber: "CTR-311",
      email: "amit.power@citypramaan.demo",
      phone: "+91 90000 31311",
      area: city.primaryArea,
      ward: city.repairWard,
      specialization: "POWER_OUTAGE",
      agencyName: "Electricity restoration crew",
      verificationStatus: "Verified",
      availabilityStatus: "Busy",
      assignedReports: [],
    },
  ];
}

function mergeContractors(primary: ContractorProfile[], fallback: ContractorProfile[]) {
  return mergeContractorLists(fallback, primary);
}

function normalizeCategory(value?: string) {
  const normalized = (value ?? "GENERAL").toUpperCase().replace(/[\s/-]+/g, "_");

  if (normalized.includes("ROAD") || normalized.includes("POTHOLE")) {
    return "ROAD_DAMAGE";
  }

  if (normalized.includes("DRAIN")) {
    return "DRAINAGE";
  }

  if (normalized.includes("STREET") || normalized.includes("LIGHT")) {
    return "STREETLIGHT";
  }

  if (normalized.includes("GARBAGE")) {
    return "GARBAGE";
  }

  if (normalized.includes("WATER")) {
    return "WATER_LEAKAGE";
  }

  if (normalized.includes("FOOTPATH")) {
    return "FOOTPATH";
  }

  if (normalized.includes("POWER") || normalized.includes("TRANSFORMER")) {
    return "POWER_OUTAGE";
  }

  return "GENERAL";
}

function normalizeText(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function hashCode(value: string) {
  return Array.from(value).reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
}
