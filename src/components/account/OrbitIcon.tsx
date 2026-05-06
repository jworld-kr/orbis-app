"use client";

import { motion } from "framer-motion";

/**
 * Pure-visual Orbit (Saturn) icon — same design as the floating top-right
 * indicator, but reusable inline at any size. No link / no auth dependency.
 *
 * The size prop controls the wrapper square; everything inside scales
 * proportionally.
 */
export default function OrbitIcon({
  size = 48,
  withHalo = true,
  className,
}: {
  size?: number;
  withHalo?: boolean;
  className?: string;
}) {
  // Body diameter is ~50% of the wrapper so the ring extends well past it.
  const bodyPct = "46%";

  return (
    <motion.div
      className={`relative ${className ?? ""}`}
      style={{ width: size, height: size }}
      animate={{ y: [0, -1.5, 0, 1.5, 0] }}
      transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
    >
      {/* outer cyan halo */}
      {withHalo && (
        <motion.div
          className="absolute inset-[-12%] rounded-full pointer-events-none"
          animate={{ opacity: [0.55, 0.78, 0.55] }}
          transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
          style={{
            background:
              "radial-gradient(circle, rgba(170,210,255,0.30) 0%, rgba(120,170,230,0.10) 45%, transparent 78%)",
          }}
        />
      )}

      {/* — Z-layer 1: ring BACK half */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 24, ease: "linear", repeat: Infinity }}
        style={{ transformOrigin: "50% 50%" }}
      >
        <defs>
          <linearGradient id="orbit-icon-back" x1="0" y1="0.5" x2="1" y2="0.5">
            <stop offset="0%" stopColor="rgba(170,200,240,0)" />
            <stop offset="22%" stopColor="rgba(190,220,250,0.55)" />
            <stop offset="50%" stopColor="rgba(220,240,255,0.85)" />
            <stop offset="78%" stopColor="rgba(190,220,250,0.55)" />
            <stop offset="100%" stopColor="rgba(170,200,240,0)" />
          </linearGradient>
        </defs>
        <g transform="rotate(-20 50 50)">
          <path
            d="M 14 50 A 36 9 0 0 1 86 50"
            fill="none"
            stroke="url(#orbit-icon-back)"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M 14 50 A 36 9 0 0 1 86 50"
            fill="none"
            stroke="rgba(80,100,140,0.45)"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
            transform="translate(0, 0.7)"
          />
        </g>
      </motion.svg>

      {/* — Z-layer 2: planet body */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative rounded-full"
          style={{
            width: bodyPct,
            height: bodyPct,
            background:
              "radial-gradient(circle at 33% 26%, #ffffff 0%, #d8e2f4 18%, #94a3c2 50%, #495571 85%, #2a3146 100%)",
            boxShadow:
              "0 0 4px rgba(220,235,255,0.7), 0 0 12px rgba(150,180,230,0.35)," +
              "inset -3px -4px 5px rgba(15,20,38,0.65)," +
              "inset 1.5px 1.5px 1.5px rgba(255,255,255,0.85)",
          }}
        >
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "32%",
              height: "26%",
              top: "16%",
              left: "26%",
              background:
                "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 65%)",
              filter: "blur(0.4px)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 78% 80%, rgba(160,200,255,0.45) 0%, rgba(160,200,255,0) 25%)",
            }}
          />
          <motion.div
            className="absolute left-0 right-0 pointer-events-none"
            animate={{ opacity: [0.42, 0.55, 0.42] }}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
            style={{
              top: "47%",
              height: "10%",
              transform: "rotate(-20deg)",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.55) 25%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.55) 75%, transparent 100%)",
              filter: "blur(0.6px)",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>

      {/* — Z-layer 3: ring FRONT half */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 24, ease: "linear", repeat: Infinity }}
        style={{ transformOrigin: "50% 50%" }}
      >
        <defs>
          <linearGradient id="orbit-icon-front" x1="0" y1="0.5" x2="1" y2="0.5">
            <stop offset="0%" stopColor="rgba(180,210,250,0)" />
            <stop offset="22%" stopColor="rgba(220,235,255,0.95)" />
            <stop offset="50%" stopColor="rgba(255,255,255,1)" />
            <stop offset="78%" stopColor="rgba(220,235,255,0.95)" />
            <stop offset="100%" stopColor="rgba(180,210,250,0)" />
          </linearGradient>
        </defs>
        <g transform="rotate(-20 50 50)">
          <path
            d="M 14 50 A 36 9 0 0 0 86 50"
            fill="none"
            stroke="url(#orbit-icon-front)"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M 14 50 A 36 9 0 0 0 86 50"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.45"
            vectorEffect="non-scaling-stroke"
            transform="translate(0, -0.6)"
          />
        </g>
      </motion.svg>
    </motion.div>
  );
}
