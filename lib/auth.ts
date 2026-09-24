import "server-only";
import { createServerSupabase } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/env";

export interface AdminContext {
  userId: string;
  username: string | null;
  fullName: string | null;
}

/** Returns the signed-in admin, or null. The session is verified by Supabase (getUser), not just decoded. */
export async function getAdminContext(): Promise<AdminContext | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  // RLS lets a user read only their own admins row — no row means "not an admin".
  const { data: row } = await supabase.from("admins").select("username, full_name").eq("user_id", user.id).maybeSingle();
  if (!row) return null;
  return { userId: user.id, username: row.username, fullName: row.full_name };
}

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
  }
}

export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) throw new UnauthorizedError();
  return ctx;
}
