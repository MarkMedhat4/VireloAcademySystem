"use server";

import { fieldErrorsOf, isValidPhone, normalizePhone, studentUpdateSchema } from "@/lib/validation";
import { createServiceSupabase } from "@/lib/supabase-server";
import { isServiceRoleConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/env";
import { rateLimit, TOO_MANY_MESSAGE } from "@/lib/rate-limit";
import { endStudentSession, getSessionStudent, startStudentSession, STUDENT_COLUMNS } from "@/lib/student-session";
import type { ActionResult, Student } from "@/lib/types";

const NETWORK_ERROR = "حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى.";

/**
 * Student portal entry: the phone number locates the student's record.
 * Only ONE record is ever returned, looked up on the server; there is no way to list or browse students.
 */
export async function lookupStudent(phoneInput: string): Promise<ActionResult<Student>> {
  if (!isServiceRoleConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE };
  const phone = normalizePhone(String(phoneInput ?? ""));
  if (!isValidPhone(phone)) {
    const msg = "رقم الهاتف غير صحيح. مثال: 01012345678";
    return { ok: false, message: msg, fieldErrors: { phone: msg } };
  }
  // Slows down anyone trying to guess phone numbers in bulk.
  if (!(await rateLimit("student-lookup", 10, 10 * 60_000))) return { ok: false, message: TOO_MANY_MESSAGE };

  try {
    const { data, error } = await createServiceSupabase().from("students").select(STUDENT_COLUMNS).eq("student_phone", phone).maybeSingle();
    if (error) {
      console.error("[lookupStudent]", error.code, error.message);
      return { ok: false, message: "تعذر البحث حالياً. يرجى المحاولة مرة أخرى بعد قليل." };
    }
    if (!data) {
      const msg = "لا توجد بيانات مسجلة بهذا الرقم. تأكد من الرقم أو سجّل من صفحة التسجيل.";
      return { ok: false, message: msg, fieldErrors: { phone: msg } };
    }
    await startStudentSession(data.id);
    return { ok: true, data: data as Student };
  } catch (e) {
    console.error("[lookupStudent] unexpected", e);
    return { ok: false, message: NETWORK_ERROR };
  }
}

/** Updates ONLY the record bound to this browser's signed session. The phone number can never be changed here. */
export async function updateMyStudent(input: unknown): Promise<ActionResult<Student>> {
  if (!isServiceRoleConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE };
  if (!(await rateLimit("student-update", 20, 10 * 60_000))) return { ok: false, message: TOO_MANY_MESSAGE };

  const parsed = studentUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "تحقق من البيانات المُدخلة وحاول مرة أخرى.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  try {
    const current = await getSessionStudent();
    if (!current) return { ok: false, message: "انتهت الجلسة. يرجى إدخال رقم الهاتف مرة أخرى." };

    const { data, error } = await createServiceSupabase()
      .from("students")
      .update({
        student_name: parsed.data.student_name,
        guardian_name: parsed.data.guardian_name,
        guardian_phone: parsed.data.guardian_phone,
        grade: parsed.data.grade,
      })
      .eq("id", current.id)
      .select(STUDENT_COLUMNS)
      .maybeSingle();
    if (error || !data) {
      console.error("[updateMyStudent]", error?.code, error?.message);
      return { ok: false, message: "تعذر حفظ التعديلات حالياً. حاول مرة أخرى." };
    }
    return { ok: true, data: data as Student };
  } catch (e) {
    console.error("[updateMyStudent] unexpected", e);
    return { ok: false, message: NETWORK_ERROR };
  }
}

export async function studentSignOut(): Promise<void> {
  await endStudentSession();
}
