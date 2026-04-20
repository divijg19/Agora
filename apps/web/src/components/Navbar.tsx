"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (previous && latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: "-150%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-50 flex items-center justify-between px-8 py-4 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
    >
      <div className="font-black italic text-2xl tracking-tighter">AGORA</div>
      <div className="flex items-center gap-8 text-sm font-mono tracking-widest text-gray-300">
        <Link href="#features" className="hover:text-white transition-colors">
          FEATURES
        </Link>
        <Link href="#roster" className="hover:text-white transition-colors">
          ROSTER
        </Link>
        <a
          href="http://localhost:3000"
          className="px-6 py-2 bg-white text-black font-bold hover:bg-agora-red hover:text-white transition-colors rounded-full"
        >
          ENTER ARENA
        </a>
      </div>
    </motion.nav>
  );
}
