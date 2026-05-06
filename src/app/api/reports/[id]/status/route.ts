import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/reports/[id]/status
 *
 * Lightweight polling endpoint. Returns the report's current status +
 * how many chapters are present. Auth-gated by RLS on the reports
 * table (user can only see their own).
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const { data: report, error } = await supabase
    .from("reports")
    .select("id, status, chapters, preview_ready_at, full_ready_at")
    .eq("id", params.id)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const chapterCount = Array.isArray(report.chapters) ? report.chapters.length : 0;

  return NextResponse.json({
    reportId: report.id,
    status: report.status,
    chapterCount,
    previewReadyAt: report.preview_ready_at,
    fullReadyAt: report.full_ready_at,
  });
}
