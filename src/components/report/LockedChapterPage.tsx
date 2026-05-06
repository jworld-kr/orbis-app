import { toc } from "@/lib/chapters/toc";

/**
 * A locked chapter page — shown for chapters that haven't been unlocked
 * yet. Renders a blurred placeholder of the chapter title + sub-items
 * with a lock badge in the center, hinting that there's more below.
 */
export default function LockedChapterPage({ chapterNo }: { chapterNo: number }) {
  const entry = toc.find((t, i) => i + 1 === chapterNo);
  if (!entry) return null;

  return (
    <div className="relative h-full">
      {/* Blurred chapter preview content */}
      <div
        aria-hidden
        className="select-none pointer-events-none"
        style={{ filter: "blur(6px)" }}
      >
        <div>
          <div className="flex items-baseline justify-between gap-3 mb-2.5">
            <span className="font-mono text-[11px] tracking-[0.2em] text-white/45">
              CHAPTER {entry.roman}
            </span>
            <span className="headline-serif italic text-[14px] text-white/45">
              Locked
            </span>
          </div>
          <div className="h-px bg-white/[0.1]" />
          <h1 className="mt-3 font-kr text-[28px] md:text-[40px] leading-[1.1] tracking-tightest font-medium">
            {entry.title}
          </h1>
        </div>

        <div className="mt-8 md:mt-12 space-y-7">
          {entry.subs.map((sub, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-px w-5 bg-white/25" />
                <span className="font-mono text-[10px] tracking-[0.22em] text-white/45">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="font-kr text-[12px] text-white/45 mb-2.5">{sub}</p>
              {/* fake body lines (just visual filler) */}
              <p className="font-kr text-[15px] md:text-[18px] leading-[1.55] tracking-tight font-medium text-white/85">
                ████████ ████ ███████ ███████ ███████ ████████
              </p>
              <p className="mt-2.5 font-kr text-[13px] md:text-[14.5px] leading-[1.9] text-white/55">
                ████████████ ███████ ████ ███████ ████████ ███████ ████ ████████
                ███████████ ████████ ████████ ███████ ████████ ████ ████████.
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
