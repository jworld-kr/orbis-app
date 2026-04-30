"use client";

import { useState } from "react";

type Result = {
  input: {
    local: {
      year: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
    };
    timezone: string;
    tzOffsetHours: number;
    utc: { year: number; month: number; day: number; hour: number };
    coordinates: { latitude: number; longitude: number };
    placeName?: string;
    julianDay: number;
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

export default function TestChartPage() {
  const [year, setYear] = useState("1995");
  const [month, setMonth] = useState("06");
  const [day, setDay] = useState("12");
  const [hour, setHour] = useState("14");
  const [minute, setMinute] = useState("32");
  const [place, setPlace] = useState("경기도 성남시 분당구 야탑로 59");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          year: Number(year),
          month: Number(month),
          day: Number(day),
          hour: Number(hour),
          minute: Number(minute),
          place,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "request failed");
      setResult(json as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-orbis-bg text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-kr text-2xl md:text-3xl font-medium tracking-tight mb-2">
          /api/chart 테스트
        </h1>
        <p className="font-kr text-white/55 text-sm mb-8">
          주소 → 위경도 → 시간대 → 출생 차트 좌표 (Mapbox + Swiss Ephemeris).
        </p>

        {/* form */}
        <section className="border border-white/10 rounded p-5 mb-8 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Field label="연" value={year} setValue={setYear} />
            <Field label="월" value={month} setValue={setMonth} />
            <Field label="일" value={day} setValue={setDay} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="시 (24h)" value={hour} setValue={setHour} />
            <Field label="분" value={minute} setValue={setMinute} />
          </div>
          <Field label="태어난 곳 (주소)" value={place} setValue={setPlace} />
          <button
            onClick={submit}
            disabled={loading}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2 border border-white/40 hover:border-white hover:bg-white hover:text-orbis-bg transition-all duration-300 ease-orbis disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="font-kr text-sm tracking-wide">
              {loading ? "계산 중…" : "차트 계산"}
            </span>
            <span>→</span>
          </button>
        </section>

        {error && (
          <section className="border border-red-500/40 bg-red-500/5 rounded p-4 mb-8">
            <div className="font-mono text-xs text-red-300/80 mb-1">ERROR</div>
            <div className="font-mono text-sm text-red-200">{error}</div>
          </section>
        )}

        {result && (
          <section className="space-y-6">
            {/* identity & input */}
            <Block title="입력 / 변환">
              {result.input.placeName && (
                <Row k="해석된 주소" v={result.input.placeName} />
              )}
              <Row
                k="좌표"
                v={`${result.input.coordinates.latitude.toFixed(4)}°N · ${result.input.coordinates.longitude.toFixed(4)}°E`}
              />
              <Row k="시간대" v={`${result.input.timezone} (UTC${result.input.tzOffsetHours >= 0 ? "+" : ""}${result.input.tzOffsetHours})`} />
              <Row
                k="UTC"
                v={`${result.input.utc.year}-${pad(result.input.utc.month)}-${pad(result.input.utc.day)} ${result.input.utc.hour.toFixed(4)} h`}
              />
              <Row k="Julian Day" v={result.input.julianDay.toFixed(6)} />
            </Block>

            {/* planets */}
            <Block title="행성 좌표">
              {result.planets.map((p) => (
                <Row key={p.name} k={`${p.symbol}  ${p.name}`} v={p.label} />
              ))}
            </Block>

            {/* axes */}
            <Block title="축">
              <Row k="상승궁 (ASC)" v={result.axes.ascendant.label} />
              <Row k="중천 (MC)" v={result.axes.midheaven.label} />
            </Block>

            {/* houses */}
            <Block title="12 하우스 (Placidus)">
              {result.houses.map((h) => (
                <Row
                  key={h.index}
                  k={`House ${String(h.index).padStart(2, "0")}`}
                  v={h.label}
                />
              ))}
            </Block>

            <details className="border border-white/10 rounded p-4">
              <summary className="cursor-pointer font-mono text-xs text-white/60 mb-2">
                raw json
              </summary>
              <pre className="text-[11px] leading-[1.6] overflow-x-auto font-mono text-white/70 mt-3">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </section>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  setValue,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono uppercase text-[10px] tracking-[0.18em] text-white/55">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="bg-transparent border-b border-white/30 focus:border-white outline-none px-1 py-1 font-mono text-sm"
      />
    </label>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 rounded">
      <div className="px-4 py-2 border-b border-white/10 font-mono uppercase text-[10px] tracking-[0.2em] text-white/55">
        {title}
      </div>
      <div className="p-4 space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 font-mono text-[12.5px] text-white/85">
      <span className="text-white/55 shrink-0">{k}</span>
      <span className="text-right tracking-tight">{v}</span>
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
