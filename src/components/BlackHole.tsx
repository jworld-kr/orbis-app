"use client";

import { motion } from "framer-motion";

type Props = {
  size?: number;
  className?: string;
};

/**
 * Event Horizon — visible, deep, with photon ring and warped spacetime.
 * Tuned for high contrast against #0A0E1A background.
 */
export default function BlackHole({ size = 1200, className }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const horizonR = size * 0.16; // black disk
  const photonR = size * 0.205; // bright photon ring
  const accretionRX = size * 0.42;
  const accretionRY = size * 0.1;

  return (
    <div
      className={`relative w-full h-full ${className ?? ""}`}
      aria-hidden
    >
      {/* warped grid layer — concentric rings + spokes, masked toward center */}
      <motion.svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 w-full h-full"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 240, ease: "linear", repeat: Infinity }}
      >
        <defs>
          <radialGradient id="grid-mask" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" />
            <stop offset={`${(horizonR / cx) * 100}%`} stopColor="#000" />
            <stop offset={`${(photonR / cx) * 100 + 6}%`} stopColor="#fff" />
            <stop offset="78%" stopColor="#fff" />
            <stop offset="100%" stopColor="#000" />
          </radialGradient>
          <mask id="grid-fade">
            <rect width={size} height={size} fill="url(#grid-mask)" />
          </mask>
        </defs>

        <g mask="url(#grid-fade)">
          {/* concentric lensing rings — brighter than before */}
          {Array.from({ length: 22 }, (_, i) => {
            const r = horizonR + (i + 1) * (size * 0.022);
            const o = 0.12 + (i / 22) * 0.28;
            return (
              <circle
                key={`r-${i}`}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={`rgba(245, 247, 250, ${o})`}
                strokeWidth={i % 4 === 0 ? 1.1 : 0.6}
              />
            );
          })}
          {/* radial spokes */}
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i * 10 * Math.PI) / 180;
            const r1 = horizonR;
            const r2 = size * 0.55;
            const major = i % 9 === 0;
            return (
              <line
                key={`s-${i}`}
                x1={cx + r1 * Math.cos(a)}
                y1={cy + r1 * Math.sin(a)}
                x2={cx + r2 * Math.cos(a)}
                y2={cy + r2 * Math.sin(a)}
                stroke={`rgba(245, 247, 250, ${major ? 0.32 : 0.1})`}
                strokeWidth={major ? 1 : 0.5}
              />
            );
          })}
        </g>
      </motion.svg>

      {/* accretion disk — tilted, brighter inner rings */}
      <motion.svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 w-full h-full"
        initial={{ rotate: 0 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 320, ease: "linear", repeat: Infinity }}
      >
        <g transform={`translate(${cx} ${cy}) rotate(-14)`}>
          <ellipse
            cx={0}
            cy={0}
            rx={accretionRX * 1.25}
            ry={accretionRY * 1.4}
            fill="none"
            stroke="rgba(245, 247, 250, 0.14)"
            strokeWidth={1}
          />
          <ellipse
            cx={0}
            cy={0}
            rx={accretionRX}
            ry={accretionRY}
            fill="none"
            stroke="rgba(245, 247, 250, 0.36)"
            strokeWidth={1.1}
          />
          <ellipse
            cx={0}
            cy={0}
            rx={accretionRX * 0.85}
            ry={accretionRY * 0.85}
            fill="none"
            stroke="rgba(245, 247, 250, 0.6)"
            strokeWidth={1}
          />
          <ellipse
            cx={0}
            cy={0}
            rx={accretionRX * 0.7}
            ry={accretionRY * 0.7}
            fill="none"
            stroke="rgba(245, 247, 250, 0.85)"
            strokeWidth={0.9}
          />
        </g>
      </motion.svg>

      {/* static layer — outer glow + photon ring + horizon */}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          {/* big soft outer glow */}
          <radialGradient id="outer-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245, 247, 250, 0)" />
            <stop
              offset={`${(photonR / cx) * 100 - 4}%`}
              stopColor="rgba(245, 247, 250, 0)"
            />
            <stop
              offset={`${(photonR / cx) * 100}%`}
              stopColor="rgba(245, 247, 250, 0.55)"
            />
            <stop
              offset={`${(photonR / cx) * 100 + 18}%`}
              stopColor="rgba(245, 247, 250, 0.04)"
            />
            <stop offset="100%" stopColor="rgba(245, 247, 250, 0)" />
          </radialGradient>
          {/* horizon — true black, darker than bg */}
          <radialGradient id="horizon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="80%" stopColor="#000000" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.9)" />
          </radialGradient>
        </defs>

        {/* outer glow halo */}
        <circle
          cx={cx}
          cy={cy}
          r={photonR + 60}
          fill="url(#outer-glow)"
        />

        {/* outer photon ring (thick + bright) */}
        <circle
          cx={cx}
          cy={cy}
          r={photonR}
          fill="none"
          stroke="rgba(245, 247, 250, 0.95)"
          strokeWidth={2.5}
        />
        {/* secondary inner ring for depth */}
        <circle
          cx={cx}
          cy={cy}
          r={photonR - 6}
          fill="none"
          stroke="rgba(245, 247, 250, 0.35)"
          strokeWidth={1}
        />

        {/* event horizon (deep black disk) */}
        <circle cx={cx} cy={cy} r={horizonR} fill="url(#horizon)" />

        {/* horizon edge — slightly visible silhouette */}
        <circle
          cx={cx}
          cy={cy}
          r={horizonR}
          fill="none"
          stroke="rgba(245, 247, 250, 0.18)"
          strokeWidth={0.8}
        />
      </svg>

      {/* breathing pulse — visible "alive" signal */}
      <motion.div
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, transparent 14%, rgba(245, 247, 250, 0.1) 21%, transparent 32%)",
        }}
      />
    </div>
  );
}
