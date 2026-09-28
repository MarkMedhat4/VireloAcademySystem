"use server";

import { createServiceSupabase } from "@/lib/supabase-server";
import { isServiceRoleConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/env";
import { rateLimit, TOO_MANY_MESSAGE } from "@/lib/rate-limit";
import { validateResponse, type FormField, type FormRecord, type FormSettings } from "@/lib/forms";
import type { ActionResult } from "@/lib/types";

export type PublicFormView =
  | { status: "not_found" }
  | { status: "archived"; title: string }
  | { status: "closed"; title: string }
  | { status: "ready"; form: FormRecord; fields: FormField[] };

const FIELD_COLUMNS = "id, form_id, field_key, label, type, placeholder, description, required, validation, options, default_value, sort_order";

/**
 * Loads a form by slug for the public /forms/[slug] page.
 * Drafts are treated as "not found" (they were never announced); archived forms show a
 * dedicated message instead of a generic 404, per the brief.
 */
export async function getFormForPublicView(slug: string): Promise<PublicFormView> {
  if (!isServiceRoleConfigured()) return { status: "not_found" };
  const supabase = createServiceSupabase();
  const { data: form, error } = await supabase.from("forms").select("*").eq("slug", slug).maybeSingle();
  if (error || !form) return { status: "not_found" };
  if (form.status === "draft") return { status: "not_found" };
  if (form.status === "archived") return { status: "archived", title: form.title };

  const settings = form.settings as FormSettings;
  if (settings?.accept_responses === false) return { status: "closed", title: form.title };

  const { data: fields, error: fErr } = await supabase.from("form_fields").select(FIELD_COLUMNS).eq("form_id", form.id).order("sort_order");
  if (fErr) return { status: "not_found" };

  return { status: "ready", form: form as FormRecord, fields: (fields ?? []) as FormField[] };
}

/**
 * Submits a response. The form and its fields are re-fetched here (never trusted from the
 * client) so a form that was archived, closed or edited seconds ago is always re-checked.
 */
export async function submitFormResponse(
  slug: string,
  raw: Record<string, unknown>,
): Promise<ActionResult<{ successMessage: string }>> {
  if (typeof raw === "object" && raw !== null && "website" in raw && (raw as { website?: unknown }).website) {
    return { ok: true, data: { successMessage: "تم إرسال بياناتك بنجاح." } };
  }
  if (!isServiceRoleConfigured()) return { ok: false, message: NOT_CONFIGURED_MESSAGE };
  if (!(await rateLimit("form-submit", 10, 10 * 60_000, slug))) return { ok: false, message: TOO_MANY_MESSAGE };

  const view = await getFormForPublicView(slug);
  if (view.status === "not_found") return { ok: false, message: "النموذج غير موجود." };
  if (view.status === "archived") return { ok: false, message: "هذا النموذج لم يعد يستقبل ردوداً." };
  if (view.status === "closed") return { ok: false, message: "هذا النموذج لم يعد يستقبل ردوداً." };

  const outcome = validateResponse(view.fields, raw);
  if (!outcome.ok) {
    return { ok: false, message: "تحقق من البيانات المُدخلة وحاول مرة أخرى.", fieldErrors: outcome.fieldErrors };
  }

  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase.from("form_responses").insert({ form_id: view.form.id, response_data: outcome.data });
    if (error) {
      console.error("[submitFormResponse]", error.code, error.message);
      return { ok: false, message: "تعذر إرسال البيانات حالياً. يرجى المحاولة مرة أخرى بعد قليل." };
    }
    const settings = view.form.settings as FormSettings;
    return { ok: true, data: { successMessage: settings?.success_message || "تم إرسال بياناتك بنجاح." } };
  } catch (e) {
    console.error("[submitFormResponse] unexpected", e);
    return { ok: false, message: "حدث خطأ في الاتصال. تحقق من الإنترنت وحاول مرة أخرى." };
  }
}
