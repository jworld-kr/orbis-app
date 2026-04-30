"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { ORBIS_EASE } from "@/lib/motion";

const STAGES = [
  { id: "00", label: "ORBIS" },
  { id: "01", label: "ABOUT" },
  { id: "02", label: "BIRTH CHART" },
  { id: "03", label: "REPORT" },
  { id: "04", label: "BEGIN" },
  { id: "05", label: "DIFFERENCE" },
  { id: "06", label: "END" },
];

export default function ScrollHUD() {
  const { scrollYProgress } = useScroll();
  const [stage, setStage] = useState(0);
  const [pct, setPct] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setPct(v);
    const idx = Math.min(STAGES.length - 1, Math.floor(v * STAGES.length));
    setStage(idx);
  });

  const current = STAGES[stage];

  return (
    <>
      {/* top progress bar */}
      <div
        className="fixed top-0 left-0 h-px bg-white/40 z-50 pointer-events-none origin-left"
        style={{ width: "100%", transform: `scaleX(${pct})` }}
      />

      {/* top-left brand mark — desktop */}
      <div className="fixed top-6 left-10 z-50 pointer-events-none hidden md:flex items-center gap-3">
        <span className="label-mono">ORBIS / OBSERVATORY</span>
      </div>

      {/* top-right stage indicator — desktop only */}
      <div className="fixed top-6 right-10 z-50 pointer-events-none hidden md:flex items-center">
        <span className="label-mono relative inline-block min-w-[200px] text-right">
          <motion.span
            key={current.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.5, ease: ORBIS_EASE }}
            className="block"
          >
            {current.id} — {current.label}
          </motion.span>
        </span>
      </div>

      {/* bottom-left coordinate readout — desktop */}
      <div className="fixed bottom-6 left-10 z-50 pointer-events-none hidden md:block">
        <span className="label-mono">
          LAT 37.5665° N · LON 126.9780° E
        </span>
      </div>

      {/* bottom-right session id — desktop */}
      <div className="fixed bottom-6 right-10 z-50 pointer-events-none hidden md:block">
        <span className="label-mono">EST. 2026 · MMXXVI</span>
      </div>

      {/* mobile only — single tiny coordinate readout, centered at bottom */}
      <div className="fixed bottom-3 left-0 right-0 z-50 pointer-events-none md:hidden flex justify-center">
        <span
          className="font-mono uppercase text-white/45"
          style={{
            fontSize: 9,
            letterSpacing: "0.22em",
          }}
        >
          37.57°N · 126.98°E
        </span>
      </div>
    </>
  );
}
