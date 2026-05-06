import Anthropic from "@anthropic-ai/sdk";
import type { Chapter } from "./types";
import type { ChapterSpec } from "./chapterMap";
import { buildChapterPrompt, type PromptInputs } from "./prompt";
import { validateChapter, formatIssuesForRetry } from "./validate";

/**
 * Anthropic-backed single-chapter generator.
 *
 *   1. Build system + user prompt (가이드 + 차트 슬라이스 + 이전 챕터 lead).
 *   2. Call Claude.
 *   3. Parse JSON out of the response.
 *   4. Validate against §5/§6/§9.
 *   5. If invalid, retry once with the issue list as feedback.
 *
 * Throws on hard failure (no JSON, second attempt still invalid). The
 * caller (generate.ts) decides whether to fall back to mock or surface
 * the error.
 */

const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;
const TEMPERATURE = 0.6;

export type GenerateChapterArgs = PromptInputs & {
  /** Optional model override. Defaults to claude-sonnet-4-6. */
  model?: string;
  /** Maximum retries on validation failure. Defaults to 1. */
  maxRetries?: number;
};

export type GenerateChapterResult = {
  chapter: Chapter;
  /** Issues found on the *final* accepted output. Should be empty. */
  issues: ReturnType<typeof validateChapter>["issues"];
  /** How many attempts were made (1-indexed). */
  attempts: number;
  model: string;
};

export async function generateChapterViaAnthropic(
  args: GenerateChapterArgs,
): Promise<GenerateChapterResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });
  const model = args.model ?? DEFAULT_MODEL;
  const maxRetries = args.maxRetries ?? 1;

  let attempt = 0;
  let lastFeedback: string | undefined;
  let lastIssues: ReturnType<typeof validateChapter>["issues"] = [];
  let lastChapter: Chapter | null = null;

  while (attempt <= maxRetries) {
    attempt++;
    const prompt = await buildChapterPrompt({
      ...args,
      retryFeedback: lastFeedback,
    });

    const res = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });

    const text = extractText(res);
    const parsed = parseChapterJSON(text);
    if (!parsed) {
      throw new Error("anthropic_response_not_json");
    }

    const chapter: Chapter = assembleChapter(parsed, args.spec);
    const validation = validateChapter(chapter, args.spec);
    lastChapter = chapter;
    lastIssues = validation.issues;

    if (validation.ok) {
      return { chapter, issues: [], attempts: attempt, model };
    }

    lastFeedback = formatIssuesForRetry(validation.issues);
  }

  // Out of retries — return whatever we have, with the issues attached so
  // the caller can decide what to do (log + accept, or fail).
  if (!lastChapter) throw new Error("anthropic_failed_to_produce_chapter");
  return {
    chapter: lastChapter,
    issues: lastIssues,
    attempts: attempt,
    model,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */

function extractText(
  res: Anthropic.Messages.Message,
): string {
  // Claude responses are an array of content blocks; pick the text ones.
  return res.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function parseChapterJSON(text: string): Record<string, unknown> | null {
  // Try a fenced ```json ... ``` block first.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate.trim());
  } catch {
    // Fallback: pull the largest {...} substring we can find.
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function assembleChapter(
  parsed: Record<string, unknown>,
  spec: ChapterSpec,
): Chapter {
  const base: Chapter = {
    no: spec.no,
    romanNo: spec.romanNo,
    title: spec.title,
    en: ROMAN_EN[spec.romanNo] ?? spec.title,
    paragraphs: Array.isArray(parsed.paragraphs)
      ? (parsed.paragraphs as Array<{ lead: string; body: string }>)
      : [],
  };

  if (spec.special === "synergy" && parsed.synergy) {
    base.synergy = parsed.synergy as Chapter["synergy"];
  }
  if (spec.special === "prescription" && parsed.prescription) {
    base.prescription = parsed.prescription as Chapter["prescription"];
  }
  if (typeof parsed.oneLine === "string") {
    base.oneLine = parsed.oneLine;
  }
  return base;
}

const ROMAN_EN: Record<string, string> = {
  I: "The Core Coordinate",
  II: "Three Selves",
  III: "How Emotion Works",
  IV: "When You Love",
  V: "How You Speak",
  VI: "When You Work",
  VII: "Money",
  VIII: "Shadow",
  IX: "Talents & Calling",
  X: "This Season",
  XI: "Next Six Months",
  XII: "Your Prescription",
};
