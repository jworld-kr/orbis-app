"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * /billing/success
 *
 * Toss redirects here after a successful payment with:
 *   ?paymentKey=...&orderId=...&amount=...&packageId=...&reportId=...
 *
 * We:
 *   1. Confirm the payment server-side (/api/payment/confirm)
 *   2. Trigger full-report generation (/api/reports/[id]/full)
 *   3. Send the user back to /report/[id]
 */
export default function BillingSuccessPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [phase, setPhase] = useState<"confirming" | "generating" | "done" | "error">(
    "confirming"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const paymentKey = sp.get("paymentKey");
    const orderId = sp.get("orderId");
    const amount = Number(sp.get("amount"));
    const packageId = sp.get("packageId");
    const reportId = sp.get("reportId");
    const mode = (sp.get("mode") ?? "unlock") as "unlock" | "topup";

    if (!paymentKey || !orderId || !amount || !packageId) {
      setPhase("error");
      setErrorMsg("결제 정보가 누락되었습니다.");
      return;
    }
    if (mode === "unlock" && !reportId) {
      setPhase("error");
      setErrorMsg("보고서 정보가 누락되었습니다.");
      return;
    }

    (async () => {
      try {
        // 1. Confirm
        const confirm = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount, packageId }),
        });
        const confirmJson = await confirm.json();
        if (!confirm.ok) {
          throw new Error(
            confirmJson.error
              ? `${confirmJson.error}${confirmJson.detail ? ` — ${JSON.stringify(confirmJson.detail)}` : ""}`
              : "confirm_failed"
          );
        }

        // 2. Topup mode — orbits credited, send the user to /account.
        if (mode === "topup") {
          setPhase("done");
          router.replace("/account");
          return;
        }

        // 3. Unlock mode — kick off Ch II~XII generation. The endpoint
        //    returns 202 immediately and runs in the background; the
        //    report page polls until status === 'full_ready'.
        setPhase("generating");
        const full = await fetch(`/api/reports/${reportId}/full`, {
          method: "POST",
        });
        if (!full.ok && full.status !== 202) {
          const fullJson = await full.json().catch(() => ({}));
          throw new Error(fullJson.error ?? "full_generation_failed");
        }

        // 4. Redirect to the report page — it will show a spinner and
        //    flip to the unlocked view automatically when ready.
        setPhase("done");
        router.replace(`/report/${reportId}`);
      } catch (e) {
        setPhase("error");
        setErrorMsg(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [router, sp]);

  return (
    <main className="min-h-screen w-full bg-[#06080F] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="font-mono text-[10px] tracking-[0.3em] text-white/45 mb-4">
          ORBIS / BILLING
        </div>
        {phase === "confirming" && (
          <p className="font-kr text-[15px] md:text-[17px] leading-[1.6]">
            결제를 확인하는 중입니다.
          </p>
        )}
        {phase === "generating" && (
          <>
            <p className="font-kr text-[15px] md:text-[17px] leading-[1.6]">
              나머지 11챕터를 작성하는 중입니다.
            </p>
            <p className="mt-3 font-kr text-[12.5px] text-white/55 leading-[1.7]">
              30초~2분 정도 걸립니다. 페이지를 닫지 말아주세요.
            </p>
          </>
        )}
        {phase === "done" && (
          <p className="font-kr text-[15px] md:text-[17px] leading-[1.6]">
            보고서로 이동 중…
          </p>
        )}
        {phase === "error" && (
          <>
            <p className="font-kr text-[15px] md:text-[17px] leading-[1.6] text-red-300/85">
              결제 처리 중 오류가 발생했습니다.
            </p>
            {errorMsg && (
              <p className="mt-3 font-kr text-[12px] text-white/55 break-all">
                {errorMsg}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
