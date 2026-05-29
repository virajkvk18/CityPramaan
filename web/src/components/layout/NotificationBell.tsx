"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Bell, CheckCircle2, FileImage, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import { getCitySnapshot, subscribeCity } from "@/src/lib/city-storage";
import { DEFAULT_CITY_KEY, getCityByKey } from "@/src/lib/city-context";
import { getReportsForCity, type CivicReport } from "@/src/lib/mock-data";
import { getLocalReportsSnapshot, subscribeLocalReports } from "@/src/lib/report-storage";
import { useDetectedLocationDisplay } from "@/src/lib/use-detected-location";

type NotificationBellProps = {
  className?: string;
};

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: "cyan" | "amber" | "emerald" | "rose";
  icon: ReactNode;
};

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const citySnapshot = useSyncExternalStore(subscribeCity, getCitySnapshot, () => DEFAULT_CITY_KEY);
  const localReportsSnapshot = useSyncExternalStore(
    subscribeLocalReports,
    getLocalReportsSnapshot,
    () => "[]"
  );
  const selectedCity = getCityByKey(citySnapshot);
  const cityDisplay = useDetectedLocationDisplay(selectedCity);
  const localReports = useMemo(() => parseReports(localReportsSnapshot), [localReportsSnapshot]);
  const notifications = useMemo(() => {
    const localForCity = localReports.filter(
      (report) => !report.cityKey || report.cityKey === selectedCity.key
    );
    const localIds = new Set(localForCity.map((report) => report.id));
    const cityReports = getReportsForCity(selectedCity.key).filter((report) => !localIds.has(report.id));
    const reports = [...localForCity, ...cityReports].sort(sortLatestReports);

    return buildNotifications(reports, selectedCity.primaryArea).slice(0, 4);
  }, [localReports, selectedCity.key, selectedCity.primaryArea]);
  const unreadCount = notifications.length;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-9 w-9 place-items-center rounded border border-white/10 bg-white/[0.04] text-[#dbc2b0]/80 transition hover:border-[#00dbe9]/45 hover:text-[#7df4ff] sm:h-10 sm:w-10"
        aria-label="Open notifications"
        aria-expanded={open}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#ff4d6d] px-1 font-mono text-[9px] font-bold text-white shadow-[0_0_14px_rgba(255,77,109,0.55)]">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[80] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-[#00dbe9]/20 bg-[#050607]/95 shadow-[0_18px_55px_rgba(0,0,0,0.55),0_0_28px_rgba(0,219,233,0.12)] backdrop-blur-2xl">
          <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(0,219,233,0.12),rgba(255,153,51,0.08))] px-4 py-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#00dbe9]">
              Civic Notifications
            </p>
            <p className="mt-1 text-xs text-[#dbc2b0]">{cityDisplay.cityName} live issue updates</p>
          </div>

          <div className="max-h-[21rem] overflow-y-auto p-2">
            {notifications.map((notification) => (
              <a
                key={notification.id}
                href={notification.href}
                onClick={() => setOpen(false)}
                className="flex gap-3 rounded-lg border border-transparent p-3 transition hover:border-[#00dbe9]/25 hover:bg-[#00dbe9]/8"
              >
                <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${toneClass(notification.tone)}`}>
                  {notification.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{notification.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#dbc2b0]">{notification.detail}</span>
                  <span className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#00dbe9]">
                    <MapPin size={11} />
                    View progress
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function parseReports(snapshot: string) {
  try {
    return JSON.parse(snapshot) as CivicReport[];
  } catch {
    return [];
  }
}

function sortLatestReports(a: CivicReport, b: CivicReport) {
  const time = (report: CivicReport) =>
    Date.parse(report.updatedAt ?? report.repairProofAt ?? report.createdAt ?? "") || 0;

  return time(b) - time(a) || a.id.localeCompare(b.id);
}

function buildNotifications(reports: CivicReport[], area: string): NotificationItem[] {
  const primaryReport = reports[0];
  const items: NotificationItem[] = [];

  if (primaryReport) {
    items.push({
      id: `${primaryReport.id}-area`,
      title: "Somebody reported an issue in your area",
      detail: `${primaryReport.title} near ${area}. Track report raised, repair proof, approval, and warranty status.`,
      href: `/warranty?issue=${primaryReport.id}#issue-progress`,
      tone: "cyan",
      icon: <MapPin size={17} />,
    });
  }

  const proofReport = reports.find((report) => report.status === "REPAIR_SUBMITTED");
  if (proofReport) {
    items.push({
      id: `${proofReport.id}-proof`,
      title: "Contractor repair proof uploaded",
      detail: `${proofReport.id} is waiting for issuer approval before warranty activation.`,
      href: `/warranty?issue=${proofReport.id}#issue-progress`,
      tone: "amber",
      icon: <FileImage size={17} />,
    });
  }

  const warrantyReport = reports.find((report) => report.status === "UNDER_WARRANTY");
  if (warrantyReport) {
    items.push({
      id: `${warrantyReport.id}-warranty`,
      title: "Repair solved and warranty is active",
      detail: `${warrantyReport.id} is now under warranty monitoring. Public proof history is visible.`,
      href: `/warranty?issue=${warrantyReport.id}#issue-progress`,
      tone: "emerald",
      icon: <ShieldCheck size={17} />,
    });
  }

  const repeatReport = reports.find((report) => report.status === "REPEAT_FAILURE");
  if (repeatReport) {
    items.push({
      id: `${repeatReport.id}-repeat`,
      title: "Repeat failure detected",
      detail: `${repeatReport.id} has been flagged again under warranty. Check the repair history.`,
      href: `/warranty?issue=${repeatReport.id}#issue-progress`,
      tone: "rose",
      icon: <ShieldAlert size={17} />,
    });
  }

  if (items.length === 0) {
    items.push({
      id: "no-active-report",
      title: "No active reports nearby",
      detail: "Open the warranty scanner to explore city issue history and public proof trails.",
      href: "/warranty",
      tone: "emerald",
      icon: <CheckCircle2 size={17} />,
    });
  }

  return dedupeNotifications(items);
}

function dedupeNotifications(items: NotificationItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function toneClass(tone: NotificationItem["tone"]) {
  const tones = {
    cyan: "border-[#00dbe9]/35 bg-[#00dbe9]/10 text-[#7df4ff]",
    amber: "border-[#ffc08d]/35 bg-[#ffc08d]/10 text-[#ffc08d]",
    emerald: "border-[#00eb88]/35 bg-[#00eb88]/10 text-[#5bffa1]",
    rose: "border-[#ffb4ab]/35 bg-[#ffb4ab]/10 text-[#ffb4ab]",
  };

  return tones[tone];
}
