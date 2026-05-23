export type InfrastructureCategory =
  | "ROAD_DAMAGE"
  | "DRAIN_BLOCKAGE"
  | "DARK_ZONE"
  | "GARBAGE_BLACKSPOT"
  | "WATER_LEAKAGE"
  | "ACCESSIBILITY_BLOCK"
  | "GENERAL_INFRASTRUCTURE";

export type InfrastructureAnalysis = {
  category: InfrastructureCategory;
  issueType: string;
  assetType: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number;
  slaHours: number;
  warrantyRequired: boolean;
  duplicateRisk: string;
  publicSummary: string;
  recommendedAction: string;
  proofTag: string;
  evidenceSignals: string[];
};

type AnalyzeInput = {
  description: string;
  imageName?: string;
  location: string;
  cityName: string;
};

const issueProfiles: Record<
  InfrastructureCategory,
  {
    issueType: string;
    assetType: string;
    keywords: string[];
    severity: InfrastructureAnalysis["severity"];
    confidence: number;
    slaHours: number;
    proofTag: string;
    recommendedAction: string;
    signals: string[];
  }
> = {
  ROAD_DAMAGE: {
    issueType: "Road Damage / Pothole",
    assetType: "Road Segment",
    keywords: ["pothole", "road", "crack", "asphalt", "patch", "broken road", "surface", "vehicle"],
    severity: "Critical",
    confidence: 96,
    slaHours: 48,
    proofTag: "ROAD_REPAIR_PROOF",
    recommendedAction: "Dispatch road repair crew and lock a warranty record after repair proof.",
    signals: ["Surface depression visible", "Traffic safety risk", "Repair warranty check required"],
  },
  DRAIN_BLOCKAGE: {
    issueType: "Drain Blockage / Waterlogging Risk",
    assetType: "Drainage Line",
    keywords: ["drain", "sewer", "waterlogging", "clog", "blocked drain", "flood", "monsoon", "stagnant"],
    severity: "High",
    confidence: 93,
    slaHours: 24,
    proofTag: "DRAIN_CLEANING_PROOF",
    recommendedAction: "Assign drainage crew and require before/after cleaning evidence.",
    signals: ["Drain obstruction risk", "Monsoon readiness impact", "Public health risk"],
  },
  DARK_ZONE: {
    issueType: "Streetlight Dark Zone",
    assetType: "Streetlight / Safety Corridor",
    keywords: ["dark", "night", "streetlight", "light", "lamp", "unsafe", "women safety", "blackout"],
    severity: "High",
    confidence: 91,
    slaHours: 18,
    proofTag: "LIGHT_REPAIR_PROOF",
    recommendedAction: "Route to electrical maintenance and verify brightness after repair.",
    signals: ["Low-light safety risk", "Night-time visibility issue", "Public safety corridor impact"],
  },
  GARBAGE_BLACKSPOT: {
    issueType: "Garbage Blackspot",
    assetType: "Solid Waste Point",
    keywords: ["garbage", "waste", "dump", "trash", "overflow", "bin", "smell", "blackspot"],
    severity: "Medium",
    confidence: 90,
    slaHours: 12,
    proofTag: "WASTE_CLEARANCE_PROOF",
    recommendedAction: "Assign sanitation crew and watch for repeat dumping at same coordinate.",
    signals: ["Waste accumulation detected", "Repeat blackspot risk", "Sanitation SLA required"],
  },
  WATER_LEAKAGE: {
    issueType: "Water Leakage / Pipeline Fault",
    assetType: "Water Supply Line",
    keywords: ["water leak", "leakage", "pipe", "pipeline", "burst", "tap", "water flowing", "seepage"],
    severity: "High",
    confidence: 92,
    slaHours: 12,
    proofTag: "WATER_REPAIR_PROOF",
    recommendedAction: "Escalate to water board and record repair closure with pressure check.",
    signals: ["Water loss risk", "Road damage secondary risk", "Utility repair proof required"],
  },
  ACCESSIBILITY_BLOCK: {
    issueType: "Accessibility / Footpath Obstruction",
    assetType: "Footpath / Ramp",
    keywords: ["footpath", "sidewalk", "ramp", "blocked", "accessibility", "wheelchair", "pedestrian", "encroachment"],
    severity: "Medium",
    confidence: 89,
    slaHours: 36,
    proofTag: "ACCESSIBILITY_RESTORATION_PROOF",
    recommendedAction: "Remove obstruction or repair walkway, then verify accessible path clearance.",
    signals: ["Pedestrian access affected", "Mobility barrier risk", "Public right-of-way issue"],
  },
  GENERAL_INFRASTRUCTURE: {
    issueType: "General Civic Infrastructure Issue",
    assetType: "Public Asset",
    keywords: [],
    severity: "Medium",
    confidence: 84,
    slaHours: 48,
    proofTag: "CIVIC_ASSET_PROOF",
    recommendedAction: "Route to civic admin for triage and request repair proof after action.",
    signals: ["Infrastructure anomaly reported", "Manual civic triage suggested", "Public proof record needed"],
  },
};

export function analyzeInfrastructureIssue({
  description,
  imageName = "",
  location,
  cityName,
}: AnalyzeInput): InfrastructureAnalysis {
  const searchable = `${description} ${imageName}`.toLowerCase();
  const category =
    (Object.entries(issueProfiles).find(([key, profile]) => {
      if (key === "GENERAL_INFRASTRUCTURE") {
        return false;
      }

      return profile.keywords.some((keyword) => searchable.includes(keyword));
    })?.[0] as InfrastructureCategory | undefined) ?? "GENERAL_INFRASTRUCTURE";
  const profile = issueProfiles[category];
  const repeatedWords = ["again", "repeat", "same", "previous", "repaired", "warranty"];
  const hasRepeatSignal = repeatedWords.some((word) => searchable.includes(word));
  const confidence = Math.min(99, profile.confidence + (imageName ? 2 : 0) + (hasRepeatSignal ? 1 : 0));

  return {
    category,
    issueType: profile.issueType,
    assetType: profile.assetType,
    severity: hasRepeatSignal && profile.severity === "High" ? "Critical" : profile.severity,
    confidence,
    slaHours: profile.slaHours,
    warrantyRequired: ["ROAD_DAMAGE", "DRAIN_BLOCKAGE", "DARK_ZONE", "WATER_LEAKAGE"].includes(category),
    duplicateRisk: hasRepeatSignal ? "High repeat/warranty breach risk" : "Low duplicate risk",
    publicSummary: `${profile.issueType} reported near ${location}, ${cityName}. AI recommends public proof tracking and SLA monitoring.`,
    recommendedAction: profile.recommendedAction,
    proofTag: profile.proofTag,
    evidenceSignals: [
      ...profile.signals,
      imageName ? "Visual evidence attached" : "Visual evidence pending",
      hasRepeatSignal ? "Repeat-location language found" : "No repeat-language signal",
    ],
  };
}
