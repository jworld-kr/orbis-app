"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Starfield from "@/components/Starfield";
import BlackHole from "@/components/BlackHole";
import { ORBIS_EASE } from "@/lib/motion";

const reveal = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.25 + i * 0.18,
      duration: 1.2,
      ease: ORBIS_EASE,
    },
  }),
};

export default function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bhScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const bhOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section
      ref={ref}
      className="relative h-[100svh] w-full overflow-hidden bg-orbis-bg"
    >
      {/* z-0: starfield (deepest) */}
      <div className="absolute inset-0 z-0">
        <Starfield density={0.1} parallaxStrength={14} />
      </div>

      {/* z-10: black hole, dead center */}
      <motion.div
        style={{ scale: bhScale, opacity: bhOpacity }}
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
      >
        <div
          className="relative"
          style={{
            width: "min(86vmin, 860px)",
            height: "min(86vmin, 860px)",
          }}
        >
          <BlackHole size={1200} />
        </div>
      </motion.div>

      {/* z-20: edge vignette so corners deepen, center stays open */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 50%, rgba(10, 14, 26, 0) 40%, rgba(10, 14, 26, 0) 65%, rgba(10, 14, 26, 0.85) 100%)",
        }}
      />

      {/* z-25: dark veil behind text — bridges with the black hole's horizon */}
      <div
        className="absolute inset-0 z-[25] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 38% 28% at 50% 50%, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.55) 45%, rgba(0, 0, 0, 0) 80%)",
        }}
      />

      {/* z-30: text, dead center over the black hole */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="absolute inset-0 z-30 flex items-center justify-center px-6 md:px-10"
      >
        <div
          className="w-full max-w-2xl text-center"
          style={{
            textShadow:
              "0 0 24px rgba(0, 0, 0, 0.85), 0 0 8px rgba(0, 0, 0, 0.7)",
          }}
        >
          <motion.h1
            custom={0}
            variants={reveal}
            initial="hidden"
            animate="show"
            className="headline-serif text-[56px] md:text-[80px] leading-none font-medium"
          >
            Orbis<span className="text-white/40">.</span>
          </motion.h1>

          <motion.p
            custom={1}
            variants={reveal}
            initial="hidden"
            animate="show"
            className="mt-6 md:mt-8 font-kr text-pretty text-[15px] md:text-[22px] leading-[1.6] md:leading-[1.55] tracking-tight text-white/85"
          >
            NASA 천체 데이터와 깊이 있는 통찰로,
            <br />
            인간관계의 비밀을 해독하는 정밀 점성술.
          </motion.p>

          <motion.div
            custom={2}
            variants={reveal}
            initial="hidden"
            animate="show"
            className="mt-8 md:mt-10 flex items-center justify-center gap-8 md:gap-10"
          >
            <UnderlineCTA href="#begin">내 차트 그리기</UnderlineCTA>
            <UnderlineCTA href="#about" muted>
              점성술이란?
            </UnderlineCTA>
          </motion.div>
        </div>
      </motion.div>

      {/* z-30: scroll cue, sits below the text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
      >
        <span className="label-mono opacity-50">SCROLL</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-6 bg-white/30"
        />
      </motion.div>
    </section>
  );
}

function UnderlineCTA({
  href,
  children,
  muted,
}: {
  href: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group relative inline-flex items-center gap-2 font-kr text-[14px] md:text-[15px] tracking-tight ${
        muted ? "text-white/55 hover:text-white" : "text-white"
      } transition-colors duration-300 ease-orbis`}
    >
      <span>{children}</span>
      <span className="inline-block transition-transform duration-300 ease-orbis group-hover:translate-x-1">
        →
      </span>
      <span
        className={`absolute left-0 -bottom-1 h-px ${
          muted ? "bg-white/40" : "bg-white"
        } w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-orbis`}
      />
    </a>
  );
}
