"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ORBIS_EASE } from "@/lib/motion";
import { signInWithGoogle } from "@/lib/auth/actions";

/**
 * Sign-in modal. Triggered when an unauthenticated user submits ChartForm.
 * One Google button — single auth provider for now.
 */
export default function LoginModal({
  open,
  onClose,
  next = "/",
}: {
  open: boolean;
  onClose: () => void;
  next?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle(next);
      // signInWithGoogle redirects, so we never reach here on success.
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
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
          className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-black/70 backdrop-blur-md px-5 py-8 md:py-12 flex items-start md:items-center justify-center"
        >
          <motion.div
            key="panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.45, ease: ORBIS_EASE }}
            className="relative w-full max-w-sm my-auto border border-white/15 bg-[#0A0E1A] p-7 md:p-10"
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
                분석을 시작하기 전에
                <br />
                계정을 연결해주세요
              </h2>
              <p className="mt-3 font-kr text-pretty text-[12.5px] md:text-[13px] leading-[1.7] text-white/55">
                보고서는 계정에 평생 보관됩니다.
                <br />
                다른 사람과 공유되지 않습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="mt-8 w-full inline-flex items-center justify-center gap-3 px-5 py-3 border border-white/30 bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-60"
            >
              <GoogleMark />
              <span className="font-kr text-[14px] tracking-tight font-medium">
                {busy ? "Google 로그인 이동 중…" : "Google 계정으로 계속"}
              </span>
            </button>

            {error && (
              <p className="mt-4 font-kr text-[12px] text-red-300/80 text-center">
                {error}
              </p>
            )}

            <p className="mt-6 font-kr text-[11px] text-white/35 text-center leading-[1.6]">
              계속 진행하면 서비스 이용약관과
              <br />
              개인정보 처리방침에 동의하는 것으로 간주합니다.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  );
}
