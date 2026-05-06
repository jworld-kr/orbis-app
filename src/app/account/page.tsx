import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AccountClient from "./AccountClient";

/**
 * /account — signed-in user's profile, orbit balance, report library.
 * Server component fetches user + reports list, client component handles
 * "충전하기" modal + sign-out button.
 */
export default async function AccountPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?login=1&next=/account");

  // Profile (token balance, display name)
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, token_balance, created_at")
    .eq("id", user.id)
    .maybeSingle();

  // Reports (joined to chart for subject name + birth)
  const { data: reportsRaw } = await supabase
    .from("reports")
    .select("id, status, created_at, full_ready_at, chart_id")
    .order("created_at", { ascending: false });

  const reports = reportsRaw ?? [];

  // Pull associated chart names in one query.
  const chartIds = reports.map((r) => r.chart_id);
  const { data: charts } = chartIds.length
    ? await supabase
        .from("charts")
        .select("id, name, birth_date")
        .in("id", chartIds)
    : { data: [] };
  const chartById = new Map((charts ?? []).map((c) => [c.id, c]));

  const reportsList = reports.map((r) => {
    const chart = chartById.get(r.chart_id);
    return {
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
      readyAt: r.full_ready_at,
      subjectName: chart?.name ?? "—",
      birthDate: chart?.birth_date ?? "",
    };
  });

  return (
    <main className="min-h-screen w-full bg-[#06080F] text-white px-6 md:px-16 py-14 md:py-20">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="font-mono text-[10px] tracking-[0.22em] text-white/45 hover:text-white transition-colors"
        >
          ← ORBIS
        </Link>

        <h1 className="mt-8 font-kr text-[28px] md:text-[36px] tracking-tight font-medium">
          마이페이지
        </h1>

        <AccountClient
          email={user.email ?? null}
          displayName={profile?.display_name ?? null}
          tokenBalance={profile?.token_balance ?? 0}
          reports={reportsList}
          userId={user.id}
        />
      </div>
    </main>
  );
}
