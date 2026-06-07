import { NextResponse } from "next/server";
import { asString, asStringArray, clampNumber, runJsonAgent } from "@/src/lib/ai-agent-server";
import type {
  ImageDuplicateMatch,
  ImageForensicsFileMetadata,
  ImageForensicsResult,
  ImageProofType,
} from "@/src/lib/image-forensics-types";
import type { CivicReport } from "@/src/lib/mock-data";

type ImageForensicsBody = {
  proofType?: ImageProofType;
  imageName?: string;
  imageDataUrl?: string;
  imageHash?: string;
  perceptualHash?: string;
  metadata?: ImageForensicsFileMetadata;
  duplicateMatches?: ImageDuplicateMatch[];
  uploadedLatitude?: number;
  uploadedLongitude?: number;
  complaintLatitude?: number;
  complaintLongitude?: number;
  report?: Partial<CivicReport>;
  beforeImageDataUrl?: string;
};

type AgentImageForensicsResult = Pick<
  ImageForensicsResult,
  | "authenticity"
  | "aiGeneratedConfidence"
  | "manipulationConfidence"
  | "metadataStatus"
  | "gpsConsistency"
  | "duplicateStatus"
  | "beforeAfterConsistency"
  | "fraudScore"
  | "riskLevel"
  | "decision"
  | "reviewerAction"
  | "forensicSummary"
  | "reasons"
>;

const authenticityValues: ImageForensicsResult["authenticity"][] = ["REAL", "SUSPICIOUS", "AI_GENERATED"];
const metadataStatuses: ImageForensicsResult["metadataStatus"][] = ["VALID", "MISSING", "SUSPICIOUS"];
const gpsStatuses: ImageForensicsResult["gpsConsistency"][] = ["MATCH", "MISMATCH", "UNKNOWN"];
const duplicateStatuses: ImageForensicsResult["duplicateStatus"][] = ["UNIQUE", "POSSIBLE_REUSE", "REUSED"];
const beforeAfterStatuses: ImageForensicsResult["beforeAfterConsistency"][] = [
  "MATCH",
  "MISMATCH",
  "NOT_APPLICABLE",
  "UNKNOWN",
];
const riskLevels: ImageForensicsResult["riskLevel"][] = ["GENUINE", "NEEDS_REVIEW", "HIGHLY_SUSPICIOUS"];
const decisions: ImageForensicsResult["decision"][] = ["ACCEPT", "MANUAL_REVIEW", "REJECT"];

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ImageForensicsBody;
  const proofType = body.proofType ?? "CITIZEN_ISSUE";
  const metadata = normalizeMetadata(body.metadata, body.imageName);
  const duplicateMatches = body.duplicateMatches ?? [];
  const gpsDistanceMeters = getGpsDistanceMeters(metadata, body);
  const fallback = buildFallback({
    proofType,
    metadata,
    duplicateMatches,
    gpsDistanceMeters,
    hasBeforeImage: Boolean(body.beforeImageDataUrl),
  });

  const agent = await runJsonAgent<AgentImageForensicsResult>({
    agentName: "ProofGuard AI Image Forensics Agent",
    task:
      "Detect fake, AI-generated, edited, reused, or inconsistent civic proof photos. Check AI-generation artifacts, manipulation signs, EXIF metadata, GPS consistency, duplicate/reused image matches, and before/after location consistency.",
    input: {
      proofType,
      imageName: body.imageName,
      report: body.report,
      metadata,
      duplicateMatches,
      gpsDistanceMeters,
      hasBeforeImage: Boolean(body.beforeImageDataUrl),
    },
    fallback,
    schema:
      '{ "authenticity": "REAL|SUSPICIOUS|AI_GENERATED", "aiGeneratedConfidence": number, "manipulationConfidence": number, "metadataStatus": "VALID|MISSING|SUSPICIOUS", "gpsConsistency": "MATCH|MISMATCH|UNKNOWN", "duplicateStatus": "UNIQUE|POSSIBLE_REUSE|REUSED", "beforeAfterConsistency": "MATCH|MISMATCH|NOT_APPLICABLE|UNKNOWN", "fraudScore": number 0-100, "riskLevel": "GENUINE|NEEDS_REVIEW|HIGHLY_SUSPICIOUS", "decision": "ACCEPT|MANUAL_REVIEW|REJECT", "reviewerAction": string, "forensicSummary": string, "reasons": string[] }',
    imageDataUrls: [body.imageDataUrl ?? "", body.beforeImageDataUrl ?? ""],
    ruleQuery: {
      text: `${body.report?.title ?? ""} ${body.report?.location ?? ""} image forensics fake AI generated edited reused proof metadata GPS before after`,
      category: body.report?.issueCategory,
      report: body.report,
      limit: 5,
    },
  });
  const sanitized = sanitize(agent.result, fallback);
  const verifiedAt = new Date().toISOString();

  return NextResponse.json({
    ...agent,
    result: {
      featureName: "ProofGuard AI",
      proofType,
      ...sanitized,
      imageHash: body.imageHash ?? "",
      perceptualHash: body.perceptualHash ?? "",
      duplicateMatches,
      metadata: {
        ...metadata,
        metadataWarnings: [
          ...metadata.metadataWarnings,
          ...(typeof gpsDistanceMeters === "number"
            ? [`GPS distance from complaint pin: ${Math.round(gpsDistanceMeters)}m`]
            : []),
        ],
      },
      blockchainPayload: {
        imageHash: body.imageHash ?? "",
        perceptualHash: body.perceptualHash ?? "",
        fraudScore: sanitized.fraudScore,
        decision: sanitized.decision,
        verifiedAt,
        reviewerAction: sanitized.reviewerAction,
      },
      aiMode: agent.mode,
      aiProvider: agent.agentTrace.providerLabel,
      aiFallbackReason: agent.fallbackReason,
    } satisfies ImageForensicsResult,
  });
}

function buildFallback({
  proofType,
  metadata,
  duplicateMatches,
  gpsDistanceMeters,
  hasBeforeImage,
}: {
  proofType: ImageProofType;
  metadata: ImageForensicsFileMetadata;
  duplicateMatches: ImageDuplicateMatch[];
  gpsDistanceMeters?: number;
  hasBeforeImage: boolean;
}): AgentImageForensicsResult {
  const exactDuplicate = duplicateMatches.some((match) => match.matchType === "EXACT_HASH");
  const perceptualDuplicate = duplicateMatches.some((match) => match.matchType === "PERCEPTUAL_MATCH");
  const gpsMismatch = typeof gpsDistanceMeters === "number" && gpsDistanceMeters > 250;
  const missingExif = !metadata.hasExif;
  const tinyOrHuge =
    metadata.fileSize > 0 && (metadata.fileSize < 12_000 || metadata.fileSize > 10_000_000);
  const suspiciousDimensions =
    Boolean(metadata.width && metadata.height) &&
    ((metadata.width ?? 0) < 360 || (metadata.height ?? 0) < 360);
  const fraudScore = Math.min(
    100,
    (exactDuplicate ? 78 : perceptualDuplicate ? 52 : 0) +
      (gpsMismatch ? 28 : 0) +
      (missingExif ? 16 : 0) +
      (tinyOrHuge ? 12 : 0) +
      (suspiciousDimensions ? 12 : 0) +
      (proofType === "CONTRACTOR_REPAIR" && !hasBeforeImage ? 10 : 0)
  );
  const riskLevel =
    fraudScore >= 61 ? "HIGHLY_SUSPICIOUS" : fraudScore >= 31 ? "NEEDS_REVIEW" : "GENUINE";
  const decision = fraudScore >= 75 ? "REJECT" : fraudScore >= 31 ? "MANUAL_REVIEW" : "ACCEPT";

  return {
    authenticity: fraudScore >= 61 ? "SUSPICIOUS" : "REAL",
    aiGeneratedConfidence: missingExif && suspiciousDimensions ? 42 : missingExif ? 28 : 12,
    manipulationConfidence: tinyOrHuge || suspiciousDimensions ? 45 : 18,
    metadataStatus: metadata.hasExif ? (gpsMismatch ? "SUSPICIOUS" : "VALID") : "MISSING",
    gpsConsistency: gpsMismatch ? "MISMATCH" : typeof gpsDistanceMeters === "number" ? "MATCH" : "UNKNOWN",
    duplicateStatus: exactDuplicate ? "REUSED" : perceptualDuplicate ? "POSSIBLE_REUSE" : "UNIQUE",
    beforeAfterConsistency:
      proofType === "CONTRACTOR_REPAIR" ? (hasBeforeImage ? "UNKNOWN" : "MISMATCH") : "NOT_APPLICABLE",
    fraudScore,
    riskLevel,
    decision,
    reviewerAction:
      decision === "ACCEPT"
        ? "Accept proof and continue normal civic workflow."
        : decision === "REJECT"
          ? "Reject or hold proof because reuse or location/metadata risk is too high."
          : "Send proof to manual review before assignment or approval.",
    forensicSummary:
      riskLevel === "GENUINE"
        ? "No strong local forensic risk was found. Real AI vision can still add stronger artifact detection."
        : "Local forensics found metadata, duplicate, size, or GPS risk signals that require review.",
    reasons: [
      exactDuplicate ? "Exact image hash matches an earlier proof." : "",
      perceptualDuplicate ? "Perceptual hash is visually close to an earlier proof." : "",
      gpsMismatch ? "Image GPS metadata does not match complaint location." : "",
      missingExif ? "Camera EXIF metadata is missing or unavailable." : "",
      tinyOrHuge ? "File size is unusual for field evidence." : "",
      suspiciousDimensions ? "Image resolution is unusually low for proof evidence." : "",
    ].filter(Boolean),
  };
}

function sanitize(
  raw: AgentImageForensicsResult,
  fallback: AgentImageForensicsResult
): AgentImageForensicsResult {
  const fraudScore = clampNumber(raw.fraudScore, fallback.fraudScore);
  const decision =
    pickAllowed(raw.decision, decisions) ?? (fraudScore >= 75 ? "REJECT" : fraudScore >= 31 ? "MANUAL_REVIEW" : "ACCEPT");

  return {
    authenticity: pickAllowed(raw.authenticity, authenticityValues) ?? fallback.authenticity,
    aiGeneratedConfidence: clampNumber(raw.aiGeneratedConfidence, fallback.aiGeneratedConfidence),
    manipulationConfidence: clampNumber(raw.manipulationConfidence, fallback.manipulationConfidence),
    metadataStatus: pickAllowed(raw.metadataStatus, metadataStatuses) ?? fallback.metadataStatus,
    gpsConsistency: pickAllowed(raw.gpsConsistency, gpsStatuses) ?? fallback.gpsConsistency,
    duplicateStatus: pickAllowed(raw.duplicateStatus, duplicateStatuses) ?? fallback.duplicateStatus,
    beforeAfterConsistency:
      pickAllowed(raw.beforeAfterConsistency, beforeAfterStatuses) ?? fallback.beforeAfterConsistency,
    fraudScore,
    riskLevel: pickAllowed(raw.riskLevel, riskLevels) ?? fallback.riskLevel,
    decision,
    reviewerAction: asString(raw.reviewerAction, fallback.reviewerAction),
    forensicSummary: asString(raw.forensicSummary, fallback.forensicSummary),
    reasons: asStringArray(raw.reasons, fallback.reasons),
  };
}

function normalizeMetadata(
  metadata?: ImageForensicsFileMetadata,
  imageName?: string
): ImageForensicsFileMetadata {
  return {
    fileName: metadata?.fileName || imageName || "uploaded-proof-image",
    fileType: metadata?.fileType || "image/*",
    fileSize: Number.isFinite(metadata?.fileSize) ? metadata?.fileSize ?? 0 : 0,
    lastModified: metadata?.lastModified,
    width: metadata?.width,
    height: metadata?.height,
    cameraMake: metadata?.cameraMake,
    cameraModel: metadata?.cameraModel,
    deviceInfo: metadata?.deviceInfo,
    takenAt: metadata?.takenAt,
    gpsLatitude: metadata?.gpsLatitude,
    gpsLongitude: metadata?.gpsLongitude,
    hasExif: Boolean(metadata?.hasExif),
    metadataWarnings: metadata?.metadataWarnings ?? [],
  };
}

function getGpsDistanceMeters(metadata: ImageForensicsFileMetadata, body: ImageForensicsBody) {
  const fromLat = metadata.gpsLatitude ?? body.uploadedLatitude;
  const fromLng = metadata.gpsLongitude ?? body.uploadedLongitude;
  const toLat = body.complaintLatitude ?? body.report?.latitude;
  const toLng = body.complaintLongitude ?? body.report?.longitude;

  if (![fromLat, fromLng, toLat, toLng].every((value) => typeof value === "number")) {
    return undefined;
  }

  return getDistanceKm(fromLat as number, fromLng as number, toLat as number, toLng as number) * 1000;
}

function getDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const startLat = toRadians(fromLat);
  const endLat = toRadians(toLat);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function pickAllowed<T extends string>(value: unknown, allowed: T[]) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : null;
}
