import type { ReactNode } from "react";

/**
 * A4-sized page wrapper. Each "page" of the report renders inside one of
 * these so the report reads as a stack of physical pages, not infinite
 * scroll.
 *
 * Design:
 *   - Fixed A4 ratio (794 × 1123 at desktop), scaled down on mobile
 *   - Top header   : ORBIS / REPORT · page number
 *   - Bottom footer: page number (large) + brand mark
 *   - Subtle border + soft shadow → "stacked paper" feel
 *
 * The viewer sees a vertical stack of A4 pages with a small gap between
 * each. The scroll is normal; the page boundaries are visual.
 */
type Props = {
  pageNumber: number;
  totalPages?: number;
  children: ReactNode;
  /** hide the header/footer chrome (used for the cover page) */
  bare?: boolean;
};

export default function A4Page({
  pageNumber,
  totalPages,
  children,
  bare = false,
}: Props) {
  return (
    <div className="flex justify-center">
      <article
        className="relative bg-orbis-bg flex flex-col"
        style={{
          // A4-ish width, but min-height not aspect-ratio so content that
          // overflows naturally extends the page instead of clipping.
          // The bottom of the page (footer) sticks to the actual bottom.
          width: "min(794px, 100% - 24px)",
          // ~A4 ratio for visual minimum; long pages just grow taller.
          minHeight: "min(1123px, calc((100vw - 24px) * 1.414))",
          border: "1px solid rgba(245,247,250,0.08)",
          boxShadow:
            "0 30px 60px -30px rgba(0,0,0,0.7), 0 12px 24px -12px rgba(0,0,0,0.6)",
        }}
      >
        {!bare && (
          <header className="px-6 md:px-12 pt-5 md:pt-7 flex items-center justify-between shrink-0">
            <span className="label-mono opacity-55">ORBIS / REPORT</span>
            <span className="font-mono text-[10px] md:text-[11px] tracking-[0.2em] text-white/45">
              P {String(pageNumber).padStart(2, "0")}
              {totalPages ? ` / ${String(totalPages).padStart(2, "0")}` : ""}
            </span>
          </header>
        )}

        {/* page body */}
        <div
          className={`flex-1 min-h-0 ${
            bare ? "px-6 md:px-12 py-10 md:py-16" : "px-6 md:px-12 py-7 md:py-10"
          }`}
        >
          {children}
        </div>

        {!bare && (
          <footer className="px-6 md:px-12 pb-5 md:pb-7 flex items-end justify-between shrink-0">
            <span className="label-mono opacity-40">MMXXVI</span>
            <span
              className="headline-serif italic text-white/45 leading-none select-none"
              style={{ fontSize: "20px", letterSpacing: "-0.01em" }}
            >
              {String(pageNumber).padStart(2, "0")}
            </span>
          </footer>
        )}
      </article>
    </div>
  );
}
