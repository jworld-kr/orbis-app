import chapter1 from "@/lib/chapters/chapter1";
import chapter2 from "@/lib/chapters/chapter2";
import { userIdentity, userCoordinatesPanel } from "@/lib/chapters/userChart";
import A4Page from "@/components/report/A4Page";
import {
  CoverPage,
  CoordinatesPage,
  TOCPage,
  ChapterHeaderInterpretation,
  ChapterSynergy,
} from "@/components/report/ReportPages";

/**
 * Sample report — uses the hand-written Lee Wonjun mock content. Kept so
 * design / layout tweaks can be reviewed without a real DB row.
 *
 * The real, per-user version lives at /report/[id].
 */
export default function ReportSamplePage() {
  const totalPages = 7;
  return (
    <main className="relative min-h-screen w-full bg-[#06080F] py-10 md:py-16">
      <div className="space-y-6 md:space-y-10">
        <A4Page pageNumber={1} totalPages={totalPages} bare>
          <CoverPage identity={userIdentity} />
        </A4Page>

        <A4Page pageNumber={2} totalPages={totalPages}>
          <CoordinatesPage panel={userCoordinatesPanel} />
        </A4Page>

        <A4Page pageNumber={3} totalPages={totalPages}>
          <TOCPage start={0} end={6} partLabel="PART I · 01 — 06" />
        </A4Page>

        <A4Page pageNumber={4} totalPages={totalPages}>
          <TOCPage start={6} end={12} partLabel="PART II · 07 — 12" />
        </A4Page>

        <A4Page pageNumber={5} totalPages={totalPages}>
          <ChapterHeaderInterpretation ch={chapter1} />
        </A4Page>

        {chapter1.synergy && (
          <A4Page pageNumber={6} totalPages={totalPages}>
            <ChapterSynergy ch={chapter1} />
          </A4Page>
        )}

        <A4Page pageNumber={7} totalPages={totalPages}>
          <ChapterHeaderInterpretation ch={chapter2} />
        </A4Page>
      </div>
    </main>
  );
}
