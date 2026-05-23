import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Blocks,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileImage,
  Fingerprint,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { ChainProofCard } from "@/src/components/proof/ChainProofCard";

export default function ProofTimelinePage({ params }: { params: { id: string } }) {
  const events = [
    {
      title: "Citizen report created",
      detail: "Road damage evidence submitted from MP Nagar Zone 1, Bhopal.",
      time: "10:12 AM",
      icon: FileImage,
      tone: "orange",
      tx: "0x82f4...91ac",
    },
    {
      title: "AI verified civic issue",
      detail: "Detected road damage with 96% confidence and critical severity.",
      time: "10:13 AM",
      icon: Sparkles,
      tone: "cyan",
      tx: "0x19bb...45aa",
    },
    {
      title: "Repair proof submitted",
      detail: "Contractor uploaded after-repair evidence for public audit.",
      time: "04:40 PM",
      icon: UserCheck,
      tone: "blue",
      tx: "0x93ac...72fd",
    },
    {
      title: "Warranty activated",
      detail: "Repair moved to 30-day warranty monitoring period.",
      time: "04:45 PM",
      icon: ShieldCheck,
      tone: "emerald",
      tx: "0xb928...1ce0",
    },
    {
      title: "Repeat failure detected",
      detail: "Same location failed again during active warranty window.",
      time: "3 days later",
      icon: ShieldAlert,
      tone: "fuchsia",
      tx: "0xf12d...8bb0",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="relative z-10 flex h-16 items-center justify-between border-b border-[#ff9933]/15 bg-[#030507]/75 px-6 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
          <ArrowLeft size={16} />
          Back to Command Center
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <BrandLogo size="sm" subtitle="Public blockchain proof" />
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 xl:grid-cols-[1fr_380px] xl:px-6 xl:py-8">
        <div>
          <div className="rounded-2xl border border-fuchsia-400/20 bg-[linear-gradient(145deg,rgba(217,70,239,0.16),rgba(0,219,233,0.06))] p-6 shadow-[0_0_24px_rgba(217,70,239,0.1)]">
            <div className="flex items-center gap-2 text-fuchsia-200">
              <AlertTriangle size={20} />
              <p className="font-medium">Repeat Failure Case</p>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Public Proof Timeline: {params.id}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              This road segment was previously marked repaired, but failed again inside its active
              warranty period. CityPramaan keeps every status change, AI audit, and repair proof
              visible as a tamper-resistant public record.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Badge icon={<MapPin size={15} />} label="MP Nagar Zone 1, Bhopal" />
              <Badge icon={<CalendarClock size={15} />} label="12 warranty days left" />
              <Badge icon={<Blocks size={15} />} label="5 on-chain events" />
              <Badge icon={<Fingerprint size={15} />} label="Contractor: Bhopal RoadWorks" />
            </div>
          </div>

          <div className="cp-cyber-card cp-cyber-card-hover mt-6 rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-orange-300">Tamper-Proof Audit</p>
                <h2 className="mt-1 text-2xl font-semibold">Proof Timeline</h2>
              </div>

              <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                View Contract
                <ExternalLink size={15} />
              </button>
            </div>

            <div className="space-y-0">
              {events.map((event, index) => {
                const Icon = event.icon;

                return (
                  <div key={event.title} className="grid grid-cols-[36px_1fr] gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`grid h-9 w-9 place-items-center rounded-full ${toneClass(event.tone)}`}>
                        <Icon size={17} />
                      </div>
                      {index !== events.length - 1 && <div className="h-16 w-px bg-white/10" />}
                    </div>

                    <div className="pb-7">
                      <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="mt-1 text-sm text-zinc-400">{event.detail}</p>
                          </div>
                          <p className="shrink-0 text-xs text-zinc-500">{event.time}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                          <span className="text-xs text-zinc-500">Blockchain transaction</span>
                          <span className="text-xs text-emerald-300">{event.tx}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <ChainProofCard />

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-cyan-300" />
              <p className="font-medium">AI Verdict</p>
            </div>

            <div className="mt-5 space-y-3">
              <Score label="Initial Issue Confidence" value="96%" />
              <Score label="Repair Confidence" value="84%" />
              <Score label="False Closure Risk" value="High" />
              <Score label="Repeat Match" value="92%" />
            </div>

            <p className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-zinc-300">
              The new damage report appears within the same repaired road segment and warranty
              period. Case should be reopened for accountability review.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
  <div className="flex items-center gap-2">
    <FileImage size={18} className="text-orange-300" />
    <p className="font-medium">Evidence Comparison</p>
  </div>

  <div className="mt-4 space-y-3">
    <EvidenceCard
      label="Before Repair"
      status="Critical road damage detected"
      tone="red"
      pattern="pothole"
    />
    <EvidenceCard
      label="After Repair"
      status="Patch submitted by contractor"
      tone="emerald"
      pattern="patch"
    />
    <EvidenceCard
      label="Repeat Failure"
      status="Damage appeared again inside warranty"
      tone="fuchsia"
      pattern="failure"
    />
  </div>
</div>

          <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-5">
            <div className="flex items-center gap-2 text-fuchsia-200">
              <ShieldAlert size={18} />
              <p className="font-medium">Accountability Impact</p>
            </div>

            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />
                Case automatically reopened
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />
                Contractor score reduced
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />
                Warranty claim publicly visible
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/60 px-3 py-1.5 text-sm text-zinc-300">
      {icon}
      {label}
    </span>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function EvidenceCard({
  label,
  status,
  tone,
  pattern,
}: {
  label: string;
  status: string;
  tone: "red" | "emerald" | "fuchsia";
  pattern: "pothole" | "patch" | "failure";
}) {
  const toneMap = {
    red: "border-red-400/20 bg-red-500/10 text-red-200",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    fuchsia: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200",
  };

  return (
    <div className={`overflow-hidden rounded-xl border ${toneMap[tone]}`}>
      <div className="relative h-32 bg-zinc-950">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(113,113,122,0.35)_25%,transparent_25%),linear-gradient(225deg,rgba(113,113,122,0.35)_25%,transparent_25%),linear-gradient(45deg,rgba(63,63,70,0.35)_25%,transparent_25%),linear-gradient(315deg,rgba(63,63,70,0.35)_25%,#09090b_25%)] bg-[size:28px_28px] bg-[position:14px_0,14px_0,0_0,0_0]" />

        {pattern === "pothole" && (
          <div className="absolute left-1/2 top-1/2 h-16 w-28 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-red-300/40 bg-red-950 shadow-[0_0_40px_rgba(239,68,68,0.25)_inset]" />
        )}

        {pattern === "patch" && (
          <div className="absolute left-1/2 top-1/2 h-14 w-28 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-300/40 bg-emerald-950/80 shadow-[0_0_30px_rgba(16,185,129,0.18)_inset]" />
        )}

        {pattern === "failure" && (
          <>
            <div className="absolute left-1/2 top-1/2 h-14 w-28 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-300/20 bg-emerald-950/40" />
            <div className="absolute left-[48%] top-[52%] h-14 w-20 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-fuchsia-300/40 bg-fuchsia-950 shadow-[0_0_40px_rgba(217,70,239,0.25)_inset]" />
          </>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-zinc-400">{status}</p>
      </div>
    </div>
  );
}

function toneClass(tone: string) {
  const classes: Record<string, string> = {
    orange: "bg-orange-500/15 text-orange-300",
    cyan: "bg-cyan-500/15 text-cyan-300",
    blue: "bg-blue-500/15 text-blue-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
    fuchsia: "bg-fuchsia-500/15 text-fuchsia-300",
  };

  return classes[tone];
}
