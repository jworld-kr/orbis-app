import type { Chapter } from "./types";
import chapter1Mock from "./chapter1";
import chapter2Mock from "./chapter2";

/**
 * Single source of truth for "given a chart + chapter number, produce a
 * Chapter object". Today: returns hand-written mock content while
 * ANTHROPIC_API_KEY is unset. Tomorrow: routes to Anthropic API with
 * 챕터_생성_가이드.md as the system prompt and 챕터별 chart slice as input.
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
  }[];
  houses: { index: number; cusp: number; sign: string; label: string }[];
  axes: {
    ascendant: { sign: string; degree: number; minute: number; label: string };
    midheaven: { sign: string; degree: number; minute: number; label: string };
  };
};

const MOCKS: Record<number, Chapter> = {
  1: chapter1Mock,
  2: chapter2Mock,
};

/**
 * Generate one chapter. Returns the same Chapter shape that the report
 * page already knows how to render.
 *
 * @param chartData  Output of /api/chart
 * @param subjectName  Person's name to address in the prose ("이원준님은…")
 * @param chapterNo  1..12
 */
export async function generateChapter(
  _chartData: ChartData,
  _subjectName: string,
  chapterNo: number,
): Promise<Chapter> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Mock mode — return the hand-written sample so the full pipeline
    // (DB write, route render, payment gate) can be exercised without
    // burning Anthropic credits.
    const mock = MOCKS[chapterNo];
    if (mock) return mock;
    return placeholderChapter(chapterNo);
  }

  // TODO: real Anthropic call. Will read 챕터_생성_가이드.md as system
  // prompt, send chart slice + sub-items for chapterNo, parse JSON, and
  // run §11-7 self-checks. Wired up once API key is in.
  throw new Error("anthropic_not_wired_yet");
}

function placeholderChapter(no: number): Chapter {
  return {
    no,
    romanNo: ["", "I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][no] ?? String(no),
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
