import { NextResponse } from "next/server";
import {
  recordFabricProofEvent,
  type FabricProofEventInput,
} from "@/src/lib/fabric-proof-service";

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
