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
  const resolvedSubtitle = subtitle ?? `${t("publicProof")} | ${t("warrantyGuard")}`;

  return (
    <div className={`flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}>
      <div
        className={`cp-logo-mark group relative grid shrink-0 ${markSize} place-items-center overflow-hidden border border-[#c6c5d5] bg-white shadow-[0_8px_18px_rgba(0,0,60,0.1)]`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(49,158,35,0.18),transparent_22%),radial-gradient(circle_at_20%_84%,rgba(254,152,50,0.22),transparent_24%)]" />
        <div className="absolute bottom-2.5 flex h-6 items-end gap-0.5 opacity-80">
          <span className="h-3 w-1.5 rounded-t-sm bg-[#fe9832]" />
          <span className="h-5 w-1.5 rounded-t-sm bg-[#ffb77a]" />
          <span className="h-6 w-1.5 rounded-t-sm bg-[#000080]" />
          <span className="h-4 w-1.5 rounded-t-sm bg-[#319e23]" />
          <span className="h-5 w-1.5 rounded-t-sm bg-[#fe9832]" />
        </div>
        <Landmark size={size === "sm" ? 21 : 25} className="relative z-10 -translate-y-1 text-[#00003c]" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#fe9832]" />
        <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full bg-[#319e23]" />
        <span className="absolute bottom-5 right-4 h-px w-5 -rotate-45 bg-[#319e23]/70" />
      </div>

      {showText && (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={`${titleSize} whitespace-nowrap font-black leading-none tracking-tight text-[#00003c]`}>
            City<span className="cp-brand-text">Pramaan</span>
          </span>
          <span className="hidden max-w-[180px] truncate text-[10px] font-bold uppercase tracking-[0.18em] text-[#464653] sm:block md:max-w-none">
            {resolvedSubtitle}
          </span>
        </div>
      )}
    </div>
  );
}
