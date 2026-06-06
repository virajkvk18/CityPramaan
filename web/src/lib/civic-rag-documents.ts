export type CivicKnowledgeDocument = {
  id: string;
  title: string;
  source: string;
  version: string;
  effectiveFrom: string;
  tags: string[];
  text: string;
};

export const civicKnowledgeDocuments: CivicKnowledgeDocument[] = [
  {
    id: "doc-road-sla-2026-06",
    title: "Road repair SLA and proof policy",
    source: "CityPramaan operational policy draft",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    tags: ["road", "pothole", "sla", "repair", "contractor", "warranty"],
    text:
      "Major potholes and broken road segments should be acknowledged quickly, assigned to a road repair contractor, photographed before and after repair, and kept under warranty memory after closure. Critical carriageway collapse requires urgent barricading and escalation before normal repair closure.",
  },
  {
    id: "doc-drainage-health-2026-06",
    title: "Drainage and sewage public health policy",
    source: "CityPramaan operational policy draft",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    tags: ["drain", "sewage", "waterlogging", "health", "monsoon"],
    text:
      "Drainage blockage, sewage overflow, and waterlogging are public-health issues. Reports mentioning manholes, schools, contaminated water, stagnant water, or monsoon flow should be escalated and require contractor proof showing restored drainage flow.",
  },
  {
    id: "doc-streetlight-power-2026-06",
    title: "Streetlight and power outage response policy",
    source: "CityPramaan operational policy draft",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    tags: ["streetlight", "power", "transformer", "outage", "safety"],
    text:
      "Streetlight dark zones affect public safety and should be prioritized around schools, markets, bus stops, and unsafe night movement. Transformer or feeder outages should publish restoration ETA and visible progress until power restoration proof is accepted.",
  },
  {
    id: "doc-warranty-repeat-2026-06",
    title: "Warranty memory and repeat failure policy",
    source: "CityPramaan operational policy draft",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    tags: ["warranty", "repeat", "same location", "breach", "failure"],
    text:
      "If the same issue category appears at the same or very nearby location during an active warranty period, the system should flag warranty risk, connect the old and new proof records, and require stronger contractor rework evidence.",
  },
  {
    id: "doc-contractor-assignment-2026-06",
    title: "Contractor matching and assignment policy",
    source: "CityPramaan operational policy draft",
    version: "2026.06",
    effectiveFrom: "2026-06-01",
    tags: ["contractor", "ward", "workload", "specialization", "assignment"],
    text:
      "Contractor assignment should prefer verified contractors with matching specialization, same ward or nearby area, availability, and lower workload. An admin override must record why a lower-ranked contractor was selected.",
  },
];

export function retrieveKnowledgeDocuments(query: string, limit = 3) {
  const normalizedQuery = normalize(query);
  const terms = new Set(normalizedQuery.split(/\s+/).filter((term) => term.length > 2));

  return civicKnowledgeDocuments
    .map((document) => {
      const normalizedText = normalize(`${document.title} ${document.tags.join(" ")} ${document.text}`);
      const tagMatches = document.tags.filter((tag) => normalizedQuery.includes(normalize(tag)));
      const termMatches = Array.from(terms).filter((term) => normalizedText.includes(term));

      return {
        ...document,
        matchScore: tagMatches.length * 15 + termMatches.length,
        matchedTags: tagMatches,
      };
    })
    .filter((document) => document.matchScore > 0)
    .sort((first, second) => second.matchScore - first.matchScore)
    .slice(0, limit);
}

export function formatKnowledgeDocumentsForPrompt(query: string) {
  const documents = retrieveKnowledgeDocuments(query);

  if (!documents.length) {
    return "No uploaded/policy knowledge documents matched this query.";
  }

  return documents
    .map(
      (document, index) =>
        `${index + 1}. ${document.title}\nSource: ${document.source} | Version: ${
          document.version
        } | Effective: ${document.effectiveFrom}\nExcerpt: ${document.text}`
    )
    .join("\n\n");
}

function normalize(value?: string) {
  return (value ?? "").toLowerCase().replace(/[_/-]+/g, " ").replace(/\s+/g, " ").trim();
}
