import { NextResponse } from "next/server";
import SwissEph from "swisseph-wasm";
import tzLookup from "tz-lookup";
import { DateTime } from "luxon";
import { createHash } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  computeAspects,
  houseOfLongitude,
  findStelliums,
  classifyChartShape,
  type PlanetPosition,
  type HouseCusp,
} from "@/lib/astrology/aspects";

// Force Node.js runtime — swisseph-wasm needs Node, not edge.
export const runtime = "nodejs";

/** Stable hash of (date, time, lat, lon, tz) — same input → same chart_id. */
function chartFingerprint(
  year: number, month: number, day: number,
  hour: number, minute: number,
  latitude: number, longitude: number, timezone: string,
) {
  const key = [
    year, month, day, hour, minute,
    latitude.toFixed(4), longitude.toFixed(4), timezone,
  ].join("|");
  return createHash("sha256").update(key).digest("hex").slice(0, 32);
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const ZODIAC_KO = [
  "양자리", "황소자리", "쌍둥이자리", "게자리",
  "사자자리", "처녀자리", "천칭자리", "전갈자리",
  "사수자리", "염소자리", "물병자리", "물고기자리",
];

function toZodiac(longitude: number) {
  const norm = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(norm / 30);
  const degInSign = norm - signIndex * 30;
  const deg = Math.floor(degInSign);
  const min = Math.floor((degInSign - deg) * 60);
  return {
    sign: ZODIAC_KO[signIndex],
    signIndex,
    degree: deg,
    minute: min,
    longitude: norm,
    label: `${ZODIAC_KO[signIndex]} ${deg}° ${String(min).padStart(2, "0")}'`,
  };
}

type Body = {
  // local birth date/time as the user typed it
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  // place lookup — accept either a free-text address OR explicit coords
  place?: string;
  latitude?: number;
  longitude?: number;
  // optional timezone override; otherwise inferred from coords
  timezone?: string;
  // subject of the chart (defaults to current user's display name)
  name?: string;
};

/** Resolve `place` to lat/lon/timezone via Mapbox.
 *  Returns either a successful result or a structured failure with reason. */
async function resolvePlace(place: string): Promise<
  | {
      ok: true;
      placeName: string;
      latitude: number;
      longitude: number;
      timezone: string;
    }
  | { ok: false; reason: string; status?: number; body?: unknown }
> {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    return { ok: false, reason: "MAPBOX_TOKEN not set on server" };
  }
  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    place
  )}.json?access_token=${token}&limit=1&language=ko`;

  let r: Response;
  try {
    r = await fetch(endpoint, { cache: "no-store" });
  } catch (e) {
    return {
      ok: false,
      reason: `fetch failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  if (!r.ok) {
    let body: unknown;
    try {
      body = await r.json();
    } catch {
      body = await r.text().catch(() => null);
    }
    return {
      ok: false,
      reason: `mapbox http ${r.status}`,
      status: r.status,
      body,
    };
  }

  const data = (await r.json()) as {
    features?: Array<{ place_name: string; center: [number, number] }>;
  };
  const feature = data.features?.[0];
  if (!feature) {
    return {
      ok: false,
      reason: "no geocoding match for query",
    };
  }
  const [longitude, latitude] = feature.center;
  let timezone = "UTC";
  try {
    timezone = tzLookup(latitude, longitude);
  } catch {
    /* fall back to UTC */
  }
  return {
    ok: true,
    placeName: feature.place_name,
    latitude,
    longitude,
    timezone,
  };
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  POST /api/chart                                                           */
/*    Body: {                                                                 */
/*      year, month, day, hour, minute,                                       */
/*      place?: string,            (preferred — auto-geocoded)                */
/*      latitude?, longitude?,     (or pass coords directly)                  */
/*      timezone?: string          (IANA tz; otherwise inferred)              */
/*    }                                                                       */
/*    Returns: { input, planets, houses, axes }                               */
/* ────────────────────────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  // Auth gate — must be signed in to compute & persist a chart.
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "auth_required" },
      { status: 401 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "invalid json body" },
      { status: 400 }
    );
  }

  const { year, month, day, hour, minute } = body;
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return NextResponse.json(
      { error: "year/month/day/hour/minute are required numbers" },
      { status: 400 }
    );
  }

  // Resolve place → coords + timezone
  let latitude: number;
  let longitude: number;
  let timezone: string;
  let placeName: string | undefined;

  if (body.place && body.place.trim().length > 0) {
    const geo = await resolvePlace(body.place.trim());
    if (!geo.ok) {
      return NextResponse.json(
        {
          error: "could not geocode 'place'",
          reason: geo.reason,
          status: geo.status,
          body: geo.body,
        },
        { status: 400 }
      );
    }
    latitude = geo.latitude;
    longitude = geo.longitude;
    timezone = body.timezone ?? geo.timezone;
    placeName = geo.placeName;
  } else if (
    Number.isFinite(body.latitude) &&
    Number.isFinite(body.longitude)
  ) {
    latitude = body.latitude as number;
    longitude = body.longitude as number;
    try {
      timezone = body.timezone ?? tzLookup(latitude, longitude);
    } catch {
      timezone = body.timezone ?? "UTC";
    }
  } else {
    // last-resort default — Seoul
    latitude = 37.5665;
    longitude = 126.978;
    timezone = body.timezone ?? "Asia/Seoul";
  }

  // Convert local birth time → UTC using the resolved timezone.
  // Luxon handles DST, historical offsets, and edge cases correctly.
  const local = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: timezone }
  );
  if (!local.isValid) {
    return NextResponse.json(
      {
        error: "invalid local time",
        detail: local.invalidReason,
      },
      { status: 400 }
    );
  }
  const utc = local.toUTC();
  const uYear = utc.year;
  const uMonth = utc.month;
  const uDay = utc.day;
  const uHour = utc.hour + utc.minute / 60 + utc.second / 3600;
  const tzOffsetHours = local.offset / 60; // local minus UTC, in hours

  const swe = new SwissEph();
  await swe.initSwissEph();

  try {
    // Julian Day (UT)
    const jd = swe.julday(uYear, uMonth, uDay, uHour);

    // Planet positions (longitude + speed for retrograde detection)
    const planetIds = [
      { id: swe.SE_SUN, name: "태양", sym: "☉" },
      { id: swe.SE_MOON, name: "달", sym: "☽" },
      { id: swe.SE_MERCURY, name: "수성", sym: "☿" },
      { id: swe.SE_VENUS, name: "금성", sym: "♀" },
      { id: swe.SE_MARS, name: "화성", sym: "♂" },
      { id: swe.SE_JUPITER, name: "목성", sym: "♃" },
      { id: swe.SE_SATURN, name: "토성", sym: "♄" },
    ];

    const readCalc = (r: unknown): { lon: number; speed: number } => {
      if (Array.isArray(r) || r instanceof Float64Array) {
        const arr = r as ArrayLike<number>;
        return { lon: arr[0], speed: arr[3] ?? 0 };
      }
      if (r && typeof r === "object") {
        const o = r as { longitude?: number; longitudeSpeed?: number };
        return { lon: o.longitude ?? 0, speed: o.longitudeSpeed ?? 0 };
      }
      return { lon: 0, speed: 0 };
    };

    const planets = planetIds.map((p) => {
      const r = swe.calc_ut(jd, p.id, swe.SEFLG_SWIEPH) as unknown;
      const { lon, speed } = readCalc(r);
      const z = toZodiac(lon);
      return {
        symbol: p.sym,
        name: p.name,
        longitude: z.longitude,
        sign: z.sign,
        degree: z.degree,
        minute: z.minute,
        label: z.label,
        speed,
        retrograde: speed < 0,
      };
    });

    // North Lunar Node — required for §5 매핑 (재능과 사명)
    const nodeId =
      (swe as unknown as { SE_TRUE_NODE?: number; SE_MEAN_NODE?: number })
        .SE_TRUE_NODE ??
      (swe as unknown as { SE_MEAN_NODE?: number }).SE_MEAN_NODE ??
      11;
    let northNode: ReturnType<typeof toZodiac> & { longitude: number } = {
      sign: "—", signIndex: -1, degree: 0, minute: 0,
      longitude: 0, label: "—",
    } as never;
    let southNodeLon = 0;
    try {
      const nr = swe.calc_ut(jd, nodeId, swe.SEFLG_SWIEPH) as unknown;
      const { lon: nlon } = readCalc(nr);
      northNode = toZodiac(nlon);
      southNodeLon = (nlon + 180) % 360;
    } catch {
      // some swisseph builds don't expose nodes; tolerate gracefully
    }
    const southNode = toZodiac(southNodeLon);

    // Houses (Placidus = 'P')
    const housesRaw = swe.houses(jd, latitude, longitude, "P") as unknown as {
      cusps: ArrayLike<number>;
      ascmc: ArrayLike<number>;
    };
    const cusps: number[] = [];
    for (let i = 1; i <= 12; i++) cusps.push(housesRaw.cusps[i]);
    const asc = housesRaw.ascmc[0];
    const mc = housesRaw.ascmc[1];

    const ascZ = toZodiac(asc);
    const mcZ = toZodiac(mc);

    const houses = cusps.map((c, i) => {
      const z = toZodiac(c);
      return {
        index: i + 1,
        cusp: z.longitude,
        sign: z.sign,
        label: z.label,
      };
    });

    swe.close?.();

    // ── Derived astrology data — aspects, house placement, stelliums, shape
    const housesForCalc: HouseCusp[] = houses.map((h) => ({
      index: h.index,
      cusp: h.cusp,
    }));

    const planetsForCalc: PlanetPosition[] = planets.map((p) => ({
      symbol: p.symbol,
      name: p.name,
      longitude: p.longitude,
      speed: p.speed,
    }));

    // Map planet name → house number
    const housePlacement: Record<string, number> = {};
    const planetsWithHouse = planets.map((p) => {
      const house = houseOfLongitude(p.longitude, housesForCalc);
      housePlacement[p.name] = house;
      return { ...p, house };
    });

    const ascHouse = 1; // by definition
    const mcHouse = houseOfLongitude(mc, housesForCalc);

    const aspects = computeAspects(planetsForCalc);
    const stelliums = findStelliums(planetsWithHouse, housePlacement);
    const chartShape = classifyChartShape(planets.map((p) => p.longitude));

    const chartJson = {
      input: {
        local: { year, month, day, hour, minute },
        timezone,
        tzOffsetHours,
        utc: { year: uYear, month: uMonth, day: uDay, hour: uHour },
        coordinates: { latitude, longitude },
        placeName,
        julianDay: jd,
      },
      planets: planetsWithHouse,
      houses,
      axes: {
        ascendant: { ...ascZ, house: ascHouse },
        midheaven: { ...mcZ, house: mcHouse },
      },
      nodes: {
        north: { ...northNode },
        south: { ...southNode },
      },
      aspects,
      stelliums,
      chartShape,
    };

    // Persist chart + create empty report row (idempotent on chart fingerprint).
    const admin = createSupabaseAdminClient();
    const fp = chartFingerprint(
      year, month, day, hour, minute,
      latitude, longitude, timezone,
    );
    const subjectName =
      (body.name ?? "").trim() ||
      (user.user_metadata?.full_name as string | undefined) ||
      (user.email ? user.email.split("@")[0] : "사용자");

    // Upsert chart by (user_id, fingerprint) → idempotent.
    const { data: chartRow, error: chartErr } = await admin
      .from("charts")
      .upsert(
        {
          user_id: user.id,
          name: subjectName,
          birth_date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          birth_time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
          birth_place: body.place ?? placeName ?? "",
          latitude,
          longitude,
          timezone,
          fingerprint: fp,
          chart_json: chartJson,
        },
        { onConflict: "user_id,fingerprint" },
      )
      .select("id")
      .single();
    if (chartErr || !chartRow) {
      return NextResponse.json(
        {
          error: "chart_save_failed",
          detail: chartErr?.message ?? "unknown",
        },
        { status: 500 }
      );
    }

    // Ensure a single reports row exists for this chart (chart_id is unique).
    const { data: reportRow, error: reportErr } = await admin
      .from("reports")
      .upsert(
        {
          user_id: user.id,
          chart_id: chartRow.id,
          status: "preview_pending",
        },
        { onConflict: "chart_id" },
      )
      .select("id, status")
      .single();
    if (reportErr || !reportRow) {
      return NextResponse.json(
        {
          error: "report_init_failed",
          detail: reportErr?.message ?? "unknown",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...chartJson,
      chartId: chartRow.id,
      reportId: reportRow.id,
      reportStatus: reportRow.status,
    });
  } catch (err) {
    swe.close?.();
    return NextResponse.json(
      {
        error: "chart calculation failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
