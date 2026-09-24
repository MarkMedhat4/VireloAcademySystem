import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { signToken, verifyToken } from "@/lib/session-token";
import { createServiceSupabase } from "@/lib/supabase-server";
import { isServiceRoleConfigured } from "@/lib/env";
import type { Student } from "@/lib/types";

const COOKIE = "virelo_student";
const TTL_SECONDS = 30 * 60; // 30 minutes
export const STUDENT_COLUMNS = "id, student_name, student_phone, guardian_name, guardian_phone, grade, created_at, updated_at";

/** Signing key derived from the server-only service-role key — no extra env variable needed. */
function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHmac("sha256", key).update("virelo-student-session-v1").digest("hex");
}

/** After a successful phone lookup: remember WHICH student this browser may access (httpOnly, signed, 30 min). */
export async function startStudentSession(studentId: string) {
  const token = signToken({ sid: studentId, exp: Date.now() + TTL_SECONDS * 1000 }, secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function endStudentSession() {
  (await cookies()).delete(COOKIE);
}

/** The ONLY student record this browser may read or edit — derived from the signed cookie, never from client input. */
export async function getSessionStudent(): Promise<Student | null> {
  if (!isServiceRoleConfigured()) return null;
  const id = verifyToken((await cookies()).get(COOKIE)?.value, secret());
  if (!id) return null;
  const { data } = await createServiceSupabase().from("students").select(STUDENT_COLUMNS).eq("id", id).maybeSingle();
  return (data as Student | null) ?? null;
}
