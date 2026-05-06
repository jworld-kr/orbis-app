"use client";

import { useEffect, useState } from "react";
import PaywallModal from "./PaywallModal";

/**
 * Watches scroll position; opens the paywall modal whenever the user
 * scrolls into the bottom region. Re-arms once the user scrolls back
 * up so the modal can re-appear on every new approach.
 */
export default function PaywallTrigger({
  reportId,
  userId,
  email,
  tokenBalance,
}: {
  reportId: string;
  userId: string;
  email?: string;
  tokenBalance: number;
}) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight;
      const viewport = window.innerHeight;
      const scrolled = window.scrollY;
      const scrollable = Math.max(docHeight - viewport, 1);
      const progress = scrolled / scrollable;

      // Fire when the user has scrolled at least halfway through the page,
      // re-arm once they're back near the top.
      if (armed && progress > 0.5) {
        setOpen(true);
        setArmed(false);
      } else if (!armed && progress < 0.2) {
        setArmed(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [armed]);

  return (
    <PaywallModal
      open={open}
      onClose={() => setOpen(false)}
      reportId={reportId}
      userId={userId}
      email={email}
      tokenBalance={tokenBalance}
    />
  );
}
