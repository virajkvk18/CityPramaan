import { Blocks } from "lucide-react";
import type { FabricProofMetadata } from "@/src/lib/fabric-proof-service";

export function FabricProofCard({ proof }: { proof?: FabricProofMetadata }) {
  if (!proof) {
    return null;
  }

  return (
    <div className="rounded-xl border border-[#00dbe9]/25 bg-[#00dbe9]/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-[#7df4ff]">
        <Blocks size={16} />
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em]">
          Hyperledger Fabric Proof
        </p>
      </div>
      <div className="grid gap-2 font-mono text-xs">
        <FabricProofRow label="Fabric Channel" value={proof.fabricChannel} />
        <FabricProofRow label="Chaincode" value={proof.chaincodeName} />
        <FabricProofRow label="Event" value={proof.eventType} />
        <FabricProofRow label="Fabric Tx ID" value={proof.fabricTxId} />
        <FabricProofRow label="Endorsement" value={proof.endorsementPolicy} />
      </div>
    </div>
  );
}

function FabricProofRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
      <span className="shrink-0 uppercase text-[#dbc2b0]/55">{label}</span>
      <span className="min-w-0 break-all text-right font-semibold text-white">{value}</span>
    </div>
  );
}
