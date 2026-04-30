"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

type Props = {
  size?: number;
  className?: string;
};

/**
 * A natal-chart wheel where the planets sit at fixed angles, but the entire
 * chart rotates by ±0.25° on a 4s loop — so it looks like the chart is
 * recomputing for "1 minute later" and back. Quiet, deliberate motion that
 * makes the page feel alive without being distracting.
 *
 * Visual: 12-house wheel + zodiac ring + 7 planet markers + aspect lines.
 * Rendered with vector-effect non-scaling-stroke so weights stay crisp.
 */
export default function LiveNatalChart({ size = 520, className }: Props) {
  // angles for the 7 planets (deterministic, "sample chart")
  const planets = [
    { name: "☉", angle: 14, r: 0.86 }, // sun
    { name: "☽", angle: 78, r: 0.76 }, // moon
    { name: "☿", angle: 22, r: 0.66 }, // mercury
    { name: "♀", angle: 340, r: 0.84 }, // venus
    { name: "♂", angle: 196, r: 0.7 }, // mars
    { name: "♃", angle: 252, r: 0.78 }, // jupiter
    { name: "♄", angle: 122, r: 0.7 }, // saturn
  ];

  const r = (rel: number) => (size / 2) * rel;

  const polar = (deg: number, radius: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };
  };

  // ±0.18° tick — represents one-minute drift
  const tick = useMotionValue(0);
  useEffect(() => {
    const ctrl = animate(tick, [0, 0.18, 0, -0.18, 0], {
      duration: 6,
      ease: "easeInOut",
      repeat: Infinity,
    });
    return () => ctrl.stop();
  }, [tick]);

  const chartRotate = useTransform(tick, (v) => v);
  // a much slower base rotation gives life
  const baseRotate = useMotionValue(0);
  useEffect(() => {
    const ctrl = animate(baseRotate, 360, {
      duration: 240,
      ease: "linear",
      repeat: Infinity,
    });
    return () => ctrl.stop();
  }, [baseRotate]);
  const totalRotate = useTransform(
    [chartRotate, baseRotate],
    ([a, b]: number[]) => a + b
  );

  return (
    <motion.svg
      viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
      className={className}
      style={{ rotate: totalRotate }}
      aria-hidden
    >
      {/* outer ring */}
      <circle
        r={r(0.95)}
        fill="none"
        stroke="rgba(245,247,250,0.55)"
        strokeWidth={0.8}
        vectorEffect="non-scaling-stroke"
      />
      {/* zodiac ring */}
      <circle
        r={r(0.85)}
        fill="none"
        stroke="rgba(245,247,250,0.32)"
        strokeWidth={0.6}
        vectorEffect="non-scaling-stroke"
      />
      {/* inner house ring */}
      <circle
        r={r(0.55)}
        fill="none"
        stroke="rgba(245,247,250,0.22)"
        strokeWidth={0.5}
        vectorEffect="non-scaling-stroke"
      />
      {/* aspect ring */}
      <circle
        r={r(0.34)}
        fill="none"
        stroke="rgba(245,247,250,0.18)"
        strokeWidth={0.5}
        strokeDasharray="2 4"
        vectorEffect="non-scaling-stroke"
      />

      {/* 12 house spokes */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = i * 30;
        const i1 = polar(a, r(0.55));
        const o = polar(a, r(0.95));
        const major = i % 3 === 0;
        return (
          <line
            key={`sp-${i}`}
            x1={i1.x}
            y1={i1.y}
            x2={o.x}
            y2={o.y}
            stroke={
              major ? "rgba(245,247,250,0.55)" : "rgba(245,247,250,0.2)"
            }
            strokeWidth={major ? 0.9 : 0.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      {/* zodiac tick marks every 5° */}
      {Array.from({ length: 72 }, (_, i) => i * 5).map((a, i) => {
        const o = polar(a, r(0.85));
        const o2 = polar(a, r(0.85) - (a % 30 === 0 ? r(0.05) : r(0.025)));
        return (
          <line
            key={`tick-${i}`}
            x1={o.x}
            y1={o.y}
            x2={o2.x}
            y2={o2.y}
            stroke="rgba(245,247,250,0.3)"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      {/* aspect lines between selected planets */}
      {[
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 4],
        [0, 6],
      ].map(([a, b], i) => {
        const p1 = polar(planets[a].angle, r(planets[a].r * 0.85));
        const p2 = polar(planets[b].angle, r(planets[b].r * 0.85));
        return (
          <line
            key={`asp-${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="rgba(245,247,250,0.18)"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      {/* planets */}
      {planets.map((p, i) => {
        const pt = polar(p.angle, r(p.r * 0.85));
        return (
          <g key={`pl-${i}`}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={r(0.005) + 1.6}
              fill="rgba(245,247,250,0.95)"
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r={r(0.022)}
              fill="none"
              stroke="rgba(245,247,250,0.6)"
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}

      {/* center crosshair */}
      <line
        x1={-6}
        y1={0}
        x2={6}
        y2={0}
        stroke="rgba(245,247,250,0.5)"
        strokeWidth={0.7}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={0}
        y1={-6}
        x2={0}
        y2={6}
        stroke="rgba(245,247,250,0.5)"
        strokeWidth={0.7}
        vectorEffect="non-scaling-stroke"
      />
    </motion.svg>
  );
}
