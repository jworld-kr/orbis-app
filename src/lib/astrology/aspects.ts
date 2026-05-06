/**
 * Astrology derivations from raw planet longitudes.
 *
 * swisseph-wasm gives us only longitude + speed for each planet. The
 * actual interpretive meat — aspects, retrograde flags, which house
 * a planet falls into, stellium detection — has to be computed on top
 * of those numbers. This file does that.
 */

export type PlanetPosition = {
  symbol: string;
  name: string;       // 한글
  longitude: number;  // 0~360
  speed?: number;     // deg/day; negative → retrograde
};

export type HouseCusp = {
  index: number;      // 1..12
  cusp: number;       // 0~360
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Aspects                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export type AspectKind =
  | "conjunction"
  | "sextile"
  | "square"
  | "trine"
  | "opposition";

export type Aspect = {
  a: string;            // planet name (한글)
  b: string;            // planet name (한글)
  kind: AspectKind;
  exactAngle: number;   // the canonical angle for this aspect
  actualAngle: number;  // the measured angle, 0..180
  orb: number;          // |actualAngle - exactAngle|, deg
  applying: boolean;    // true → orb is closing; false → separating
  label: string;        // "태양 ☌ 수성 (orb 1.4°)"
};

/** Maximum allowed orb per aspect (degrees). Tighter than max so we only
 *  surface meaningful aspects. */
const ASPECT_DEFS: Array<{ kind: AspectKind; angle: number; maxOrb: number; symbol: string }> = [
  { kind: "conjunction", angle: 0,   maxOrb: 8, symbol: "☌" },
  { kind: "sextile",     angle: 60,  maxOrb: 4, symbol: "✶" },
  { kind: "square",      angle: 90,  maxOrb: 6, symbol: "□" },
  { kind: "trine",       angle: 120, maxOrb: 6, symbol: "△" },
  { kind: "opposition",  angle: 180, maxOrb: 8, symbol: "☍" },
];

const ASPECT_KO: Record<AspectKind, string> = {
  conjunction: "합",
  sextile: "육합",
  square: "충",
  trine: "삼합",
  opposition: "대립",
};

/** Smallest angular separation between two longitudes (0..180). */
function angularDistance(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

export function computeAspects(planets: PlanetPosition[]): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      const dist = angularDistance(a.longitude, b.longitude);
      // Find the tightest matching aspect within orb.
      let best: { def: typeof ASPECT_DEFS[number]; orb: number } | null = null;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(dist - def.angle);
        if (orb <= def.maxOrb) {
          if (!best || orb < best.orb) best = { def, orb };
        }
      }
      if (!best) continue;
      const applying = isApplying(a, b, dist, best.def.angle);
      const symKo = ASPECT_KO[best.def.kind];
      out.push({
        a: a.name,
        b: b.name,
        kind: best.def.kind,
        exactAngle: best.def.angle,
        actualAngle: dist,
        orb: best.orb,
        applying,
        label: `${a.name} ${best.def.symbol} ${b.name} (${symKo}, orb ${best.orb.toFixed(1)}°${applying ? ", 접근" : ", 분리"})`,
      });
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

function isApplying(
  a: PlanetPosition,
  b: PlanetPosition,
  currentDist: number,
  targetAngle: number,
): boolean {
  const sa = a.speed ?? 0;
  const sb = b.speed ?? 0;
  // Predict what dist would be one day later. If it moves toward target → applying.
  const futureA = a.longitude + sa;
  const futureB = b.longitude + sb;
  const futureDist = angularDistance(futureA, futureB);
  return Math.abs(futureDist - targetAngle) < Math.abs(currentDist - targetAngle);
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  House placement                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

/** Returns 1..12 — which house a longitude falls into, given 12 cusps. */
export function houseOfLongitude(
  longitude: number,
  houses: HouseCusp[],
): number {
  const cusps = [...houses].sort((a, b) => a.index - b.index);
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

/* ────────────────────────────────────────────────────────────────────────── */
/*  Stellium detection                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export type Stellium = {
  /** "sign" | "house" — what they share. */
  kind: "sign" | "house";
  /** 별자리 한글 이름 또는 1..12 */
  key: string;
  planets: string[];   // 한글
};

/** A stellium = 3+ planets clustered in one sign or house. */
export function findStelliums(
  planets: Array<{ name: string; sign: string; longitude: number }>,
  housePlacement: Record<string, number>,
): Stellium[] {
  const out: Stellium[] = [];

  // by sign
  const bySign = new Map<string, string[]>();
  for (const p of planets) {
    const arr = bySign.get(p.sign) ?? [];
    arr.push(p.name);
    bySign.set(p.sign, arr);
  }
  for (const [sign, names] of bySign) {
    if (names.length >= 3) out.push({ kind: "sign", key: sign, planets: names });
  }

  // by house
  const byHouse = new Map<number, string[]>();
  for (const p of planets) {
    const h = housePlacement[p.name];
    if (!h) continue;
    const arr = byHouse.get(h) ?? [];
    arr.push(p.name);
    byHouse.set(h, arr);
  }
  for (const [house, names] of byHouse) {
    if (names.length >= 3) out.push({ kind: "house", key: String(house), planets: names });
  }

  return out;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Chart shape (Marc Edmund Jones)                                           */
/* ────────────────────────────────────────────────────────────────────────── */

export type ChartShape =
  | "splash"
  | "bowl"
  | "bucket"
  | "locomotive"
  | "bundle"
  | "seesaw"
  | "splay";

/** Rough chart-shape classifier. Inputs are 7 planet longitudes. */
export function classifyChartShape(longitudes: number[]): ChartShape {
  const sorted = [...longitudes].sort((a, b) => a - b);
  const n = sorted.length;

  // Largest gap between consecutive planets (with wrap)
  let maxGap = 0;
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const gap = ((sorted[next] - sorted[i]) % 360 + 360) % 360;
    if (gap > maxGap) maxGap = gap;
  }
  // Span occupied = 360 - maxGap
  const span = 360 - maxGap;

  if (span <= 120) return "bundle";
  if (span <= 180) return "bowl";
  if (span <= 240) return "locomotive";
  // splash if planets are spread fairly evenly across the wheel
  // splay if there are 2-3 clusters
  // crude proxy: if no gap > 60°, splash; otherwise splay/seesaw.
  if (maxGap < 60) return "splash";
  return "splay";
}

/* ────────────────────────────────────────────────────────────────────────── */
