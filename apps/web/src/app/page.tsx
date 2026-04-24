import { Navbar } from "@/components/Navbar";
import { RosterSection } from "@/components/RosterSection";
import { WakeUpPing } from "../components/WakeUpPing";

const MARQUEE_SLOGANS = [
  '"DATA OVER FEELINGS."',
  '"TRUTH BEYOND THE SPREADSHEET."',
  '"ENTROPY ALWAYS WINS."',
  '"PROGRESS IS THE ONLY ABSOLUTE."',
];

function MarqueeSegment({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="marquee-segment" aria-hidden={duplicate || undefined}>
      {MARQUEE_SLOGANS.flatMap((slogan, index) => [
        <span key={`s-${slogan}`} className="text-4xl font-mono text-gray-500">
          {slogan}
        </span>,
        <span
          key={`v-${slogan}`}
          className={`text-4xl font-black italic ${
            index % 2 === 0 ? "text-agora-red" : "text-agora-blue"
          }`}
        >
          VS
        </span>,
      ])}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-[200vh] bg-agora-bg text-agora-text selection:bg-agora-red">
      <WakeUpPing />
      <Navbar />

      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,60,60,0.1)_0%,transparent_50%)] pointer-events-none" />

        <h1 className="mt-16 md:mt-20 text-[10vw] md:text-[9vw] leading-none font-black italic tracking-tighter text-center mix-blend-difference z-10">
          WHERE IDEAS
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-agora-red to-orange-500">
            FIGHT.
          </span>
        </h1>

        <p className="mt-8 text-xl md:text-2xl font-mono text-gray-400 tracking-widest max-w-2xl text-center z-10 uppercase">
          The world's first autonomous, deterministic AI debate engine. Select
          your champions. Set the stage. Watch them bleed.
        </p>

        <a
          href={process.env.NEXT_PUBLIC_ARENA_URL || "http://localhost:3000"}
          className="mt-16 px-12 py-6 border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white hover:text-black transition-all text-2xl font-bold tracking-[0.2em] uppercase z-10"
        >
          Initialize Neural Link
        </a>
      </section>

      {/* Infinite Marquee (CSS only) */}
      <section className="py-12 border-y border-white/10 bg-agora-panel overflow-hidden whitespace-nowrap">
        <div className="marquee-track">
          <MarqueeSegment />
          <MarqueeSegment duplicate />
        </div>
      </section>

      {/* The Lore/Roster Section */}
      <RosterSection />
    </main>
  );
}
