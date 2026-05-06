import type { Chapter, ChapterParagraph } from "./types";
import type { ChapterSpec } from "./chapterMap";

/**
 * Single-chapter validator. Implements 가이드 §5 (lead rules),
 * §6 (body rules), §9 (length budgets), and the §11 self-check.
 *
 * Returns a list of human-readable issues. Empty list = pass.
 * The list is fed back to the model on retry so it knows what to fix.
 */

export type ValidationIssue = {
  code: string;
  message: string;
  /** Optional reference to where the issue lives. */
  at?: { paragraph?: number; field?: "lead" | "body" };
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

const LEAD_MIN = 30;
const LEAD_MAX = 60;
const BODY_MIN = 280;
const BODY_MAX = 420;
const SENTENCE_MIN = 30;
const SENTENCE_MAX = 120;
const PARA_BODY_SENTENCES_MIN = 4;
const PARA_BODY_SENTENCES_MAX = 7;

const FORBIDDEN_LEAD_PATTERNS: { regex: RegExp; reason: string }[] = [
  { regex: /가장 강력한 신호/, reason: "§5-1 빈 강조 ('가장 강력한 신호')" },
  { regex: /한 사람이 켜집니다/, reason: "§5-1 의인화 ('한 사람이 켜집니다')" },
  { regex: /자아가 켜져요/, reason: "§5-1 의인화" },
  { regex: /^그런데\s/, reason: "§0 안내·연결사로 lead 시작 ('그런데')" },
  { regex: /^그리고\s/, reason: "§0 안내·연결사로 lead 시작 ('그리고')" },
  { regex: /^그래서\s/, reason: "§0 안내·연결사로 lead 시작 ('그래서')" },
];

/** Patterns that turn the body into an astrology lecture. Lecture means
 *  using a chart placement as a one-line cause for an abstract
 *  consequence ("X자리에 Y가 자리해 Z합니다"). Pure citations + 풀이
 *  형식 ("Y가 X자리에 자리하고, 이는 Z라는 뜻이에요. ~한 사람이
 *  됩니다.")는 OK — 사주 풀이도 그렇게 합니다. */
const FORBIDDEN_BODY_PATTERNS: { regex: RegExp; reason: string }[] = [
  // 강의식 인과 한 줄 — 즉시 추상 결론으로 점프
  {
    regex: /[가-힣]+자리에?\s+[가-힣]+이?\s*(?:자리해|있어|머물러|들어앉아)\s*[,，]?\s*[가-힣]+(?:한|는|을)?\s*(?:사람|결|기질|성격)을?\s*만들/,
    reason: "§0a #3 강의톤 ('X자리에 Y가 자리해 Z를 만듭니다')",
  },
  { regex: /이 도수에서 태어난 사람/, reason: "§0a #3 강의톤 ('이 도수에서 태어난 사람')" },
  { regex: /상승궁이?\s*만들어내는/, reason: "§0a #3 강의톤 ('상승궁이 만들어내는')" },
  // 분명한 의인화·시적 표현 (헤드라인 자리 외)
  { regex: /살고 있어요|살고 있습니다/, reason: "§0a 의인화 ('살고 있어요')" },
  { regex: /한 사람이 켜집니다/, reason: "§0a 의인화 ('한 사람이 켜집니다')" },
];

const META_ANNOUNCEMENT_PATTERNS: { regex: RegExp; reason: string }[] = [
  { regex: /이 (?:다섯|네|네 가지) 단락은/, reason: "§6-7 메타 안내문" },
  { regex: /이번 챕터에서는/, reason: "§6-7 메타 안내문" },
  { regex: /다음 단락에서는/, reason: "§6-7 메타 안내문" },
  { regex: /지금부터 .* 풀어/, reason: "§6-7 메타 안내문" },
  { regex: /이 챕터의 나머지/, reason: "§6-7 메타 안내문" },
];

const ZODIAC = [
  "양자리", "황소자리", "쌍둥이자리", "게자리",
  "사자자리", "처녀자리", "천칭자리", "전갈자리",
  "사수자리", "염소자리", "물병자리", "물고기자리",
];

const PLANETS = ["태양", "달", "수성", "금성", "화성", "목성", "토성"];

const HOUSE_NAMES = [
  "첫 번째 방", "두 번째 방", "세 번째 방", "네 번째 방",
  "다섯 번째 방", "여섯 번째 방", "일곱 번째 방", "여덟 번째 방",
  "아홉 번째 방", "열 번째 방", "열한 번째 방", "열두 번째 방",
  "노동의 방", "관계의 방",
];

const ASTRO_META = [
  "관계의 거울", "라이징 사인", "스텔리움",
];

const ADVICE_ENDING_PATTERNS = [
  /해두면 [^.]*[다요][.!?]?$/,
  /하는 게 좋[아습][다요][.!?]?$/,
  /하는 게 본인 (결|성격|스타일)에 맞[아습][다요][.!?]?$/,
  /하면 자연스럽게 [^.]*[다요][.!?]?$/,
  /를?\s*만들어두세요[.!?]?$/,
];

/* ────────────────────────────────────────────────────────────────────────── */

export function validateChapter(
  ch: Chapter,
  spec: ChapterSpec,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Paragraph count == sub-item count (Ch I = 5, Ch II~XI = 4, XII = 4 prescription items)
  if (spec.special === "prescription") {
    if (!ch.prescription) {
      issues.push({ code: "missing_prescription", message: "§2 Ch XII는 prescription 블록이 필요합니다" });
    } else {
      if (ch.prescription.items.length !== spec.subItems.length) {
        issues.push({
          code: "prescription_item_count",
          message: `prescription.items 개수가 sub-items와 일치하지 않습니다: 기대 ${spec.subItems.length}, 실제 ${ch.prescription.items.length}`,
        });
      }
    }
    if (!ch.oneLine || ch.oneLine.trim().length === 0) {
      issues.push({ code: "missing_one_line", message: "§2 Ch XII는 oneLine이 필요합니다" });
    }
  } else {
    if (ch.paragraphs.length !== spec.subItems.length) {
      issues.push({
        code: "paragraph_count",
        message: `단락 수가 sub-items와 일치하지 않습니다: 기대 ${spec.subItems.length}, 실제 ${ch.paragraphs.length}`,
      });
    }
  }

  // Synergy required for Chapter I
  if (spec.special === "synergy") {
    if (!ch.synergy) {
      issues.push({ code: "missing_synergy", message: "§2 Ch I은 synergy 블록이 필요합니다" });
    } else {
      if (ch.synergy.pairs.length !== 3) {
        issues.push({
          code: "synergy_pairs_count",
          message: `§9-6 synergy.pairs는 정확히 3개여야 합니다 (실제 ${ch.synergy.pairs.length})`,
        });
      }
    }
  }

  // Per-paragraph checks
  let adviceCount = 0;
  for (let i = 0; i < ch.paragraphs.length; i++) {
    const p = ch.paragraphs[i];
    const paraIssues = validateParagraph(p, i + 1);
    issues.push(...paraIssues);
    if (paragraphEndsWithAdvice(p)) adviceCount++;
  }

  // §9-7 advice endings
  if (adviceCount > 2) {
    issues.push({
      code: "too_much_advice",
      message: `§9-7 권유성 닫음 단락이 너무 많습니다 (${adviceCount}개, 최대 2개). 나머지는 진단·관찰·장면으로 닫아주세요.`,
    });
  }

  // Chapter-level keyword counts (§9-3)
  const fullText = ch.paragraphs.map((p) => `${p.lead} ${p.body}`).join(" ");
  const gyolCount = countMatches(fullText, /결이|결을|결에|결의|결로|결입니다|결이에요|결인/g);
  if (gyolCount > 3) {
    issues.push({
      code: "gyol_overuse",
      message: `§9-3 "결" 사용이 과합니다: ${gyolCount}회 (한도 3회). 성격·기질·방식·패턴 등으로 대체.`,
    });
  }

  // Chapter-level "자리" meta usage (§9-3)
  const metaJari = countMatches(
    fullText,
    /(차트의|그|가장 깊은|이런|그런|이) 자리/g
  );
  if (metaJari > 3) {
    issues.push({
      code: "jari_overuse",
      message: `§9-3 메타 "자리" 표현이 과합니다: ${metaJari}회 (한도 3회).`,
    });
  }

  // Chapter-level astro term count (§6-1 / §9-3: 4~8회 권장)
  const astroCount = countAstroTerms(fullText);
  if (astroCount > 12) {
    issues.push({
      code: "astro_term_overuse",
      message: `§6-1 점성술 용어 인용이 너무 많습니다: ${astroCount}회 (한도 12회). 풀이 흐름이 강의로 빠졌는지 확인해주세요.`,
    });
  }
  if (astroCount < 2) {
    issues.push({
      code: "astro_term_underuse",
      message: `§0a #2 차트 시그니처 풀이가 부족합니다: 점성술 용어 ${astroCount}회 (최소 2회 — 사주 풀이가 명리 용어를 쓰듯이 별자리·궁·도수를 자유롭게 인용해 풀이로 연결해주세요).`,
    });
  }

  // Total chapter length (§9-5)
  const totalLen = fullText.length;
  const minTotal = spec.special === "synergy" ? 1800 : 1400;
  const maxTotal = spec.special === "synergy" ? 2400 : 2000;
  if (totalLen < minTotal) {
    issues.push({
      code: "chapter_too_short",
      message: `§9-5 챕터 총 글자 수가 너무 짧습니다: ${totalLen}자 (기대 ${minTotal}~${maxTotal}).`,
    });
  } else if (totalLen > maxTotal) {
    issues.push({
      code: "chapter_too_long",
      message: `§9-5 챕터 총 글자 수가 너무 깁니다: ${totalLen}자 (기대 ${minTotal}~${maxTotal}).`,
    });
  }

  return { ok: issues.length === 0, issues };
}

/* ────────────────────────────────────────────────────────────────────────── */

function validateParagraph(p: ChapterParagraph, idx: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const at = (field: "lead" | "body") => ({ paragraph: idx, field });

  // —— lead —————————————————————————————————————————————————————————
  const lead = (p.lead ?? "").trim();
  const leadLen = visibleLength(lead);

  if (leadLen < LEAD_MIN || leadLen > LEAD_MAX) {
    issues.push({
      code: "lead_length",
      message: `단락 ${idx} lead 길이 ${leadLen}자 (기대 ${LEAD_MIN}~${LEAD_MAX}자).`,
      at: at("lead"),
    });
  }

  const periodCount = (lead.match(/[.!?。]/g) ?? []).length;
  if (periodCount !== 1) {
    issues.push({
      code: "lead_sentence_count",
      message: `단락 ${idx} lead 마침표가 ${periodCount}개입니다. 정확히 1문장이어야 합니다.`,
      at: at("lead"),
    });
  }

  const commaCount = (lead.match(/,|，/g) ?? []).length;
  if (commaCount > 1) {
    issues.push({
      code: "lead_too_many_commas",
      message: `단락 ${idx} lead 콤마 ${commaCount}개. §5-3 한 문장에 콤마 0~1개만 허용.`,
      at: at("lead"),
    });
  }

  for (const { regex, reason } of FORBIDDEN_LEAD_PATTERNS) {
    if (regex.test(lead)) {
      issues.push({
        code: "lead_forbidden_pattern",
        message: `단락 ${idx} lead에 금지 패턴: ${reason}.`,
        at: at("lead"),
      });
    }
  }

  // —— body —————————————————————————————————————————————————————————
  const body = (p.body ?? "").trim();
  const bodyLen = visibleLength(body);
  if (bodyLen < BODY_MIN || bodyLen > BODY_MAX) {
    issues.push({
      code: "body_length",
      message: `단락 ${idx} body 길이 ${bodyLen}자 (기대 ${BODY_MIN}~${BODY_MAX}자).`,
      at: at("body"),
    });
  }

  const sentences = splitSentences(body);
  if (sentences.length < PARA_BODY_SENTENCES_MIN || sentences.length > PARA_BODY_SENTENCES_MAX) {
    issues.push({
      code: "body_sentence_count",
      message: `단락 ${idx} body 문장 수 ${sentences.length} (기대 ${PARA_BODY_SENTENCES_MIN}~${PARA_BODY_SENTENCES_MAX}).`,
      at: at("body"),
    });
  }

  for (let s = 0; s < sentences.length; s++) {
    const len = visibleLength(sentences[s]);
    if (len < SENTENCE_MIN || len > SENTENCE_MAX) {
      issues.push({
        code: "sentence_length",
        message: `단락 ${idx} body 문장 ${s + 1} 길이 ${len}자 (기대 ${SENTENCE_MIN}~${SENTENCE_MAX}).`,
        at: at("body"),
      });
      break; // one issue per body
    }
  }

  // §6-1 per-paragraph astro count (단락당 1~3회 자연스러우면 OK)
  const paraText = `${lead} ${body}`;
  const paraAstro = countAstroTerms(paraText);
  if (paraAstro > 4) {
    issues.push({
      code: "para_astro_term_overuse",
      message: `단락 ${idx}: 점성술 용어 ${paraAstro}회 (단락당 최대 4회). 같은 용어가 한 단락에서 너무 자주 등장하면 강의로 보입니다.`,
      at: at("body"),
    });
  }

  // §6-2 zodiac labelling pattern, e.g. "외면(염소)·머리(쌍둥이)·본능(게)"
  const labelMatches = paraText.match(/\([^)]*(?:염소|쌍둥이|게|양|황소|사자|처녀|천칭|전갈|사수|물병|물고기)[^)]*\)/g) ?? [];
  if (labelMatches.length >= 2) {
    issues.push({
      code: "zodiac_label_listing",
      message: `단락 ${idx}: 별자리 라벨링 나열(${labelMatches.length}회) 발견. §6-2 전면 금지.`,
      at: at("body"),
    });
  }

  // §6-7 meta announcement
  for (const { regex, reason } of META_ANNOUNCEMENT_PATTERNS) {
    if (regex.test(paraText)) {
      issues.push({
        code: "meta_announcement",
        message: `단락 ${idx}: ${reason}.`,
        at: at("body"),
      });
    }
  }

  // §0a body patterns — astrology lecture / poetic prose
  for (const { regex, reason } of FORBIDDEN_BODY_PATTERNS) {
    if (regex.test(paraText)) {
      issues.push({
        code: "body_forbidden_pattern",
        message: `단락 ${idx}: ${reason}.`,
        at: at("body"),
      });
    }
  }

  // §0a #3 — at least one direct-quote evaluation per paragraph (heuristic).
  // We accept a paragraph as having a "들어봤을 평가" if it contains a
  // single-quoted Korean fragment of length >= 3.
  const quotedFragments = paraText.match(/['‘"][^'’"]{3,40}['’"]/g) ?? [];
  if (quotedFragments.length === 0) {
    issues.push({
      code: "missing_overheard_quote",
      message: `단락 ${idx}: 들어봤을 평가 인용이 없습니다 (§0a #3). 그 사람이 진짜 들어봤을 한마디를 작은따옴표로 박아주세요.`,
      at: at("body"),
    });
  }

  // §4-1 -입니다 streak (3+ consecutive)
  const ipnidaStreak = sentences.reduce(
    (acc, s) => {
      const ends = /입니다\.?$|습니다\.?$/.test(s.trim());
      if (ends) {
        acc.cur++;
        acc.max = Math.max(acc.max, acc.cur);
      } else {
        acc.cur = 0;
      }
      return acc;
    },
    { cur: 0, max: 0 }
  ).max;
  if (ipnidaStreak >= 3) {
    issues.push({
      code: "ipnida_streak",
      message: `단락 ${idx}: '-입니다' 종결이 ${ipnidaStreak}회 연속. §4-1 위반.`,
      at: at("body"),
    });
  }

  return issues;
}

/* ────────────────────────────────────────────────────────────────────────── */

export function paragraphEndsWithAdvice(p: ChapterParagraph): boolean {
  const sentences = splitSentences(p.body);
  if (sentences.length === 0) return false;
  const last = sentences[sentences.length - 1].trim();
  return ADVICE_ENDING_PATTERNS.some((re) => re.test(last));
}

/** Visible character count — strips zero-width / leading-trailing whitespace */
function visibleLength(s: string): number {
  return s.replace(/\s+/g, " ").trim().length;
}

function splitSentences(s: string): string[] {
  // Split on . ! ? 。 followed by space or end. Keeps quoted fragments
  // ("그런데 ‘힘들다’ 라고 답합니다.") intact.
  return s
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。])\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function countMatches(s: string, re: RegExp): number {
  return (s.match(re) ?? []).length;
}

function countAstroTerms(s: string): number {
  let n = 0;
  for (const z of ZODIAC) n += countMatches(s, new RegExp(z, "g"));
  // Planet + degree pattern, e.g. "태양 19도", "달 2도"
  for (const p of PLANETS) {
    n += countMatches(s, new RegExp(`${p}\\s*\\d+도`, "g"));
  }
  for (const h of HOUSE_NAMES) n += countMatches(s, new RegExp(h, "g"));
  for (const m of ASTRO_META) n += countMatches(s, new RegExp(m, "g"));
  return n;
}

/* ────────────────────────────────────────────────────────────────────────── */

/** Render a list of issues as a feedback block for the next attempt. */
export function formatIssuesForRetry(issues: ValidationIssue[]): string {
  return issues.map((i, idx) => `${idx + 1}. [${i.code}] ${i.message}`).join("\n");
}
