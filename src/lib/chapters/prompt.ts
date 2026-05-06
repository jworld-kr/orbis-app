import { promises as fs } from "node:fs";
import path from "node:path";
import type { ChapterSpec } from "./chapterMap";
import type { ChartData } from "./generate";
import type { Chapter } from "./types";

/**
 * Builds the system prompt + user message for one chapter call.
 *
 * System prompt = the entire 챕터_생성_가이드.md (so persona, rules,
 * length budgets, and the JSON schema all come from one source).
 *
 * User message = subject identity + chart slice + the specific chapter
 * we're generating + its sub-items + a "previous lead lines" block so
 * the model can avoid §10 cross-chapter repetition.
 */

let cachedGuide: string | null = null;

async function loadGuide(): Promise<string> {
  if (cachedGuide) return cachedGuide;
  // The guide lives at <repo-root>/web/docs/챕터_생성_가이드.md.
  // process.cwd() is the Next app root in dev + Vercel runtime.
  const guidePath = path.join(process.cwd(), "docs", "챕터_생성_가이드.md");
  cachedGuide = await fs.readFile(guidePath, "utf8");
  return cachedGuide;
}

export type PromptInputs = {
  chartData: ChartData;
  subjectName: string;
  spec: ChapterSpec;
  /** Already-generated chapters in the same report (for §10 dedup). */
  priorChapters?: Chapter[];
  /** Optional model feedback from a previous failed attempt. */
  retryFeedback?: string;
};

export type BuiltPrompt = {
  system: string;
  user: string;
};

export async function buildChapterPrompt(
  inputs: PromptInputs,
): Promise<BuiltPrompt> {
  const guide = await loadGuide();
  return {
    system: guide,
    user: composeUserMessage(inputs),
  };
}

/* ────────────────────────────────────────────────────────────────────────── */

function composeUserMessage(inputs: PromptInputs): string {
  const { chartData, subjectName, spec, priorChapters, retryFeedback } = inputs;
  const lines: string[] = [];

  // 1. subject + chart
  lines.push("# 사용자 출생 차트");
  lines.push(`이름: ${subjectName}`);
  const local = chartData.input.local;
  lines.push(
    `출생: ${local.year}-${pad(local.month)}-${pad(local.day)} ` +
    `${pad(local.hour)}:${pad(local.minute)} (${chartData.input.timezone})`
  );
  if (chartData.input.placeName) {
    const c = chartData.input.coordinates;
    lines.push(
      `태어난 곳: ${chartData.input.placeName} (${c.latitude.toFixed(2)}°N, ${c.longitude.toFixed(2)}°E)`
    );
  }
  lines.push("");

  // 2. axes + planets
  lines.push("## 축");
  lines.push(`- ASC (상승궁): ${chartData.axes.ascendant.label}`);
  lines.push(`- MC (중천): ${chartData.axes.midheaven.label}`);
  lines.push("");

  lines.push("## 행성");
  for (const p of chartData.planets) {
    const house = p.house ?? houseOfLongitude(p.longitude, chartData.houses);
    const retro = p.retrograde ? " · 역행(R)" : "";
    lines.push(`- ${p.symbol} ${p.name}: ${p.label} (${house}궁)${retro}`);
  }
  lines.push("");

  // 3. nodes
  if (chartData.nodes && chartData.nodes.north.sign !== "—") {
    lines.push("## 달 노드 (인생 방향성)");
    lines.push(`- 북쪽 노드 (성장 방향): ${chartData.nodes.north.label}`);
    lines.push(`- 남쪽 노드 (익숙함, 떠나야 할 자리): ${chartData.nodes.south.label}`);
    lines.push("");
  }

  // 4. aspects — interpretive meat
  if (chartData.aspects && chartData.aspects.length > 0) {
    lines.push("## 행성 간 각도 (Aspects) — 해석에 가장 중요한 부분");
    lines.push("orb이 작을수록 강한 작용. '접근'은 영향이 강해지는 중,");
    lines.push("'분리'는 영향이 풀어지는 중을 의미합니다.");
    for (const a of chartData.aspects) {
      lines.push(`- ${a.label}`);
    }
    lines.push("");
  }

  // 5. stelliums
  if (chartData.stelliums && chartData.stelliums.length > 0) {
    lines.push("## 스텔리움 (한 자리에 3개 이상 모인 행성)");
    for (const s of chartData.stelliums) {
      const where = s.kind === "sign" ? `${s.key}` : `${s.key}궁`;
      lines.push(`- ${where}: ${s.planets.join(", ")}`);
    }
    lines.push("");
  }

  // 6. shape
  if (chartData.chartShape) {
    const shapeKo: Record<string, string> = {
      bundle: "번들 (좁은 범위에 집중)",
      bowl: "보울 (180° 이내 모임)",
      bucket: "버킷 (한 행성이 손잡이 역할)",
      locomotive: "로코모티브 (240° 이내, 강한 추진력)",
      splash: "스플래시 (12 사인에 골고루)",
      seesaw: "시소 (양쪽 두 그룹)",
      splay: "스플레이 (불규칙 분포)",
    };
    lines.push(`## 차트 모양: ${shapeKo[chartData.chartShape] ?? chartData.chartShape}`);
    lines.push("");
  }

  // 7. houses (cusps — for reference)
  lines.push("## 12 하우스 cusps (참고)");
  for (const h of chartData.houses) {
    lines.push(`- ${pad(h.index)}궁: ${h.label}`);
  }
  lines.push("");

  // 4. spotlight
  lines.push("## 이번 챕터에서 가장 중요하게 볼 부분");
  if (spec.emphasizePlanets.length > 0) {
    lines.push(`- 행성: ${spec.emphasizePlanets.join(", ")}`);
  }
  if (spec.emphasizeHouses.length > 0) {
    lines.push(`- 하우스: ${spec.emphasizeHouses.map((n) => `${n}궁`).join(", ")}`);
  }
  if (spec.emphasizeAxes && spec.emphasizeAxes.length > 0) {
    lines.push(`- 축: ${spec.emphasizeAxes.join(", ")}`);
  }
  lines.push("");

  // 5. chapter spec
  lines.push("# 작성할 챕터");
  lines.push(`Chapter ${spec.romanNo} — ${spec.title}`);
  if (spec.special === "synergy") {
    lines.push("(특수: 본문 5단락 + synergy 블록 포함)");
  } else if (spec.special === "prescription") {
    lines.push("(특수: prescription 4 items + closing + oneLine 구조)");
  } else {
    lines.push("(표준: 본문 4단락만)");
  }
  lines.push("");
  lines.push("세부 항목 (단락과 1:1 매칭, 순서 그대로):");
  spec.subItems.forEach((s, i) => lines.push(`  ${pad(i + 1)} ${s}`));
  lines.push("");

  // 6. prior chapters' lead lines (cross-chapter dedup)
  if (priorChapters && priorChapters.length > 0) {
    lines.push("# 이미 작성된 이전 챕터들의 lead 모음");
    lines.push(
      "(다음 lead들과 같은 인용구·장면·결론을 이번 챕터의 lead로 쓰지 마세요. " +
      "§10 챕터 간 중복 검수.)"
    );
    for (const ch of priorChapters) {
      lines.push(`\n[Chapter ${ch.romanNo} — ${ch.title}]`);
      ch.paragraphs.forEach((p, i) => {
        lines.push(`  ${pad(i + 1)} ${p.lead}`);
      });
    }
    lines.push("");
  }

  // 7. retry feedback (only on second attempt)
  if (retryFeedback) {
    lines.push("# 이전 시도에서 어긴 규칙");
    lines.push(
      "이전 응답이 다음 검수에 걸렸습니다. 동일한 챕터를 다시 작성하되 " +
      "이번엔 모든 규칙을 준수하세요."
    );
    lines.push("");
    lines.push(retryFeedback);
    lines.push("");
  }

  // 8. output instruction
  lines.push("# 출력");
  lines.push(
    "위 가이드의 §11 자가 검수를 통과시킨 후, §12 JSON 스키마에 맞춰 " +
    "**JSON만** 출력하세요. 설명·해설·markdown 외부 텍스트 일체 금지. " +
    "코드블록 ```json ... ``` 안에 넣어도 되고, 순수 JSON만 내도 됩니다."
  );

  return lines.join("\n");
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Find which house a longitude (0~360) falls into, given the 12 cusps. */
function houseOfLongitude(
  longitude: number,
  houses: ChartData["houses"],
): number {
  // houses[i].cusp is the start of house (i+1).
  // We sort by index to be safe and pick the largest cusp that is <= long
  // (with wrap-around at 360°).
  const cusps = [...houses].sort((a, b) => a.index - b.index);
  // Normalize to [cusp0, cusp1, ..., cusp11] in degrees.
  const norm = ((longitude % 360) + 360) % 360;
  for (let i = 0; i < 12; i++) {
    const cur = cusps[i].cusp;
    const nxt = cusps[(i + 1) % 12].cusp;
    if (cur < nxt) {
      if (norm >= cur && norm < nxt) return cusps[i].index;
    } else {
      // wraps past 360
      if (norm >= cur || norm < nxt) return cusps[i].index;
    }
  }
  return 1;
}
