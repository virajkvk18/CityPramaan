"use client";

import { sha256Hex } from "./proof-hashing";
import type { CivicReport } from "./mock-data";
import type {
  ImageDuplicateMatch,
  ImageForensicsFileMetadata,
  ImageForensicsResult,
  ImageProofType,
} from "./image-forensics-types";

type ImageForensicsInput = {
  proofType: ImageProofType;
  file?: File;
  imageName: string;
  imageDataUrl: string;
  cityReports: CivicReport[];
  report?: CivicReport;
  uploadedLatitude?: number;
  uploadedLongitude?: number;
  complaintLatitude?: number;
  complaintLongitude?: number;
  beforeImageDataUrl?: string;
};

type ImageForensicsResponse = {
  result?: ImageForensicsResult;
};

export async function requestImageForensics(input: ImageForensicsInput): Promise<ImageForensicsResult> {
  const [imageHash, perceptualHash, metadata] = await Promise.all([
    sha256Hex(input.imageDataUrl),
    createPerceptualHash(input.imageDataUrl),
    extractImageMetadata(input.file, input.imageDataUrl, input.imageName),
  ]);
  const duplicateMatches = await findDuplicateImageMatches({
    currentReportId: input.report?.id,
    imageHash,
    perceptualHash,
    cityReports: input.cityReports,
  });
  const fallback = buildClientFallback({
    proofType: input.proofType,
    imageHash,
    perceptualHash,
    metadata,
    duplicateMatches,
  });

  try {
    const response = await fetch("/api/ai/image-forensics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proofType: input.proofType,
        imageName: input.imageName,
        imageDataUrl: input.imageDataUrl,
        imageHash,
        perceptualHash,
        metadata,
        duplicateMatches,
        uploadedLatitude: input.uploadedLatitude,
        uploadedLongitude: input.uploadedLongitude,
        complaintLatitude: input.complaintLatitude,
        complaintLongitude: input.complaintLongitude,
        report: input.report,
        beforeImageDataUrl: input.beforeImageDataUrl,
      }),
    });

    if (!response.ok) {
      return {
        ...fallback,
        aiFallbackReason: `ProofGuard AI API returned ${response.status}.`,
      };
    }

    const payload = (await response.json()) as ImageForensicsResponse;
    return payload.result ?? fallback;
  } catch (error) {
    console.warn("ProofGuard AI image forensics unavailable:", error);
    return fallback;
  }
}

export function imageForensicsStatusCopy(result?: ImageForensicsResult | null) {
  if (!result) {
    return "ProofGuard AI not run yet.";
  }

  if (result.decision === "ACCEPT") {
    return `ProofGuard AI accepted this image. Fraud score ${result.fraudScore}/100.`;
  }

  if (result.decision === "REJECT") {
    return `ProofGuard AI flagged high risk. Fraud score ${result.fraudScore}/100.`;
  }

  return `ProofGuard AI requires manual review. Fraud score ${result.fraudScore}/100.`;
}

async function extractImageMetadata(
  file: File | undefined,
  imageDataUrl: string,
  fallbackName: string
): Promise<ImageForensicsFileMetadata> {
  const dimensions: { width?: number; height?: number } = await getImageDimensions(imageDataUrl).catch(() => ({}));
  const metadataWarnings: string[] = [];
  let exif: Record<string, unknown> | undefined;

  if (file) {
    try {
      const exifr = await import("exifr");
      exif = (await exifr.parse(file, true)) as Record<string, unknown> | undefined;
    } catch (error) {
      console.warn("EXIF parsing failed:", error);
      metadataWarnings.push("EXIF parser could not read camera metadata.");
    }
  }

  const cameraMake = asString(exif?.Make);
  const cameraModel = asString(exif?.Model);
  const gpsLatitude = asNumber(exif?.latitude);
  const gpsLongitude = asNumber(exif?.longitude);
  const takenAt = stringifyDate(exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate);
  const hasExif = Boolean(exif && Object.keys(exif).length);

  if (!hasExif) {
    metadataWarnings.push("Camera EXIF metadata is missing.");
  }

  if (!cameraMake && !cameraModel) {
    metadataWarnings.push("Camera make/model is not available.");
  }

  if (!gpsLatitude || !gpsLongitude) {
    metadataWarnings.push("Photo GPS metadata is missing.");
  }

  return {
    fileName: file?.name ?? fallbackName,
    fileType: file?.type || imageDataUrl.slice(5, imageDataUrl.indexOf(";")) || "image/*",
    fileSize: file?.size ?? estimateDataUrlBytes(imageDataUrl),
    lastModified: file?.lastModified ? new Date(file.lastModified).toISOString() : undefined,
    width: dimensions.width,
    height: dimensions.height,
    cameraMake,
    cameraModel,
    deviceInfo: [cameraMake, cameraModel].filter(Boolean).join(" ") || undefined,
    takenAt,
    gpsLatitude,
    gpsLongitude,
    hasExif,
    metadataWarnings,
  };
}

async function findDuplicateImageMatches({
  currentReportId,
  imageHash,
  perceptualHash,
  cityReports,
}: {
  currentReportId?: string;
  imageHash: string;
  perceptualHash: string;
  cityReports: CivicReport[];
}) {
  const matches: ImageDuplicateMatch[] = [];
  const candidates = cityReports
    .filter((report) => report.id !== currentReportId)
    .flatMap((report) => [
      {
        reportId: report.id,
        imageRole: "issue" as const,
        imageDataUrl: report.issueImageDataUrl,
        hash: report.evidenceHash,
      },
      {
        reportId: report.id,
        imageRole: "repair" as const,
        imageDataUrl: report.repairImageDataUrl,
        hash: report.repairEvidenceHash,
      },
    ])
    .filter((candidate) => candidate.imageDataUrl || candidate.hash)
    .slice(0, 40);

  for (const candidate of candidates) {
    if (candidate.hash && candidate.hash === imageHash) {
      matches.push({
        reportId: candidate.reportId,
        imageRole: candidate.imageRole,
        distance: 0,
        matchType: "EXACT_HASH",
      });
      continue;
    }

    if (!candidate.imageDataUrl || !perceptualHash) {
      continue;
    }

    const candidateHash = await createPerceptualHash(candidate.imageDataUrl).catch(() => "");
    const distance = hammingDistance(perceptualHash, candidateHash);

    if (candidateHash && distance <= 8) {
      matches.push({
        reportId: candidate.reportId,
        imageRole: candidate.imageRole,
        distance,
        matchType: "PERCEPTUAL_MATCH",
      });
    }
  }

  return matches.slice(0, 8);
}

function buildClientFallback({
  proofType,
  imageHash,
  perceptualHash,
  metadata,
  duplicateMatches,
}: {
  proofType: ImageProofType;
  imageHash: string;
  perceptualHash: string;
  metadata: ImageForensicsFileMetadata;
  duplicateMatches: ImageDuplicateMatch[];
}): ImageForensicsResult {
  const reused = duplicateMatches.some((match) => match.matchType === "EXACT_HASH");
  const similar = duplicateMatches.some((match) => match.matchType === "PERCEPTUAL_MATCH");
  const fraudScore = Math.min(100, (reused ? 75 : similar ? 45 : 0) + (!metadata.hasExif ? 16 : 0));
  const riskLevel = fraudScore >= 61 ? "HIGHLY_SUSPICIOUS" : fraudScore >= 31 ? "NEEDS_REVIEW" : "GENUINE";
  const decision = fraudScore >= 75 ? "REJECT" : fraudScore >= 31 ? "MANUAL_REVIEW" : "ACCEPT";
  const verifiedAt = new Date().toISOString();

  return {
    featureName: "ProofGuard AI",
    proofType,
    authenticity: riskLevel === "HIGHLY_SUSPICIOUS" ? "SUSPICIOUS" : "REAL",
    aiGeneratedConfidence: metadata.hasExif ? 12 : 28,
    manipulationConfidence: 20,
    metadataStatus: metadata.hasExif ? "VALID" : "MISSING",
    gpsConsistency: metadata.gpsLatitude && metadata.gpsLongitude ? "MATCH" : "UNKNOWN",
    duplicateStatus: reused ? "REUSED" : similar ? "POSSIBLE_REUSE" : "UNIQUE",
    beforeAfterConsistency: proofType === "CONTRACTOR_REPAIR" ? "UNKNOWN" : "NOT_APPLICABLE",
    fraudScore,
    riskLevel,
    decision,
    reviewerAction:
      decision === "ACCEPT"
        ? "Accept proof and continue normal workflow."
        : "Send proof to manual review before accepting it.",
    forensicSummary: "Local image hashing and metadata checks completed. Real AI forensics can add visual artifact detection.",
    reasons: [
      reused ? "Exact image hash matches older proof." : "",
      similar ? "Perceptual hash is close to older proof." : "",
      !metadata.hasExif ? "Camera EXIF metadata missing." : "",
    ].filter(Boolean),
    imageHash,
    perceptualHash,
    duplicateMatches,
    metadata,
    blockchainPayload: {
      imageHash,
      perceptualHash,
      fraudScore,
      decision,
      verifiedAt,
      reviewerAction:
        decision === "ACCEPT"
          ? "Accept proof and continue normal workflow."
          : "Send proof to manual review before accepting it.",
    },
    aiMode: "ruleset-fallback",
    aiProvider: "local",
    aiFallbackReason: "ProofGuard AI API unavailable; local metadata/hash checks used.",
  };
}

function createPerceptualHash(imageDataUrl: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 8;
      canvas.height = 8;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Canvas is unavailable for image hash."));
        return;
      }

      context.drawImage(image, 0, 0, 8, 8);
      const pixels = context.getImageData(0, 0, 8, 8).data;
      const grays: number[] = [];

      for (let index = 0; index < pixels.length; index += 4) {
        grays.push(pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114);
      }

      const average = grays.reduce((sum, value) => sum + value, 0) / grays.length;
      resolve(grays.map((value) => (value >= average ? "1" : "0")).join(""));
    };
    image.onerror = () => reject(new Error("Could not load image for perceptual hash."));
    image.src = imageDataUrl;
  });
}

function getImageDimensions(imageDataUrl: string) {
  return new Promise<{ width?: number; height?: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Could not read image dimensions."));
    image.src = imageDataUrl;
  });
}

function hammingDistance(first: string, second: string) {
  if (!first || !second || first.length !== second.length) {
    return Number.MAX_SAFE_INTEGER;
  }

  let distance = 0;

  for (let index = 0; index < first.length; index += 1) {
    if (first[index] !== second[index]) {
      distance += 1;
    }
  }

  return distance;
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.round((base64.length * 3) / 4);
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function stringifyDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return asString(value);
}
