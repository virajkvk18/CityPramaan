import { DEFAULT_CITY_KEY, formatCityLocation, getCityByKey, type CityKey } from "./city-context";

export type ReportStatus =
  | "OPEN"
  | "PENDING_PROOF"
  | "REPAIR_SUBMITTED"
  | "UNDER_WARRANTY"
  | "REPEAT_FAILURE";

export type CivicReport = {
  id: string;
  title: string;
  ward: string;
  status: ReportStatus;
  severity: string;
  confidence: number;
  contractor: string;
  txHash: string;
  warrantyDaysLeft: number | null;
  location: string;
  issueCategory?: string;
  assetType?: string;
  aiSummary?: string;
  recommendedAction?: string;
  slaHours?: number;
};

export function getReportsForCity(cityKey: CityKey | string = DEFAULT_CITY_KEY): CivicReport[] {
  const city = getCityByKey(cityKey);

  return [
    {
      id: "CP-001",
      title: `Pothole near ${city.secondaryArea}`,
      ward: city.repairWard,
      status: "OPEN",
      severity: "High",
      confidence: 94,
      contractor: "Not assigned",
      txHash: "0x82f4...91ac",
      warrantyDaysLeft: null,
      location: formatCityLocation(city, city.secondaryArea),
    },
    {
      id: "CP-002",
      title: "Road patch repair submitted",
      ward: city.repairWard,
      status: "REPAIR_SUBMITTED",
      severity: "Medium",
      confidence: 81,
      contractor: city.contractor,
      txHash: "0xa91b...22fd",
      warrantyDaysLeft: null,
      location: formatCityLocation(city, city.secondaryArea),
    },
    {
      id: "CP-003",
      title: "Resolved road damage under warranty",
      ward: city.repairWard,
      status: "UNDER_WARRANTY",
      severity: "Medium",
      confidence: 88,
      contractor: city.contractor,
      txHash: "0x44ce...73ab",
      warrantyDaysLeft: 24,
      location: formatCityLocation(city),
    },
    {
      id: "CP-004",
      title: "Repeat failure detected after repair",
      ward: city.repairWard,
      status: "REPEAT_FAILURE",
      severity: "Critical",
      confidence: 96,
      contractor: city.contractor,
      txHash: "0xf12d...8bb0",
      warrantyDaysLeft: 12,
      location: formatCityLocation(city),
    },
  ];
}

export const reports: CivicReport[] = getReportsForCity();
