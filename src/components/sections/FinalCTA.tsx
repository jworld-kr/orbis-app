"use client";

import { motion } from "framer-motion";
import DriftingStars from "@/components/DriftingStars";
import { ORBIS_EASE } from "@/lib/motion";

export default function FinalCTA() {
  return (
    <section
      id="final"
      className="relative min-h-[100svh] w-full flex items-center justify-center px-5 md:px-20 py-24 md:py-32 overflow-hidden border-t border-white/[0.06] bg-orbis-bg"
    >
      {/* shared deep-space backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-orbis-bg" />
        <DriftingStars />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(10, 14, 26, 0.4) 30%, rgba(10, 14, 26, 0.9) 100%)",
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

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 1.2, ease: ORBIS_EASE }}
        className="relative z-10 max-w-4xl text-center"
      >
        <h2 className="font-kr text-pretty md:text-balance text-[28px] md:text-[56px] leading-[1.2] md:leading-[1.1] tracking-tightest font-medium">
          당신이 모르는 당신을,
          <br />
          <span className="text-white/55">우주는 알고 있습니다.</span>
        </h2>

        <p className="mt-8 md:mt-12 text-white/65 font-kr text-pretty text-[14px] md:text-[17px] leading-[1.8] max-w-xl mx-auto">
          왜 같은 사람한테 끌리는지, 왜 어떤 일에서만 빛나는지.
          <br />
          당신이 묻기 전에, 차트는 답을 가지고 있습니다.
        </p>

        <div className="mt-12 md:mt-16 flex justify-center">
          <a
            href="#begin-alt"
            className="group inline-flex items-center gap-3 px-8 py-3.5 border border-white text-white bg-white/[0.04] hover:bg-white hover:text-orbis-bg transition-all duration-500 ease-orbis"
          >
            <span className="font-kr text-[14px] md:text-[15px] tracking-wide">
              차트 분석하기
            </span>
            <span className="inline-block transition-transform duration-300 ease-orbis group-hover:translate-x-1.5">
              →
            </span>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
