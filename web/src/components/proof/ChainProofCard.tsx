import { Blocks, CheckCircle2, Database, FileKey2, Fingerprint } from "lucide-react";

type ChainProofCardProps = {
  compact?: boolean;
};

const proof = {
  network: "Base Sepolia",
  contract: "0x3fa2...9c11",
  block: "6,492,118",
  txHash: "0xf12d...8bb0",
  ipfsCid: "bafy...repair-proof",
  status: "Verified on-chain",
};

export function ChainProofCard({ compact = false }: ChainProofCardProps) {
  return (
    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-emerald-200">
          <Blocks size={18} />
          <p className="font-medium">On-chain Proof</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
          <CheckCircle2 size={13} />
          Live
        </span>
      </div>

      {!compact && (
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Status changes and repair evidence are anchored as tamper-resistant public records.
        </p>
      )}

      <div className="mt-4 grid gap-2">
        <ProofRow icon={<Database size={15} />} label="Network" value={proof.network} />
        <ProofRow icon={<Fingerprint size={15} />} label="Contract" value={proof.contract} />
        <ProofRow icon={<Blocks size={15} />} label="Block" value={proof.block} />
        <ProofRow icon={<FileKey2 size={15} />} label="IPFS CID" value={proof.ipfsCid} />
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2">
        <p className="text-xs text-zinc-500">Latest transaction</p>
        <p className="mt-1 break-all text-xs font-medium text-emerald-300">{proof.txHash}</p>
      </div>
    </div>
  );
}

function ProofRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2">
      <span className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="text-emerald-300">{icon}</span>
        {label}
      </span>
      <span className="text-right text-xs font-medium text-zinc-100">{value}</span>
    </div>
  );
}
