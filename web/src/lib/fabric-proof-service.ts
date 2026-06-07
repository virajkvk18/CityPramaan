export type FabricProofEventInput = {
  reportId: string;
  eventType: string;
  proofHash: string;
  actorRole: string;
  organization: string;
  status: string;
  city?: string;
  issueType?: string;
  locationHash?: string;
  evidenceHash?: string;
  citizenHash?: string;
};

export type FabricProofMetadata = FabricProofEventInput & {
  source?: "REAL_FABRIC_GATEWAY" | "FABRIC_ADAPTER_FALLBACK";
  fabricTxId: string;
  fabricChannel: "cityrepairchannel";
  chaincodeName: "citypramaan";
  endorsementPolicy: "Org1MSP + Org2MSP" | "OR('Org1MSP.peer')";
  timestamp: string;
  fabricResult?: unknown;
};

// This adapter is designed to be replaced with real Hyperledger Fabric Gateway SDK calls to the deployed citypramaan chaincode.
export async function recordFabricProofEvent(
  event: FabricProofEventInput
): Promise<FabricProofMetadata> {
  return {
    source: "FABRIC_ADAPTER_FALLBACK",
    fabricTxId: createFabricStyleTxId(event),
    fabricChannel: "cityrepairchannel",
    chaincodeName: "citypramaan",
    endorsementPolicy: "Org1MSP + Org2MSP",
    reportId: event.reportId,
    eventType: event.eventType,
    proofHash: event.proofHash,
    actorRole: event.actorRole,
    organization: event.organization,
    status: event.status,
    timestamp: new Date().toISOString(),
  };
}

function createFabricStyleTxId(event: FabricProofEventInput) {
  const seed = [
    event.reportId,
    event.eventType,
    event.proofHash,
    event.actorRole,
    event.organization,
    event.status,
    Date.now(),
  ].join(":");

  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return `fabric-${hash.toString(16).padStart(8, "0")}-${Date.now().toString(16)}`;
}
