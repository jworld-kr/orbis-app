"use client";

import { motion } from "framer-motion";

type Props = {
  /** trigger drawing animation when this becomes true */
  active: boolean;
  className?: string;
};

/**
 * "당신이라는 별자리" — 7 planets connected like a constellation.
 * On `active=true`, stars light up one by one and lines draw between them.
 * Tuned for a tall portrait viewport (mobile-first 240×320), scales fluidly.
 */
export default function Constellation({ active, className }: Props) {
  // viewBox: 240 × 320 — taller-than-wide constellation
  // positions hand-tuned to read as a connected figure (loose Big Dipper feel)
  const W = 240;
  const H = 320;

  const stars: { x: number; y: number; sym: string; name: string }[] = [
    { x: 60, y: 40, sym: "☉", name: "SUN" },
    { x: 175, y: 70, sym: "☽", name: "MOON" },
    { x: 110, y: 115, sym: "☿", name: "MERCURY" },
    { x: 45, y: 165, sym: "♀", name: "VENUS" },
    { x: 165, y: 195, sym: "♂", name: "MARS" },
    { x: 80, y: 240, sym: "♃", name: "JUPITER" },
    { x: 195, y: 280, sym: "♄", name: "SATURN" },
  ];

  // edges drawn in order — each line draws after both stars are lit
  const edges: [number, number][] = [
    [0, 2],
    [1, 2],
    [2, 3],
    [2, 4],
    [3, 5],
    [4, 5],
    [5, 6],
  ];

  // timing
  const STAR_FROM = 0.2; // start lighting stars at 0.2s
  const STAR_GAP = 0.35; // gap between each star
  const lineFrom = (idx: [number, number]) =>
    STAR_FROM + Math.max(idx[0], idx[1]) * STAR_GAP + 0.1;

  return (
    <div className={`relative ${className ?? ""}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {/* edges */}
        {edges.map(([a, b], i) => {
          const sa = stars[a];
          const sb = stars[b];
          const dx = sb.x - sa.x;
          const dy = sb.y - sa.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          return (
            <motion.line
              key={`e-${i}`}
              x1={sa.x}
              y1={sa.y}
              x2={sb.x}
              y2={sb.y}
              stroke="rgba(245,247,250,0.55)"
              strokeWidth={0.7}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{
                strokeDasharray: len,
                strokeDashoffset: len,
              }}
              animate={
                active
                  ? { strokeDashoffset: 0 }
                  : { strokeDashoffset: len }
              }
              transition={{
                duration: 0.6,
                delay: lineFrom([a, b]),
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          );
        })}

        {/* stars */}
        {stars.map((s, i) => (
          <g key={`s-${i}`}>
            {/* glow */}
            <motion.circle
              cx={s.x}
              cy={s.y}
              r={9}
              fill="rgba(245,247,250,0.16)"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={
                active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }
              }
              transition={{
                duration: 0.7,
                delay: STAR_FROM + i * STAR_GAP,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
            {/* hard dot */}
            <motion.circle
              cx={s.x}
              cy={s.y}
              r={2.4}
              fill="rgba(255,255,255,1)"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={
                active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }
              }
              transition={{
                duration: 0.5,
                delay: STAR_FROM + i * STAR_GAP,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
            {/* faint label */}
            <motion.text
              x={s.x + 8}
              y={s.y + 3}
              fontSize="6.5"
              fontFamily="var(--font-mono), monospace"
              letterSpacing="1.6"
              fill="rgba(245,247,250,0.55)"
              initial={{ opacity: 0 }}
              animate={active ? { opacity: 1 } : { opacity: 0 }}
              transition={{
                duration: 0.7,
                delay: STAR_FROM + i * STAR_GAP + 0.25,
              }}
            >
              {s.name}
            </motion.text>
          </g>
        ))}
      </svg>

      {/* corner marks — keeps the same instrument tone as BirthChart */}
      <CornerMarks />
    </div>
  );
}

function CornerMarks() {
  const stroke = "rgba(245,247,250,0.32)";
  const arm = 10;
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
