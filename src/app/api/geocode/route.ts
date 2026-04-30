import { NextResponse } from "next/server";
import tzLookup from "tz-lookup";

export const runtime = "nodejs";

/**
 * GET /api/geocode?q=<address>&limit=5&lang=ko
 *
 * Resolves a free-text address into one or more candidate locations using
 * Mapbox's Geocoding API. Each result includes:
 *  - place_name        full address string ("서울특별시 용산구 …")
 *  - latitude          decimal degrees
 *  - longitude         decimal degrees
 *  - timezone          IANA timezone (e.g. "Asia/Seoul"), derived from coords
 *
 * Mapbox token is read from MAPBOX_TOKEN env var. The handler never returns
 * the token to the client.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.max(
    1,
    Math.min(10, Number(url.searchParams.get("limit") ?? 5) || 5)
  );
  const lang = url.searchParams.get("lang") ?? "ko";

  if (!q) {
    return NextResponse.json(
      { error: "missing query (?q=...)" },
      { status: 400 }
    );
  }

  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "server misconfigured: MAPBOX_TOKEN not set" },
      { status: 500 }
    );
  }

  // Mapbox Geocoding v5 — encode the query, no commas in path
  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    q
  )}.json?access_token=${token}&limit=${limit}&language=${lang}`;

  const upstream = await fetch(endpoint, { cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: "geocoding failed",
        status: upstream.status,
      },
      { status: 502 }
    );
  }

  const data = (await upstream.json()) as {
    features?: Array<{
      id: string;
      place_name: string;
      place_type: string[];
      center: [number, number]; // [longitude, latitude]
      context?: Array<{ id: string; text: string }>;
    }>;
  };

  const features = data.features ?? [];

  const results = features.map((f) => {
    const [longitude, latitude] = f.center;
    let timezone = "UTC";
    try {
      timezone = tzLookup(latitude, longitude);
    } catch {
      // tz-lookup throws for some edge coords; fall back to UTC
    }
    return {
      id: f.id,
      placeName: f.place_name,
      placeType: f.place_type,
      latitude,
      longitude,
      timezone,
    };
  });

  return NextResponse.json({
    query: q,
    count: results.length,
    results,
  });
}
