"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function FailContent() {
  const sp = useSearchParams();
  const code = sp.get("code");
  const message = sp.get("message");

  return (
    <div className="text-center max-w-md">
      <div className="font-mono text-[10px] tracking-[0.3em] text-white/45 mb-4">
        ORBIS / BILLING
      </div>
      <p className="font-kr text-[15px] md:text-[17px] leading-[1.6]">
        결제가 완료되지 않았습니다.
      </p>
      {message && (
        <p className="mt-3 font-kr text-[12.5px] text-white/55 leading-[1.7]">
          {message}
        </p>
      )}
      {code && (
        <p className="mt-1 font-mono text-[11px] text-white/35">코드: {code}</p>
      )}
      <Link
        href="/"
        className="mt-7 inline-block border border-white/30 px-5 py-2 font-kr text-[13px] hover:bg-white hover:text-black transition-colors"
      >
        처음으로
      </Link>
    </div>
  );
}
