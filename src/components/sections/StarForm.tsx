"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ORBIS_EASE } from "@/lib/motion";

/**
 * Constellation-style input form.
 * Each field is a "star" — typing in it lights the star and draws a line
 * to the next, building a constellation as the user fills the form.
 *
 *  Desktop: stars laid out diagonally as a real constellation.
 *  Mobile : stars stacked vertically with a connecting line on the left.
 *
 *  CTA is dim until all five stars are lit.
 */

type FieldKey = "name" | "date" | "time" | "place" | "email";

type FieldDef = {
  key: FieldKey;
  label: string;
  placeholder: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  // desktop position on a 100×100 canvas
  cx: number;
  cy: number;
};

const FIELDS: FieldDef[] = [
  { key: "name", label: "이름", placeholder: "홍길동", cx: 18, cy: 22 },
  {
    key: "date",
    label: "태어난 날",
    placeholder: "1995. 06. 12",
    inputMode: "numeric",
    cx: 42,
    cy: 38,
  },
  {
    key: "time",
    label: "태어난 시간",
    placeholder: "14:32",
    inputMode: "numeric",
    cx: 28,
    cy: 58,
  },
  {
    key: "place",
    label: "태어난 곳",
    placeholder: "서울",
    cx: 62,
    cy: 70,
  },
  {
    key: "email",
    label: "이메일",
    placeholder: "you@orbis.app",
    type: "email",
    inputMode: "email",
    cx: 82,
    cy: 50,
  },
];

export default function StarForm() {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  const [values, setValues] = useState<Record<FieldKey, string>>({
    name: "",
    date: "",
    time: "",
    place: "",
    email: "",
  });

  const filled = (k: FieldKey) => values[k].trim().length > 0;
  const allFilled = FIELDS.every((f) => filled(f.key));

  const handleChange = (k: FieldKey, v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  return (
    <section
      ref={ref}
      id="begin"
      className="relative w-full min-h-[100svh] flex items-center px-5 md:px-16 py-20 md:py-28 overflow-hidden bg-orbis-bg"
    >
      {/* backdrop — quiet, deep */}
      <Backdrop />

      {/* curtain wipe */}
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
          § 04 — BEGIN
        </div>
        <div className="h-16 w-px bg-white/15" />
      </div>

      <div className="relative z-20 w-full max-w-5xl mx-auto">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.9, delay: 0.95, ease: ORBIS_EASE }}
          className="max-w-[620px] mx-auto text-center mb-10 md:mb-14"
        >
          <h2 className="font-kr text-pretty md:text-balance text-[24px] md:text-[40px] leading-[1.3] md:leading-[1.25] tracking-tightest font-medium">
            당신의 좌표를 새깁니다.
          </h2>
          <p className="mt-5 md:mt-7 font-kr text-pretty md:text-balance text-[14px] md:text-[17px] leading-[1.7] tracking-tight text-white/65">
            다섯 개의 별이 모이면, 당신만의 별자리가 그려집니다.
          </p>
        </motion.div>

        {/* desktop constellation */}
        <div className="hidden md:block">
          <DesktopConstellation
            values={values}
            onChange={handleChange}
            filled={filled}
            inView={inView}
          />
        </div>

        {/* mobile vertical list */}
        <div className="md:hidden">
          <MobileConstellation
            values={values}
            onChange={handleChange}
            filled={filled}
            inView={inView}
          />
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1.4, ease: ORBIS_EASE }}
          className="mt-10 md:mt-16 flex flex-col items-center gap-3"
        >
          <button
            type="button"
            disabled={!allFilled}
            className={`group inline-flex items-center gap-3 px-8 py-3.5 border transition-all duration-500 ease-orbis ${
              allFilled
                ? "border-white text-white bg-white/[0.04] hover:bg-white hover:text-orbis-bg"
                : "border-white/20 text-white/40 cursor-not-allowed"
            }`}
          >
            <span className="font-kr text-[14px] tracking-wide">
              내 차트 그리기
            </span>
            <span
              className={`inline-block transition-transform duration-300 ease-orbis ${
                allFilled ? "group-hover:translate-x-1" : ""
              }`}
            >
              →
            </span>
          </button>
          <span className="label-mono opacity-50">
            첫 결과는 무료입니다 · ₩5,000 부터
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Desktop — stars on a constellation canvas, inputs floating beside them    */
/* ────────────────────────────────────────────────────────────────────────── */

function DesktopConstellation({
  values,
  onChange,
  filled,
  inView,
}: {
  values: Record<FieldKey, string>;
  onChange: (k: FieldKey, v: string) => void;
  filled: (k: FieldKey) => boolean;
  inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1, delay: 1.1, ease: ORBIS_EASE }}
      className="relative mx-auto"
      style={{ width: "min(720px, 90%)", aspectRatio: "100 / 80" }}
    >
      {/* connector lines, drawn in order between filled stars */}
      <svg
        viewBox="0 0 100 80"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {FIELDS.slice(0, -1).map((f, i) => {
          const next = FIELDS[i + 1];
          const lit = filled(f.key) && filled(next.key);
          return (
            <motion.line
              key={`line-${i}`}
              x1={f.cx}
              y1={f.cy}
              x2={next.cx}
              y2={next.cy}
              stroke="rgba(245, 247, 250, 0.7)"
              strokeWidth={0.18}
              vectorEffect="non-scaling-stroke"
              animate={{ opacity: lit ? 1 : 0 }}
              transition={{ duration: 0.6, ease: ORBIS_EASE }}
            />
          );
        })}
      </svg>

      {/* stars + inputs */}
      {FIELDS.map((f) => (
        <DesktopNode
          key={f.key}
          field={f}
          value={values[f.key]}
          onChange={(v) => onChange(f.key, v)}
          lit={filled(f.key)}
        />
      ))}
    </motion.div>
  );
}

function DesktopNode({
  field,
  value,
  onChange,
  lit,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
  lit: boolean;
}) {
  return (
    <div
      className="absolute"
      style={{
        left: `${field.cx}%`,
        top: `${(field.cy / 80) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="flex items-center gap-3">
        <Star lit={lit} />
        <div className="flex flex-col gap-0.5">
          <label className="label-mono opacity-60">{field.label}</label>
          <input
            type={field.type ?? "text"}
            inputMode={field.inputMode}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="orbis-inline-input font-kr text-[14px] tracking-tight"
            style={{ width: 160 }}
          />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Mobile — stacked, with a vertical line on the left connecting stars       */
/* ────────────────────────────────────────────────────────────────────────── */

function MobileConstellation({
  values,
  onChange,
  filled,
  inView,
}: {
  values: Record<FieldKey, string>;
  onChange: (k: FieldKey, v: string) => void;
  filled: (k: FieldKey) => boolean;
  inView: boolean;
}) {
  return (
    <motion.ul
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1, delay: 1.1, ease: ORBIS_EASE }}
      className="relative max-w-[440px] mx-auto"
    >
      {FIELDS.map((f, i) => {
        const isLast = i === FIELDS.length - 1;
        const lineLit = filled(f.key) && filled(FIELDS[i + 1]?.key);
        return (
          <li key={f.key} className="relative pl-9 pb-7">
            {/* connecting line to next star */}
            {!isLast && (
              <span
                className="absolute left-[10px] top-[18px] bottom-0 w-px bg-white/[0.1]"
                aria-hidden
              />
            )}
            {!isLast && (
              <motion.span
                className="absolute left-[10px] top-[18px] bottom-0 w-px"
                style={{
                  background: "rgba(245, 247, 250, 0.7)",
                  transformOrigin: "top",
                }}
                animate={{ scaleY: lineLit ? 1 : 0, opacity: lineLit ? 1 : 0 }}
                transition={{ duration: 0.6, ease: ORBIS_EASE }}
                aria-hidden
              />
            )}

            {/* star marker */}
            <span className="absolute left-0 top-1.5 flex items-center justify-center w-[20px] h-[20px]">
              <Star lit={filled(f.key)} small />
            </span>

            <div className="flex flex-col gap-1">
              <label className="label-mono opacity-60">{f.label}</label>
              <input
                type={f.type ?? "text"}
                inputMode={f.inputMode}
                placeholder={f.placeholder}
                value={values[f.key]}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="orbis-inline-input font-kr text-[16px] tracking-tight"
                style={{ width: "100%" }}
              />
            </div>
          </li>
        );
      })}
    </motion.ul>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Star marker                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function Star({ lit, small }: { lit: boolean; small?: boolean }) {
  const size = small ? 5 : 7;
  const halo = small ? 16 : 24;
  return (
    <span
      className="relative inline-block"
      style={{ width: halo, height: halo }}
      aria-hidden
    >
      {/* halo */}
      <motion.span
        className="absolute inset-0 rounded-full"
        animate={{
          opacity: lit ? 1 : 0,
          scale: lit ? 1 : 0.6,
        }}
        transition={{ duration: 0.7, ease: ORBIS_EASE }}
        style={{
          background:
            "radial-gradient(circle, rgba(245,247,250,0.45) 0%, rgba(245,247,250,0.08) 45%, transparent 70%)",
        }}
      />
      {/* dot */}
      <motion.span
        className="absolute rounded-full"
        animate={{
          backgroundColor: lit
            ? "rgba(255, 255, 255, 1)"
            : "rgba(245, 247, 250, 0.35)",
          boxShadow: lit
            ? "0 0 6px rgba(255,255,255,0.95), 0 0 14px rgba(255,255,255,0.55)"
            : "0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.5, ease: ORBIS_EASE }}
        style={{
          width: size,
          height: size,
          left: "50%",
          top: "50%",
          translate: "-50% -50%",
        }}
      />
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Backdrop                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function Backdrop() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-orbis-bg" />
      {/* faint deep glow at center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(20, 24, 56, 0.35) 0%, transparent 75%)",
        }}
      />
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
