import type { FighterDef } from "@/types/fighter";
import Image from "next/image";

async function getRoster(): Promise<FighterDef[]> {
  const apiBaseUrl =
    process.env.ENGINE_API_BASE_URL ??
    process.env.NEXT_PUBLIC_ENGINE_API_BASE_URL ??
    "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${apiBaseUrl}/api/match/roster`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch roster");
    }

    const data = await res.json();
    return data.roster;
  } catch {
    return [];
  }
}

export async function RosterSection() {
  const roster = await getRoster();

  if (!roster || roster.length === 0) {
    return (
      <section
        id="roster"
        className="min-h-screen py-24 flex items-center justify-center border-t border-white/10"
      >
        <p className="text-xl text-gray-500 font-mono">
          CONNECTION TO NEURAL ARCHIVE LOST.
        </p>
      </section>
    );
  }

  return (
    <section
      id="roster"
      className="min-h-screen py-24 px-8 border-t border-white/10 relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(60,130,255,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-4 uppercase">
          THE NEURAL{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-agora-blue to-cyan-500">
            ARCHIVE
          </span>
        </h2>
        <p className="text-xl text-gray-400 font-mono mb-16 max-w-2xl">
          Review the combat logic, strategies, and fatal flaws of the active
          roster before entering the Arena.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {roster.map((fighter) => {
            // Convert bg-color to border-color for the cards.
            const borderColor = fighter.color.replace("bg-", "border-");
            const textColor = fighter.color.replace("bg-", "text-");

            return (
              <div
                key={fighter.id}
                className={`bg-black/50 backdrop-blur-sm border-2 ${borderColor} p-8 hover:bg-gray-900/50 transition-colors flex flex-col gap-6`}
              >
                {/* Header: Avatar & Name */}
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-900 border-2 border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                    <Image
                      src={fighter.animations.idle}
                      alt={fighter.name}
                      width={96}
                      height={96}
                      unoptimized
                      className="w-full h-full object-cover pixelated"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <div>
                    <h3
                      className={`text-3xl font-black uppercase tracking-widest ${textColor}`}
                    >
                      {fighter.name}
                    </h3>
                    <p className="text-gray-400 italic text-lg mt-1">
                      "{fighter.tagline}"
                    </p>
                  </div>
                </div>

                {/* Lore Data (The Engine Prompts) */}
                <div className="grid grid-cols-1 gap-4 font-mono text-sm">
                  <div className="bg-black/80 p-4 border border-white/5">
                    <span className="text-gray-500 block mb-1 uppercase tracking-widest">
                      Voice Directive:
                    </span>
                    <span className="text-gray-200">{fighter.voice}</span>
                  </div>
                  <div className="bg-black/80 p-4 border border-white/5">
                    <span className="text-gray-500 block mb-1 uppercase tracking-widest">
                      Combat Strategy:
                    </span>
                    <span className="text-gray-200">{fighter.strategy}</span>
                  </div>
                  <div className="bg-red-950/20 p-4 border border-red-900/30">
                    <span className="text-red-500/70 block mb-1 uppercase tracking-widest">
                      Fatal Flaw:
                    </span>
                    <span className="text-red-200/80">{fighter.weakness}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
