import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen w-full bg-[#06080F] text-white flex items-center justify-center px-6">
      <Suspense fallback={<SuccessFallback />}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}

function SuccessFallback() {
  return (
    <div className="text-center max-w-md">
      <div className="font-mono text-[10px] tracking-[0.3em] text-white/45 mb-4">
        ORBIS / BILLING
      </div>
      <p className="font-kr text-[15px] md:text-[17px] leading-[1.6]">
        결제를 확인하는 중입니다.
      </p>
    </div>
  );
}
