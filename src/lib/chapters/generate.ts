import type { Chapter } from "./types";
import chapter1Mock from "./chapter1";
import chapter2Mock from "./chapter2";
import { getChapterSpec } from "./chapterMap";
import { generateChapterViaAnthropic } from "./anthropic";
import { crossValidate } from "./crossValidate";

/**
 * Single source of truth for "given a chart + chapter number, produce a
 * Chapter object".
 *
 * - With ANTHROPIC_API_KEY set: real call → §5/§6/§9 self-validate →
 *   1 retry on failure → return.
 * - Without the key: return the hand-written mock so the rest of the
 *   pipeline (DB write, render, payment gate) can be exercised free.
 *
 * For full reports, prefer generateFullReport() which adds §10 cross-
 * chapter dedup on top.
 */

export type ChartData = {
  input: {
    local: { year: number; month: number; day: number; hour: number; minute: number };
    timezone: string;
    coordinates: { latitude: number; longitude: number };
    placeName?: string;
  };
  planets: {
    symbol: string;
    name: string;
    longitude: number;
    sign: string;
    degree: number;
    minute: number;
    label: string;
    speed?: number;
    retrograde?: boolean;
    house?: number;
  }[];
  houses: { index: number; cusp: number; sign: string; label: string }[];
  axes: {
    ascendant: {
      sign: string; degree: number; minute: number; label: string; house?: number;
    };
    midheaven: {
      sign: string; degree: number; minute: number; label: string; house?: number;
    };
  };
  nodes?: {
    north: { sign: string; degree: number; minute: number; label: string };
    south: { sign: string; degree: number; minute: number; label: string };
  };
  aspects?: Array<{
    a: string;
    b: string;
    kind: "conjunction" | "sextile" | "square" | "trine" | "opposition";
    exactAngle: number;
    actualAngle: number;
    orb: number;
    applying: boolean;
    label: string;
  }>;
  stelliums?: Array<{ kind: "sign" | "house"; key: string; planets: string[] }>;
  chartShape?: string;
};

const MOCKS: Record<number, Chapter> = {
  1: chapter1Mock,
  2: chapter2Mock,
};

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Generate one chapter.
 *
 * @param chartData     Output of /api/chart
 * @param subjectName   Person's name to address in the prose ("이원준님은…")
 * @param chapterNo     1..12
 * @param priorChapters Already-generated chapters in this report — used
 *                      for §10 cross-chapter dedup feedback in the prompt.
 */
export async function generateChapter(
  chartData: ChartData,
  subjectName: string,
  chapterNo: number,
  priorChapters: Chapter[] = [],
): Promise<Chapter> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return MOCKS[chapterNo] ?? placeholderChapter(chapterNo);
  }

  const spec = getChapterSpec(chapterNo);
  const result = await generateChapterViaAnthropic({
    chartData,
    subjectName,
    spec,
    priorChapters,
  });

  if (result.issues.length > 0) {
    // We tried + retried; final output still has issues. Log and accept
    // — failing the whole report would hurt the user more than minor
    // rule violations. Issues list is preserved for QA.
    console.warn(
      `[generateChapter] Ch${chapterNo} accepted with ${result.issues.length} issue(s) after ${result.attempts} attempts:`,
      result.issues.map((i) => i.code).join(", "),
    );
  }

  return result.chapter;
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Generate the full 12-chapter report (or 11, when Ch I is already done).
 *
 *   - Generates sequentially (not parallel) so each chapter sees the
 *     previously generated lead lines and can dedup.
 *   - After all chapters are done, runs cross-validation (§10). Any
 *     chapter flagged as duplicating an earlier one gets ONE retry
 *     with the duplicate context fed back as feedback.
 */
export async function generateFullReport(
  chartData: ChartData,
  subjectName: string,
  alreadyGenerated: Chapter[] = [],
): Promise<Chapter[]> {
  const out: Chapter[] = [...alreadyGenerated].sort((a, b) => a.no - b.no);
  const have = new Set(out.map((c) => c.no));

  for (let n = 1; n <= 12; n++) {
    if (have.has(n)) continue;
    const ch = await generateChapter(chartData, subjectName, n, out);
    out.push(ch);
    out.sort((a, b) => a.no - b.no);
  }

  // Cross-chapter dedup pass — only when real model output (mock content
  // is hand-curated, no need to verify across chapters).
  if (process.env.ANTHROPIC_API_KEY) {
    const cross = crossValidate(out);
    if (!cross.ok) {
      const dupNos = Object.keys(cross.byChapter).map((s) => Number(s));
      console.warn(
        `[generateFullReport] cross-chapter issues in chapters: ${dupNos.join(", ")}. retrying offenders…`,
      );
      for (const n of dupNos) {
        const issues = cross.byChapter[n];
        const feedback =
          "이전 챕터들과 lead/장면/결론이 중복되었습니다:\n" +
          issues.map((i) => `- ${i.message}`).join("\n");
        const others = out.filter((c) => c.no !== n);
        const spec = getChapterSpec(n);
        const result = await generateChapterViaAnthropic({
          chartData,
          subjectName,
          spec,
          priorChapters: others,
          retryFeedback: feedback,
        });
        const idx = out.findIndex((c) => c.no === n);
        if (idx >= 0) out[idx] = result.chapter;
      }
    }
  }

  return out;
}

/* ────────────────────────────────────────────────────────────────────────── */

function placeholderChapter(no: number): Chapter {
  const roman = ROMAN[no] ?? String(no);
  return {
    no,
    romanNo: roman,
    title: `챕터 ${no}`,
    en: `Chapter ${no}`,
    paragraphs: [
      {
        lead: "이 챕터는 곧 본인의 차트로 채워집니다.",
        body: "Anthropic API 연결 후 사용자 차트로 자동 생성됩니다.",
      },
    ],
  };
}

const ROMAN: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
};
