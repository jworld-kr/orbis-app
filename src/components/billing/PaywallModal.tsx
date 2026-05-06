"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ORBIT_PACKAGES, type OrbitPackage, formatKrw } from "@/lib/billing/packages";
import { ORBIS_EASE } from "@/lib/motion";
import OrbitIcon from "@/components/account/OrbitIcon";

/**
 * Paywall modal — shown after the user finishes scrolling Ch I.
 * Lets them pick a package and launches Toss Payments.
 */
export default function PaywallModal({
  open,
  onClose,
  reportId,
  userId,
  email,
  mode = "unlock",
  tokenBalance = 0,
}: {
  open: boolean;
  onClose: () => void;
  /** Empty string when mode === "topup". */
  reportId: string;
  userId: string;
  email?: string;
  /** "unlock" → after payment, generate Ch II~XII for reportId.
   *  "topup"  → just credit orbits, no report generation. */
  mode?: "unlock" | "topup";
  /** Current orbit balance. If >=1 and mode==="unlock", show "use orbit"
   *  CTA instead of forcing a purchase. */
  tokenBalance?: number;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPackages, setShowPackages] = useState(
    mode === "topup" || tokenBalance < 1
  );

  const handleUseOrbit = async () => {
    setError(null);
    setBusy("use_orbit");
    try {
      const res = await fetch(`/api/reports/${reportId}/full`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "insufficient_orbits") {
          setShowPackages(true);
          setBusy(null);
          return;
        }
        throw new Error(json.error ?? "unlock_failed");
      }
      // Reload to render the now-unlocked report.
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  };

  const handlePay = async (pkg: OrbitPackage) => {
    setError(null);
    setBusy(pkg.id);
    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("Toss 클라이언트 키가 설정되지 않았습니다.");
      }

      // Lazy import — keep initial bundle small.
      const { loadTossPayments, ANONYMOUS } = await import(
        "@tosspayments/tosspayments-sdk"
      );

      const orderId = `orbis_${userId.slice(0, 8)}_${Date.now()}_${pkg.id}`;
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      // requestPayment redirects on success — successUrl carries the
      // params we need to confirm server-side.
      const params = new URLSearchParams({
        packageId: pkg.id,
        mode,
      });
      if (reportId) params.set("reportId", reportId);
      const origin = window.location.origin;

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: pkg.priceKrw },
        orderId,
        orderName: pkg.title,
        successUrl: `${origin}/billing/success?${params.toString()}`,
        failUrl: `${origin}/billing/fail`,
        customerEmail: email,
        card: { useEscrow: false, flowMode: "DEFAULT", useCardPoint: false },
      });
    } catch (e) {
      // User cancelled is normal — Toss throws PAY_PROCESS_CANCELED.
      const msg = e instanceof Error ? e.message : String(e);
      if (!/cancel|CANCEL/i.test(msg)) {
        setError(msg);
      }
      setBusy(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: ORBIS_EASE }}
          onClick={onClose}
          className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-black/80 backdrop-blur-md px-5 py-8 md:py-12 flex items-start md:items-center justify-center"
        >
          <motion.div
            key="panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.5, ease: ORBIS_EASE }}
            className="relative w-full max-w-lg my-auto border border-white/15 bg-[#0A0E1A] p-6 md:p-9"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-[18px] leading-none"
              aria-label="닫기"
            >
              ×
            </button>

            <div className="text-center">
              <div className="font-mono text-[10px] tracking-[0.3em] text-white/45 mb-3">
                ORBIS
              </div>
              <h2 className="font-kr text-[20px] md:text-[22px] tracking-tight font-medium leading-[1.4]">
                {mode === "topup"
                  ? "오빗 충전하기"
                  : "나머지 11챕터를 열어보세요"}
              </h2>
              <p className="mt-3 font-kr text-pretty text-[12.5px] md:text-[13px] leading-[1.7] text-white/55">
                {mode === "topup"
                  ? "한 보고서당 1 오빗이 사용됩니다. 보고서는 계정에 평생 보관됩니다."
                  : "결제 즉시 본인의 차트로 11챕터가 전부 작성됩니다. 보고서는 계정에 평생 보관됩니다."}
              </p>
            </div>

            {mode === "unlock" && tokenBalance >= 1 && !showPackages && (
              <div className="mt-7">
                <div className="border border-white/15 p-5">
                  <div className="font-mono text-[10px] tracking-[0.22em] text-white/55 mb-3">
                    MY ORBITS
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <OrbitIcon size={44} />
                      <div className="flex items-baseline gap-2">
                        <span className="font-kr text-[28px] leading-none font-medium tracking-tight">
                          {tokenBalance}
                        </span>
                        <span className="font-kr text-[13px] text-white/55">
                          오빗
                        </span>
                      </div>
                    </div>
                    <span className="font-kr text-[12px] text-white/55">
                      1 오빗 사용
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseOrbit}
                    disabled={busy !== null}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/85 bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-60"
                  >
                    <span className="font-kr text-[14px] tracking-tight font-medium">
                      {busy === "use_orbit"
                        ? "11챕터 작성 중…"
                        : "1 오빗 사용해서 열기"}
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPackages(true)}
                  className="mt-3 w-full text-center font-kr text-[12.5px] text-white/55 hover:text-white transition-colors"
                >
                  오빗 더 충전하기 →
                </button>

                {error && (
                  <p className="mt-4 font-kr text-[12px] text-red-300/80 text-center">
                    {error}
                  </p>
                )}
              </div>
            )}

            {showPackages && (
            <ul className="mt-7 space-y-2.5">
              {ORBIT_PACKAGES.map((pkg) => (
                <li key={pkg.id}>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => handlePay(pkg)}
                    className="group w-full text-left border border-white/15 hover:border-white/40 transition-colors p-4 disabled:opacity-50"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-kr text-[15px] md:text-[16px] font-medium tracking-tight">
                          {pkg.title}
                        </span>
                        {pkg.label && (
                          <span className="font-mono text-[10px] tracking-[0.18em] text-white/55 border border-white/25 px-1.5 py-[1px]">
                            {pkg.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-kr text-[11px] text-white/35 line-through">
                          {formatKrw(pkg.originalKrw)}
                        </span>
                        <span className="font-kr text-[15px] md:text-[17px] tracking-tight font-medium">
                          {formatKrw(pkg.priceKrw)}
                        </span>
                      </div>
                    </div>
                    {busy === pkg.id && (
                      <div className="mt-2 font-kr text-[11.5px] text-white/55">
                        결제창을 여는 중…
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            )}

            {showPackages && error && (
              <p className="mt-4 font-kr text-[12px] text-red-300/80 text-center">
                {error}
              </p>
            )}

            <p className="mt-6 font-kr text-[11px] text-white/35 text-center leading-[1.6]">
              결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
              <br />
              사용하지 않은 오빗은 다른 사람 보고서에도 쓸 수 있습니다.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
