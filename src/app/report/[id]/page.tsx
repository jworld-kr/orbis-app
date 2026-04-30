import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Chapter, CoordinatesPanel } from "@/lib/chapters/types";
import A4Page from "@/components/report/A4Page";
import {
  CoverPage,
  CoordinatesPage,
  TOCPage,
  ChapterHeaderInterpretation,
  ChapterSynergy,
} from "@/components/report/ReportPages";

/**
 * Real per-user report.
 *
 * Renders Cover + Coordinates + TOC + however many chapters have been
 * generated so far. Currently shows Ch I (the free preview) once
 * /api/reports/[id]/preview has populated chapters[].
 *
 * RLS ensures only the owner can read this report's row.
 */
export default async function ReportPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/?login=1&next=/report/${params.id}`);
  }

  const { data: report } = await supabase
    .from("reports")
    .select("id, status, chapters, chart_id")
    .eq("id", params.id)
    .single();
  if (!report) notFound();

  const { data: chart } = await supabase
    .from("charts")
    .select("name, birth_date, birth_time, birth_place, latitude, longitude, chart_json")
    .eq("id", report.chart_id)
    .single();
  if (!chart) notFound();

  const chartJson = chart.chart_json as ChartJson;
  const identity = buildIdentity(chart);
  const panel = buildCoordinatesPanel(chartJson);

  const chapters = ((report.chapters as Array<{ no: number; content: Chapter }>) ?? [])
    .sort((a, b) => a.no - b.no);
  const ch1 = chapters.find((c) => c.no === 1)?.content;

  // 4 fixed pages (Cover, Coordinates, TOC × 2) + Ch I body + optional Ch I synergy
  const pages: PageEntry[] = [
    { kind: "cover" },
    { kind: "coordinates" },
    { kind: "toc", part: 1 },
    { kind: "toc", part: 2 },
  ];
  if (ch1) {
    pages.push({ kind: "chapter", chapter: ch1 });
    if (ch1.synergy) pages.push({ kind: "synergy", chapter: ch1 });
  }
  const totalPages = pages.length;

  return (
    <main className="relative min-h-screen w-full bg-[#06080F] py-10 md:py-16">
      <div className="space-y-6 md:space-y-10">
        {pages.map((p, i) => {
          const pageNumber = i + 1;
          if (p.kind === "cover") {
            return (
              <A4Page key={i} pageNumber={pageNumber} totalPages={totalPages} bare>
                <CoverPage identity={identity} />
              </A4Page>
            );
          }
          if (p.kind === "coordinates") {
            return (
              <A4Page key={i} pageNumber={pageNumber} totalPages={totalPages}>
                <CoordinatesPage panel={panel} />
              </A4Page>
            );
          }
          if (p.kind === "toc") {
            return (
              <A4Page key={i} pageNumber={pageNumber} totalPages={totalPages}>
                <TOCPage
                  start={p.part === 1 ? 0 : 6}
                  end={p.part === 1 ? 6 : 12}
                  partLabel={p.part === 1 ? "PART I · 01 — 06" : "PART II · 07 — 12"}
                />
              </A4Page>
            );
          }
          if (p.kind === "chapter") {
            return (
              <A4Page key={i} pageNumber={pageNumber} totalPages={totalPages}>
                <ChapterHeaderInterpretation ch={p.chapter} />
              </A4Page>
            );
          }
          if (p.kind === "synergy") {
            return (
              <A4Page key={i} pageNumber={pageNumber} totalPages={totalPages}>
                <ChapterSynergy ch={p.chapter} />
              </A4Page>
            );
          }
          return null;
        })}

        {report.status === "preview_pending" && !ch1 && (
          <div className="max-w-md mx-auto text-center font-kr text-white/55 text-[13px] py-12">
            보고서 1챕터 생성 중입니다. 잠시 후 새로고침해주세요.
          </div>
        )}
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

type ChartJson = {
  planets: Array<{ name: string; sign: string; degree: number; minute: number; label: string; symbol: string }>;
  axes: {
    ascendant: { sign: string; degree: number; minute: number; label: string };
  };
};

type PageEntry =
  | { kind: "cover" }
  | { kind: "coordinates" }
  | { kind: "toc"; part: 1 | 2 }
  | { kind: "chapter"; chapter: Chapter }
  | { kind: "synergy"; chapter: Chapter };

function buildIdentity(chart: {
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  latitude: number;
  longitude: number;
}) {
  const [y, m, d] = chart.birth_date.split("-");
  const [hh, mm] = chart.birth_time.split(":");
  return {
    name: chart.name,
    birth: `${y}. ${m}. ${d}  ${hh}:${mm} KST`,
    place: chart.birth_place,
    coordsLabel: `${chart.latitude.toFixed(2)}°N · ${chart.longitude.toFixed(2)}°E`,
  };
}

const PLANET_KO = ["수성","금성","화성","목성","토성"];
const PLANET_MEANING: Record<string, string> = {
  수성: "사고·소통",
  금성: "사랑의 결",
  화성: "행동·욕망",
  목성: "확장·운",
  토성: "책임·시련",
};

function buildCoordinatesPanel(chart: ChartJson): CoordinatesPanel {
  const sun = chart.planets.find((p) => p.name === "태양");
  const moon = chart.planets.find((p) => p.name === "달");
  const asc = chart.axes.ascendant;

  return {
    bigThree: [
      {
        kind: "rising",
        enLabel: "RISING",
        koLabel: "상승궁",
        sign: asc.sign,
        degree: `${asc.degree}° ${String(asc.minute).padStart(2, "0")}'`,
        role: "첫인상의 가면",
        note: "사회적 자리에서 자동으로 켜지는 모습",
      },
      {
        kind: "sun",
        enLabel: "SUN",
        koLabel: "태양",
        sign: sun?.sign ?? "—",
        degree: sun ? `${sun.degree}° ${String(sun.minute).padStart(2, "0")}'` : "—",
        role: "의식하는 자아",
        note: "본인이 ‘이게 나’라고 믿는 모습",
      },
      {
        kind: "moon",
        enLabel: "MOON",
        koLabel: "달",
        sign: moon?.sign ?? "—",
        degree: moon ? `${moon.degree}° ${String(moon.minute).padStart(2, "0")}'` : "—",
        role: "감정의 본능",
        note: "가까운 사람 앞에서의 모습",
      },
    ],
    planets: PLANET_KO.map((ko) => {
      const p = chart.planets.find((x) => x.name === ko);
      return {
        symbol: p?.symbol ?? "",
        name: ko.toUpperCase(),
        ko,
        position: p?.label ?? "—",
        meaning: PLANET_MEANING[ko] ?? "",
      };
    }),
  };
}
