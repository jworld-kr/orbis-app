import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateFullReport, type ChartData } from "@/lib/chapters/generate";
import type { Chapter } from "@/lib/chapters/types";

export const runtime = "nodejs";

// In Next 14 dev, full report generation should fit; bump if it doesn't.
export const maxDuration = 300; // seconds (only honored on Vercel)

/**
 * POST /api/reports/[id]/full
 *
 * Called from /billing/success after a successful payment confirmation.
 * Atomically:
 *   1. consume 1 orbit (errors out if balance < 1 → user must buy more)
 *   2. generate Chapters II~XII (Ch I is already there from preview)
 *   3. flip status to 'full_ready'
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const reportId = params.id;

  // Auth
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  // Load report
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

  // Idempotency — if already full_ready, just succeed.
  if (report.status === "full_ready") {
    return NextResponse.json({
      reportId: report.id,
      status: "full_ready",
      alreadyDone: true,
    });
  }

  // Load chart
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

  // Consume 1 orbit (atomic balance check + decrement + tx row).
  // Errors with 'insufficient_orbits' if user has no balance.
  const { error: rpcErr } = await admin.rpc("consume_orbit", {
    p_user_id: user.id,
    p_report_id: report.id,
  });
  if (rpcErr) {
    if (rpcErr.message.includes("insufficient_orbits")) {
      return NextResponse.json(
        { error: "insufficient_orbits" },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "consume_failed", detail: rpcErr.message },
      { status: 500 }
    );
  }

  // Mark generating so the report page can show progress + kick off the
  // long-running generation in the background. Return 202 so the client
  // can navigate to /report/{id} and poll for status.
  await admin
    .from("reports")
    .update({ status: "full_pending" })
    .eq("id", report.id);

  const existing = ((report.chapters as Array<{ no: number; content: Chapter }>) ?? []);
  const alreadyGenerated = existing.map((c) => c.content);

  void runFullGeneration({
    reportId: report.id,
    chartJson: chart.chart_json as ChartData,
    subjectName: chart.name,
    alreadyGenerated,
  });

  return NextResponse.json(
    { reportId: report.id, status: "full_pending", started: true },
    { status: 202 },
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

async function runFullGeneration(args: {
  reportId: string;
  chartJson: ChartData;
  subjectName: string;
  alreadyGenerated: Chapter[];
}) {
  const admin = createSupabaseAdminClient();
  try {
    const allChapters = await generateFullReport(
      args.chartJson,
      args.subjectName,
      args.alreadyGenerated,
    );
    const merged = allChapters.map((c) => ({ no: c.no, content: c }));
    await admin
      .from("reports")
      .update({
        chapters: merged,
        status: "full_ready",
        full_ready_at: new Date().toISOString(),
        model: process.env.ANTHROPIC_API_KEY ? "claude-sonnet-4-6" : "mock",
      })
      .eq("id", args.reportId);
  } catch (e) {
    console.error("[full-bg] generation failed:", e);
    await admin
      .from("reports")
      .update({ status: "failed" })
      .eq("id", args.reportId);
  }
}
