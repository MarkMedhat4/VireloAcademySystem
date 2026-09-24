import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function publicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase is not configured");
  return { url, anon };
}

/** Server client acting AS THE SIGNED-IN USER (cookie session). Row Level Security applies. */
export async function createServerSupabase() {
  const { url, anon } = publicEnv();
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component — the proxy refreshes sessions, safe to ignore.
        }
      },
    },
  });
}

/**
 * Service-role client — BYPASSES Row Level Security. Server-only.
 * Only use it inside server actions after validating input, never with raw client data.
 */
export function createServiceSupabase() {
  const { url } = publicEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Service role key is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
