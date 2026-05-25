"use client";

import { Landmark } from "lucide-react";
import { useLanguage } from "@/src/lib/use-language";

type BrandLogoProps = {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md";
  subtitle?: string;
};

export function BrandLogo({
  className = "",
  showText = true,
  size = "md",
  subtitle,
}: BrandLogoProps) {
  const { t } = useLanguage();
  const markSize =
    size === "sm"
      ? "h-10 w-10 rounded-lg sm:h-11 sm:w-11"
      : "h-11 w-11 rounded-lg sm:h-14 sm:w-14 sm:rounded-xl";
  const titleSize = size === "sm" ? "text-xl sm:text-2xl" : "text-2xl sm:text-[29px]";
  const resolvedSubtitle = subtitle ?? `${t("publicProof")} · ${t("warrantyGuard")}`;

  return (
    <div className={`flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}>
      <div
        className={`cp-logo-mark group relative grid shrink-0 ${markSize} place-items-center overflow-hidden border border-[#ff9933]/55 bg-[#061015] shadow-[0_0_28px_rgba(255,153,51,0.18)]`}
      >
        <div className="absolute inset-1 rounded-lg border border-[#00dbe9]/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(0,235,136,0.24),transparent_22%),radial-gradient(circle_at_20%_84%,rgba(255,153,51,0.22),transparent_24%)]" />
        <div className="absolute bottom-2.5 flex h-6 items-end gap-0.5">
          <span className="h-3 w-1.5 rounded-t-sm bg-[#ff9933]" />
          <span className="h-5 w-1.5 rounded-t-sm bg-[#ffc08d]" />
          <span className="h-6 w-1.5 rounded-t-sm bg-[#00dbe9]" />
          <span className="h-4 w-1.5 rounded-t-sm bg-[#00eb88]" />
          <span className="h-5 w-1.5 rounded-t-sm bg-[#ff9933]" />
        </div>
        <Landmark
          size={size === "sm" ? 21 : 25}
          className="relative z-10 -translate-y-1 text-[#ffdcc2] drop-shadow-[0_0_8px_rgba(255,192,141,0.55)]"
        />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-[#00dbe9] bg-[#061015]" />
        <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full bg-[#00eb88] shadow-[0_0_14px_rgba(0,235,136,0.95)]" />
        <span className="absolute bottom-5 right-4 h-px w-5 -rotate-45 bg-[#00eb88]/70" />
      </div>

      {showText && (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={`${titleSize} font-black leading-none tracking-tight text-white`}>
            City<span className="cp-brand-text">Pramaan</span>
          </span>
          <span className="hidden max-w-[180px] truncate font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#dbc2b0] sm:block md:max-w-none">
            {resolvedSubtitle}
          </span>
        </div>
      )}
    </div>
  );
}
