"use client";

import { motion } from "framer-motion";
import NatalChart from "@/components/NatalChart";
import { ORBIS_EASE } from "@/lib/motion";

export default function Method() {
  return (
    <section className="relative min-h-screen w-full flex items-center px-6 md:px-20 py-32 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto w-full">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1, ease: ORBIS_EASE }}
          className="max-w-3xl"
        >
          <div className="label-mono mb-6">02 — METHOD</div>
          <h2 className="font-kr text-balance text-[40px] md:text-[64px] leading-[1.05] tracking-tightest font-medium">
            <span className="text-white/55">하늘이</span> 당신을 그립니다
          </h2>
          <p className="mt-8 text-white/65 font-kr text-[15px] md:text-[16px] leading-[1.85] max-w-[560px]">
            이름과 태어난 시간, 장소만 입력하시면 됩니다.
            <br />
            나머지는 NASA 천체 데이터가 그려냅니다.
          </p>
        </motion.div>

        {/* divider */}
        <div className="my-16 md:my-24 h-px bg-white/[0.08]" />

        {/* grid: left chart + right co-star style input */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* chart */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 1.4, ease: ORBIS_EASE }}
              className="relative aspect-square max-w-[480px] mx-auto"
            >
              <NatalChart
                size={700}
                rotationDuration={180}
                strokeOpacity={0.5}
                className="w-full h-full"
              />
              <div className="absolute -top-4 -left-4 label-mono">
                CHART / LIVE
              </div>
              <div className="absolute -bottom-4 -right-4 label-mono">
                12 HOUSES · 7 PLANETS
              </div>
            </motion.div>
          </div>

          {/* co-star style sentence input */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 1, ease: ORBIS_EASE }}
            >
              <div className="label-mono mb-8">CAST YOUR CHART</div>

              <p className="font-kr text-[26px] md:text-[34px] leading-[1.55] tracking-tight text-white/85">
                나는{" "}
                <input
                  type="text"
                  placeholder="도시"
                  defaultValue=""
                  className="orbis-inline-input w-[7ch] md:w-[10ch] text-center font-kr"
                />
                에서{" "}
                <input
                  type="text"
                  placeholder="2000.01.01"
                  defaultValue=""
                  className="orbis-inline-input w-[10ch] md:w-[12ch] text-center font-mono text-[20px] md:text-[26px]"
                />{" "}
                <span className="text-white/50">,</span>{" "}
                <input
                  type="text"
                  placeholder="00:00"
                  defaultValue=""
                  className="orbis-inline-input w-[6ch] text-center font-mono text-[20px] md:text-[26px]"
                />
                에 태어났습니다.
              </p>

              <p className="font-kr text-[26px] md:text-[34px] leading-[1.55] tracking-tight text-white/85 mt-2">
                내 이메일은{" "}
                <input
                  type="email"
                  placeholder="email@example.com"
                  defaultValue=""
                  className="orbis-inline-input w-[16ch] md:w-[22ch] text-left font-mono text-[18px] md:text-[24px]"
                />
                .
              </p>

              <div className="mt-12 flex items-center gap-6">
                <button
                  type="button"
                  className="group inline-flex items-center gap-3 px-7 py-3.5 border border-white/40 hover:border-white hover:bg-white hover:text-orbis-bg transition-all duration-300 ease-orbis"
                >
                  <span className="font-kr text-[14px] tracking-wide">
                    내 차트 그리기
                  </span>
                  <span className="inline-block transition-transform duration-300 ease-orbis group-hover:translate-x-1">
                    →
                  </span>
                </button>
                <span className="label-mono opacity-50">
                  첫 결과는 무료입니다
                </span>
              </div>

              <p className="mt-10 text-white/35 font-kr text-[12px] leading-[1.7] max-w-[440px]">
                정확한 출생 시간을 입력해주세요. 1분의 차이가 당신의 좌표를
                바꿉니다.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
