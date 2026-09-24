"use server";

import { registerSchema, fieldErrorsOf } from "@/lib/validation";
import { createServiceSupabase } from "@/lib/supabase-server";
import { isServiceRoleConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/env";
import { rateLimit, TOO_MANY_MESSAGE } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/types";

/**
 * Public student registration.
 * Anonymous visitors have no table access (RLS), so the insert runs here with the service role
 * AFTER strict server-side validation. Never pass raw client data to the database.
 */
export async function registerStudent(input: unknown): Promise<ActionResult> {
  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (typeof input === "object" && input !== null && "website" in input && (input as { website?: unknown }).website) {
    return { ok: true, data: undefined };
  }

  if (!(await rateLimit("register", 8, 10 * 60_000))) return { ok: false, message: TOO_MANY_MESSAGE };
  if (!isServiceRoleConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE };

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "تحقق من البيانات المُدخلة وحاول مرة أخرى.", fieldErrors: fieldErrorsOf(parsed.error) };
  }

  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase.from("students").insert(parsed.data);
    if (error) {
      if (error.code === "23505") {
        return {
          ok: false,
          message: "هذا الرقم مسجل بالفعل.",
          fieldErrors: { student_phone: "هذا الرقم مسجل بالفعل. يمكنك الدخول من بوابة الطالب." },
        };
      }
      console.error("[registerStudent] insert failed", error.code, error.message);
      return { ok: false, message: "تعذر حفظ البيانات حالياً. يرجى المحاولة مرة أخرى بعد قليل." };
    }
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("[registerStudent] unexpected", e);
    return { ok: false, message: "حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى." };
  }
}
