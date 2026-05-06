"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { signOut, signInWithGoogle } from "@/lib/auth/actions";

/**
 * Footer's right-most column.
 *  - Signed in  → ACCOUNT (email + 로그아웃 빨강)
 *  - Signed out → "로그인" CTA
 */
export default function FooterAccountStrip() {
  const { user } = useCurrentUser();

  if (user) {
    return (
      <div className="md:col-span-3 md:text-right">
        <div className="label-mono mb-4">ACCOUNT</div>
        <div className="font-mono text-white/65 text-[12px] leading-[1.85] truncate">
          {user.email}
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="mt-3 font-kr text-[12.5px] text-red-400/85 hover:text-red-300 transition-colors"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="md:col-span-3 md:text-right">
      <div className="label-mono mb-4">ACCOUNT</div>
      <button
        type="button"
        onClick={() => signInWithGoogle("/")}
        className="font-kr text-[13px] text-white/75 hover:text-white border-b border-white/30 hover:border-white pb-0.5 transition-colors"
      >
        로그인
      </button>
    </div>
  );
}
