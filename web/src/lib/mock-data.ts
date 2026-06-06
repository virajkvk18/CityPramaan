import { DEFAULT_CITY_KEY, formatCityLocation, getCityByKey, type CityKey } from "./city-context";
import type { FabricProofMetadata } from "./fabric-proof-service";

export type ReportStatus =
  | "OPEN"
  | "PENDING_PROOF"
  | "ASSIGNED_TO_CONTRACTOR"
  | "WORK_ACCEPTED"
  | "WORK_STARTED"
  | "WORK_COMPLETED"
  | "REPAIR_SUBMITTED"
  | "ADMIN_APPROVED"
  | "REPAIR_REJECTED"
  | "CITIZEN_DISPUTED"
  | "UNDER_WARRANTY"
  | "REPEAT_FAILURE"
  | "CLOSED";

export type ContractorSpecialization =
  | "ROAD_DAMAGE"
  | "DRAINAGE"
  | "STREETLIGHT"
  | "GARBAGE"
  | "WATER_LEAKAGE"
  | "FOOTPATH"
  | "POWER_OUTAGE"
  | "GENERAL";

export type ContractorProfile = {
  contractorId: string;
  userId?: string;
  name: string;
  identityNumber: string;
  email: string;
  phone: string;
  area: string;
  ward: string;
  specialization: ContractorSpecialization | string;
  agencyName?: string;
  verificationStatus: "Verified" | "Pending" | "Suspended";
  availabilityStatus: "Available" | "Busy" | "Offline";
  assignedReports?: string[];
};

export type CivicReport = {
  id: string;
  cityKey?: string;
  title: string;
  ward: string;
  status: ReportStatus;
  severity: string;
  confidence: number;
  contractor: string;
  citizenId?: string;
  citizenName?: string;
  citizenContact?: string;
  assignedContractorId?: string;
  assignedContractorDetails?: ContractorProfile;
  assignedByAdmin?: string;
  assignedByAdminId?: string;
  adminApprovalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  citizenFinalApproval?: "PENDING" | "CONFIRMED" | "DISPUTED";
  warrantyStatus?: "NOT_ACTIVE" | "ACTIVE" | "EXPIRED" | "REOPENED";
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
  repairNotes?: string;
  rejectionReason?: string;
  assignedAt?: string;
  acceptedAt?: string;
  workStartedAt?: string;
  workCompletedAt?: string;
  warrantyActivatedAt?: string;
  warrantyExpiresAt?: string;
  warrantyPeriodDays?: number;
  evidenceHash?: string;
  proofBundleHash?: string;
  fabricProof?: FabricProofMetadata;
  fabricProofs?: FabricProofMetadata[];
  repairEvidenceHash?: string;
  repairTxHash?: string;
  aiPriorityScore?: number;
  imageEvidenceScore?: number;
  aiModelVersion?: string;
  estimatedImpact?: string;
  ownerVerified?: boolean;
  closedAt?: string;
  closureNote?: string;
  publicFeedback?: CivicReportFeedback[];
  utilityRestoration?: {
    cause: string;
    affectedArea: string;
    estimatedRestoration: string;
    progressStage: string;
    department: string;
    citizenUpdate: string;
  };
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
      evidenceHash: "0x5d1c9f4a03b7...road01",
      proofBundleHash: "0xa81e4f0c72d9...bundle01",
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
      aiPriorityScore: 92,
      imageEvidenceScore: 91,
      aiModelVersion: "CityPramaan Ruleset v0.4",
      estimatedImpact: "Vehicle damage and accident risk for commuters",
      createdAt: "2026-05-23T10:12:00.000Z",
    },
    {
      id: "CP-005",
      cityKey: city.key,
      title: `Transformer outage after heavy rainfall near ${city.primaryArea}`,
      ward: city.repairWard,
      status: "OPEN",
      severity: "Critical",
      confidence: 95,
      contractor: "Electricity restoration crew",
      txHash: "0xee91...44ac",
      evidenceHash: "0x91f5b6c8aa10...pwr05",
      proofBundleHash: "0xfe5a89c1d442...bundle05",
      warrantyDaysLeft: null,
      location: formatCityLocation(city, city.primaryArea),
      latitude: city.lat - 0.004,
      longitude: city.lng - 0.006,
      mapUrl: buildGoogleMapsUrl(city.lat - 0.004, city.lng - 0.006),
      issueCategory: "POWER_OUTAGE",
      assetType: "Distribution Transformer / Feeder Line",
      aiSummary:
        "Weather-linked transformer or feeder failure reported. Citizens need restoration ETA and progress updates.",
      recommendedAction:
        "Escalate to electricity maintenance, publish restoration ETA, and require power restoration proof before closure.",
      slaHours: 6,
      aiPriorityScore: 98,
      imageEvidenceScore: 93,
      aiModelVersion: "CityPramaan Ruleset v0.4",
      estimatedImpact: "Homes and shops affected by power loss and uncertain restoration ETA",
      createdAt: "2026-05-24T06:35:00.000Z",
      utilityRestoration: {
        cause: "Heavy rainfall / suspected transformer trip",
        affectedArea: `${city.primaryArea} residential pocket`,
        estimatedRestoration: "4-6 hours",
        progressStage: "Repair crew dispatched",
        department: "Electricity Maintenance",
        citizenUpdate:
          "Fault has been acknowledged. Crew is checking transformer and feeder line before restoration.",
      },
      history: [
        {
          label: "Power outage reported",
          detail: `Citizens near ${city.primaryArea} reported no electricity after heavy rainfall.`,
          time: "24 May 2026, 06:35",
          tx: "0xee91...44ac",
        },
        {
          label: "Weather casualty triaged",
          detail: "AI classified the case as transformer / feeder outage with critical public impact.",
          time: "24 May 2026, 06:37",
          tx: "0x19bb...pwr5",
        },
        {
          label: "Repair crew dispatched",
          detail: "Electricity maintenance crew assigned. Estimated restoration is 4-6 hours.",
          time: "24 May 2026, 06:45",
          tx: "0xcrew...pwr5",
        },
      ],
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
      evidenceHash: "0x123e7a6bc9d2...road02",
      proofBundleHash: "0xb219a88ef552...bundle02",
      repairEvidenceHash: "0x8dc41a72f09b...repair02",
      repairTxHash: "0x93ac...02fd",
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
      aiPriorityScore: 78,
      imageEvidenceScore: 89,
      aiModelVersion: "CityPramaan Ruleset v0.4",
      estimatedImpact: "Pending issuer approval for safer road movement",
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
      evidenceHash: "0x9ba43df00291...road03",
      proofBundleHash: "0x31e840fa3b55...bundle03",
      repairEvidenceHash: "0xb6cd18f00e32...repair03",
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
      aiPriorityScore: 66,
      imageEvidenceScore: 94,
      aiModelVersion: "CityPramaan Ruleset v0.4",
      estimatedImpact: "Repair verified and monitored for repeat failure",
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
      evidenceHash: "0xcc1a74df0286...road04",
      proofBundleHash: "0x74ab6fc11e90...bundle04",
      repairEvidenceHash: "0x0aa7cc53fd29...repair04",
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
      aiPriorityScore: 97,
      imageEvidenceScore: 96,
      aiModelVersion: "CityPramaan Ruleset v0.4",
      estimatedImpact: "Repeat road hazard exposed under active repair warranty",
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
