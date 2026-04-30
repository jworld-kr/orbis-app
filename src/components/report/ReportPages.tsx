import { toc } from "@/lib/chapters/toc";
import type { Chapter, CoordinatesPanel } from "@/lib/chapters/types";

/**
 * Reusable report page bodies. Both /report/sample (demo) and
 * /report/[id] (real) render the same components — just feed them
 * different data.
 */

export function CoverPage({
  identity,
}: {
  identity: { name: string; birth: string; place: string; coordsLabel: string };
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between">
        <span className="label-mono opacity-55">ORBIS / REPORT</span>
        <span className="label-mono opacity-40">MMXXVI</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <h1
          className="headline-serif font-medium leading-none"
          style={{ fontSize: "clamp(56px, 13vw, 96px)" }}
        >
          Orbis<span className="text-white/40">.</span>
        </h1>

        <p className="mt-8 md:mt-10 font-kr text-pretty text-[15px] md:text-[18px] leading-[1.65] tracking-tight text-white/85 max-w-md">
          NASA 천체 데이터와 깊이 있는 통찰로,
          <br />
          인간관계의 비밀을 해독하는 정밀 점성술.
        </p>

        <div className="mt-10 md:mt-14 flex items-center gap-2.5 label-mono opacity-55">
          <span className="h-px w-6 bg-white/40" />
          <span>자기 분석 보고서</span>
          <span className="h-px w-6 bg-white/40" />
        </div>
      </div>

      <div className="border-t border-white/[0.08] pt-5">
        <div className="flex items-baseline gap-3">
          <span
            className="headline-serif italic leading-none text-white/40"
            style={{ fontSize: "16px", letterSpacing: "-0.01em" }}
          >
            For
          </span>
          <span className="font-kr text-[18px] md:text-[20px] tracking-tight font-medium">
            {identity.name}님
          </span>
        </div>
        <div className="mt-1.5 font-mono text-[11px] md:text-[12px] text-white/45 leading-[1.7]">
          {identity.birth}
          <br />
          {identity.place} · {identity.coordsLabel}
        </div>
      </div>
    </div>
  );
}

export function CoordinatesPage({ panel }: { panel: CoordinatesPanel }) {
  return (
    <div>
      <SectionLabel ko="당신의 핵심 좌표" en="COORDINATES" />

      <div className="mt-5 grid grid-cols-3 gap-2 md:gap-3">
        {panel.bigThree.map((card) => (
          <div
            key={card.kind}
            className="border border-white/[0.12] p-3 md:p-5 flex flex-col"
          >
            <div className="flex items-baseline justify-between mb-2 md:mb-3">
              <span
                className="font-mono uppercase text-white/50"
                style={{ fontSize: 9, letterSpacing: "0.18em" }}
              >
                {card.enLabel}
              </span>
              <span className="font-kr text-[10px] md:text-[11px] text-white/45">
                {card.koLabel}
              </span>
            </div>
            <div className="font-kr text-[15px] md:text-[20px] leading-[1.2] tracking-tight font-medium">
              {card.sign}
            </div>
            <div className="font-mono text-[10.5px] md:text-[12px] text-white/55 mt-0.5">
              {card.degree}
            </div>
            <div className="mt-3 md:mt-5 pt-2 md:pt-3 border-t border-white/[0.08]">
              <div className="font-kr text-[10.5px] md:text-[12px] text-white/85 leading-[1.4]">
                {card.role}
              </div>
              <div className="font-kr text-[10px] md:text-[11.5px] text-white/55 leading-[1.4] mt-1">
                {card.note}
              </div>
            </div>
          </div>
        ))}
      </div>

      {panel.planets.length > 0 && (
        <div className="mt-5 md:mt-8">
          <div className="flex items-baseline gap-3 mb-2.5">
            <span
              className="font-mono uppercase text-white/55"
              style={{ fontSize: 10, letterSpacing: "0.22em" }}
            >
              PLANETS
            </span>
            <span className="h-px flex-1 bg-white/[0.1]" />
            <span className="font-kr text-[11px] text-white/45">행성</span>
          </div>
          <ul>
            {panel.planets.map((p) => (
              <li
                key={p.name}
                className="border-b border-white/[0.06] py-2 grid grid-cols-12 gap-2 items-baseline"
              >
                <span className="col-span-2 md:col-span-1 text-white/85 text-[14px] md:text-[16px]">
                  {p.symbol}
                </span>
                <span className="col-span-3 md:col-span-2 font-kr text-[12px] md:text-[13px] text-white/85">
                  {p.ko}
                </span>
                <span className="col-span-7 md:col-span-6 font-mono text-[11.5px] md:text-[13px] text-white/85 tracking-tight">
                  {p.position}
                </span>
                <span className="col-span-12 md:col-span-3 font-kr text-[11.5px] md:text-[12.5px] text-white/55">
                  {p.meaning}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {panel.keySignature && (
        <div className="mt-5 md:mt-8 border border-white/[0.16] p-4 md:p-5">
          <div
            className="font-mono uppercase text-white/55 mb-2"
            style={{ fontSize: 10, letterSpacing: "0.22em" }}
          >
            KEY SIGNATURE · 결정적 배치
          </div>
          <div className="font-kr text-[15px] md:text-[17px] leading-[1.3] tracking-tight font-medium mt-1">
            {panel.keySignature.title}
          </div>
          <p className="mt-2.5 font-kr text-pretty text-[12px] md:text-[13.5px] leading-[1.7] text-white/65">
            {panel.keySignature.body}
          </p>
        </div>
      )}
    </div>
  );
}

export function TOCPage({
  start = 0,
  end = 12,
  partLabel,
}: {
  start?: number;
  end?: number;
  partLabel?: string;
}) {
  const items = toc.slice(start, end);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <SectionLabel ko="목차" en="CONTENTS" />
        {partLabel && (
          <span className="font-mono text-[10px] md:text-[11px] tracking-[0.2em] text-white/40 uppercase">
            {partLabel}
          </span>
        )}
      </div>
      <ol className="mt-6 space-y-5 md:space-y-6">
        {items.map((item) => (
          <li key={item.roman}>
            <div className="grid grid-cols-12 gap-3 items-baseline pb-2 border-b border-white/[0.12]">
              <span className="col-span-2 md:col-span-1 font-mono text-[11px] md:text-[12px] text-white/55 tracking-[0.2em]">
                {item.roman}
              </span>
              <span className="col-span-8 md:col-span-9 font-kr text-[14px] md:text-[16px] text-white tracking-tight font-medium">
                {item.title}
              </span>
              <span className="col-span-2 font-mono text-[11px] md:text-[12px] text-white/45 text-right tracking-tight">
                {String(item.page).padStart(2, "0")}
              </span>
            </div>
            <ul className="mt-2 ml-[calc(8.333%+12px)] md:ml-[calc(8.333%+12px)] space-y-1">
              {item.subs.map((sub, i) => (
                <li
                  key={i}
                  className="font-kr text-[12.5px] md:text-[13.5px] leading-[1.7] text-white/60 tracking-tight"
                >
                  {sub}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ChapterHeaderInterpretation({ ch }: { ch: Chapter }) {
  const tocEntry = toc.find((t) => t.roman === ch.romanNo);
  const subs = tocEntry?.subs ?? [];
  return (
    <div>
      <ChapterTitle ch={ch} />
      <section className="mt-8 md:mt-12">
        <div className="space-y-8 md:space-y-10">
          {ch.paragraphs.map((p, i) => (
            <Paragraph key={i} para={p} index={i} subTitle={subs[i]} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function ChapterSynergy({ ch }: { ch: Chapter }) {
  if (!ch.synergy) return null;
  return (
    <section>
      <SectionLabel ko="세 결이 만났을 때" en="WHEN THEY MEET" />
      <p className="mt-4 font-kr text-pretty text-[13.5px] md:text-[15px] leading-[1.85] text-white/75">
        {ch.synergy.intro}
      </p>
      <ol className="mt-5 space-y-5">
        {ch.synergy.pairs.map((pair, i) => (
          <li key={i}>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] tracking-[0.18em] text-white/45 w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-kr text-[14.5px] md:text-[17px] leading-[1.35] tracking-tight font-medium">
                {pair.title}
              </h3>
            </div>
            <p className="mt-1.5 ml-8 font-kr text-pretty text-[13px] md:text-[14.5px] leading-[1.85] text-white/72">
              {pair.body}
            </p>
          </li>
        ))}
      </ol>
      <div className="mt-6 pt-5 border-t border-white/[0.08]">
        <p className="font-kr text-pretty text-[14px] md:text-[16px] leading-[1.7] text-white tracking-tight font-medium">
          {ch.synergy.summary}
        </p>
      </div>
    </section>
  );
}

function ChapterTitle({ ch }: { ch: Chapter }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <span className="font-mono text-[11px] tracking-[0.2em] text-white/45">
          CHAPTER {ch.romanNo}
        </span>
        <span className="headline-serif italic text-[14px] text-white/45">
          {ch.en}
        </span>
      </div>
      <div className="h-px bg-white/[0.1]" />
      <h1 className="mt-3 font-kr text-[28px] md:text-[40px] leading-[1.1] tracking-tightest font-medium">
        {ch.title}
      </h1>
    </div>
  );
}

function SectionLabel({ ko, en }: { ko: string; en: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/55">
        {en}
      </span>
      <span className="h-px flex-1 max-w-[120px] bg-white/[0.1]" />
      <span className="font-kr text-[11px] text-white/45">{ko}</span>
    </div>
  );
}

function Paragraph({
  para,
  index,
  subTitle,
}: {
  para: { lead: string; body: string };
  index?: number;
  subTitle?: string;
}) {
  return (
    <div>
      {subTitle && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-px w-5 bg-white/25" />
            <span className="font-mono text-[10px] tracking-[0.22em] text-white/45">
              {String((index ?? 0) + 1).padStart(2, "0")}
            </span>
          </div>
          <p className="font-kr text-[11.5px] md:text-[12.5px] leading-[1.5] tracking-tight text-white/45">
            {subTitle}
          </p>
        </div>
      )}
      <p className="font-kr text-pretty text-[15px] md:text-[18px] leading-[1.55] tracking-tight font-medium text-white">
        {para.lead}
      </p>
      <p className="mt-2.5 font-kr text-pretty text-[13px] md:text-[14.5px] leading-[1.9] text-white/70">
        {para.body}
      </p>
    </div>
  );
}
