"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Trigger a Google OAuth sign-in. Supabase redirects the browser to
 * Google's consent page; on success Google bounces back to
 * `/auth/callback?code=...` which exchanges the code for a session.
 *
 * @param next  Path to land on after successful sign-in. Defaults to "/".
 */
export async function signInWithGoogle(next = "/") {
  const supabase = createSupabaseBrowserClient();
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

/** Sign the current user out and reload. */
export async function signOut() {
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
  if (typeof window !== "undefined") window.location.reload();
}
