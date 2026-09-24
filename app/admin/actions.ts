"use server";

import { adminLoginSchema, PROOF_PATH_RE, paymentStatusSchema } from "@/lib/validation";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";
import { getAdminContext, requireAdmin, UnauthorizedError } from "@/lib/auth";
import { isServiceRoleConfigured, isSupabaseConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/env";
import { PROOF_BUCKET } from "@/lib/config";
import { rateLimit, TOO_MANY_MESSAGE } from "@/lib/rate-limit";
import type { ActionResult, PaymentStatus } from "@/lib/types";

const BAD_LOGIN = "بيانات الدخول غير صحيحة.";

/**
 * Admin login with a username OR an email. The password is only ever sent to Supabase Auth —
 * it is not stored, logged or hard-coded anywhere in this project.
 */
export async function adminLogin(input: unknown): Promise<ActionResult> {
  if (!isServiceRoleConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE };
  const parsed = adminLoginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "أدخل اسم المستخدم وكلمة المرور." };
  const { identifier, password } = parsed.data;

  if (!(await rateLimit("admin-login", 6, 15 * 60_000, identifier.toLowerCase()))) return { ok: false, message: TOO_MANY_MESSAGE };

  try {
    let email = identifier;
    if (!identifier.includes("@")) {
      const service = createServiceSupabase();
      const { data: row } = await service.from("admins").select("user_id").eq("username", identifier.toLowerCase()).maybeSingle();
      if (!row) return { ok: false, message: BAD_LOGIN };
      const { data: u } = await service.auth.admin.getUserById(row.user_id);
      if (!u.user?.email) return { ok: false, message: BAD_LOGIN };
      email = u.user.email;
    }

    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: BAD_LOGIN };

    // A valid Supabase account is NOT enough: it must also be listed in public.admins.
    const ctx = await getAdminContext();
    if (!ctx) {
      await supabase.auth.signOut();
      return { ok: false, message: BAD_LOGIN };
    }
    return { ok: true, data: undefined };
  } catch (e) {
    console.error("[adminLogin] unexpected", e);
    return { ok: false, message: "حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى." };
  }
}

export async function adminLogout(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
}

/** Short-lived signed URL for one payment proof. Admin-only; never a permanent public URL. */
export async function getPaymentProofUrl(path: string): Promise<ActionResult<{ url: string }>> {
  try {
    await requireAdmin();
    if (typeof path !== "string" || !PROOF_PATH_RE.test(path)) return { ok: false, message: "مسار الصورة غير صالح." };
    const supabase = await createServerSupabase(); // acts as the admin → storage RLS applies
    const { data, error } = await supabase.storage.from(PROOF_BUCKET).createSignedUrl(path, 120);
    if (error || !data) {
      console.error("[getPaymentProofUrl]", error?.message);
      return { ok: false, message: "تعذر فتح صورة الإثبات. قد تكون محذوفة." };
    }
    return { ok: true, data: { url: data.signedUrl } };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, message: "انتهت الجلسة. سجّل الدخول مرة أخرى." };
    console.error("[getPaymentProofUrl] unexpected", e);
    return { ok: false, message: "حدث خطأ غير متوقع." };
  }
}

/** Confirm / reject / reset a payment. Runs as the admin so RLS enforces admin-only access. */
export async function setPaymentStatus(id: string, status: PaymentStatus): Promise<ActionResult<{ id: string; status: PaymentStatus }>> {
  try {
    await requireAdmin();
    const s = paymentStatusSchema.safeParse(status);
    if (!s.success || !/^[0-9a-f-]{36}$/.test(String(id))) return { ok: false, message: "طلب غير صالح." };
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("payments")
      .update({ status: s.data, reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status")
      .maybeSingle();
    if (error || !data) {
      console.error("[setPaymentStatus]", error?.message);
      return { ok: false, message: "تعذر تحديث حالة الدفع." };
    }
    return { ok: true, data: { id: data.id, status: data.status as PaymentStatus } };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, message: "انتهت الجلسة. سجّل الدخول مرة أخرى." };
    console.error("[setPaymentStatus] unexpected", e);
    return { ok: false, message: "حدث خطأ غير متوقع." };
  }
}
