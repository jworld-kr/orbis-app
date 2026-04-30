import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client (RSC / Route Handlers / Server Actions).
 * Anon key + user's session cookies — RLS still applies as the signed-in user.
 *
 * Use this when you need the *current authenticated user's identity*.
 * For RLS-bypassing admin work (token grants, server-only writes), use
 * createSupabaseAdminClient() from ./admin.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookies cannot be set there.
            // Middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}
