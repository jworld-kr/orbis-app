"use client";

import { motion } from "framer-motion";

type Props = {
  size?: number;
  /** seconds for one full rotation */
  rotationDuration?: number;
  /** overall stroke opacity */
  strokeOpacity?: number;
  className?: string;
};

// classic natal chart: 12 houses (every 30°), zodiac ring, aspect lines
export default function NatalChart({
  size = 900,
  rotationDuration = 90,
  strokeOpacity = 0.4,
  className,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.48;
  const rZodiac = size * 0.42;
  const rHouseInner = size * 0.28;
  const rAspectInner = size * 0.18;

  const stroke = `rgba(245, 247, 250, ${strokeOpacity})`;
  const strokeFaint = `rgba(245, 247, 250, ${strokeOpacity * 0.5})`;
  const strokeStrong = `rgba(245, 247, 250, ${Math.min(1, strokeOpacity * 1.6)})`;

  const houseAngles = Array.from({ length: 12 }, (_, i) => i * 30);

  // pseudo planet placements (deterministic, just for atmosphere — not real ephemeris)
  const planets = [
    { name: "☉", angle: 14, r: rZodiac - 26 }, // sun
    { name: "☽", angle: 78, r: rZodiac - 44 }, // moon
    { name: "☿", angle: 22, r: rZodiac - 62 }, // mercury
    { name: "♀", angle: 340, r: rZodiac - 30 }, // venus
    { name: "♂", angle: 196, r: rZodiac - 50 }, // mars
    { name: "♃", angle: 252, r: rZodiac - 36 }, // jupiter
    { name: "♄", angle: 122, r: rZodiac - 56 }, // saturn
  ];

  const polar = (angleDeg: number, r: number) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  // a few aspect lines connecting some planets
  const aspects: [number, number][] = [
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 4],
    [0, 6],
  ];

  return (
    <motion.svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{
        duration: rotationDuration,
        ease: "linear",
        repeat: Infinity,
      }}
      aria-hidden
    >
      {/* outer ring */}
      <circle
        cx={cx}
        cy={cy}
        r={rOuter}
        fill="none"
        stroke={stroke}
        strokeWidth={1}
      />
      {/* zodiac ring */}
      <circle
        cx={cx}
        cy={cy}
        r={rZodiac}
        fill="none"
        stroke={strokeFaint}
        strokeWidth={1}
      />
      {/* inner house ring */}
      <circle
        cx={cx}
        cy={cy}
        r={rHouseInner}
        fill="none"
        stroke={strokeFaint}
        strokeWidth={1}
      />
      {/* aspect circle */}
      <circle
        cx={cx}
        cy={cy}
        r={rAspectInner}
        fill="none"
        stroke={strokeFaint}
        strokeWidth={1}
        strokeDasharray="2 4"
      />

      {/* house spokes */}
      {houseAngles.map((a, i) => {
        const inner = polar(a, rHouseInner);
        const outer = polar(a, rOuter);
        const major = a % 90 === 0;
        return (
          <line
            key={`spoke-${i}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={major ? strokeStrong : strokeFaint}
            strokeWidth={major ? 1 : 0.6}
          />
        );
      })}

      {/* zodiac tick marks (every 5°) */}
      {Array.from({ length: 72 }, (_, i) => i * 5).map((a, i) => {
        const o = polar(a, rZodiac);
        const o2 = polar(a, rZodiac - (a % 30 === 0 ? 12 : 5));
        return (
          <line
            key={`tick-${i}`}
            x1={o.x}
            y1={o.y}
            x2={o2.x}
            y2={o2.y}
            stroke={strokeFaint}
            strokeWidth={0.6}
          />
        );
      })}

      {/* aspect lines */}
      {aspects.map(([a, b], i) => {
        const p1 = polar(planets[a].angle, planets[a].r);
        const p2 = polar(planets[b].angle, planets[b].r);
        return (
          <line
            key={`aspect-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={strokeFaint}
            strokeWidth={0.6}
          />
        );
      })}

      {/* planets */}
      {planets.map((p, i) => {
        const pt = polar(p.angle, p.r);
        return (
          <g key={`planet-${i}`}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill="rgba(245, 247, 250, 0.95)"
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r={9}
              fill="none"
              stroke={strokeStrong}
              strokeWidth={0.6}
            />
          </g>
        );
      })}

      {/* center crosshair */}
      <g>
        <line
          x1={cx - 8}
          y1={cy}
          x2={cx + 8}
          y2={cy}
          stroke={strokeStrong}
          strokeWidth={1}
        />
        <line
          x1={cx}
          y1={cy - 8}
          x2={cx}
          y2={cy + 8}
          stroke={strokeStrong}
          strokeWidth={1}
        />
      </g>
    </motion.svg>
  );
}
