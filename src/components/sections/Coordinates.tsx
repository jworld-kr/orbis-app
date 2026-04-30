"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import IPhoneMockup from "@/components/IPhoneMockup";
import LiveNatalChart from "@/components/LiveNatalChart";
import { ORBIS_EASE } from "@/lib/motion";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Sample report data                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

// Phone 1 — chapter analysis (사랑할 때). Aligned to Phone 2's natal data
// (Lee Jiwon, Venus 황소자리 28° · 9H, Mars 사자자리 3° · 12H).
const CHAPTER = {
  no: "IV",
  title: "사랑할 때",
  en: "When You Love",
  // hook headline (one line of impact) + character subhead (사주 style)
  hook: "끌릴수록 멀어지는 사랑.",
  subhead: "황소자리 금성과 사자자리 화성이\n서로 다른 곳을 가리킬 때.",
  data: [
    { k: "금성", v: "황소자리 28° · 9번째 방" },
    { k: "화성", v: "사자자리 3° · 12번째 방" },
    { k: "관계", v: "금성과 화성, 90° 긴장" },
  ],
  body: [
    "황소자리 28도의 금성을 가진 Jiwon님은 사랑에 신중하고 흔들리지 않는 사람입니다. 한 번 마음을 정하면 쉽게 바꾸지 않는, ‘천천히 깊어지는’ 형태의 사랑을 합니다.",
    "금성이 9번째 방 — 가치관과 신념의 자리에 머무는 배치는, 단순한 끌림이 아닌 ‘같은 세계를 바라보는 사람’에게서만 사랑을 느끼게 만듭니다. 가벼운 만남에 흥미를 느끼지 못하는 이유가 여기 있습니다.",
    "그러나 화성이 12번째 방, 무의식의 자리에 사자자리로 들어선 배치는 정반대 신호를 보냅니다. 사자자리 12실의 화성은 ‘밖으로 표현되지 않는 강렬함’을 의미합니다. 원하는 사람 앞에서 도리어 망설이고, 끌릴수록 거리를 두는 패턴이 반복되는 이유입니다.",
    "두 행성이 90도로 맞물린 배치는, 사랑의 신중함(금성)과 표현의 망설임(화성)이 끊임없이 충돌하는 형국입니다. 좋아하는 사람일수록 다가가지 못한다는 패턴은, 의지의 문제가 아니라 차트에 새겨진 두 행성의 긴장 그 자체입니다.",
  ],
  // a hint that the chapter has more sub-sections — fades out at bottom
  subcats: [
    "끌리는 사람의 유형",
    "당신이 다가가는 방식",
    "반복되는 관계 패턴",
    "가장 행복한 사랑의 형태",
    "가장 다치게 하는 신호",
  ],
  page: "PAGE 07 / 20",
};

// Phone 2 — coordinates page (your natal chart data)
const COORDS = {
  name: "Lee Jiwon",
  date: "1995. 06. 12",
  time: "14:32 KST",
  place: "Seoul · 37.57°N · 126.98°E",
  asc: "천칭자리 6°",
  mc: "게자리 12°",
  planets: [
    { sym: "☉", name: "태양", sign: "게자리 21°", house: "11" },
    { sym: "☽", name: "달", sign: "물병자리 8°", house: "06" },
    { sym: "☿", name: "수성", sign: "쌍둥이자리 14°", house: "10" },
    { sym: "♀", name: "금성", sign: "황소자리 28°", house: "09" },
    { sym: "♂", name: "화성", sign: "사자자리 3°", house: "12" },
    { sym: "♃", name: "목성", sign: "사수자리 17°", house: "04" },
    { sym: "♄", name: "토성", sign: "물고기자리 24°", house: "07" },
  ],
  page: "PAGE 02 / 20",
};

// Phone 3 — table of contents (12 chapters with sub-items)
const TOC: { title: string; subs: string[] }[] = [
  {
    title: "핵심 좌표",
    subs: ["핵심 에너지 3가지", "한 문장 정의"],
  },
  {
    title: "세 가지 자아",
    subs: ["사회적 가면 (상승궁)", "의식하는 나 (태양)", "본능 (달)"],
  },
  {
    title: "감정 작동 방식",
    subs: ["스트레스 반응 패턴", "안정감을 찾는 방식", "셀프케어 가이드"],
  },
  {
    title: "사랑할 때",
    subs: ["끌리는 사람의 유형", "다가가는 방식", "반복하는 패턴"],
  },
  {
    title: "소통 방식",
    subs: ["말하고 듣는 패턴", "오해받는 지점", "갈등 상황의 언어"],
  },
  {
    title: "일할 때",
    subs: ["빛나는 환경", "동료/상사로서의 모습", "성공 공식"],
  },
  {
    title: "돈과의 관계",
    subs: ["돈에 대한 무의식", "소비 패턴", "끌어당기는 방식"],
  },
  {
    title: "그림자",
    subs: ["회피하는 것", "부정하는 것", "자기 파괴 패턴"],
  },
  {
    title: "재능과 사명",
    subs: ["타고난 재능", "이번 생의 과제", "빛나는 자리"],
  },
  {
    title: "지금 이 시기",
    subs: ["끝나가는 것", "시작되는 것"],
  },
  {
    title: "앞으로 6개월",
    subs: ["시기별 키워드", "주의점", "구체적 조언"],
  },
  {
    title: "당신을 위한 처방",
    subs: ["기억할 세 가지", "매일의 실천", "피해야 할 함정"],
  },
];

/* ────────────────────────────────────────────────────────────────────────── */

export default function Coordinates() {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section
      ref={ref}
      id="coordinates"
      className="relative w-full min-h-[100svh] flex items-center py-20 md:py-32 overflow-hidden bg-orbis-bg"
    >
      <BackdropGrid />

      <motion.div
        initial={{ scaleY: 1 }}
        animate={inView ? { scaleY: 0 } : { scaleY: 1 }}
        transition={{ duration: 1.1, ease: ORBIS_EASE, delay: 0.05 }}
        style={{ transformOrigin: "top" }}
        className="absolute inset-0 z-30 bg-orbis-bg pointer-events-none"
      />

      <div className="hidden md:flex absolute left-8 top-0 bottom-0 z-10 flex-col items-center justify-center pointer-events-none">
        <div className="h-16 w-px bg-white/15" />
        <div
          className="my-3 label-mono opacity-55"
          style={{ writingMode: "vertical-rl", letterSpacing: "0.3em" }}
        >
          § 03 — REPORT
        </div>
        <div className="h-16 w-px bg-white/15" />
      </div>

      <div className="relative z-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.9, delay: 0.95, ease: ORBIS_EASE }}
          className="px-5 md:px-16 max-w-[640px] mx-auto text-center mb-10 md:mb-16"
        >
          <h2 className="font-kr text-pretty md:text-balance text-[24px] md:text-[40px] leading-[1.3] md:leading-[1.25] tracking-tightest font-medium">
            12개의 챕터, 한 사람의 좌표.
          </h2>
          <p className="mt-5 md:mt-7 font-kr text-pretty md:text-balance text-[14px] md:text-[17px] leading-[1.7] tracking-tight text-white/70">
            이 우주 속에 새겨진, 당신 출생의 비밀.
            <br />
            마주할 준비가 되어있나요?
            <br />
            한 번 읽으면, 이전의 자신으로 돌아갈 수 없습니다.
          </p>
        </motion.div>

        <div className="relative px-5 md:px-16">
          <MockupRow inView={inView} />
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function MockupRow({ inView }: { inView: boolean }) {
  // order: chapter → coordinates → contents
  const screens = [
    { type: "chapter" as const, key: "chapter" },
    { type: "coordinates" as const, key: "coords" },
    { type: "contents" as const, key: "toc" },
  ];
  const stagger = ["md:translate-y-3", "", "md:translate-y-5"];

  return (
    <div className="flex justify-start md:justify-center items-end gap-3 md:gap-8 overflow-x-auto md:overflow-visible -mx-5 md:mx-0 px-5 md:px-0 pb-2 md:pb-0">
      {screens.map((s, i) => (
        <motion.div
          key={s.key}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{
            duration: 0.9,
            delay: 1.2 + i * 0.12,
            ease: ORBIS_EASE,
          }}
          className={`shrink-0 ${stagger[i]}`}
        >
          <IPhoneMockup>
            {s.type === "contents" ? (
              <ContentsScreen />
            ) : s.type === "coordinates" ? (
              <CoordinatesScreen />
            ) : (
              <ChapterScreen />
            )}
          </IPhoneMockup>
        </motion.div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Screen 1 — Table of Contents                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function ContentsScreen() {
  return (
    <div className="relative w-full h-full bg-[#06080F] text-white overflow-hidden">
      {/* scrollable content — overflows the phone, bottom fade hints "more" */}
      <div className="px-5 py-4 h-full overflow-hidden">
        <ReportHeader page="PAGE 01 / 20" />

        <div className="mt-3.5">
          <div className="headline-serif italic text-[12px] text-white/50 leading-none">
            Contents
          </div>
          <div className="font-kr text-[22px] leading-[1.1] mt-1 tracking-tight font-medium">
            목차
          </div>
        </div>

        <div
          className="mt-2.5 mb-1.5 label-mono opacity-50"
          style={{ fontSize: 7.5 }}
        >
          12 CHAPTERS · 20 PAGES
        </div>

        <ol className="space-y-2">
          {TOC.map((t, i) => (
            <li key={i}>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-mono text-white/55 w-4 shrink-0"
                  style={{ fontSize: 8 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-kr text-white/95 flex-1 tracking-tight" style={{ fontSize: 10 }}>
                  {t.title}
                </span>
                <span
                  className="font-mono text-white/40 shrink-0"
                  style={{ fontSize: 7.5 }}
                >
                  {String(2 + i).padStart(2, "0")}
                </span>
              </div>
              <ul className="mt-0.5 ml-6">
                {t.subs.map((s, j) => (
                  <li
                    key={j}
                    className="flex items-baseline gap-1.5 leading-[1.4]"
                  >
                    <span className="text-white/30" style={{ fontSize: 7.5 }}>
                      ·
                    </span>
                    <span
                      className="font-kr text-white/55 tracking-tight"
                      style={{ fontSize: 8.5 }}
                    >
                      {s}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      {/* bottom fade — content extends "below" the phone */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, #06080F 0%, rgba(6,8,15,0.85) 35%, transparent 100%)",
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Screen 2 — Your Coordinates (chart + planet table)                        */
/* ────────────────────────────────────────────────────────────────────────── */

function CoordinatesScreen() {
  return (
    <div className="w-full h-full overflow-hidden bg-[#06080F] text-white px-5 py-4 flex flex-col">
      <ReportHeader page={COORDS.page} />

      <div className="mt-4">
        <div className="headline-serif italic text-[12px] text-white/50 leading-none">
          Your Coordinates
        </div>
        <div className="font-kr text-[22px] leading-[1.1] mt-1 tracking-tight font-medium">
          내 고유 좌표
        </div>
      </div>

      {/* identity block */}
      <div className="mt-3 pb-2 border-b border-white/[0.08]">
        <div className="font-kr text-[11px] text-white/85 tracking-tight">
          {COORDS.name}
        </div>
        <div
          className="font-mono text-white/55 mt-0.5"
          style={{ fontSize: 8.5, letterSpacing: "0.05em" }}
        >
          {COORDS.date} · {COORDS.time}
        </div>
        <div
          className="font-mono text-white/45 mt-0.5"
          style={{ fontSize: 8, letterSpacing: "0.05em" }}
        >
          {COORDS.place}
        </div>
      </div>

      {/* chart */}
      <div className="mt-3 flex justify-center">
        <div className="relative w-[110px] h-[110px]">
          <LiveNatalChart size={520} className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      {/* planets table */}
      <div className="mt-2">
        <div
          className="flex items-baseline gap-2 mb-1"
        >
          <span
            className="font-mono uppercase text-white/55"
            style={{ fontSize: 7.5, letterSpacing: "0.2em" }}
          >
            PLANETS
          </span>
          <span className="h-px flex-1 bg-white/[0.1]" />
          <span className="font-kr text-white/40" style={{ fontSize: 8 }}>
            7
          </span>
        </div>
        <ul>
          {COORDS.planets.map((p, i) => (
            <li
              key={i}
              className="flex items-baseline gap-2 py-[2px] border-b border-white/[0.05] last:border-b-0"
            >
              <span className="text-white/85 w-3 shrink-0" style={{ fontSize: 10 }}>
                {p.sym}
              </span>
              <span className="font-kr text-white/65 w-7 shrink-0" style={{ fontSize: 9 }}>
                {p.name}
              </span>
              <span className="font-kr text-white/85 flex-1 tracking-tight" style={{ fontSize: 9 }}>
                {p.sign}
              </span>
              <span
                className="font-mono text-white/45 shrink-0"
                style={{ fontSize: 8 }}
              >
                {p.house}H
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* axes */}
      <div className="mt-2">
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className="font-mono uppercase text-white/55"
            style={{ fontSize: 7.5, letterSpacing: "0.2em" }}
          >
            AXES
          </span>
          <span className="h-px flex-1 bg-white/[0.1]" />
        </div>
        <ul>
          <li className="flex items-baseline gap-2 py-[2px]">
            <span className="font-kr text-white/65 w-12 shrink-0" style={{ fontSize: 9 }}>
              상승궁
            </span>
            <span className="font-kr text-white/85 flex-1 tracking-tight" style={{ fontSize: 9 }}>
              {COORDS.asc}
            </span>
          </li>
          <li className="flex items-baseline gap-2 py-[2px]">
            <span className="font-kr text-white/65 w-12 shrink-0" style={{ fontSize: 9 }}>
              중천
            </span>
            <span className="font-kr text-white/85 flex-1 tracking-tight" style={{ fontSize: 9 }}>
              {COORDS.mc}
            </span>
          </li>
        </ul>
      </div>

      <ReportFooter page={COORDS.page} className="mt-auto" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Screen 3 — Chapter (when you love)                                        */
/* ────────────────────────────────────────────────────────────────────────── */

function ChapterScreen() {
  return (
    <div className="relative w-full h-full bg-[#06080F] text-white overflow-hidden">
      <div className="px-5 py-4 h-full overflow-hidden">
        <ReportHeader page={CHAPTER.page} chapter={`CH. ${CHAPTER.no}`} />

        {/* title */}
        <div className="mt-3">
          <div className="headline-serif italic text-[11px] text-white/50 leading-none">
            {CHAPTER.en}
          </div>
          <div className="font-kr text-[19px] leading-[1.1] mt-1 tracking-tight font-medium">
            {CHAPTER.title}
          </div>
        </div>

        {/* hook headline + character subhead */}
        <div className="mt-3 pb-3 border-b border-white/[0.08]">
          <div
            className="font-kr font-semibold tracking-tight text-white"
            style={{ fontSize: 12.5, lineHeight: 1.35 }}
          >
            {CHAPTER.hook}
          </div>
          <div
            className="mt-1 font-kr text-white/55 leading-[1.45] whitespace-pre-line tracking-tight"
            style={{ fontSize: 9 }}
          >
            {CHAPTER.subhead}
          </div>
        </div>

        {/* coordinates */}
        <div className="mt-3">
          <SectionHead label="당신의 좌표" en="COORDINATES" />
          <ul className="mt-1.5">
            {CHAPTER.data.map((d, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-3 py-[2px] border-b border-white/[0.05] last:border-b-0"
              >
                <span
                  className="font-kr text-white/60 shrink-0"
                  style={{ fontSize: 9 }}
                >
                  {d.k}
                </span>
                <span
                  className="font-kr text-white/90 text-right tracking-tight"
                  style={{ fontSize: 9 }}
                >
                  {d.v}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* interpretation */}
        <div className="mt-3">
          <SectionHead label="해석" en="INTERPRETATION" />
          <div className="mt-1.5 space-y-1.5">
            {CHAPTER.body.map((p, i) => (
              <p
                key={i}
                className="font-kr leading-[1.65] text-white/78"
                style={{ fontSize: 9.5 }}
              >
                {p}
              </p>
            ))}
          </div>
        </div>

        {/* hint of subcategories — appears at the very bottom under the body,
            fades out so it reads as "more inside" */}
        <div className="mt-3">
          <SectionHead label="이 챕터의 항목" en="IN THIS CHAPTER" />
          <ul className="mt-1.5 space-y-[3px]">
            {CHAPTER.subcats.map((s, i) => (
              <li
                key={i}
                className="flex items-baseline gap-2"
              >
                <span
                  className="font-mono text-white/40 w-3 shrink-0"
                  style={{ fontSize: 7.5 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="font-kr text-white/65"
                  style={{ fontSize: 9 }}
                >
                  {s}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* bottom fade — content continues below */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, #06080F 0%, rgba(6,8,15,0.9) 30%, transparent 100%)",
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Shared phone bits                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

function ReportHeader({ page, chapter }: { page?: string; chapter?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
      <span className="font-mono text-[8px] tracking-[0.18em] uppercase text-white/55">
        ORBIS / REPORT
      </span>
      <span className="font-mono text-[8px] tracking-[0.18em] uppercase text-white/55">
        {chapter ?? page?.replace("PAGE ", "P. ")}
      </span>
    </div>
  );
}

function ReportFooter({
  page,
  className,
}: {
  page: string;
  className?: string;
}) {
  return (
    <div
      className={`pt-2.5 border-t border-white/[0.06] flex items-center justify-between ${className ?? ""}`}
    >
      <span className="font-mono text-[8px] text-white/40 tracking-[0.18em]">
        {page}
      </span>
      <span className="font-mono text-[8px] text-white/40 tracking-[0.18em]">
        ORBIS · MMXXVI
      </span>
    </div>
  );
}

function SectionHead({ label, en }: { label: string; en: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="font-mono uppercase text-white/55"
        style={{ fontSize: 7.5, letterSpacing: "0.2em" }}
      >
        {en}
      </span>
      <span className="h-px flex-1 bg-white/[0.1]" />
      <span className="font-kr text-white/40" style={{ fontSize: 8.5 }}>
        {label}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function BackdropGrid() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-orbis-bg" />

      {/* ruled-paper horizontal lines — paper / notebook tone */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(245, 247, 250, 0.06) 31px, rgba(245, 247, 250, 0.06) 32px)",
        }}
      />

      {/* shooting light beam — sweeps L→R across the page like a scanner */}
      <ShootingBeam />

      {/* radial darken at edges, keep center readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(10, 14, 26, 0.5) 90%, rgba(10, 14, 26, 0.95) 100%)",
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

/** Shooting stars — diagonal meteors with head + trailing tail.
 *  Plain absolute-positioned divs, animated with framer-motion. */
function ShootingBeam() {
  // start in the upper-right band, staggered, so on average ~5s between
  // staggered so a meteor appears roughly every 4s on average
  const meteors = [
    { x: 88, delay: 0 },
    { x: 72, delay: 4 },
    { x: 96, delay: 8 },
  ];
  return (
    <>
      {meteors.map((m, i) => (
        <Meteor key={i} startXPct={m.x} delay={m.delay} />
      ))}
    </>
  );
}

function Meteor({ startXPct, delay }: { startXPct: number; delay: number }) {
  const TRAVEL = 1.8;
  const CYCLE = 12;

  const DX = -260;
  const DY = 190;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        top: "10%",
        left: `${startXPct}%`,
      }}
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{
        // soft fade in, hold, soft fade out
        opacity: [0, 0.55, 0.55, 0],
        x: [0, DX],
        y: [0, DY],
      }}
      transition={{
        duration: TRAVEL,
        delay,
        // accelerate as it falls — feels like a real shooting star
        ease: [0.5, 0, 0.7, 0.4],
        repeat: Infinity,
        repeatDelay: CYCLE - TRAVEL,
        times: [0, 0.18, 0.7, 1],
      }}
    >
      {/* trail — long, soft, blurred */}
      <div
        className="absolute"
        style={{
          width: 90,
          height: 0.8,
          top: 0,
          left: 1,
          transform: "rotate(-35deg)",
          transformOrigin: "left center",
          background:
            "linear-gradient(to right, rgba(255,255,255,0.55) 0%, rgba(245,247,250,0.18) 60%, rgba(245,247,250,0) 100%)",
          filter: "blur(0.6px)",
        }}
      />
      {/* head — soft halo, no hard core */}
      <div
        className="absolute rounded-full"
        style={{
          width: 1.4,
          height: 1.4,
          top: -0.7,
          left: -0.7,
          background: "rgba(255,255,255,0.92)",
          boxShadow:
            "0 0 4px rgba(255,255,255,0.55), 0 0 10px rgba(245,247,250,0.28)",
        }}
      />
    </motion.div>
  );
}
