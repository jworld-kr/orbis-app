"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import LiveNatalChart from "@/components/LiveNatalChart";
import { ORBIS_EASE } from "@/lib/motion";

/**
 * Birth Chart — horizontal timeline demo.
 * A thin horizontal line spans the section. On it sit two marker nodes:
 *   left  — sample-input panel
 *   right — animated natal chart
 * A flowing dotted connector + flying dot signals data moving from one to
 * the other. Stays horizontal on mobile (just compacted) so the page does
 * not lengthen.
 */
export default function Problem() {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  // toggle the displayed minute every 3s — pairs with the chart's tick
  const [minute, setMinute] = useState(32);
  useEffect(() => {
    const id = setInterval(() => {
      setMinute((m) => (m === 32 ? 33 : 32));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      ref={ref}
      id="birth-chart"
      className="relative w-full min-h-[100svh] flex flex-col justify-center py-20 md:py-32 overflow-hidden bg-orbis-bg"
    >
      {/* instrument grid backdrop */}
      <InstrumentGrid />

      {/* curtain wipe on entry */}
      <motion.div
        initial={{ scaleY: 1 }}
        animate={inView ? { scaleY: 0 } : { scaleY: 1 }}
        transition={{ duration: 1.1, ease: ORBIS_EASE, delay: 0.05 }}
        style={{ transformOrigin: "top" }}
        className="absolute inset-0 z-30 bg-orbis-bg pointer-events-none"
      />

      {/* left chapter mark */}
      <div className="hidden md:flex absolute left-8 top-0 bottom-0 z-10 flex-col items-center justify-center pointer-events-none">
        <div className="h-16 w-px bg-white/15" />
        <div
          className="my-3 label-mono opacity-55"
          style={{ writingMode: "vertical-rl", letterSpacing: "0.3em" }}
        >
          § 03 — BIRTH CHART
        </div>
        <div className="h-16 w-px bg-white/15" />
      </div>

      {/* small upper meta */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.9, delay: 0.95, ease: ORBIS_EASE }}
        className="relative z-20 px-5 md:px-16 flex items-center gap-3"
      >
        <span className="block w-5 h-px bg-white/35" />
        <span className="label-mono opacity-70">실시간 관측</span>
        <span className="ml-auto label-mono opacity-40">
          NASA 천체 데이터 기반
        </span>
      </motion.div>

      {/* timeline — full-bleed, the hero element of this section */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 1, delay: 1.15, ease: ORBIS_EASE }}
        className="relative z-20 mt-12 md:mt-20 px-4 md:px-12"
      >
        <Timeline minute={minute} />
      </motion.div>

      {/* headline + body, sit beneath the tool, lower visual weight */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 1, delay: 1.4, ease: ORBIS_EASE }}
        className="relative z-20 mt-12 md:mt-20 px-5 md:px-16 max-w-[640px]"
      >
        <h2 className="font-kr text-pretty md:text-balance text-[22px] md:text-[34px] leading-[1.3] md:leading-[1.25] tracking-tightest font-medium">
          당신이 태어난 순간,
          <br />
          우주에 단 하나뿐인 차트가 탄생합니다.
        </h2>

        <div className="mt-5 md:mt-7 space-y-4 md:space-y-5">
          <p className="font-kr text-pretty text-[14px] md:text-[16px] leading-[1.7] tracking-tight text-white/85">
            생년월일, 시간, 장소.
          </p>
          <p className="font-kr text-pretty md:text-balance text-[13.5px] md:text-[15.5px] leading-[1.75] tracking-tight text-white/65">
            Orbis는{" "}
            <span className="text-white font-semibold">
              NASA 천체 데이터와 자체 개발한 엔진
            </span>
            으로 그 순간의 하늘을 정확히 복원합니다.
          </p>
          <p className="font-kr text-pretty text-[13.5px] md:text-[15.5px] leading-[1.75] tracking-tight text-white/85 font-medium">
            출생 시간 1분의 차이가 행성의 위치를 바꿉니다.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Horizontal timeline                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function Timeline({ minute }: { minute: number }) {
  // The two cards are aligned by their vertical centers. The track lives
  // in an absolutely-positioned overlay whose center y exactly matches the
  // card-row's center y — so the line always passes through the middle of
  // both cards, no matter their individual heights.
  return (
    <div className="relative w-full">
      {/* the cards row — both cards centered to the same horizontal axis */}
      <div className="relative flex items-center justify-between gap-3 md:gap-10">
        <div className="relative shrink-0">
          <InputCard minute={minute} />
        </div>
        <div className="relative shrink-0">
          <ChartCard />
        </div>

        {/* track — drawn behind, on the row's vertical center */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center -z-10">
          <div className="relative w-full h-3">
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px"
              style={{ background: "rgba(245,247,250,0.18)" }}
            />
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 block w-1.5 h-1.5 rounded-full"
              style={{ background: "rgba(245,247,250,0.4)" }}
            />
            <span
              className="absolute right-0 top-1/2 -translate-y-1/2 block w-1.5 h-1.5 rounded-full"
              style={{ background: "rgba(245,247,250,0.4)" }}
            />
            <FlowDot />
          </div>
        </div>
      </div>

      {/* labels under the cards */}
      <div className="mt-3 flex items-center justify-between gap-3 md:gap-10">
        <span className="label-mono opacity-55">INPUT</span>
        <span className="label-mono opacity-55">CHART</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Input card                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function InputCard({ minute }: { minute: number }) {
  return (
    <div
      className="relative bg-[#07091A]/55 backdrop-blur-[3px] px-3 py-3 md:px-5 md:py-4"
      style={{ minWidth: 140, maxWidth: 240 }}
    >
      <CornerBrackets />
      <ul className="space-y-1.5 md:space-y-2">
        <Field label="DATE" value="1995. 06. 12" mono />
        <Field
          label="TIME"
          value={`14:${String(minute).padStart(2, "0")} KST`}
          mono
          live
        />
        <Field label="PLACE" value="Seoul · 37.57°N" mono />
      </ul>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  live,
}: {
  label: string;
  value: string;
  mono?: boolean;
  live?: boolean;
}) {
  return (
    <li className="flex flex-col gap-0.5">
      <span
        className="font-mono uppercase text-white/45"
        style={{ fontSize: 8.5, letterSpacing: "0.2em" }}
      >
        {label}
      </span>
      <span
        className={`text-white/90 ${
          mono ? "font-mono" : "font-kr"
        } text-[11.5px] md:text-[13.5px] tracking-tight`}
      >
        {live ? (
          <span className="inline-flex items-center gap-1.5">
            <span>{value}</span>
            <motion.span
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-block w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/85"
            />
          </span>
        ) : (
          value
        )}
      </span>
    </li>
  );
}

function CornerBrackets() {
  const arm = 10;
  const stroke = "rgba(245,247,250,0.45)";
  return (
    <>
      <span
        className="absolute top-0 left-0"
        style={{ width: arm, height: 1, background: stroke }}
      />
      <span
        className="absolute top-0 left-0"
        style={{ width: 1, height: arm, background: stroke }}
      />
      <span
        className="absolute top-0 right-0"
        style={{ width: arm, height: 1, background: stroke }}
      />
      <span
        className="absolute top-0 right-0"
        style={{ width: 1, height: arm, background: stroke }}
      />
      <span
        className="absolute bottom-0 left-0"
        style={{ width: arm, height: 1, background: stroke }}
      />
      <span
        className="absolute bottom-0 left-0"
        style={{ width: 1, height: arm, background: stroke }}
      />
      <span
        className="absolute bottom-0 right-0"
        style={{ width: arm, height: 1, background: stroke }}
      />
      <span
        className="absolute bottom-0 right-0"
        style={{ width: 1, height: arm, background: stroke }}
      />
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Chart card                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function ChartCard() {
  return (
    <div
      className="relative inline-block aspect-square"
      style={{
        width: "min(34vw, 240px)",
      }}
    >
      <div className="absolute inset-1.5 rounded-full border border-white/[0.06]" />
      <LiveNatalChart size={520} className="absolute inset-0 w-full h-full" />
      <div className="absolute -bottom-3 right-0 label-mono opacity-50">
        12H · 7P
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Flow dot — small bright dot traveling left → right along the line         */
/* ────────────────────────────────────────────────────────────────────────── */

function FlowDot() {
  return (
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
      style={{ left: 0 }}
      initial={{ left: "12%", opacity: 0 }}
      animate={{ left: ["12%", "88%"], opacity: [0, 0.9, 0.9, 0] }}
      transition={{
        duration: 2.6,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 1.2,
        times: [0, 0.15, 0.85, 1],
      }}
    >
      <span
        className="block w-1 h-1 rounded-full bg-white"
        style={{ boxShadow: "0 0 8px rgba(255,255,255,0.85)" }}
      />
      <span
        className="absolute top-1/2 right-1.5 -translate-y-1/2 block h-px"
        style={{
          width: 24,
          background:
            "linear-gradient(to right, transparent, rgba(255,255,255,0.7))",
        }}
      />
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Instrument grid — faint engineering-paper background, static              */
/* ────────────────────────────────────────────────────────────────────────── */

function InstrumentGrid() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-orbis-bg" />
      {/* the grid drifts very slowly diagonally — 50px (one major cell) every
          ~30s, so it feels alive without registering as motion */}
      <motion.div
        className="absolute -inset-[60px]"
        style={{
          backgroundImage: [
            "linear-gradient(to right, rgba(245,247,250,0.05) 1px, transparent 1px)",
            "linear-gradient(to bottom, rgba(245,247,250,0.05) 1px, transparent 1px)",
            "linear-gradient(to right, rgba(245,247,250,0.025) 1px, transparent 1px)",
            "linear-gradient(to bottom, rgba(245,247,250,0.025) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "50px 50px, 50px 50px, 10px 10px, 10px 10px",
        }}
        initial={{ x: 0, y: 0 }}
        animate={{ x: -50, y: -50 }}
        transition={{
          duration: 12,
          ease: "linear",
          repeat: Infinity,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 65% at 50% 50%, transparent 30%, rgba(10, 14, 26, 0.55) 80%, rgba(10, 14, 26, 0.95) 100%)",
        }}
      />
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
