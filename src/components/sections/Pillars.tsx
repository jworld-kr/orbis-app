"use client";

import { motion } from "framer-motion";
import { ORBIS_EASE } from "@/lib/motion";

const PILLARS = [
  {
    no: "01",
    eyebrow: "DATA",
    title: "NASA 천체 데이터",
    body: "운세 알고리즘이 아닙니다. 실시간 갱신되는 행성의 좌표를 그대로 사용합니다. 분석은 천문학 위에 쌓입니다.",
    diagram: <DataDiagram />,
  },
  {
    no: "02",
    eyebrow: "PRECISION",
    title: "분 단위 정밀 분석",
    body: "출생 시간 1분의 차이가 좌표를 바꿉니다. 시간과 장소를 모두 반영해, 동일한 차트가 두 번 그려지지 않습니다.",
    diagram: <PrecisionDiagram />,
  },
  {
    no: "03",
    eyebrow: "ENGINE",
    title: "Orbis 엔진",
    body: "시판 도구는 같은 차트를 같은 결론으로 만듭니다. Orbis는 그 한계를 넘기 위해, 분석 엔진을 직접 설계했습니다.",
    diagram: <EngineDiagram />,
  },
];

export default function Pillars() {
  return (
    <section className="relative w-full min-h-[100svh] flex items-center px-5 md:px-20 py-14 md:py-28 overflow-hidden border-t border-white/[0.06]">
      <RadarBackdrop />
      <div className="relative z-10 max-w-5xl mx-auto w-full">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, ease: ORBIS_EASE }}
          className="mb-8 md:mb-14"
        >
          <h2 className="font-kr text-pretty md:text-balance text-[26px] md:text-[44px] leading-[1.2] md:leading-[1.1] tracking-tightest font-medium">
            Orbis가 <span className="text-white/55">다른</span> 이유.
          </h2>
        </motion.div>

        {/* mobile: stacked rows. desktop: 3-column cards */}
        <div className="md:hidden">
          {PILLARS.map((p, i) => (
            <motion.article
              key={p.no}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{
                duration: 0.9,
                delay: i * 0.1,
                ease: ORBIS_EASE,
              }}
              className="py-5 flex items-end gap-4"
            >
              <div className="shrink-0 w-14 h-14 flex items-end justify-center">
                <div className="scale-[0.4] origin-bottom">{p.diagram}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="label-mono opacity-60">{p.no}</span>
                  <span className="label-mono opacity-60">{p.eyebrow}</span>
                </div>
                <h3 className="font-kr text-[16px] leading-[1.25] tracking-tight font-medium">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-white/60 font-kr text-[12.5px] leading-[1.7]">
                  {p.body}
                </p>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="hidden md:grid grid-cols-3 gap-8">
          {PILLARS.map((p, i) => (
            <motion.article
              key={p.no}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{
                duration: 1,
                delay: i * 0.12,
                ease: ORBIS_EASE,
              }}
              className="bg-orbis-bg p-10 md:p-12 flex flex-col min-h-[440px]"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="label-mono">{p.no}</span>
                <span className="label-mono">{p.eyebrow}</span>
              </div>

              <h3 className="font-kr text-[26px] md:text-[28px] leading-[1.2] tracking-tight font-medium">
                {p.title}
              </h3>
              <p className="mt-4 text-white/60 font-kr text-[14px] leading-[1.85]">
                {p.body}
              </p>

              <div className="mt-auto pt-8 flex items-end justify-center">
                {p.diagram}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DataDiagram() {
  // satellite orbits — three tilted ellipses slowly rotating around the center
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className="w-40 h-40"
      animate={{ rotate: 360 }}
      transition={{ duration: 40, ease: "linear", repeat: Infinity }}
    >
      <g
        fill="none"
        stroke="rgba(245,247,250,0.55)"
        strokeWidth="1"
        transform="translate(100 100)"
      >
        <ellipse rx="80" ry="32" />
        <ellipse rx="80" ry="32" transform="rotate(60)" />
        <ellipse rx="80" ry="32" transform="rotate(-60)" />
        <circle r="6" fill="rgba(245,247,250,0.95)" stroke="none" />
        <circle r="80" stroke="rgba(245,247,250,0.18)" strokeDasharray="2 4" />
      </g>
      <circle cx="180" cy="40" r="2.4" fill="rgba(245,247,250,0.95)" />
      <circle cx="20" cy="160" r="1.8" fill="rgba(245,247,250,0.6)" />
    </motion.svg>
  );
}

function PrecisionDiagram() {
  // clock — minute hand ticks 1 minute at a time, snappy
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40">
      <g
        fill="none"
        stroke="rgba(245,247,250,0.55)"
        strokeWidth="1"
        transform="translate(100 100)"
      >
        <circle r="80" />
        <circle r="60" stroke="rgba(245,247,250,0.18)" strokeDasharray="1 3" />
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i * 6 * Math.PI) / 180;
          const r1 = 80;
          const r2 = i % 5 === 0 ? 70 : 76;
          return (
            <line
              key={i}
              x1={r1 * Math.cos(a)}
              y1={r1 * Math.sin(a)}
              x2={r2 * Math.cos(a)}
              y2={r2 * Math.sin(a)}
              strokeWidth={i % 15 === 0 ? 1.4 : 0.6}
            />
          );
        })}
        <line x1="-12" y1="0" x2="12" y2="0" strokeWidth="1" />
        <line x1="0" y1="-12" x2="0" y2="12" strokeWidth="1" />
      </g>

      {/* minute hand — uses SVG SMIL animateTransform, which natively
          rotates around an explicit pivot point (the clock center) */}
      <line
        x1="100"
        y1="100"
        x2="100"
        y2="40"
        stroke="rgba(245,247,250,0.95)"
        strokeWidth="1.4"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 100 100"
          to="360 100 100"
          dur="60s"
          repeatCount="indefinite"
        />
      </line>
    </svg>
  );
}

function EngineDiagram() {
  // Two overlapping engine rings rotating in opposite directions, framed
  // by a static outer footprint matching the other diagrams (r=80).
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40">
      <g transform="translate(100 100)">
        {/* outer dashed ring — static reference */}
        <circle
          r="80"
          fill="none"
          stroke="rgba(245,247,250,0.18)"
          strokeDasharray="2 4"
          strokeWidth="1"
        />

        {/* center core — static */}
        <circle r="6" fill="rgba(245,247,250,0.95)" />

        {/* input/output marks — static */}
        <line
          x1="-80"
          y1="0"
          x2="-72"
          y2="0"
          stroke="rgba(245,247,250,0.55)"
          strokeWidth="1"
        />
        <line
          x1="72"
          y1="0"
          x2="80"
          y2="0"
          stroke="rgba(245,247,250,0.55)"
          strokeWidth="1"
        />
        <circle cx="-80" cy="0" r="2.4" fill="rgba(245,247,250,0.95)" />
        <circle cx="80" cy="0" r="2.4" fill="rgba(245,247,250,0.95)" />
      </g>

      {/* engine rings — the whole pair rotates around center (visible
          movement since the rings are off-center, like a twin orbit) */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 24, ease: "linear", repeat: Infinity }}
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
        }}
      >
        <circle
          cx="78"
          cy="100"
          r="50"
          fill="none"
          stroke="rgba(245,247,250,0.55)"
          strokeWidth="1"
        />
        <circle
          cx="122"
          cy="100"
          r="50"
          fill="none"
          stroke="rgba(245,247,250,0.55)"
          strokeWidth="1"
        />
      </motion.g>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Radar backdrop — concentric rings that expand from the center,           */
/*  staggered so a continuous flow appears.                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function RadarBackdrop() {
  // Drift fog — three soft cloud layers + a faint check grid behind.
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-orbis-bg" />

      {/* faint check grid — 40px squares, subtle drift */}
      <motion.div
        className="absolute -inset-[60px]"
        style={{
          backgroundImage: [
            "linear-gradient(to right, rgba(245,247,250,0.05) 1px, transparent 1px)",
            "linear-gradient(to bottom, rgba(245,247,250,0.05) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "40px 40px, 40px 40px",
        }}
        initial={{ x: 0, y: 0 }}
        animate={{ x: -40, y: -40 }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      />

      {/* layer 1 — large, slow */}
      <motion.div
        className="absolute -inset-[20%]"
        animate={{ x: ["-8%", "8%"], y: ["-4%", "4%"] }}
        transition={{
          duration: 70,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(245, 247, 250, 0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* layer 2 — medium, drift the other way */}
      <motion.div
        className="absolute -inset-[20%]"
        animate={{ x: ["6%", "-6%"], y: ["3%", "-3%"] }}
        transition={{
          duration: 90,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 70% 65%, rgba(245, 247, 250, 0.05) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      {/* layer 3 — small, lighter */}
      <motion.div
        className="absolute -inset-[20%]"
        animate={{ x: ["-4%", "4%"], y: ["-6%", "2%"] }}
        transition={{
          duration: 50,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          background:
            "radial-gradient(ellipse 40% 35% at 50% 30%, rgba(245, 247, 250, 0.04) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* edge fades — clean transitions */}
      <div
        className="absolute inset-x-0 top-0 h-24"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10, 14, 26, 0.95) 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{
          background:
            "linear-gradient(to top, rgba(10, 14, 26, 0.95) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
