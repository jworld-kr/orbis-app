"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ORBIS_EASE } from "@/lib/motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import LoginModal from "@/components/auth/LoginModal";

/**
 * Sentence-style input form. Inline fields are embedded inside a sentence
 * so the form reads as text, not a form. Co-Star tone, but in Korean and
 * with Orbis's restraint (no slang, no jokes, mono labels off).
 *
 *   나 [이름]은 [날짜]의 [시간]에 [지역]에서 태어났습니다.
 *   이메일은 [이메일]입니다.
 *
 *                        [차트 분석하기 →]
 *
 * On submit, posts to /api/chart and renders the resulting planet / house /
 * axis tables inline beneath the form.
 */

type FieldKey = "name" | "date" | "time" | "place" | "email";

type ChartResult = {
  input: {
    local: { year: number; month: number; day: number; hour: number; minute: number };
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
  // Added once chart is persisted server-side
  chartId?: string;
  reportId?: string;
  reportStatus?: string;
};

/** Parse "1995. 06. 12" / "1995-06-12" / "1995/06/12" / "19950612" → {y,m,d}.
 *  Returns null if invalid. */
function parseDate(
  s: string
): { year: number; month: number; day: number } | null {
  const t = s.trim();
  // pull all digit groups
  const m = t.match(/^(\d{4})\D*(\d{1,2})\D*(\d{1,2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  )
    return null;
  return { year, month, day };
}

/** Parse "14:32" / "1432" / "14시 32분" / "14.32" → {h,m}.
 *  Returns null if invalid. */
function parseTime(s: string): { hour: number; minute: number } | null {
  const t = s.trim();
  const m = t.match(/^(\d{1,2})\D*(\d{1,2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  )
    return null;
  return { hour, minute };
}

export default function ChartForm() {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  const [values, setValues] = useState<Record<FieldKey, string>>({
    name: "",
    date: "",
    time: "",
    place: "",
    email: "",
  });

  const filled = (k: FieldKey) => values[k].trim().length > 0;
  const allFilled = (Object.keys(values) as FieldKey[]).every(filled);
  const filledCount = (Object.keys(values) as FieldKey[]).filter(filled).length;

  const set = (k: FieldKey, v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  // submit state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChartResult | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  // If true, auto-submit once authentication completes (currently a no-op
  // because Google OAuth fully reloads the page; kept for future popup auth).
  const pendingSubmitRef = useRef(false);

  // Track auth state on mount + on changes (post sign-in / sign-out).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.user);
      setAuthChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setAuthed(!!session?.user);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async () => {
    setError(null);
    setResult(null);

    const date = parseDate(values.date);
    const time = parseTime(values.time);
    if (!date) {
      setError("생년월일 형식을 확인해주세요. 예: 1995. 06. 12");
      return;
    }
    if (!time) {
      setError("출생 시간 형식을 확인해주세요. 예: 14:32");
      return;
    }

    if (authChecked && !authed) {
      pendingSubmitRef.current = true;
      setLoginOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...date,
          ...time,
          place: values.place,
          name: values.name,
        }),
      });
      const json = (await res.json()) as ChartResult & {
        error?: string;
        reason?: string;
      };
      if (res.status === 401) {
        // Session expired or never existed — open modal.
        pendingSubmitRef.current = true;
        setLoginOpen(true);
        return;
      }
      if (!res.ok) {
        throw new Error(
          json.reason ? `${json.error ?? "request failed"} — ${json.reason}` : json.error ?? "request failed"
        );
      }
      setResult(json);

      // Kick off Ch I preview generation, then route to the report page.
      if (json.reportId) {
        try {
          const prev = await fetch(`/api/reports/${json.reportId}/preview`, {
            method: "POST",
          });
          if (prev.ok) {
            window.location.href = `/report/${json.reportId}`;
            return;
          }
        } catch {
          /* fall through to inline result */
        }
      }

      // Fallback — show inline result panel if preview failed.
      setTimeout(() => {
        const el = document.getElementById("chart-result");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      ref={ref}
      id="begin-alt"
      className="relative w-full min-h-[100svh] flex flex-col justify-center px-5 md:px-16 py-14 md:py-20 overflow-hidden bg-orbis-bg"
    >
      <Backdrop filledCount={filledCount} sealed={allFilled} />

      <motion.div
        initial={{ scaleY: 1 }}
        animate={inView ? { scaleY: 0 } : { scaleY: 1 }}
        transition={{ duration: 1.1, ease: ORBIS_EASE, delay: 0.05 }}
        style={{ transformOrigin: "top" }}
        className="absolute inset-0 z-30 bg-orbis-bg pointer-events-none"
      />

      <div className="hidden md:flex absolute left-8 top-0 bottom-0 z-10 flex-col items-center justify-center pointer-events-none">
        <div className="h-16 w-px bg-white/15" />
        <div
          className="my-3 label-mono opacity-55"
          style={{ writingMode: "vertical-rl", letterSpacing: "0.3em" }}
        >
          § 04 — BEGIN
        </div>
        <div className="h-16 w-px bg-white/15" />
      </div>

      <div className="relative z-20 w-full max-w-3xl mx-auto">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.9, delay: 0.95, ease: ORBIS_EASE }}
          className="mb-10 md:mb-14 text-center md:text-left"
        >
          <h2 className="font-kr text-pretty md:text-balance text-[22px] md:text-[34px] leading-[1.3] md:leading-[1.25] tracking-tightest font-medium">
            당신의 좌표를 입력합니다.
          </h2>
          <p className="mt-3 md:mt-5 font-kr text-pretty md:text-balance text-[13px] md:text-[15.5px] leading-[1.65] tracking-tight text-white/65">
            당신만을 위한 분석이 시작됩니다.
          </p>
        </motion.div>

        {/* sentence-style form */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 1, delay: 1.1, ease: ORBIS_EASE }}
          className="font-kr leading-[2.2] text-[18px] md:text-[26px] tracking-tight text-white/80 text-center md:text-left"
        >
          <p>
            나{" "}
            <Inline
              value={values.name}
              onChange={(v) => set("name", v)}
              placeholder="홍길동"
              width="7ch"
            />
            은{" "}
            <Inline
              value={values.date}
              onChange={(v) => set("date", v)}
              placeholder="1995. 06. 12"
              width="11ch"
              mono
              inputMode="numeric"
            />
            의{" "}
            <Inline
              value={values.time}
              onChange={(v) => set("time", v)}
              placeholder="14:32"
              width="6ch"
              mono
              inputMode="numeric"
            />
            에{" "}
            <Inline
              value={values.place}
              onChange={(v) => set("place", v)}
              placeholder="경기도 성남시 분당구 야탑로 59"
              width="22ch"
            />
            에서 태어났습니다.
          </p>
          <p className="mt-2">
            이메일은{" "}
            <Inline
              value={values.email}
              onChange={(v) => set("email", v)}
              placeholder="you@orbis.app"
              width="16ch"
              mono
              inputMode="email"
              type="email"
            />
            입니다.
          </p>
        </motion.div>

        {/* precision microcopy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1.3, ease: ORBIS_EASE }}
          className="mt-6 md:mt-8 space-y-1 font-kr text-pretty text-[12px] md:text-[13px] leading-[1.7] text-white/45 text-center md:text-left"
        >
          <p>* 정확한 주소를 입력하면 더 정밀한 좌표가 그려집니다.</p>
          <p>* 모를 경우 태어난 지역을 정확하게 입력해주세요.</p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1.4, ease: ORBIS_EASE }}
          className="mt-12 md:mt-16 flex flex-col items-center md:items-start gap-3"
        >
          <button
            type="button"
            onClick={submit}
            disabled={!allFilled || loading}
            className={`group inline-flex items-center gap-3 px-7 py-3 border transition-all duration-500 ease-orbis ${
              allFilled && !loading
                ? "border-white text-white bg-white/[0.04] hover:bg-white hover:text-orbis-bg"
                : "border-white/20 text-white/40 cursor-not-allowed"
            }`}
          >
            <span className="font-kr text-[14px] tracking-wide">
              {loading ? "차트 그리는 중…" : "차트 분석하기"}
            </span>
            <span
              className={`inline-block transition-transform duration-300 ease-orbis ${
                allFilled && !loading ? "group-hover:translate-x-1" : ""
              }`}
            >
              →
            </span>
          </button>
          {error && (
            <p className="font-kr text-[12.5px] text-red-300/80 max-w-xl">
              {error}
            </p>
          )}
        </motion.div>

        <LoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          next="/"
        />

        {/* result panel */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="result"
              id="chart-result"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 1, ease: ORBIS_EASE }}
              className="mt-16 md:mt-24"
            >
              <ChartResult data={result} name={values.name} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Chart result panel                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

function ChartResult({
  data,
  name,
}: {
  data: ChartResult;
  name: string;
}) {
  const sun = data.planets.find((p) => p.name === "태양");
  const moon = data.planets.find((p) => p.name === "달");
  const asc = data.axes.ascendant;

  return (
    <div className="border border-white/10 bg-white/[0.02] backdrop-blur-[2px] p-6 md:p-10">
      {/* header */}
      <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="label-mono opacity-55">YOUR CHART</div>
          <div className="font-kr text-[18px] md:text-[22px] tracking-tight font-medium mt-1">
            {name}님의 좌표
          </div>
        </div>
        <div className="text-right font-mono text-[10px] md:text-[11px] text-white/45 leading-[1.6]">
          {data.input.placeName && (
            <div className="truncate max-w-[240px]">
              {data.input.placeName}
            </div>
          )}
          <div>
            {data.input.coordinates.latitude.toFixed(2)}°N ·{" "}
            {data.input.coordinates.longitude.toFixed(2)}°E
          </div>
          <div>{data.input.timezone}</div>
        </div>
      </div>

      {/* the big three */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 mt-6">
        <BigSign label="태양" symbol="☉" sign={sun?.sign} degree={sun?.degree} />
        <BigSign label="달" symbol="☽" sign={moon?.sign} degree={moon?.degree} />
        <BigSign
          label="상승궁"
          symbol="↑"
          sign={asc.sign}
          degree={asc.degree}
        />
      </div>

      {/* planet table */}
      <div className="mt-8">
        <div className="label-mono opacity-55 mb-3">PLANETS · 7</div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5">
          {data.planets.map((p) => (
            <li
              key={p.name}
              className="flex items-baseline justify-between border-b border-white/[0.06] py-1.5"
            >
              <span className="font-kr text-[12.5px] md:text-[13.5px] text-white/75 flex items-baseline gap-2">
                <span className="w-3 text-white/85">{p.symbol}</span>
                {p.name}
              </span>
              <span className="font-mono text-[11.5px] md:text-[12.5px] text-white/85 tracking-tight">
                {p.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* axes */}
      <div className="mt-6">
        <div className="label-mono opacity-55 mb-3">AXES</div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5">
          <li className="flex items-baseline justify-between border-b border-white/[0.06] py-1.5">
            <span className="font-kr text-[12.5px] md:text-[13.5px] text-white/75">
              상승궁 (ASC)
            </span>
            <span className="font-mono text-[11.5px] md:text-[12.5px] text-white/85">
              {data.axes.ascendant.label}
            </span>
          </li>
          <li className="flex items-baseline justify-between border-b border-white/[0.06] py-1.5">
            <span className="font-kr text-[12.5px] md:text-[13.5px] text-white/75">
              중천 (MC)
            </span>
            <span className="font-mono text-[11.5px] md:text-[12.5px] text-white/85">
              {data.axes.midheaven.label}
            </span>
          </li>
        </ul>
      </div>

      {/* houses */}
      <div className="mt-6">
        <div className="label-mono opacity-55 mb-3">HOUSES · 12</div>
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
          {data.houses.map((h) => (
            <li
              key={h.index}
              className="flex items-baseline justify-between border-b border-white/[0.06] py-1.5"
            >
              <span className="font-mono text-[11px] text-white/55">
                {String(h.index).padStart(2, "0")}
              </span>
              <span className="font-mono text-[11.5px] md:text-[12px] text-white/85 text-right">
                {h.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 font-kr text-[12px] text-white/45">
        이 화면은 좌표 계산 결과입니다. 다음 단계에서 보고서가 생성됩니다.
      </p>
    </div>
  );
}

function BigSign({
  label,
  symbol,
  sign,
  degree,
}: {
  label: string;
  symbol: string;
  sign?: string;
  degree?: number;
}) {
  return (
    <div className="border border-white/10 p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="label-mono opacity-55">{label}</span>
        <span className="text-white/85 text-[18px] md:text-[20px] leading-none">
          {symbol}
        </span>
      </div>
      <div className="font-kr text-[15px] md:text-[19px] tracking-tight font-medium leading-tight">
        {sign ?? "—"}
      </div>
      <div className="font-mono text-[10.5px] md:text-[11.5px] text-white/55 mt-1">
        {typeof degree === "number" ? `${degree}°` : ""}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Inline input — underlined field that flows inside a sentence              */
/* ────────────────────────────────────────────────────────────────────────── */

function Inline({
  value,
  onChange,
  placeholder,
  width,
  mono,
  inputMode,
  type,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  width: string;
  mono?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
}) {
  return (
    <input
      type={type ?? "text"}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`orbis-inline-input text-center align-baseline ${
        mono ? "font-mono" : "font-kr"
      }`}
      style={{
        width,
        // visually align mono inputs with the surrounding sentence
        fontSize: "inherit",
        lineHeight: "inherit",
      }}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Reactive backdrop — five stars scattered across the viewport, lit one    */
/*  at a time as fields are filled. Lines connect sequentially-lit stars.    */
/* ────────────────────────────────────────────────────────────────────────── */

// Positions in vw / vh units so the constellation spreads across the screen.
// Order matches the 5 input fields (name → date → time → place → email).
const STAR_POSITIONS = [
  { x: 14, y: 18 }, // top-left
  { x: 86, y: 26 }, // top-right
  { x: 8, y: 72 }, // bottom-left
  { x: 92, y: 78 }, // bottom-right
  { x: 50, y: 92 }, // bottom-center
];

function Backdrop({
  filledCount,
  sealed,
}: {
  filledCount: number;
  sealed: boolean;
}) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-orbis-bg" />

      {/* faint deep-space wash so the constellation feels suspended */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(20, 24, 56, 0.35) 0%, transparent 75%)",
        }}
      />

      {/* connector lines between sequentially-lit stars */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {STAR_POSITIONS.slice(0, -1).map((s, i) => {
          const next = STAR_POSITIONS[i + 1];
          const lit = filledCount > i + 1;
          return (
            <motion.line
              key={`line-${i}`}
              x1={s.x}
              y1={s.y}
              x2={next.x}
              y2={next.y}
              stroke="rgba(245, 247, 250, 0.4)"
              strokeWidth={0.16}
              vectorEffect="non-scaling-stroke"
              animate={{ opacity: lit ? 1 : 0 }}
              transition={{ duration: 0.8, ease: ORBIS_EASE }}
            />
          );
        })}
      </svg>

      {/* the five stars themselves */}
      {STAR_POSITIONS.map((s, i) => (
        <Star key={i} x={s.x} y={s.y} lit={i < filledCount} />
      ))}

      {/* sealing pulse around the center when all 5 are filled */}
      {sealed && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.45, 0] }}
          transition={{
            duration: 2.6,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: [0.6, 1.8] }}
            transition={{
              duration: 2.6,
              ease: "easeOut",
              repeat: Infinity,
              repeatDelay: 2,
            }}
            style={{
              width: "min(640px, 90vw)",
              height: "min(640px, 90vw)",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.5)",
            }}
          />
        </motion.div>
      )}

      <div
        className="absolute inset-x-0 top-0 h-24"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10, 14, 26, 0.95) 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{
          background:
            "linear-gradient(to top, rgba(10, 14, 26, 0.95) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

function Star({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* halo */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          opacity: lit ? 1 : 0,
          scale: lit ? 1 : 0.5,
        }}
        transition={{ duration: 0.9, ease: ORBIS_EASE }}
        style={{
          width: 60,
          height: 60,
          left: -30,
          top: -30,
          background:
            "radial-gradient(circle, rgba(180, 195, 255, 0.35) 0%, rgba(120, 140, 220, 0.12) 40%, transparent 75%)",
        }}
      />
      {/* the dot */}
      <motion.div
        className="rounded-full"
        animate={{
          opacity: lit ? 1 : 0.18,
          scale: lit ? 1 : 0.6,
          backgroundColor: lit
            ? "rgba(255,255,255,1)"
            : "rgba(245,247,250,0.5)",
          boxShadow: lit
            ? "0 0 6px rgba(255,255,255,1), 0 0 18px rgba(255,255,255,0.7), 0 0 36px rgba(180,195,255,0.45)"
            : "none",
        }}
        transition={{ duration: 0.7, ease: ORBIS_EASE }}
        style={{
          width: 4,
          height: 4,
        }}
      />
      {/* slow breathing while lit */}
      {lit && (
        <motion.div
          className="absolute rounded-full"
          animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.12, 1] }}
          transition={{
            duration: 4.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          style={{
            width: 14,
            height: 14,
            left: -7,
            top: -7,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
          }}
        />
      )}
    </div>
  );
}
