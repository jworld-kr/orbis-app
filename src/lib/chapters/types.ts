/**
 * Shared type definitions for a single report chapter.
 * Each chapter is structured so the same template can render any chapter,
 * and an AI can produce data in this shape for a real chart.
 */

export type ChapterCoordinate = {
  label: string; // e.g. "첫인상의 가면"
  value: string; // e.g. "염소자리"
  note?: string; // short explainer
};

/** Symbol + sign + degrees row (used for the planets list) */
export type CoordinateRow = {
  symbol: string; // ☉ ☽ ☿ ♀ ♂ ♃ ♄
  name: string; // 영문/한글 이름
  ko: string; // 한글 짧은 라벨
  position: string; // "게자리 8° 13'"
  meaning: string; // "사고·소통"
};

/** Big Three card (Rising / Sun / Moon) */
export type BigThreeCard = {
  kind: "rising" | "sun" | "moon";
  enLabel: string; // "RISING"
  koLabel: string; // "상승궁"
  sign: string; // "염소자리"
  degree: string; // "12° 22'"
  role: string; // "첫인상의 가면"
  note: string; // "흔들림 없는 외면"
};

export type CoordinatesPanel = {
  bigThree: BigThreeCard[];
  planets: CoordinateRow[];
  keySignature?: {
    title: string; // "게자리 7궁 스텔리움"
    body: string; // "달·수성·금성이 '관계의 자리'에 모인 ..."
  };
};

export type ChapterParagraph = {
  /** bold leading sentence shown larger / brighter */
  lead: string;
  /** body text (markdown allowed; we render plain) */
  body: string;
  /** prescription / one-line takeaway shown beneath the body */
  takeaway?: string;
};

export type ChapterPair = {
  title: string; // e.g. "염소 × 쌍둥이 — 빠른 머리 위에 얹힌 무거운 추"
  body: string;
};

export type Chapter = {
  no: number; // 1..12
  romanNo: string; // "I" .. "XII"
  title: string; // e.g. "핵심 좌표"
  en: string; // e.g. "The Core Coordinate"
  /** Optional per-chapter coordinates panel.
   *  In the new structure the coordinates panel lives at the top of the
   *  whole report once; individual chapters typically don't repeat it. */
  coordinatesPanel?: CoordinatesPanel;
  /** numbered narrative paragraphs */
  paragraphs: ChapterParagraph[];
  /** "세 결이 만났을 때" — synergy block (optional, mainly for chapter 1) */
  synergy?: {
    intro: string;
    pairs: ChapterPair[];
    summary: string;
    summaryTakeaway?: string;
  };
  /** Optional. Only Chapter XII (당신을 위한 처방) uses this. */
  prescription?: {
    intro: string;
    items: { title: string; body: string }[];
    closing: string;
  };
  /** Optional. Only Chapter XII closes with a single-sentence summary. */
  oneLine?: string;
};
