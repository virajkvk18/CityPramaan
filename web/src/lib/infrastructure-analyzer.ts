export type InfrastructureCategory =
  | "ROAD_DAMAGE"
  | "DRAIN_BLOCKAGE"
  | "POWER_OUTAGE"
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
  aiPriorityScore: number;
  imageEvidenceScore: number;
  estimatedImpact: string;
  modelVersion: string;
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
    impact: string;
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
    impact: "Vehicle damage and accident risk for commuters",
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
    impact: "Waterlogging, mosquito breeding, and local road disruption",
  },
  POWER_OUTAGE: {
    issueType: "Power Outage / Transformer Failure",
    assetType: "Distribution Transformer / Feeder Line",
    keywords: [
      "transformer",
      "electricity",
      "power cut",
      "power outage",
      "no power",
      "no electricity",
      "light gone",
      "lights gone",
      "feeder",
      "substation",
      "wire",
      "electric pole",
      "storm",
      "heavy rainfall",
      "rainfall",
      "blackout",
      "fuse",
      "voltage",
    ],
    severity: "Critical",
    confidence: 95,
    slaHours: 6,
    proofTag: "POWER_RESTORATION_PROOF",
    recommendedAction:
      "Escalate to electricity maintenance, publish restoration ETA, and require restoration proof before closure.",
    signals: ["Household electricity affected", "Weather casualty / feeder fault risk", "Restoration ETA required"],
    impact: "Homes and shops affected by power loss and uncertain restoration ETA",
  },
  DARK_ZONE: {
    issueType: "Streetlight Dark Zone",
    assetType: "Streetlight / Safety Corridor",
    keywords: ["dark", "night", "streetlight", "lamp", "unsafe", "women safety"],
    severity: "High",
    confidence: 91,
    slaHours: 18,
    proofTag: "LIGHT_REPAIR_PROOF",
    recommendedAction: "Route to electrical maintenance and verify brightness after repair.",
    signals: ["Low-light safety risk", "Night-time visibility issue", "Public safety corridor impact"],
    impact: "Night safety risk for pedestrians and commuters",
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
    impact: "Public hygiene risk and repeat dumping hotspot",
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
    impact: "Water loss, road damage, and pressure disruption",
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
    impact: "Pedestrian and wheelchair access blocked",
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
    impact: "Public infrastructure issue requiring civic triage",
  },
};

const severityScore: Record<InfrastructureAnalysis["severity"], number> = {
  Low: 42,
  Medium: 62,
  High: 82,
  Critical: 93,
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
  const severity = hasRepeatSignal && profile.severity === "High" ? "Critical" : profile.severity;
  const imageEvidenceScore = imageName ? Math.min(98, confidence - 3) : 44;
  const aiPriorityScore = Math.min(
    99,
    severityScore[severity] + (hasRepeatSignal ? 5 : 0) + (imageName ? 2 : -6)
  );

  return {
    category,
    issueType: profile.issueType,
    assetType: profile.assetType,
    severity,
    confidence,
    slaHours: profile.slaHours,
    warrantyRequired: ["ROAD_DAMAGE", "DRAIN_BLOCKAGE", "POWER_OUTAGE", "DARK_ZONE", "WATER_LEAKAGE"].includes(category),
    duplicateRisk: hasRepeatSignal ? "High repeat/warranty breach risk" : "Low duplicate risk",
    publicSummary: `${profile.issueType} reported near ${location}, ${cityName}. AI recommends public proof tracking and SLA monitoring.`,
    recommendedAction: profile.recommendedAction,
    proofTag: profile.proofTag,
    evidenceSignals: [
      ...profile.signals,
      imageName ? "Visual evidence attached" : "Visual evidence pending",
      hasRepeatSignal ? "Repeat-location language found" : "No repeat-language signal",
    ],
    aiPriorityScore,
    imageEvidenceScore,
    estimatedImpact: profile.impact,
    modelVersion: "CityPramaan Ruleset v0.4",
  };
}
