"use server";

import { fieldErrorsOf, normalizePhone, isValidPhone, otpSchema, studentUpdateSchema, toE164 } from "@/lib/validation";
import { createAnonSupabase, createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";
import { isServiceRoleConfigured, isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/env";
import { rateLimit, TOO_MANY_MESSAGE } from "@/lib/rate-limit";
import type { ActionResult, Student } from "@/lib/types";

const STUDENT_COLUMNS = "id, student_name, student_phone, guardian_name, guardian_phone, grade, created_at, updated_at";

/**
 * Step 1 of student login: send an SMS OTP.
 * To avoid revealing which phone numbers are registered, the response is identical whether or not
 * the number exists. The OTP is only requested for registered students (prevents SMS abuse / junk auth users).
 */
export async function sendStudentOtp(phoneInput: string): Promise<ActionResult> {
  if (!isServiceRoleConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE };
  const phone = normalizePhone(String(phoneInput ?? ""));
  if (!isValidPhone(phone)) return { ok: false, message: "رقم الهاتف غير صحيح. مثال: 01012345678", fieldErrors: { phone: "رقم الهاتف غير صحيح. مثال: 01012345678" } };
  if (!(await rateLimit("otp-send", 5, 10 * 60_000, phone))) return { ok: false, message: TOO_MANY_MESSAGE };

  try {
    const service = createServiceSupabase();
    const { data } = await service.from("students").select("id").eq("student_phone", phone).maybeSingle();
    if (data) {
      const anon = createAnonSupabase();
      const { error } = await anon.auth.signInWithOtp({ phone: toE164(phone), options: { shouldCreateUser: true, channel: "sms" } });
      if (error) console.error("[sendStudentOtp] provider error:", error.status, error.message);
    }
  } catch (e) {
    console.error("[sendStudentOtp] unexpected", e);
    return { ok: false, message: "حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى." };
  }
  return { ok: true, data: undefined };
}

/** Step 2: verify the OTP. On success the session cookie is set and only THIS student's row is readable (RLS). */
export async function verifyStudentOtp(phoneInput: string, codeInput: string): Promise<ActionResult<Student>> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE };
  const phone = normalizePhone(String(phoneInput ?? ""));
  const code = otpSchema.safeParse(codeInput);
  if (!isValidPhone(phone) || !code.success) return { ok: false, message: "رمز التحقق غير صحيح.", fieldErrors: { code: "رمز التحقق غير صحيح" } };
  if (!(await rateLimit("otp-verify", 8, 10 * 60_000, phone))) return { ok: false, message: TOO_MANY_MESSAGE };

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.verifyOtp({ phone: toE164(phone), token: code.data, type: "sms" });
    if (error) {
      return { ok: false, message: "رمز التحقق غير صحيح أو انتهت صلاحيته.", fieldErrors: { code: "رمز التحقق غير صحيح أو انتهت صلاحيته" } };
    }
    const { data: student } = await supabase.from("students").select(STUDENT_COLUMNS).maybeSingle();
    if (!student) {
      await supabase.auth.signOut();
      return { ok: false, message: "لا توجد بيانات طالب مرتبطة بهذا الرقم." };
    }
    return { ok: true, data: student as Student };
  } catch (e) {
    console.error("[verifyStudentOtp] unexpected", e);
    return { ok: false, message: "حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى." };
  }
}

/** Updates ONLY the signed-in student's own row (RLS + immutable-phone trigger enforce this in the database). */
export async function updateMyStudent(input: unknown): Promise<ActionResult<Student>> {
  if (!isSupabaseConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE };
  const parsed = studentUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "تحقق من البيانات المُدخلة وحاول مرة أخرى.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  try {
    const supabase = await createServerSupabase();
    const { data: own } = await supabase.from("students").select("id").maybeSingle();
    if (!own) return { ok: false, message: "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى." };
    const { data, error } = await supabase.from("students").update(parsed.data).eq("id", own.id).select(STUDENT_COLUMNS).maybeSingle();
    if (error || !data) {
      console.error("[updateMyStudent]", error?.code, error?.message);
      return { ok: false, message: "تعذر حفظ التعديلات حالياً. حاول مرة أخرى." };
    }
    return { ok: true, data: data as Student };
  } catch (e) {
    console.error("[updateMyStudent] unexpected", e);
    return { ok: false, message: "حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى." };
  }
}

export async function studentSignOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
}
