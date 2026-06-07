export type ImageProofType = "CITIZEN_ISSUE" | "CONTRACTOR_REPAIR";

export type ImageForensicsRiskLevel = "GENUINE" | "NEEDS_REVIEW" | "HIGHLY_SUSPICIOUS";

export type ImageForensicsDecision = "ACCEPT" | "MANUAL_REVIEW" | "REJECT";

export type ImageForensicsFileMetadata = {
  fileName: string;
  fileType: string;
  fileSize: number;
  lastModified?: string;
  width?: number;
  height?: number;
  cameraMake?: string;
  cameraModel?: string;
  deviceInfo?: string;
  takenAt?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  hasExif: boolean;
  metadataWarnings: string[];
};

export type ImageDuplicateMatch = {
  reportId: string;
  imageRole: "issue" | "repair";
  distance: number;
  matchType: "EXACT_HASH" | "PERCEPTUAL_MATCH";
};

export type ImageForensicsResult = {
  featureName: "ProofGuard AI";
  proofType: ImageProofType;
  authenticity: "REAL" | "SUSPICIOUS" | "AI_GENERATED";
  aiGeneratedConfidence: number;
  manipulationConfidence: number;
  metadataStatus: "VALID" | "MISSING" | "SUSPICIOUS";
  gpsConsistency: "MATCH" | "MISMATCH" | "UNKNOWN";
  duplicateStatus: "UNIQUE" | "POSSIBLE_REUSE" | "REUSED";
  beforeAfterConsistency: "MATCH" | "MISMATCH" | "NOT_APPLICABLE" | "UNKNOWN";
  fraudScore: number;
  riskLevel: ImageForensicsRiskLevel;
  decision: ImageForensicsDecision;
  reviewerAction: string;
  forensicSummary: string;
  reasons: string[];
  imageHash: string;
  perceptualHash: string;
  duplicateMatches: ImageDuplicateMatch[];
  metadata: ImageForensicsFileMetadata;
  blockchainPayload: {
    imageHash: string;
    perceptualHash: string;
    fraudScore: number;
    decision: ImageForensicsDecision;
    verifiedAt: string;
    reviewerAction: string;
  };
  aiMode?: "real-ai" | "ruleset-fallback";
  aiProvider?: string;
  aiFallbackReason?: string;
};
