import { createClient } from "@supabase/supabase-js";

/**
 * Admin client — uses the service_role key, which BYPASSES Row Level
 * Security. NEVER import this from a Client Component or expose its key
 * to the browser. Use only inside Route Handlers / Server Actions for
 * privileged work like calling consume_orbit() / grant_orbits() and
 * writing to charts/reports on behalf of the user.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
