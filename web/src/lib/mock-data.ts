import { DEFAULT_CITY_KEY, formatCityLocation, getCityByKey, type CityKey } from "./city-context";

export type ReportStatus =
  | "OPEN"
  | "PENDING_PROOF"
  | "REPAIR_SUBMITTED"
  | "UNDER_WARRANTY"
  | "REPEAT_FAILURE"
  | "CLOSED";

export type CivicReport = {
  id: string;
  cityKey?: string;
  title: string;
  ward: string;
  status: ReportStatus;
  severity: string;
  confidence: number;
  contractor: string;
  txHash: string;
  warrantyDaysLeft: number | null;
  location: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  issueCategory?: string;
  assetType?: string;
  aiSummary?: string;
  recommendedAction?: string;
  slaHours?: number;
  createdAt?: string;
  updatedAt?: string;
  issueImageName?: string;
  issueImageDataUrl?: string;
  repairImageName?: string;
  repairImageDataUrl?: string;
  repairProofAt?: string;
  warrantyActivatedAt?: string;
  warrantyExpiresAt?: string;
  warrantyPeriodDays?: number;
  evidenceHash?: string;
  repairTxHash?: string;
  ownerVerified?: boolean;
  closedAt?: string;
  closureNote?: string;
  publicFeedback?: CivicReportFeedback[];
  repairAudit?: {
    materialMatch: string;
    repairIntegrity: string;
    geoVariance: string;
    recommendation: string;
    beforeAfterDelta?: string;
    closureConfidence?: string;
    visibleDamageRemaining?: string;
  };
  history?: CivicReportEvent[];
};

export type CivicReportFeedback = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

export type CivicReportEvent = {
  label: string;
  detail: string;
  time: string;
  tx?: string;
};

export function getReportsForCity(cityKey: CityKey | string = DEFAULT_CITY_KEY): CivicReport[] {
  const city = getCityByKey(cityKey);

  return [
    {
      id: "CP-001",
      cityKey: city.key,
      title: `Pothole near ${city.secondaryArea}`,
      ward: city.repairWard,
      status: "OPEN",
      severity: "High",
      confidence: 94,
      contractor: "Not assigned",
      txHash: "0x82f4...91ac",
      warrantyDaysLeft: null,
      location: formatCityLocation(city, city.secondaryArea),
      latitude: city.lat + 0.006,
      longitude: city.lng + 0.004,
      mapUrl: buildGoogleMapsUrl(city.lat + 0.006, city.lng + 0.004),
      issueCategory: "ROAD_DAMAGE",
      assetType: "City Road",
      aiSummary: "Road damage requires contractor inspection and repair proof.",
      recommendedAction: "Assign contractor and collect after-repair evidence.",
      slaHours: 72,
      createdAt: "2026-05-23T10:12:00.000Z",
    },
    {
      id: "CP-002",
      cityKey: city.key,
      title: "Road patch repair submitted",
      ward: city.repairWard,
      status: "REPAIR_SUBMITTED",
      severity: "Medium",
      confidence: 81,
      contractor: city.contractor,
      txHash: "0xa91b...22fd",
      warrantyDaysLeft: null,
      location: formatCityLocation(city, city.secondaryArea),
      latitude: city.lat + 0.004,
      longitude: city.lng + 0.003,
      mapUrl: buildGoogleMapsUrl(city.lat + 0.004, city.lng + 0.003),
      issueCategory: "ROAD_DAMAGE",
      assetType: "City Road",
      aiSummary: "Contractor has submitted repair evidence. Warranty activation is pending.",
      recommendedAction: "Verify repair proof and activate warranty if audit passes.",
      slaHours: 24,
      createdAt: "2026-05-22T12:20:00.000Z",
      repairImageName: "contractor-road-patch-proof.jpg",
    },
    {
      id: "CP-003",
      cityKey: city.key,
      title: "Resolved road damage under warranty",
      ward: city.repairWard,
      status: "UNDER_WARRANTY",
      severity: "Medium",
      confidence: 88,
      contractor: city.contractor,
      txHash: "0x44ce...73ab",
      warrantyDaysLeft: 24,
      location: formatCityLocation(city),
      latitude: city.lat,
      longitude: city.lng,
      mapUrl: buildGoogleMapsUrl(city.lat, city.lng),
      issueCategory: "ROAD_DAMAGE",
      assetType: "City Road",
      aiSummary: "Repair has passed audit and is under active warranty monitoring.",
      recommendedAction: "Monitor for repeat failure during warranty window.",
      slaHours: 0,
      createdAt: "2026-05-19T10:00:00.000Z",
      repairImageName: "verified-road-repair.jpg",
      repairProofAt: "2026-05-20T16:40:00.000Z",
      warrantyActivatedAt: "2026-05-20T16:45:00.000Z",
      warrantyPeriodDays: 30,
      repairTxHash: "0x93ac...72fd",
      repairAudit: {
        materialMatch: "94.8%",
        repairIntegrity: "High",
        geoVariance: "+/-0.6 m",
        beforeAfterDelta: "82% visible surface improvement",
        closureConfidence: "91.2%",
        visibleDamageRemaining: "Low",
        recommendation: "AI sees the pothole surface filled and recommends citizen owner verification.",
      },
    },
    {
      id: "CP-004",
      cityKey: city.key,
      title: "Repeat failure detected after repair",
      ward: city.repairWard,
      status: "REPEAT_FAILURE",
      severity: "Critical",
      confidence: 96,
      contractor: city.contractor,
      txHash: "0xf12d...8bb0",
      warrantyDaysLeft: 12,
      location: formatCityLocation(city),
      latitude: city.lat,
      longitude: city.lng,
      mapUrl: buildGoogleMapsUrl(city.lat, city.lng),
      issueCategory: "ROAD_DAMAGE",
      assetType: "City Road",
      aiSummary: "Repeat failure is detected inside the active warranty window.",
      recommendedAction: "Reopen warranty claim and reduce contractor reputation score.",
      slaHours: 24,
      createdAt: "2026-05-21T09:41:00.000Z",
      repairImageName: "failed-road-repair-before-after.jpg",
      repairProofAt: "2026-05-21T16:40:00.000Z",
      warrantyActivatedAt: "2026-05-21T16:45:00.000Z",
      warrantyPeriodDays: 30,
      repairTxHash: "0x93ac...72fd",
      repairAudit: {
        materialMatch: "58.6%",
        repairIntegrity: "Low",
        geoVariance: "+/-1.4 m",
        beforeAfterDelta: "22% improvement lost",
        closureConfidence: "35.1%",
        visibleDamageRemaining: "High",
        recommendation: "AI sees repeat road damage inside warranty. Reopen claim and reduce contractor reputation.",
      },
    },
  ];
}

export const reports: CivicReport[] = getReportsForCity();

export function buildGoogleMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
