"use client";

import { Blocks, CheckCircle2, Database, FileKey2, Fingerprint } from "lucide-react";
import { useLanguage } from "@/src/lib/use-language";

type ChainProofCardProps = {
  compact?: boolean;
  proofData?: Partial<typeof proof>;
};

const proof = {
  network: "Base Sepolia",
  contract: "0x3fa2...9c11",
  block: "6,492,118",
  txHash: "0xf12d...8bb0",
  ipfsCid: "bafy...repair-proof",
  status: "Verified on-chain",
};

export function ChainProofCard({ compact = false, proofData }: ChainProofCardProps) {
  const { t } = useLanguage();
  const displayProof = { ...proof, ...proofData };

  return (
    <div className="cp-fade-in rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-emerald-200">
          <Blocks size={18} />
          <p className="font-medium">{t("onChainProofs")}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
          <CheckCircle2 size={13} />
          {t("active")}
        </span>
      </div>

      {!compact && (
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {t("publicStatusUpdates")}. {t("hashAnchored")}.
        </p>
      )}

      <div className="mt-4 grid gap-2">
        <ProofRow icon={<Database size={15} />} label={t("chainStatus")} value={displayProof.network} />
        <ProofRow icon={<Fingerprint size={15} />} label="Contract" value={displayProof.contract} />
        <ProofRow icon={<Blocks size={15} />} label="Block" value={displayProof.block} />
        <ProofRow icon={<FileKey2 size={15} />} label="Proof Hash / CID" value={displayProof.ipfsCid} />
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2">
        <p className="text-xs text-zinc-500">{t("blockchainTransaction")}</p>
        {/* FIX: truncate instead of break-all to prevent overflow */}
        <p className="mt-1 truncate text-xs font-medium text-emerald-300" title={displayProof.txHash}>
          {displayProof.txHash}
        </p>
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
      <span className="flex shrink-0 items-center gap-2 text-xs text-zinc-500">
        <span className="text-emerald-300">{icon}</span>
        {label}
      </span>
      {/* FIX: added max-w + truncate + title tooltip so long hashes don't overflow */}
      <span className="max-w-[140px] truncate text-right text-xs font-medium text-zinc-100" title={value}>
        {value}
      </span>
    </div>
  );
}

