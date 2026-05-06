"use client";

import { useEffect, useState } from "react";

/**
 * Client-side poller for the report status endpoint.
 *
 * Used when the report is in a transient state (preview_pending or
 * full_pending) — polls until status flips to *_ready and then forces
 * a hard reload so the server component re-fetches the new chapters.
 */
export default function ReportStatusWatcher({
  reportId,
  initialStatus,
}: {
  reportId: string;
  initialStatus: "preview_pending" | "full_pending";
}) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let alive = true;

    const tick = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);

    const poll = async () => {
      while (alive) {
        try {
          const r = await fetch(`/api/reports/${reportId}/status`, {
            cache: "no-store",
          });
          if (!r.ok) {
            await sleep(3000);
            continue;
          }
          const j = (await r.json()) as { status: string };
          if (j.status === "preview_ready" || j.status === "full_ready") {
            window.location.reload();
            return;
          }
          if (j.status === "failed") {
            setErrored(true);
            return;
          }
        } catch {
          /* keep polling */
        }
        await sleep(2500);
      }
    };

    poll();

    return () => {
      alive = false;
      clearInterval(tick);
    };
  }, [reportId]);

  const isPreview = initialStatus === "preview_pending";

  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <div className="font-mono text-[10px] tracking-[0.3em] text-white/45 mb-6">
        ORBIS / GENERATING
      </div>

      <Spinner />

      <h2 className="mt-6 font-kr text-[18px] md:text-[20px] tracking-tight font-medium leading-[1.5]">
        {errored
          ? "보고서 생성 중 오류가 발생했습니다"
          : isPreview
          ? "보고서 1챕터를 작성하는 중입니다"
          : "나머지 11챕터를 작성하는 중입니다"}
      </h2>

      {!errored && (
        <p className="mt-4 font-kr text-pretty text-[13px] md:text-[13.5px] leading-[1.8] text-white/55">
          {isPreview
            ? "차트를 해석해서 본인을 정확히 짚어주는 글을 만들고 있어요. 1~2분 정도 걸립니다."
            : "12개 챕터 전체를 한 번에 작성합니다. 2~4분 정도 걸립니다."}
          <br />
          <span className="font-mono text-[11px] text-white/40 mt-1 inline-block">
            경과: {formatElapsed(secondsElapsed)}
          </span>
        </p>
      )}

      {errored && (
        <p className="mt-4 font-kr text-[13px] text-red-300/80 leading-[1.7]">
          잠시 후 다시 시도해주세요. 오빗은 차감되지 않았습니다.
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="inline-flex relative w-9 h-9">
      <span className="absolute inset-0 rounded-full border border-white/15" />
      <span
        className="absolute inset-0 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: "rgba(220,235,255,0.95)",
          animation: "orbit-spin 1.1s linear infinite",
        }}
      />
      <style jsx>{`
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

function formatElapsed(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
