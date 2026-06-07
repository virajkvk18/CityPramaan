"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Blocks,
  BrainCircuit,
  Camera,
  Eye,
  FileCheck2,
  Fingerprint,
  MapPinned,
  Radar,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";
import { useLanguage } from "@/src/lib/use-language";

const simpleFlow = [
  {
    step: "01",
    title: "Citizen reports a problem",
    detail:
      "A person uploads a photo, selects the exact map location, and describes the issue: pothole, drain blockage, dark street, garbage spot, water leakage, or footpath damage.",
    icon: Camera,
  },
  {
    step: "02",
    title: "AI understands the issue",
    detail:
      "The AI reads the image and text, then gives the issue type, severity, confidence score, duplicate risk, and suggested action.",
    icon: BrainCircuit,
  },
  {
    step: "03",
    title: "A proof record is created",
    detail:
      "The report gets a public proof ID, evidence hash, timeline entry, and Fabric-ready proof package so the issue cannot silently disappear.",
    icon: Blocks,
  },
  {
    step: "04",
    title: "Contractor submits repair proof",
    detail:
      "The contractor opens the same issue, checks the citizen photo and location, uploads an after-repair image, and runs a repair audit.",
    icon: UploadCloud,
  },
  {
    step: "05",
    title: "Warranty starts after repair",
    detail:
      "Once repair proof is submitted, the issue becomes visible in the warranty scanner with repair image, contractor name, and warranty status.",
    icon: ShieldCheck,
  },
  {
    step: "06",
    title: "Public can verify everything",
    detail:
      "Anyone can open the public proof page to see before/after images, status, location, timeline, warranty state, and proof hash.",
    icon: Eye,
  },
];

const simpleTech = [
  {
    title: "Fabric-ready Ledger",
    simple:
      "Think of the ledger like a shared civic notebook where important updates can later be written by Hyperledger Fabric.",
    example:
      "If a pothole report is created today, nobody can later pretend it was never reported because the proof entry stays in the public record.",
    icon: Blocks,
  },
  {
    title: "Evidence Hash",
    simple:
      "A hash is like a digital fingerprint of an uploaded photo or report. Even a tiny change creates a different fingerprint.",
    example:
      "If someone replaces the original pothole photo, the hash changes, so the system can show the evidence was not the same.",
    icon: Fingerprint,
  },
  {
    title: "AI Analysis",
    simple:
      "AI acts like a first-level civic inspector. It does not replace officials, but it helps sort and prioritize problems quickly.",
    example:
      "A dark road at night and a broken drain need different departments. AI classifies them so the right resolver can act faster.",
    icon: Sparkles,
  },
  {
    title: "AI + RAG Agents",
    simple:
      "RAG means the AI answers using CityPramaan civic rules instead of guessing from a general prompt.",
    example:
      "A drainage complaint can be matched with sewage rules, SLA expectations, severity policy, and contractor assignment logic.",
    icon: BrainCircuit,
  },
  {
    title: "Warranty Scanner",
    simple:
      "Warranty means the repair is not just marked done. It is watched for repeat failure during a fixed period.",
    example:
      "If a repaired road breaks again in 21 days, the system can flag it as a repeat failure and question repair quality.",
    icon: Radar,
  },
  {
    title: "Public Proof Timeline",
    simple:
      "The timeline is the story of the issue from report to repair. Every step is shown in one place.",
    example:
      "Citizen reported -> AI verified -> contractor repaired -> warranty activated -> repeat failure detected.",
    icon: FileCheck2,
  },
];

const roleCards = [
  {
    role: "Citizens",
    action: "Report problems with photo, location, and description.",
    result: "They get a public proof ID instead of a complaint disappearing into a closed system.",
  },
  {
    role: "Contractors",
    action: "Pick assigned issues, inspect citizen evidence, upload after-repair proof.",
    result: "Their repair quality becomes visible and connected to warranty/reputation.",
  },
  {
    role: "City Officials",
    action: "View issue severity, duplicate clusters, open cases, and repair progress.",
    result: "They can prioritize urgent cases and monitor contractor performance.",
  },
  {
    role: "Public / Auditors",
    action: "Open the proof page and verify status, images, map location, hash, and timeline.",
    result: "The repair process becomes transparent, inspectable, and easy to trust.",
  },
];

const exampleScenario = [
  "A citizen notices a pothole near MP Nagar, Bhopal.",
  "They upload a photo and pin the exact location on the map.",
  "AI detects road damage, marks severity as high, and suggests patch repair.",
  "The report appears on the command center map with a public proof hash.",
  "A contractor selects that same issue and uploads the after-repair image.",
  "The warranty scanner now shows the issue as repaired and under warranty.",
  "If the same road breaks again, CityPramaan flags it as repeat failure.",
];

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="cp-page-shell relative min-h-screen overflow-hidden bg-[#050505] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(255,153,51,0.16),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,219,233,0.14),transparent_28%),radial-gradient(circle_at_48%_94%,rgba(0,235,136,0.08),transparent_30%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-44 opacity-20" />

      <header className="relative z-10 flex min-h-16 flex-col gap-3 border-b border-[#ff9933]/15 bg-[#030507]/75 px-4 py-4 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
          <ArrowLeft size={16} />
          {t("backToCommandCenter")}
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSelector compact />
          <BrandLogo size="sm" subtitle={t("governance")} />
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <div className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-6 sm:p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#00dbe9]">
              About CityPramaan
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Public proof for city repairs
            </h1>
            <p className="mt-5 max-w-4xl text-base leading-7 text-zinc-300">
              CityPramaan is a civic-tech web app that connects citizens, contractors, and public
              viewers in one transparent repair workflow. A citizen reports an infrastructure issue,
              AI/RAG agents explain what should happen, proof hashes make the issue traceable, and
              contractor repair proof becomes visible to everyone.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              <ValueCard icon={<Sparkles size={18} />} label="AI-first reporting" value="One report form can understand roads, drains, dark zones, garbage, water leakage, and footpaths." />
              <ValueCard icon={<Blocks size={18} />} label="Proof, not promises" value="Every issue gets a public proof hash, transaction-style record, and timeline." />
              <ValueCard icon={<Radar size={18} />} label="Repair warranty" value="Repairs are monitored after completion so repeat failures can be caught." />
            </div>
          </div>

          <aside className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-6">
            <div className="flex items-center gap-2 text-orange-100">
              <ShieldCheck size={20} />
              <p className="font-medium">In one simple line</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              CityPramaan turns a normal complaint app into a public accountability system where the
              issue, repair, contractor proof, warranty, and status are all connected.
            </p>
            <div className="mt-6 rounded-xl border border-[#00eb88]/25 bg-[#00eb88]/10 p-4">
              <p className="font-mono text-xs uppercase text-[#00eb88]">Why CityPramaan is different</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                CityPramaan focuses on proof of resolution, repair warranty, and public
                verification after the repair is completed.
              </p>
            </div>
          </aside>
        </div>

        <SectionHeader
          eyebrow="How the site works"
          title="One issue, one connected journey"
          detail="The same report moves through all pages, so the command center, contractor view, warranty scanner, and public proof page stay in sync."
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {simpleFlow.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.step} className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xs font-semibold text-orange-300">{item.step}</p>
                  <Icon size={18} className="text-[#00dbe9]" />
                </div>
                <p className="mt-4 font-semibold text-zinc-100">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.detail}</p>
              </div>
            );
          })}
        </div>

        <SectionHeader
          eyebrow="Simple example"
          title="Imagine a pothole gets reported"
          detail="This is the core civic workflow a city team can understand quickly."
        />

        <div className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-6">
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <div className="rounded-2xl border border-orange-400/20 bg-[linear-gradient(145deg,rgba(255,153,51,0.16),rgba(0,219,233,0.05))] p-5">
              <div className="flex items-center gap-2 text-orange-200">
                <MapPinned size={20} />
                <p className="font-semibold">Example case: MP Nagar pothole</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-300">
                A pothole is reported, repaired, and then watched under warranty. If it breaks again,
                CityPramaan can show the exact report, repair proof, contractor, and timeline.
              </p>
            </div>
            <ol className="grid gap-3 md:grid-cols-2">
              {exampleScenario.map((item, index) => (
                <li key={item} className="rounded-xl border border-white/10 bg-zinc-950/70 p-4">
                  <p className="font-mono text-xs text-[#00dbe9]">STEP {String(index + 1).padStart(2, "0")}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{item}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <SectionHeader
          eyebrow="Technology explained simply"
          title="What the complex words mean"
          detail="These explanations are written for citizens, officials, contractors, and public auditors."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {simpleTech.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-[#ff9933]/30 bg-[#ff9933]/10 text-orange-300">
                    <Icon size={18} />
                  </span>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-300">{item.simple}</p>
                <div className="mt-4 rounded-xl border border-[#00dbe9]/20 bg-[#00dbe9]/10 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00dbe9]">
                    Example
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{item.example}</p>
                </div>
              </div>
            );
          })}
        </div>

        <SectionHeader
          eyebrow="Who uses it"
          title="Four views, one shared truth"
          detail="Each user sees a different workflow, but everyone is connected to the same report record."
        />

        <div className="grid gap-4 lg:grid-cols-4">
          {roleCards.map((item) => (
            <div key={item.role} className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-5">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-orange-300">
                {item.role}
              </p>
              <p className="mt-4 text-sm leading-6 text-zinc-300">{item.action}</p>
              <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-zinc-400">
                {item.result}
              </p>
            </div>
          ))}
        </div>

        <SectionHeader
          eyebrow="Open CityPramaan"
          title="Explore the civic proof workflow"
          detail="These links show how the same issue travels through the whole product."
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <WorkflowLink href="/report" icon={<Camera size={18} />} title={t("citizenReport")} detail="Create a new public issue with photo, AI analysis, and map location." />
          <WorkflowLink href="/contractor" icon={<BadgeCheck size={18} />} title={t("repairProof")} detail="Select a raised issue and upload contractor after-repair proof." />
          <WorkflowLink href="/warranty" icon={<Radar size={18} />} title={t("warrantyScanner")} detail="See repaired, pending, and warranty-active issues in one public registry." />
          <WorkflowLink href="/proof/CP-004" icon={<Blocks size={18} />} title={t("publicProof")} detail="Open the public proof timeline with before/after evidence and hash." />
        </div>

        <div className="mt-6 rounded-2xl border border-[#00eb88]/25 bg-[linear-gradient(145deg,rgba(0,235,136,0.12),rgba(255,153,51,0.08))] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#00eb88]">
                Final project vision
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                From complaint tracking to proof-of-resolution
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                In the full version, this can connect to Hyperledger Fabric chaincode, object
                storage, verified contractor identities, stronger AI image models, and city dashboards.
                CityPramaan brings together the core story: report, verify, repair, warranty, and
                public proof.
              </p>
            </div>
            <Link
              href="/report"
              className="btn-primary-shimmer rounded-sm bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-5 py-3 text-center font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#4c2700]"
            >
              Try Report Flow
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="mt-10 mb-5">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[#00dbe9]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{detail}</p>
    </div>
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

function WorkflowLink({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="cp-cyber-card cp-cyber-card-hover flex min-h-36 flex-col justify-between rounded-2xl p-5 text-sm"
    >
      <span>
        <span className="flex items-center gap-2 font-semibold text-white">
          <span className="text-orange-300">{icon}</span>
          {title}
        </span>
        <span className="mt-3 block text-sm leading-6 text-zinc-400">{detail}</span>
      </span>
      <span className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-[#00dbe9]">
        Open flow
      </span>
    </Link>
  );
}
