import { NextResponse } from "next/server";
import {
  recordFabricProofEvent,
  type FabricProofEventInput,
  type FabricProofMetadata,
} from "@/src/lib/fabric-proof-service";

const FABRIC_GATEWAY_BASE_URL = "http://localhost:4000";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<FabricProofEventInput>;
  const { reportId, eventType, proofHash, actorRole, organization, status } = body;

  if (!reportId || !eventType || !proofHash || !actorRole || !organization || !status) {
    return NextResponse.json(
      {
        error:
          "Missing required Fabric proof fields: reportId, eventType, proofHash, actorRole, organization, status",
      },
      { status: 400 }
    );
  }

  if (eventType === "REPORT_CREATED") {
    const realFabricProof = await tryCreateRealFabricReportProof({
      ...body,
      reportId,
      eventType,
      proofHash,
      actorRole,
      organization,
      status,
    });

    if (realFabricProof) {
      return NextResponse.json({ proof: realFabricProof });
    }
  }

  // If backend is unavailable, fallback keeps UI demo stable.
  const proof = await recordFabricProofEvent({
    reportId,
    eventType,
    proofHash,
    actorRole,
    organization,
    status,
  });

  return NextResponse.json({ proof });
}

async function tryCreateRealFabricReportProof(
  event: FabricProofEventInput
): Promise<FabricProofMetadata | undefined> {
  const evidenceHash = event.evidenceHash ?? event.proofHash ?? `hash_evidence_${event.reportId}`;
  const fabricRequest = {
    reportId: event.reportId,
    city: event.city ?? "Jabalpur",
    issueType: event.issueType ?? "ROAD_DAMAGE",
    locationHash: event.locationHash ?? `hash_location_${event.reportId}`,
    evidenceHash,
    citizenHash: event.citizenHash ?? `hash_citizen_${event.reportId}`,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // Real Fabric Gateway backend runs locally on port 4000 for hackathon demo.
    // Browser does not call Fabric directly.
    const response = await fetch(`${FABRIC_GATEWAY_BASE_URL}/fabric/create-report-proof`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fabricRequest),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn("Real Fabric Gateway create-report-proof failed:", response.statusText);
      return undefined;
    }

    const fabricResult = (await response.json().catch(() => null)) as unknown;

    return {
      source: "REAL_FABRIC_GATEWAY",
      fabricTxId: extractFabricTxId(fabricResult, event.reportId),
      fabricChannel: "cityrepairchannel",
      chaincodeName: "citypramaan",
      endorsementPolicy: "OR('Org1MSP.peer')",
      reportId: event.reportId,
      eventType: "REPORT_CREATED",
      proofHash: evidenceHash,
      actorRole: event.actorRole,
      organization: event.organization,
      status: event.status,
      timestamp: new Date().toISOString(),
      fabricResult,
    };
  } catch (error) {
    console.warn("Real Fabric Gateway unavailable; using adapter fallback:", error);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

function extractFabricTxId(fabricResult: unknown, reportId: string) {
  if (fabricResult && typeof fabricResult === "object") {
    const result = fabricResult as Record<string, unknown>;
    const candidates = [
      result.fabricTxId,
      result.txId,
      result.transactionId,
      result.transactionID,
      result.txID,
    ];
    const txId = candidates.find((candidate) => typeof candidate === "string" && candidate);

    if (typeof txId === "string") {
      return txId;
    }
  }

  return `real-fabric-${reportId}`;
}
