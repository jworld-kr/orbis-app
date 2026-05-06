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
import PaywallTrigger from "@/components/billing/PaywallTrigger";
import LockedChapterPage from "@/components/report/LockedChapterPage";
import ReportStatusWatcher from "@/components/report/ReportStatusWatcher";

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

  const { data: profile } = await supabase
    .from("users")
    .select("token_balance")
    .eq("id", user.id)
    .maybeSingle();
  const tokenBalance = profile?.token_balance ?? 0;

  const chartJson = chart.chart_json as ChartJson;
  const identity = buildIdentity(chart);
  const panel = buildCoordinatesPanel(chartJson);

  const chapters = ((report.chapters as Array<{ no: number; content: Chapter }>) ?? [])
    .sort((a, b) => a.no - b.no);
  const hasCh1 = chapters.some((c) => c.no === 1);

  // While we're still generating the free preview (Ch I), show a
  // dedicated waiting screen — there's nothing meaningful to render
  // yet and a hard reload picks up the result the moment it lands.
  if (report.status === "preview_pending" && !hasCh1) {
    return (
      <main className="min-h-screen w-full bg-[#06080F] text-white">
        <ReportStatusWatcher reportId={report.id} initialStatus="preview_pending" />
      </main>
    );
  }
  if (report.status === "failed") {
    return (
      <main className="min-h-screen w-full bg-[#06080F] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="font-mono text-[10px] tracking-[0.3em] text-white/45 mb-4">
            ORBIS
          </div>
          <p className="font-kr text-[15px] text-red-300/85 leading-[1.7]">
            보고서 생성 중 오류가 발생했습니다.
            <br />
            잠시 후 다시 시도해주세요.
          </p>
        </div>
      </main>
    );
  }

  // Decide which chapters to render based on payment status.
  // - preview_pending / preview_ready → only Ch I (free preview)
  // - full_pending / full_ready       → all available chapters
  const isPaid = report.status === "full_ready" || report.status === "full_pending";
  const chaptersToRender = isPaid
    ? chapters
    : chapters.filter((c) => c.no === 1);

  // Fixed pages first, then chapters in order. Ch I gets a synergy page.
  const pages: PageEntry[] = [
    { kind: "cover" },
    { kind: "coordinates" },
    { kind: "toc", part: 1 },
    { kind: "toc", part: 2 },
  ];
  for (const c of chaptersToRender) {
    pages.push({ kind: "chapter", chapter: c.content });
    if (c.no === 1 && c.content.synergy) {
      pages.push({ kind: "synergy", chapter: c.content });
    }
  }
  // If the user is still on the preview tier, append a single locked
  // chapter teaser — enough to hint that more is below without flooding
  // the page with placeholders.
  if (!isPaid) {
    pages.push({ kind: "locked", chapterNo: 2 });
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
          if (p.kind === "locked") {
            return (
              <A4Page key={i} pageNumber={pageNumber} totalPages={totalPages}>
                <LockedChapterPage chapterNo={p.chapterNo} />
              </A4Page>
            );
          }
          return null;
        })}

        {report.status === "full_pending" && (
          <ReportStatusWatcher reportId={report.id} initialStatus="full_pending" />
        )}
      </div>

      {report.status === "preview_ready" && (
        <PaywallTrigger
          reportId={report.id}
          userId={user.id}
          email={user.email ?? undefined}
          tokenBalance={tokenBalance}
        />
      )}
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
  | { kind: "synergy"; chapter: Chapter }
  | { kind: "locked"; chapterNo: number };

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
