import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client (anon key only — protected by Row Level Security).
 * Used ONLY for uploading a payment proof to a server-issued signed upload URL.
 * NEXT_PUBLIC_* variables must be referenced statically so Next.js can inline them.
 */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return createBrowserClient(url, key);
}
