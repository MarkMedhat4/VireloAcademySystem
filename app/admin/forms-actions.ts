"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  DEFAULT_SETTINGS,
  isValidSlug,
  LAYOUT_TYPES,
  slugify,
  type DraftField,
  type FormField,
  type FormRecord,
  type FormResponse,
  type FormSettings,
  type FormStatus,
} from "@/lib/forms";
import type { ActionResult } from "@/lib/types";

const FIELD_COLUMNS = "id, form_id, field_key, label, type, placeholder, description, required, validation, options, default_value, sort_order";
const GENERIC_ERROR = "حدث خطأ غير متوقع. حاول مرة أخرى.";

function authFail(): ActionResult<never> {
  return { ok: false, message: "انتهت الجلسة. سجّل الدخول مرة أخرى." };
}

const metaSchema = z.object({
  name: z.string().trim().min(2, "اسم النموذج قصير جداً").max(150),
  title: z.string().trim().min(2, "عنوان النموذج قصير جداً").max(200),
  description: z.string().trim().max(1000).optional().default(""),
  slug: z.string().trim().toLowerCase().refine(isValidSlug, "الرابط يجب أن يكون بحروف إنجليزية صغيرة وأرقام وشرطات فقط"),
});
export type FormMetaInput = z.input<typeof metaSchema>;

const fieldSchema = z.object({
  field_key: z.string().trim().regex(/^[a-z0-9_]+$/),
  label: z.string().trim().max(200),
  type: z.enum([
    "short_text",
    "long_text",
    "number",
    "phone",
    "email",
    "date",
    "dropdown",
    "radio",
    "checkbox_group",
    "section",
    "divider",
  ]),
  placeholder: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  required: z.boolean(),
  validation: z.object({
    min_length: z.number().int().min(0).optional(),
    max_length: z.number().int().min(1).optional(),
    min_value: z.number().optional(),
    max_value: z.number().optional(),
  }),
  options: z.array(z.string().trim().min(1).max(150)).max(50).nullable(),
  default_value: z.string().trim().max(500).nullable().optional(),
  sort_order: z.number().int(),
});

/* ───────── List / read ───────── */

export async function listForms(): Promise<ActionResult<Array<FormRecord & { responseCount: number }>>> {
  try {
    await requireAdmin();
  } catch {
    return authFail();
  }
  const supabase = await createServerSupabase();
  const { data: forms, error } = await supabase.from("forms").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[listForms]", error.message);
    return { ok: false, message: "تعذر تحميل النماذج." };
  }
  const { data: counts } = await supabase.from("form_responses").select("form_id");
  const byForm = new Map<string, number>();
  for (const row of counts ?? []) byForm.set(row.form_id, (byForm.get(row.form_id) ?? 0) + 1);
  return { ok: true, data: (forms as FormRecord[]).map((f) => ({ ...f, responseCount: byForm.get(f.id) ?? 0 })) };
}

export async function getFormWithFields(id: string): Promise<ActionResult<{ form: FormRecord; fields: FormField[] }>> {
  try {
    await requireAdmin();
  } catch {
    return authFail();
  }
  const supabase = await createServerSupabase();
  const { data: form, error } = await supabase.from("forms").select("*").eq("id", id).maybeSingle();
  if (error || !form) return { ok: false, message: "النموذج غير موجود." };
  const { data: fields, error: fErr } = await supabase.from("form_fields").select(FIELD_COLUMNS).eq("form_id", id).order("sort_order");
  if (fErr) return { ok: false, message: "تعذر تحميل حقول النموذج." };
  return { ok: true, data: { form: form as FormRecord, fields: (fields ?? []) as FormField[] } };
}

export async function listResponses(formId: string): Promise<ActionResult<{ form: FormRecord; fields: FormField[]; responses: FormResponse[] }>> {
  const loaded = await getFormWithFields(formId);
  if (!loaded.ok) return loaded;
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("form_responses")
    .select("id, form_id, submitted_at, response_data, created_at")
    .eq("form_id", formId)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) {
    console.error("[listResponses]", error.message);
    return { ok: false, message: "تعذر تحميل الردود." };
  }
  return { ok: true, data: { ...loaded.data, responses: (data ?? []) as FormResponse[] } };
}

export interface RecentResponse {
  id: string;
  formId: string;
  formName: string;
  preview: string;
  createdAt: string;
}

/** Dashboard widget: the most recent responses across every form, newest first. */
export async function listRecentResponses(limit = 5): Promise<ActionResult<RecentResponse[]>> {
  try {
    await requireAdmin();
  } catch {
    return authFail();
  }
  const supabase = await createServerSupabase();
  const { data: forms } = await supabase.from("forms").select("id, name");
  const nameById = new Map((forms ?? []).map((f) => [f.id as string, f.name as string]));

  const { data, error } = await supabase
    .from("form_responses")
    .select("id, form_id, response_data, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[listRecentResponses]", error.message);
    return { ok: false, message: "تعذر تحميل آخر الردود." };
  }
  return {
    ok: true,
    data: (data ?? []).map((r) => {
      const values = Object.values(r.response_data as Record<string, unknown>).filter((v) => typeof v === "string" && v);
      return {
        id: r.id,
        formId: r.form_id,
        formName: nameById.get(r.form_id) ?? "نموذج محذوف",
        preview: (values[0] as string) ?? "رد جديد",
        createdAt: r.created_at,
      };
    }),
  };
}

/* ───────── Create / update ───────── */

export async function createForm(input: FormMetaInput): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch {
    return authFail();
  }
  const parsed = metaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("forms")
    .insert({ ...parsed.data, status: "draft", settings: DEFAULT_SETTINGS })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, message: "هذا الرابط مستخدم بالفعل. اختر رابطاً آخر." };
    console.error("[createForm]", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  return { ok: true, data: { id: data.id } };
}

export async function updateFormMeta(id: string, input: FormMetaInput): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return authFail();
  }
  const parsed = metaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("forms").update(parsed.data).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, message: "هذا الرابط مستخدم بالفعل. اختر رابطاً آخر." };
    console.error("[updateFormMeta]", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  return { ok: true, data: undefined };
}

/**
 * Replaces the full field list for a form. Existing RESPONSES are never touched — they store
 * their own snapshot of the data (keyed by field_key), independent of the current field list,
 * so editing or removing a field can never destroy historical response data.
 */
export async function saveFormFields(formId: string, fields: DraftField[]): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return authFail();
  }
  const parsed = z.array(fieldSchema).safeParse(
    fields.map((f, i) => ({
      field_key: f.field_key,
      label: f.label,
      type: f.type,
      placeholder: f.placeholder,
      description: f.description,
      required: LAYOUT_TYPES.includes(f.type) ? false : f.required,
      validation: f.validation,
      options: f.options,
      default_value: f.default_value,
      sort_order: i,
    })),
  );
  if (!parsed.success) return { ok: false, message: "بيانات الحقول غير صالحة." };

  const supabase = await createServerSupabase();
  const { error: delErr } = await supabase.from("form_fields").delete().eq("form_id", formId);
  if (delErr) {
    console.error("[saveFormFields] delete", delErr.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  if (parsed.data.length > 0) {
    const { error } = await supabase.from("form_fields").insert(parsed.data.map((f) => ({ ...f, form_id: formId })));
    if (error) {
      console.error("[saveFormFields] insert", error.message);
      return { ok: false, message: GENERIC_ERROR };
    }
  }
  return { ok: true, data: undefined };
}

/* ───────── Status actions ───────── */

async function setStatus(id: string, status: FormStatus, extra: Record<string, unknown> = {}): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return authFail();
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("forms").update({ status, ...extra }).eq("id", id);
  if (error) {
    console.error("[setStatus]", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  return { ok: true, data: undefined };
}

export async function publishForm(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return authFail();
  }
  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("form_fields")
    .select("id", { count: "exact", head: true })
    .eq("form_id", id)
    .not("type", "in", "(section,divider)");
  if (!count) return { ok: false, message: "أضف حقلاً واحداً على الأقل قبل النشر." };
  return setStatus(id, "published", { published_at: new Date().toISOString() });
}

export async function archiveForm(id: string): Promise<ActionResult> {
  return setStatus(id, "archived");
}

export async function restoreForm(id: string): Promise<ActionResult> {
  return setStatus(id, "draft");
}

export async function duplicateForm(id: string): Promise<ActionResult<{ id: string }>> {
  const loaded = await getFormWithFields(id);
  if (!loaded.ok) return loaded;
  try {
    await requireAdmin();
  } catch {
    return authFail();
  }

  const { form, fields } = loaded.data;
  let slug = slugify(`${form.slug}-copy`);
  const supabase = await createServerSupabase();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: created, error } = await supabase
      .from("forms")
      .insert({ name: `${form.name} (نسخة)`, title: form.title, description: form.description, slug, status: "draft", settings: form.settings })
      .select("id")
      .single();
    if (!error && created) {
      if (fields.length > 0) {
        await supabase.from("form_fields").insert(
          fields.map((f, i) => ({
            form_id: created.id,
            field_key: f.field_key,
            label: f.label,
            type: f.type,
            placeholder: f.placeholder,
            description: f.description,
            required: f.required,
            validation: f.validation,
            options: f.options,
            default_value: f.default_value,
            sort_order: i,
          })),
        );
      }
      return { ok: true, data: { id: created.id } };
    }
    if (error?.code !== "23505") {
      console.error("[duplicateForm]", error?.message);
      return { ok: false, message: GENERIC_ERROR };
    }
    slug = `${slug}-2`; // slug collision — try a slightly different one
  }
  return { ok: false, message: "تعذر إنشاء نسخة من النموذج." };
}

export async function updateFormSettings(id: string, settings: FormSettings): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return authFail();
  }
  const schema = z.object({ accept_responses: z.boolean(), success_message: z.string().trim().max(500) });
  const parsed = schema.safeParse(settings);
  if (!parsed.success) return { ok: false, message: "إعدادات غير صالحة." };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("forms").update({ settings: parsed.data }).eq("id", id);
  if (error) {
    console.error("[updateFormSettings]", error.message);
    return { ok: false, message: GENERIC_ERROR };
  }
  return { ok: true, data: undefined };
}
