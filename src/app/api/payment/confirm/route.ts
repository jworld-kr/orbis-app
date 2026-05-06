import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findPackage } from "@/lib/billing/packages";

export const runtime = "nodejs";

/**
 * POST /api/payment/confirm
 *
 * Called from the success page after Toss redirects back. We hit Toss's
 * /v1/payments/confirm with the (paymentKey, orderId, amount) tuple to
 * make sure the payment is real, then atomically grant orbits to the
 * user.
 *
 * Body: { paymentKey, orderId, amount, packageId }
 *
 * orderId encodes the user_id so we never trust client-supplied user ids.
 */
export async function POST(req: Request) {
  // Auth — only the buyer can confirm their own purchase.
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  let body: {
    paymentKey?: string;
    orderId?: string;
    amount?: number;
    packageId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { paymentKey, orderId, amount, packageId } = body;
  if (!paymentKey || !orderId || !amount || !packageId) {
    return NextResponse.json(
      { error: "missing_fields" },
      { status: 400 }
    );
  }

  // Ensure the orderId belongs to this user (we encode user prefix in it).
  if (!orderId.startsWith(`orbis_${user.id.slice(0, 8)}_`)) {
    return NextResponse.json({ error: "order_mismatch" }, { status: 403 });
  }

  // Validate package + price match — never trust client `amount`.
  const pkg = findPackage(packageId);
  if (!pkg) {
    return NextResponse.json({ error: "unknown_package" }, { status: 400 });
  }
  if (Math.round(amount) !== pkg.priceKrw) {
    return NextResponse.json(
      { error: "amount_mismatch", expected: pkg.priceKrw, got: amount },
      { status: 400 }
    );
  }

  const tossSecret = process.env.TOSS_SECRET_KEY;
  if (!tossSecret) {
    return NextResponse.json(
      { error: "toss_not_configured" },
      { status: 500 }
    );
  }

  // Idempotency — if this orderId already credited, return the existing tx.
  const admin = createSupabaseAdminClient();
  {
    const { data: existing } = await admin
      .from("token_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("toss_order_id", orderId)
      .eq("reason", "purchase")
      .maybeSingle();
    if (existing?.id) {
      return NextResponse.json({
        ok: true,
        alreadyConfirmed: true,
        transactionId: existing.id,
      });
    }
  }

  // Verify payment with Toss.
  const auth =
    "Basic " + Buffer.from(`${tossSecret}:`).toString("base64");
  const tossRes = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    }
  );

  if (!tossRes.ok) {
    const detail = await tossRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: "toss_confirm_failed", detail },
      { status: 400 }
    );
  }

  // Grant orbits via SECURITY DEFINER function — atomic balance + tx row.
  const { data: txId, error: rpcErr } = await admin.rpc("grant_orbits", {
    p_user_id: user.id,
    p_count: pkg.count,
    p_reason: "purchase",
    p_toss_key: paymentKey,
    p_toss_order: orderId,
    p_package: { id: pkg.id, priceKrw: pkg.priceKrw, count: pkg.count },
  });
  if (rpcErr) {
    return NextResponse.json(
      { error: "grant_failed", detail: rpcErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    transactionId: txId,
    orbitsGranted: pkg.count,
  });
}
