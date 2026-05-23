import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Blocks,
  FileCheck2,
  MapPinned,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";

const flow = [
  {
    step: "01",
    title: "Report civic damage",
    detail: "A citizen submits road damage evidence with location and description.",
  },
  {
    step: "02",
    title: "AI verifies evidence",
    detail: "The system classifies the issue, estimates severity, and checks duplicate risk.",
  },
  {
    step: "03",
    title: "Proof is recorded",
    detail: "Image hashes, timestamps, and status transitions become tamper-resistant records.",
  },
  {
    step: "04",
    title: "Repair proof is submitted",
    detail: "The contractor uploads after-repair evidence for public verification.",
  },
  {
    step: "05",
    title: "Warranty is monitored",
    detail: "If the same location fails again during warranty, the case is automatically flagged.",
  },
  {
    step: "06",
    title: "Public audit is visible",
    detail: "Citizens, officials, and auditors can inspect the full proof timeline.",
  },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="relative z-10 flex min-h-16 flex-col gap-3 border-b border-[#ff9933]/15 bg-[#030507]/75 px-4 py-4 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
          <ArrowLeft size={16} />
          Back to Command Center
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <BrandLogo size="sm" subtitle="Governance and demo flow" />
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-6 sm:p-8">
            <p className="text-xs font-medium uppercase text-orange-300">About CityPramaan</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
              Proof-of-repair for public infrastructure.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">
              CityPramaan is not another complaint portal. It verifies whether a civic repair was actually completed,
              whether the repair lasted through its warranty period, and who is accountable when the same issue returns.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <ValueCard icon={<Sparkles size={18} />} label="AI Verification" value="Issue severity and repair confidence" />
              <ValueCard icon={<Blocks size={18} />} label="Blockchain Proof" value="Tamper-resistant repair history" />
              <ValueCard icon={<Radar size={18} />} label="Warranty Scanner" value="Repeat failure detection" />
            </div>
          </div>

          <aside className="rounded-2xl border border-orange-400/20 bg-[linear-gradient(145deg,rgba(255,153,51,0.14),rgba(0,219,233,0.06))] p-6 shadow-[0_0_24px_rgba(255,153,51,0.08)]">
            <div className="flex items-center gap-2 text-orange-100">
              <ShieldCheck size={20} />
              <p className="font-medium">Core Difference</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              Existing apps usually collect complaints. CityPramaan focuses on accountability after closure: before/after proof,
              contractor reputation, repair warranty, and repeat failure alerts.
            </p>
          </aside>
        </div>

        <div className="cp-cyber-card cp-cyber-card-hover mt-6 rounded-2xl p-6">
          <div className="mb-6 flex items-center gap-2">
            <FileCheck2 size={20} className="text-emerald-300" />
            <h2 className="text-2xl font-semibold">How The System Works</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {flow.map((item) => (
              <div key={item.step} className="rounded-xl border border-white/10 bg-zinc-950/70 p-5">
                <p className="text-xs font-semibold text-orange-300">{item.step}</p>
                <p className="mt-3 font-medium text-zinc-100">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <DemoLink href="/report" icon={<MapPinned size={18} />} title="Citizen Report" />
          <DemoLink href="/contractor" icon={<BadgeCheck size={18} />} title="Repair Proof" />
          <DemoLink href="/warranty" icon={<Radar size={18} />} title="Warranty Scan" />
          <DemoLink href="/proof/CP-004" icon={<Blocks size={18} />} title="Public Proof" />
        </div>
      </section>
    </main>
  );
}

function ValueCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-4">
      <div className="text-orange-300">{icon}</div>
      <p className="mt-3 font-medium">{label}</p>
      <p className="mt-1 text-sm leading-5 text-zinc-400">{value}</p>
    </div>
  );
}

function DemoLink({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm font-medium hover:border-orange-400/40 hover:bg-white/[0.06]"
    >
      <span className="flex items-center gap-2">
        <span className="text-orange-300">{icon}</span>
        {title}
      </span>
      <span className="text-zinc-500">Open</span>
    </Link>
  );
}
