import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateChapter, type ChartData } from "@/lib/chapters/generate";

export const runtime = "nodejs";

/**
 * POST /api/reports/[id]/preview
 *
 * Generates Chapter I (the free preview tier) for the given report.
 * Free for the user — no token consumed. Idempotent: if Ch I already
 * exists in chapters[], we return the same row without regenerating.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const reportId = params.id;

  // Auth — only the owner can trigger generation.
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Load the report + its chart in one shot.
  const { data: report, error: reportErr } = await admin
    .from("reports")
    .select("id, user_id, chart_id, status, chapters")
    .eq("id", reportId)
    .single();
  if (reportErr || !report) {
    return NextResponse.json(
      { error: "report_not_found", detail: reportErr?.message },
      { status: 404 }
    );
  }
  if (report.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Already-generated Ch I → return as-is. Saves a round trip + cost.
  const existing = (report.chapters as Array<{ no: number }> | null) ?? [];
  const hasChapter1 = existing.some((c) => c?.no === 1);
  if (hasChapter1 && report.status !== "preview_pending") {
    return NextResponse.json({
      reportId: report.id,
      status: report.status,
      chapters: existing,
    });
  }

  // Pull chart for context.
  const { data: chart, error: chartErr } = await admin
    .from("charts")
    .select("name, chart_json")
    .eq("id", report.chart_id)
    .single();
  if (chartErr || !chart) {
    return NextResponse.json(
      { error: "chart_not_found", detail: chartErr?.message },
      { status: 500 }
    );
  }

  // Generate Chapter I.
  let chapter1;
  try {
    chapter1 = await generateChapter(
      chart.chart_json as ChartData,
      chart.name,
      1,
    );
  } catch (e) {
    await admin
      .from("reports")
      .update({ status: "failed" })
      .eq("id", report.id);
    return NextResponse.json(
      {
        error: "generation_failed",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }

  // Persist — replace any existing Ch1 entry.
  const nextChapters = [
    { no: 1, content: chapter1 },
    ...existing.filter((c) => c?.no !== 1),
  ];

  const { error: upErr } = await admin
    .from("reports")
    .update({
      chapters: nextChapters,
      status: "preview_ready",
      preview_ready_at: new Date().toISOString(),
      model: process.env.ANTHROPIC_API_KEY ? "claude-sonnet-4-6" : "mock",
    })
    .eq("id", report.id);
  if (upErr) {
    return NextResponse.json(
      { error: "save_failed", detail: upErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    reportId: report.id,
    status: "preview_ready",
    chapters: nextChapters,
  });
}
