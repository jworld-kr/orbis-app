import type { Chapter } from "./types";
import type { ValidationIssue } from "./validate";

/**
 * Cross-chapter dedup checker (가이드 §10).
 *
 *   - §10-1: same scene/quotation can't be lead'd twice across the report.
 *   - §10-2: same closing sentence can't repeat.
 *   - §10-3: same chart-data citation max twice.
 *
 * Returns issues per chapter so we can pinpoint which chapter to
 * regenerate.
 */

export type CrossValidationResult = {
  ok: boolean;
  /** Map from chapter no → list of issues. */
  byChapter: Record<number, ValidationIssue[]>;
};

/** §10-1 — phrases / scenes that may only appear as a lead once total. */
const LEAD_SCENE_POOL: { tag: string; regex: RegExp }[] = [
  { tag: "힘들다 못 함", regex: /['‘]힘들다['’]\s*[을를]?\s*말하지\s*못/ },
  { tag: "별일 아니야", regex: /['‘]별일\s*아니야['’]/ },
  { tag: "괜찮다 인용", regex: /['‘]괜찮다['’]/ },
  { tag: "또래보다 어른스럽다", regex: /['‘]또래보다\s*어른스럽다['’]|또래보다\s*어른스럽다는?\s*말/ },
  { tag: "쟤한테 맡기면 된다", regex: /['‘]쟤한테\s*맡기면\s*된다['’]/ },
  { tag: "너 생각보다 차가워", regex: /['‘](?:너\s*)?생각보다\s*차가워['’]/ },
  { tag: "너 의외로 따뜻하네", regex: /['‘](?:너\s*)?(?:의외로|생각보다)\s*따뜻해['’]?|의외로\s*따뜻하네/ },
  { tag: "이게 더 빠르다", regex: /['‘]이게\s*더?\s*빠르다['’]/ },
  { tag: "잠 못 드는 새벽", regex: /잠을?\s*못\s*드[는]?\s*새벽|잠 얕게\s*자/ },
  { tag: "카톡창 한 번 더", regex: /카톡창[을를]?\s*한\s*번\s*더/ },
  { tag: "0.5초 차이", regex: /0\.5초\s*(?:차이|늦)/ },
  { tag: "회식 자리 집에 가고 싶다", regex: /회식\s*자리.*집에\s*가고\s*싶/ },
];

const ASTRO_CITATIONS: { tag: string; regex: RegExp }[] = [
  // Stelium-style citations
  { tag: "달·수성·금성 7궁", regex: /달[·,\s]+수성[·,\s]+금성[^.]{0,40}(?:일곱\s*번째|7궁)/ },
  // Sun in 6th house
  { tag: "태양 6궁", regex: /태양[^.]{0,30}(?:여섯\s*번째|6궁|노동의 방)/ },
  // ASC in cap
  { tag: "ASC 염소", regex: /(?:상승궁|첫 번째 방|ASC)[^.]{0,30}염소자리/ },
];

/* ────────────────────────────────────────────────────────────────────────── */

export function crossValidate(chapters: Chapter[]): CrossValidationResult {
  const byChapter: Record<number, ValidationIssue[]> = {};
  const push = (no: number, issue: ValidationIssue) => {
    (byChapter[no] ??= []).push(issue);
  };

  // §10-1 — for each scene, count how many *leads* mention it across chapters.
  for (const { tag, regex } of LEAD_SCENE_POOL) {
    const hits: { no: number; paraIdx: number; lead: string }[] = [];
    for (const ch of chapters) {
      ch.paragraphs.forEach((p, i) => {
        if (regex.test(p.lead)) hits.push({ no: ch.no, paraIdx: i + 1, lead: p.lead });
      });
    }
    if (hits.length > 1) {
      // Keep the first, flag the rest.
      for (let k = 1; k < hits.length; k++) {
        const h = hits[k];
        push(h.no, {
          code: "cross_lead_scene_reuse",
          message: `§10-1 lead 장면 중복: '${tag}'이 Chapter ${chapters.find((c) => c.no === h.no)?.romanNo ?? h.no} 단락 ${h.paraIdx}와 다른 챕터의 lead에서 동시에 사용됨.`,
        });
      }
    }
  }

  // §10-3 — astro data citations across the whole report (≤2 each)
  for (const { tag, regex } of ASTRO_CITATIONS) {
    const hits: { no: number }[] = [];
    for (const ch of chapters) {
      const text = chapterFullText(ch);
      const count = (text.match(regex) ?? []).length;
      for (let k = 0; k < count; k++) hits.push({ no: ch.no });
    }
    if (hits.length > 2) {
      // Flag the chapters past the second occurrence
      for (let k = 2; k < hits.length; k++) {
        push(hits[k].no, {
          code: "cross_astro_citation_overuse",
          message: `§10-3 차트 데이터 인용 '${tag}'이 보고서 전체에서 ${hits.length}회 등장 (한도 2회).`,
        });
      }
    }
  }

  // §10-2 — same closing sentence detection (heuristic)
  // Compare last sentence of each chapter; flag duplicates.
  const closings: { no: number; closing: string }[] = chapters.map((ch) => ({
    no: ch.no,
    closing: lastSentenceOf(ch),
  }));
  for (let i = 0; i < closings.length; i++) {
    for (let j = i + 1; j < closings.length; j++) {
      if (
        closings[i].closing.length > 20 &&
        closings[j].closing.length > 20 &&
        normalize(closings[i].closing) === normalize(closings[j].closing)
      ) {
        push(closings[j].no, {
          code: "cross_closing_duplicate",
          message: `§10-2 마무리 문장이 Chapter ${chapters.find((c) => c.no === closings[i].no)?.romanNo ?? closings[i].no}와 동일합니다.`,
        });
      }
    }
  }

  const ok = Object.keys(byChapter).length === 0;
  return { ok, byChapter };
}

function chapterFullText(ch: Chapter): string {
  const main = ch.paragraphs.map((p) => `${p.lead} ${p.body}`).join(" ");
  const syn = ch.synergy
    ? `${ch.synergy.intro} ${ch.synergy.pairs.map((p) => `${p.title} ${p.body}`).join(" ")} ${ch.synergy.summary}`
    : "";
  return `${main} ${syn}`;
}

function lastSentenceOf(ch: Chapter): string {
  const lastPara = ch.paragraphs[ch.paragraphs.length - 1];
  if (!lastPara) return "";
  const sentences = lastPara.body.split(/(?<=[.!?。])\s+/).map((s) => s.trim()).filter(Boolean);
  return sentences[sentences.length - 1] ?? "";
}

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").replace(/[.!?。‘’"',]/g, "").trim();
}
