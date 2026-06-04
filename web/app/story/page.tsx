"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Construction,
  HeartHandshake,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/src/components/layout/BrandLogo";
import { LanguageSelector } from "@/src/components/layout/LanguageSelector";
import { ThemeToggle } from "@/src/components/layout/ThemeToggle";

const storyMoments = [
  {
    title: "Roz ka problem, par clear answer nahi",
    detail:
      "Kabhi pothole ki wajah se bike jhatka kha leti hai, kabhi baarish ke baad drain block ho jata hai, kabhi streetlight band hoti hai aur road unsafe lagti hai. Hum complain karte hain, par humein bas ek status milta hai: reported ya closed.",
    icon: MapPinned,
  },
  {
    title: "Sabse bada sawaal: actually fix hua kya?",
    detail:
      "India mein aksar issue close ho jata hai, lekin citizen ko proof nahi milta. Kis contractor ne repair kiya? Before photo kya tha? After proof kya hai? Agar wahi problem 20 din baad wapas aa gayi, responsibility kiski hai?",
    icon: Clock3,
  },
  {
    title: "Isi gap se CityPramaan bana",
    detail:
      "CityPramaan ka idea simple hai: complaint sirf record nahi honi chahiye, repair bhi prove hona chahiye. Har issue ka location, photo, AI analysis, repair proof, warranty aur public timeline ek jagah visible hona chahiye.",
    icon: Sparkles,
  },
];

const proofValues = [
  "Citizen ko sirf ticket number nahi, public proof mile.",
  "Contractor ka kaam visible ho, hidden nahi.",
  "Repair ke baad warranty chale, taaki repeat failure pakda ja sake.",
  "Public, officials, and auditors ek hi transparent timeline dekh saken.",
];

export default function StoryPage() {
  return (
    <main className="cp-page-shell relative min-h-screen overflow-hidden bg-[#050505] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,153,51,0.17),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(0,219,233,0.14),transparent_30%),radial-gradient(circle_at_48%_90%,rgba(0,235,136,0.1),transparent_34%)]" />
      <div className="bg-holo-grid pointer-events-none fixed inset-0" />
      <div className="stitch-cityline pointer-events-none fixed bottom-0 left-0 right-0 h-48 opacity-20" />

      <header className="relative z-10 flex min-h-16 flex-col gap-3 border-b border-[#ff9933]/15 bg-[#030507]/78 px-4 py-4 shadow-[0_0_30px_rgba(0,219,233,0.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
          <ArrowLeft size={16} />
          Back to CityPramaan
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSelector compact />
          <BrandLogo size="sm" subtitle="Story" />
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <div className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-6 sm:p-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#00dbe9]">
              Why we built it
            </p>
            <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              The Story behind Citypramaan
            </h1>
            <p className="mt-5 max-w-4xl text-base leading-8 text-zinc-300">
              CityPramaan kisi fancy dashboard se start nahi hua. Yeh un daily moments se start hua
              jahan hum sab sochte hain: &quot;Yeh road har baar toot kaise jaati hai?&quot;,
              &quot;Complaint close kaise ho gayi jab problem abhi bhi wahi hai?&quot;, ya
              &quot;Light kab aayegi, actual update koi kyun nahi de raha?&quot;
            </p>
            <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">
              Problem sirf pothole, drain, streetlight ya transformer failure nahi hai. Problem hai
              trust ka gap. Citizen ko lagta hai system sunta nahi. Contractor ka kaam proof ke bina
              judge hota hai. Officials ke paas scattered updates hote hain. Aur public ko bas wait
              karna padta hai.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {storyMoments.map((moment) => {
                const Icon = moment.icon;

                return (
                  <article key={moment.title} className="rounded-xl border border-white/10 bg-black/24 p-5">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#00dbe9]/30 bg-[#00dbe9]/10 text-[#7df4ff]">
                      <Icon size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-white">{moment.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-300">{moment.detail}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-6">
            <div className="flex items-center gap-2 text-orange-100">
              <HeartHandshake size={20} />
              <p className="font-medium">The emotion behind it</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              CityPramaan ka goal blame karna nahi hai. Goal hai ki har citizen ko clarity mile,
              har repair ka proof ho, aur har city issue ka honest public record ban sake.
            </p>
            <div className="mt-6 rounded-xl border border-[#00eb88]/25 bg-[#00eb88]/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#00eb88]">
                Simple belief
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-200">
                Agar public problem public money se fix hoti hai, toh uska proof bhi public hona
                chahiye.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[390px_1fr]">
          <div className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-6">
            <div className="flex items-center gap-2 text-[#ffc08d]">
              <Construction size={20} />
              <h2 className="text-xl font-semibold text-white">Why this matters</h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Jab repair ka before image, after image, location, contractor proof, warranty status,
              and public feedback ek saath dikhte hain, toh &quot;closed&quot; ka matlab real
              closure ban jata hai.
            </p>
          </div>

          <div className="cp-cyber-card cp-cyber-card-hover rounded-2xl p-6">
            <div className="flex items-center gap-2 text-[#7df4ff]">
              <ShieldCheck size={20} />
              <h2 className="text-xl font-semibold text-white">What CityPramaan promises</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {proofValues.map((value) => (
                <div key={value} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm leading-6 text-zinc-300">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-6 flex flex-col gap-3 rounded-2xl border border-[#ff9933]/20 bg-[#100905]/70 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-[#ffc08d]">
              Built for accountable cities
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Explore the product flow without signing in, then enter the app when you are ready.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/about"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#00dbe9]/30 bg-[#00dbe9]/10 px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#b8f9ff] transition hover:border-[#00dbe9]/60"
            >
              How it works
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#ffdcc2,#ff9933)] px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#4c2700] transition hover:brightness-110"
            >
              Back home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
