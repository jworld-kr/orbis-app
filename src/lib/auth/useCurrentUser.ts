"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  tokenBalance: number;
} | null;

/**
 * Subscribe to the current Supabase user + their orbit balance.
 * Returns `null` while loading or when signed out. Updates live on
 * sign-in/out and on `users` row changes (e.g. after a purchase).
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;
    // Holds the live channel so we can tear it down before subscribing
    // to a new user (and on unmount). Strict mode invokes effects twice
    // in dev — without explicit teardown, the second mount tries to
    // re-attach `.on(...)` to the already-subscribed channel and throws.
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    const teardownChannel = () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
      }
    };

    const subscribeToProfile = (authUserId: string) => {
      teardownChannel();
      // Unique channel name per mount — supabase-js caches channels by
      // name and re-using a cached one after subscribe() throws when we
      // attach more listeners.
      const uniq = `${authUserId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      const channel = supabase.channel(`users:${uniq}`);
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${authUserId}`,
        },
        (payload) => {
          const next = payload.new as {
            display_name?: string | null;
            token_balance?: number;
          };
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  displayName: next.display_name ?? prev.displayName,
                  tokenBalance: next.token_balance ?? prev.tokenBalance,
                }
              : prev
          );
        }
      );
      channel.subscribe();
      activeChannel = channel;
    };

    const loadProfile = async (authUserId: string, authEmail: string | null) => {
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, token_balance")
        .eq("id", authUserId)
        .maybeSingle();
      if (cancelled) return;
      setUser({
        id: authUserId,
        email: authEmail,
        displayName: profile?.display_name ?? null,
        tokenBalance: profile?.token_balance ?? 0,
      });
      setLoading(false);
      subscribeToProfile(authUserId);
    };

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (!data.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      loadProfile(data.user.id, data.user.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session?.user) {
        setUser(null);
        teardownChannel();
        return;
      }
      loadProfile(session.user.id, session.user.email ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
      teardownChannel();
    };
  }, []);

  return { user, loading };
}
