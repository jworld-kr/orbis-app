"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import DriftingStars from "@/components/DriftingStars";
import { ORBIS_EASE } from "@/lib/motion";

type Seg = { text: string; bold?: boolean };
const PARAGRAPHS: Seg[][] = [
  [
    { text: "같은 날 같은 도시에서 태어난 두 사람도, " },
    { text: "4분 차이로 차트가 달라집니다", bold: true },
    {
      text: ". 누구를 사랑할지, 어디서 빛날지, 무엇 때문에 무너질지가 그 안에 담겨 있습니다.",
    },
  ],
  [
    {
      text:
        "점성술은 2,000년 된 학문입니다. 케플러도 뉴턴도 연구했고, 유럽 왕족은 자녀의 출생 시간을 분 단위로 기록했습니다. ",
    },
    {
      text: "동양에 사주가 있다면, 서양에는 점성술이 있습니다.",
      bold: true,
    },
  ],
  [
    { text: "Orbis는 " },
    { text: "NASA 천체 데이터", bold: true },
    {
      text: "로 당신이 태어난 그 순간의 하늘을 복원합니다. 전문 점성가의 방법론을 더해, 당신이라는 사람을 정확히 읽어냅니다.",
    },
  ],
];

export default function About() {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section
      ref={ref}
      id="about"
      className="relative w-full min-h-[100svh] flex items-center px-5 md:px-16 py-20 md:py-32 overflow-hidden bg-orbis-bg"
    >
      {/* faint instrument grid backdrop */}
      <BackdropGrid />

      {/* curtain wipe on entry */}
      <motion.div
        initial={{ scaleY: 1 }}
        animate={inView ? { scaleY: 0 } : { scaleY: 1 }}
        transition={{ duration: 1.1, ease: ORBIS_EASE, delay: 0.05 }}
        style={{ transformOrigin: "top" }}
        className="absolute inset-0 z-30 bg-orbis-bg pointer-events-none"
      />

      {/* left chapter mark — desktop only */}
      <div className="hidden md:flex absolute left-8 top-0 bottom-0 z-10 flex-col items-center justify-center pointer-events-none">
        <div className="h-16 w-px bg-white/15" />
        <div
          className="my-3 label-mono opacity-55"
          style={{ writingMode: "vertical-rl", letterSpacing: "0.3em" }}
        >
          § 02 — ABOUT
        </div>
        <div className="h-16 w-px bg-white/15" />
      </div>

      {/* content */}
      <div className="relative z-20 mx-auto w-full max-w-[620px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.9, delay: 0.9, ease: ORBIS_EASE }}
          className="mb-9 md:mb-12"
        >
          <div
            className="headline-serif italic leading-none text-white/40 select-none"
            style={{
              fontSize: "20px",
              letterSpacing: "-0.01em",
            }}
          >
            Astrology
          </div>
          <div className="mt-1.5 label-mono opacity-75">점성술이란</div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1, delay: 1.05, ease: ORBIS_EASE }}
          className="font-kr text-pretty md:text-balance text-[26px] md:text-[40px] leading-[1.3] md:leading-[1.25] tracking-tightest font-medium"
        >
          왜 당신은 같은 사람한테 매번 끌릴까요?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1, delay: 1.2, ease: ORBIS_EASE }}
          className="mt-6 md:mt-8 font-kr text-pretty md:text-balance text-[16px] md:text-[20px] leading-[1.55] tracking-tight text-white/70"
        >
          당신이 태어난 그 순간의 하늘이, 답을 알고 있습니다.
        </motion.p>

        {/* orbit signature divider — Orbis = "orbit" */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1.3, ease: ORBIS_EASE }}
          className="mt-10 md:mt-14"
          aria-hidden
        >
          <OrbitDivider />
        </motion.div>

        <div className="mt-10 md:mt-14 space-y-7 md:space-y-9">
          {PARAGRAPHS.map((segs, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{
                duration: 0.9,
                delay: 1.35 + i * 0.12,
                ease: ORBIS_EASE,
              }}
              className="font-kr text-pretty text-[15px] md:text-[16.5px] leading-[1.85] text-white/70"
            >
              {segs.map((s, j) =>
                s.bold ? (
                  <span key={j} className="text-white font-semibold">
                    {s.text}
                  </span>
                ) : (
                  <span key={j}>{s.text}</span>
                )
              )}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Orbis signature divider — a thin track with a point traveling along it,
 * leaving a faint trail. Orbis = "orbit"; this is the section's heartbeat.
 */
function OrbitDivider() {
  return (
    <div className="relative h-3 w-full" aria-hidden>
      {/* the track */}
      <span
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, rgba(245,247,250,0.18) 8%, rgba(245,247,250,0.18) 92%, transparent 100%)",
        }}
      />
      {/* end caps */}
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/30"
      />
      <span
        className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-white/30"
      />

      {/* traveling point + trail */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
        initial={{ left: "0%", opacity: 0 }}
        animate={{
          left: ["0%", "100%"],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 9,
          ease: "linear",
          repeat: Infinity,
          repeatDelay: 1.4,
          times: [0, 0.06, 0.94, 1],
        }}
      >
        {/* trail behind the point */}
        <span
          className="absolute top-1/2 right-1.5 -translate-y-1/2 block h-px"
          style={{
            width: 56,
            background:
              "linear-gradient(to right, transparent, rgba(245,247,250,0.65))",
          }}
        />
        {/* the point itself */}
        <span
          className="block w-1.5 h-1.5 rounded-full bg-white"
          style={{
            boxShadow:
              "0 0 6px rgba(255,255,255,0.85), 0 0 14px rgba(255,255,255,0.45)",
          }}
        />
      </motion.div>
    </div>
  );
}

function BackdropGrid() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* drifting stars + occasional shooters */}
      <DriftingStars />
      {/* subtle vignette so center reads quieter behind text */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(10, 14, 26, 0.45) 30%, rgba(10, 14, 26, 0.75) 80%, rgba(10, 14, 26, 0.95) 100%)",
        }}
      />
      {/* clean transition into adjacent sections */}
      <div
        className="absolute inset-x-0 top-0 h-20"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10, 14, 26, 0.95) 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-20"
        style={{
          background:
            "linear-gradient(to top, rgba(10, 14, 26, 0.95) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
