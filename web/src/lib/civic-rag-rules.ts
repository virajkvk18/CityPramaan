import type { InfrastructureCategory } from "./infrastructure-analyzer";
import type { ContractorProfile, CivicReport } from "./mock-data";

export type CivicRule = {
  id: string;
  title: string;
  category: InfrastructureCategory | "CONTRACTOR_POLICY" | "WARRANTY_POLICY" | "PUBLIC_SUMMARY";
  keywords: string[];
  cityScope: string;
  source?: string;
  version?: string;
  effectiveFrom?: string;
  ruleText: string;
  slaHours?: number;
  warrantyDays?: number;
  priorityWeight: number;
};

export type RetrievedRule = CivicRule & {
  matchScore: number;
  matchedKeywords: string[];
};

export const civicRagRules: CivicRule[] = [
  {
    id: "road-major-pothole",
    title: "Major pothole or broken road response",
    category: "ROAD_DAMAGE",
    keywords: ["pothole", "road", "asphalt", "broken road", "crack", "patch", "vehicle", "accident"],
    cityScope: "Indian urban roads",
    source: "CityPramaan civic SLA knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Major road damage should be treated as high severity when it affects moving traffic, school routes, public transport, or repeat repair zones. The issue should be assigned to a road repair contractor, tracked with before/after photos, and closed only after repair proof is reviewed.",
    slaHours: 48,
    warrantyDays: 30,
    priorityWeight: 10,
  },
  {
    id: "road-collapse-critical",
    title: "Road collapse or unsafe carriageway",
    category: "ROAD_DAMAGE",
    keywords: ["collapse", "caved", "sinkhole", "danger", "blocked road", "deep pothole"],
    cityScope: "Indian urban roads",
    source: "CityPramaan civic SLA knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Road collapse, deep potholes, and blocked carriageways should be escalated as critical safety risks. Barricading, traffic diversion, and emergency contractor assignment should happen before closure proof is accepted.",
    slaHours: 24,
    warrantyDays: 45,
    priorityWeight: 16,
  },
  {
    id: "drainage-overflow",
    title: "Drainage blockage and sewage overflow",
    category: "DRAIN_BLOCKAGE",
    keywords: ["drain", "sewer", "sewage", "waterlogging", "blocked", "stagnant", "overflow", "monsoon"],
    cityScope: "Urban drainage and sanitation",
    source: "CityPramaan civic SLA knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Drain blockage, waterlogging, and sewage overflow require sanitation or drainage crew assignment. Public health risk increases when stagnant water, smell, or monsoon flow is reported. Contractor proof should show cleared drain flow.",
    slaHours: 24,
    warrantyDays: 15,
    priorityWeight: 12,
  },
  {
    id: "sewage-critical",
    title: "Critical sewage exposure",
    category: "DRAIN_BLOCKAGE",
    keywords: ["sewage overflow", "dirty water", "manhole", "contamination", "public health", "school"],
    cityScope: "Urban public health",
    source: "CityPramaan civic SLA knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Open sewage, manhole overflow, or contaminated public water exposure should be marked critical. Response requires fast sanitation action and public repair proof because it affects public health.",
    slaHours: 12,
    warrantyDays: 15,
    priorityWeight: 16,
  },
  {
    id: "streetlight-dark-zone",
    title: "Streetlight failure and dark zone safety",
    category: "DARK_ZONE",
    keywords: ["dark", "streetlight", "lamp", "night", "unsafe", "women safety", "blackout"],
    cityScope: "Streetlight and public safety",
    source: "CityPramaan civic SLA knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Streetlight failures should be prioritized when the report mentions unsafe night movement, schools, bus stops, markets, or repeated darkness. Repair proof should include restored lighting evidence.",
    slaHours: 24,
    warrantyDays: 15,
    priorityWeight: 11,
  },
  {
    id: "power-outage-restoration",
    title: "Power outage and transformer restoration",
    category: "POWER_OUTAGE",
    keywords: ["transformer", "power cut", "electricity", "feeder", "no power", "wire", "voltage", "rainfall"],
    cityScope: "Electricity maintenance",
    source: "CityPramaan civic SLA knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Transformer or feeder outage reports should include affected area, restoration ETA, and final restoration proof. Heavy rainfall or multiple households affected increases severity.",
    slaHours: 6,
    warrantyDays: 7,
    priorityWeight: 15,
  },
  {
    id: "garbage-blackspot",
    title: "Garbage blackspot and sanitation recurrence",
    category: "GARBAGE_BLACKSPOT",
    keywords: ["garbage", "waste", "dump", "trash", "overflow", "smell", "blackspot", "bin"],
    cityScope: "Solid waste management",
    source: "CityPramaan civic SLA knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Garbage blackspots should be cleared with photo proof and monitored for recurrence. Repeat dumping locations should be flagged for public timeline tracking and preventive action.",
    slaHours: 12,
    warrantyDays: 7,
    priorityWeight: 8,
  },
  {
    id: "water-leakage",
    title: "Water leakage and pipeline fault",
    category: "WATER_LEAKAGE",
    keywords: ["water leak", "leakage", "pipe", "pipeline", "burst", "tap", "water flowing", "seepage"],
    cityScope: "Water supply network",
    source: "CityPramaan civic SLA knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Water leakage should be escalated when it damages roads, affects water pressure, or wastes public supply. Repair proof should show stopped leakage and restored surface safety.",
    slaHours: 12,
    warrantyDays: 20,
    priorityWeight: 12,
  },
  {
    id: "footpath-accessibility",
    title: "Footpath obstruction and accessibility",
    category: "ACCESSIBILITY_BLOCK",
    keywords: ["footpath", "sidewalk", "ramp", "wheelchair", "pedestrian", "blocked", "encroachment"],
    cityScope: "Pedestrian accessibility",
    source: "CityPramaan civic SLA knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Footpath and ramp obstruction should be treated as an accessibility issue. Closure proof should show a clear pedestrian path and usable ramp when relevant.",
    slaHours: 36,
    warrantyDays: 10,
    priorityWeight: 7,
  },
  {
    id: "contractor-policy",
    title: "Contractor assignment policy",
    category: "CONTRACTOR_POLICY",
    keywords: ["contractor", "assign", "ward", "workload", "specialization", "available", "verified"],
    cityScope: "Ward administration",
    source: "CityPramaan contractor policy knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Contractor matching should prefer verified contractors with matching specialization, same ward or nearby area, available status, and lower active workload. Busy contractors can be selected only when specialization fit is much stronger.",
    priorityWeight: 9,
  },
  {
    id: "warranty-policy",
    title: "Warranty and repeat failure policy",
    category: "WARRANTY_POLICY",
    keywords: ["warranty", "repeat", "again", "repaired", "failed", "same location", "breach"],
    cityScope: "Post-repair monitoring",
    source: "CityPramaan warranty memory knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Repeat issue at the same location during the warranty window should be flagged as warranty risk. Road patches, drainage cleaning, streetlights, water repairs, and power restoration should keep a visible warranty memory after approval.",
    priorityWeight: 13,
  },
  {
    id: "public-summary-policy",
    title: "Public proof summary policy",
    category: "PUBLIC_SUMMARY",
    keywords: ["public", "summary", "proof", "timeline", "citizen", "transparency"],
    cityScope: "Public transparency",
    source: "CityPramaan public communication knowledge base",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    ruleText:
      "Public summaries should be understandable to citizens, avoid exposing private identity details, and clearly mention issue type, location, status, SLA, contractor proof, warranty status, and next action.",
    priorityWeight: 8,
  },
];

export function retrieveCivicRules(input: {
  text?: string;
  category?: string;
  city?: string;
  report?: Partial<CivicReport>;
  contractor?: Partial<ContractorProfile>;
  limit?: number;
}) {
  const query = normalize(
    [
      input.text,
      input.category,
      input.city,
      input.report?.title,
      input.report?.location,
      input.report?.ward,
      input.report?.issueCategory,
      input.report?.recommendedAction,
      input.contractor?.area,
      input.contractor?.ward,
      input.contractor?.specialization,
    ]
      .filter(Boolean)
      .join(" ")
  );
  const terms = new Set(query.split(/\s+/).filter((term) => term.length > 2));

  return civicRagRules
    .map((rule) => {
      const matchedKeywords = rule.keywords.filter((keyword) => query.includes(normalize(keyword)));
      const categoryMatch =
        input.category && normalize(rule.category).includes(normalize(input.category).replace("drainage", "drain"));
      const score =
        matchedKeywords.length * 12 +
        (categoryMatch ? 18 : 0) +
        Array.from(terms).filter((term) => normalize(rule.ruleText).includes(term)).length +
        rule.priorityWeight;

      return {
        ...rule,
        matchScore: score,
        matchedKeywords,
      };
    })
    .filter((rule) => rule.matchScore > rule.priorityWeight || rule.category === "PUBLIC_SUMMARY")
    .sort((first, second) => second.matchScore - first.matchScore)
    .slice(0, input.limit ?? 4);
}

export function formatRetrievedRulesForPrompt(rules: RetrievedRule[]) {
  if (!rules.length) {
    return "No matching civic rules were retrieved. Use cautious civic triage.";
  }

  return rules
    .map(
      (rule, index) =>
        `${index + 1}. ${rule.title} (${rule.category})\nSource: ${rule.source ?? "CityPramaan KB"} | Version: ${
          rule.version ?? "unversioned"
        } | Effective: ${rule.effectiveFrom ?? "current"}\nSLA: ${rule.slaHours ?? "contextual"} hours | Warranty: ${
          rule.warrantyDays ?? "contextual"
        } days\nRule: ${rule.ruleText}`
    )
    .join("\n\n");
}

function normalize(value?: string) {
  return (value ?? "").toLowerCase().replace(/[_/-]+/g, " ").replace(/\s+/g, " ").trim();
}
