"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/lib/auth/actions";
import PaywallModal from "@/components/billing/PaywallModal";
import OrbitIcon from "@/components/account/OrbitIcon";

type ReportRow = {
  id: string;
  status: string;
  createdAt: string;
  readyAt: string | null;
  subjectName: string;
  birthDate: string;
};

const STATUS_KO: Record<string, string> = {
  preview_pending: "1챕터 생성 중",
  preview_ready: "1챕터 미리보기",
  full_pending: "전체 작성 중",
  full_ready: "전체 보고서",
  failed: "오류",
};

export default function AccountClient({
  email,
  displayName,
  tokenBalance,
  reports,
  userId,
}: {
  email: string | null;
  displayName: string | null;
  tokenBalance: number;
  reports: ReportRow[];
  userId: string;
}) {
  const [paywallOpen, setPaywallOpen] = useState(false);

  return (
    <>
      {/* identity + balance */}
      <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-start">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-white/45">
            ACCOUNT
          </div>
          <div className="mt-3 font-kr text-[18px] md:text-[20px] tracking-tight">
            {displayName ?? email?.split("@")[0]}
          </div>
          <div className="mt-1 font-mono text-[12px] text-white/55">{email}</div>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-5 font-kr text-[13px] text-white/55 hover:text-white border-b border-white/20 hover:border-white pb-0.5 transition-colors"
          >
            로그아웃
          </button>
        </div>

        <div className="border border-white/15 p-6 md:p-7">
          <div className="font-mono text-[10px] tracking-[0.22em] text-white/55">
            MY ORBITS
          </div>
          <div className="mt-4 flex items-center gap-4">
            <OrbitIcon size={64} />
            <div className="flex items-baseline gap-2">
              <span className="font-kr text-[40px] md:text-[48px] leading-none font-medium tracking-tight">
                {tokenBalance}
              </span>
              <span className="font-kr text-[14px] text-white/55">오빗</span>
            </div>
          </div>
          <p className="mt-4 font-kr text-[12px] text-white/45 leading-[1.7]">
            1 오빗 = 보고서 1개 (12 챕터). 사용하지 않은 오빗은 다른 사람
            보고서에도 쓸 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => setPaywallOpen(true)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 border border-white/30 hover:bg-white hover:text-black transition-colors font-kr text-[13px]"
          >
            오빗 충전하기 →
          </button>
        </div>
      </section>

      {/* reports list */}
      <section className="mt-14 md:mt-16">
        <div className="flex items-baseline gap-3 mb-5">
          <span className="font-mono text-[10px] tracking-[0.22em] text-white/55">
            MY REPORTS
          </span>
          <span className="h-px flex-1 bg-white/[0.1]" />
          <span className="font-kr text-[11px] text-white/45">
            {reports.length}개
          </span>
        </div>

        {reports.length === 0 ? (
          <p className="font-kr text-[13px] text-white/55 leading-[1.8] py-8">
            아직 만든 보고서가 없어요.{" "}
            <Link href="/" className="border-b border-white/30 hover:text-white">
              차트를 입력해보세요
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/report/${r.id}`}
                  className="block border border-white/[0.08] hover:border-white/30 transition-colors p-4 md:p-5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-kr text-[15px] md:text-[16px] tracking-tight font-medium truncate">
                        {r.subjectName}님의 보고서
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-white/45">
                        {r.birthDate} · {formatDate(r.createdAt)} 생성
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] tracking-[0.18em] text-white/55 border border-white/15 px-2 py-1">
                      {STATUS_KO[r.status] ?? r.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        reportId=""
        userId={userId}
        email={email ?? undefined}
        mode="topup"
      />
    </>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
