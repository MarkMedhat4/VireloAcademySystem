// Uses the global Web Crypto API (available in Node 20+ and every browser) rather than
// "node:crypto", because this module is imported by client components too.
const randomUUID = () => globalThis.crypto.randomUUID();

/* ════════════════════════════════════════════════════════════════
 * Virelo Form Builder — shared types & pure helpers.
 * Used by admin builder (client), public renderer (client), and both
 * server actions (app/actions/forms.ts, app/admin/forms-actions.ts).
 * ════════════════════════════════════════════════════════════════ */

export type FormStatus = "draft" | "published" | "archived";

export const STATUS_LABEL_AR: Record<FormStatus, string> = {
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
};

/**
 * Supported field types. NOT implemented (documented as a limitation in the README):
 * file/image upload, password, url, time, date&time. "Multiple choice" from the brief
 * is the same interaction as "radio" so it isn't duplicated as a separate type.
 */
export type FieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "phone"
  | "email"
  | "date"
  | "dropdown"
  | "radio"
  | "checkbox_group"
  | "section"
  | "divider";

export const CHOICE_TYPES: readonly FieldType[] = ["dropdown", "radio", "checkbox_group"];
export const LAYOUT_TYPES: readonly FieldType[] = ["section", "divider"];

export interface FieldMeta {
  type: FieldType;
  labelAr: string;
  labelEn: string;
}

export const FIELD_TYPES: FieldMeta[] = [
  { type: "short_text", labelAr: "نص قصير", labelEn: "Short Text" },
  { type: "long_text", labelAr: "نص طويل", labelEn: "Long Text" },
  { type: "number", labelAr: "رقم", labelEn: "Number" },
  { type: "phone", labelAr: "رقم هاتف", labelEn: "Phone" },
  { type: "email", labelAr: "بريد إلكتروني", labelEn: "Email" },
  { type: "date", labelAr: "تاريخ", labelEn: "Date" },
  { type: "dropdown", labelAr: "قائمة منسدلة", labelEn: "Dropdown" },
  { type: "radio", labelAr: "اختيار واحد", labelEn: "Radio" },
  { type: "checkbox_group", labelAr: "اختيار متعدد", labelEn: "Checkbox" },
  { type: "section", labelAr: "عنوان قسم", labelEn: "Section / Heading" },
  { type: "divider", labelAr: "خط فاصل", labelEn: "Divider" },
];

export function fieldMeta(type: FieldType): FieldMeta {
  return FIELD_TYPES.find((f) => f.type === type) ?? FIELD_TYPES[0];
}

export interface FieldValidation {
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
}

export interface FormField {
  id: string;
  form_id: string;
  field_key: string;
  label: string;
  type: FieldType;
  placeholder: string | null;
  description: string | null;
  required: boolean;
  validation: FieldValidation;
  options: string[] | null;
  default_value: string | null;
  sort_order: number;
}

/** The shape used while building a form client-side, before it has a form_id / db id. */
export type DraftField = Omit<FormField, "id" | "form_id"> & { id: string; form_id?: string };

export interface FormSettings {
  accept_responses: boolean;
  success_message: string;
}

export const DEFAULT_SETTINGS: FormSettings = {
  accept_responses: true,
  success_message: "تم إرسال بياناتك بنجاح.\nشكرًا لانضمامك إلى Virelo Academy.",
};

export interface FormRecord {
  id: string;
  name: string;
  title: string;
  description: string | null;
  slug: string;
  status: FormStatus;
  settings: FormSettings;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface FormResponse {
  id: string;
  form_id: string;
  submitted_at: string;
  response_data: Record<string, unknown>;
  created_at: string;
}

/* ───────── Slug ───────── */

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && slug.length >= 2 && slug.length <= 80;
}

/** Best-effort slug from a Latin title. Arabic-only titles fall back to a short random slug. */
export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (isValidSlug(base)) return base;
  return `form-${randomUUID().slice(0, 8)}`;
}

/** Internal, stable identifier for a field — independent of its (editable) label. */
export function newFieldKey(): string {
  return `f_${randomUUID().slice(0, 8)}`;
}

export function newFieldId(): string {
  return randomUUID();
}

export function emptyField(type: FieldType, sortOrder: number): DraftField {
  const meta = fieldMeta(type);
  return {
    id: newFieldId(),
    field_key: newFieldKey(),
    label: type === "divider" ? "" : meta.labelAr,
    type,
    placeholder: null,
    description: null,
    required: false,
    validation: {},
    options: CHOICE_TYPES.includes(type) ? ["خيار 1", "خيار 2"] : null,
    default_value: null,
    sort_order: sortOrder,
  };
}

/* ───────── Response validation (server-side, authoritative) ───────── */

export type ResponseData = Record<string, string | string[]>;

export interface ValidationOutcome {
  ok: boolean;
  data: ResponseData;
  fieldErrors: Record<string, string>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{7,15}$/;

/**
 * Validates raw submitted values against the CURRENT field definitions.
 * Always run on the server — this is the only place a submission is trusted.
 */
export function validateResponse(fields: FormField[], raw: Record<string, unknown>): ValidationOutcome {
  const fieldErrors: Record<string, string> = {};
  const data: ResponseData = {};

  for (const field of fields) {
    if (LAYOUT_TYPES.includes(field.type)) continue;
    const value = raw[field.field_key];

    if (field.type === "checkbox_group") {
      const arr = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.length > 0) : [];
      if (field.required && arr.length === 0) {
        fieldErrors[field.field_key] = "هذا الحقل مطلوب";
        continue;
      }
      const allowed = new Set(field.options ?? []);
      if (arr.some((v) => !allowed.has(v))) {
        fieldErrors[field.field_key] = "قيمة غير صالحة";
        continue;
      }
      data[field.field_key] = arr;
      continue;
    }

    const str = typeof value === "string" ? value.trim() : "";
    if (!str) {
      if (field.required) fieldErrors[field.field_key] = "هذا الحقل مطلوب";
      else data[field.field_key] = "";
      continue;
    }

    if ((field.type === "dropdown" || field.type === "radio") && field.options && !field.options.includes(str)) {
      fieldErrors[field.field_key] = "قيمة غير صالحة";
      continue;
    }
    if (field.type === "email" && !EMAIL_RE.test(str)) {
      fieldErrors[field.field_key] = "بريد إلكتروني غير صحيح";
      continue;
    }
    if (field.type === "phone" && !PHONE_RE.test(str.replace(/[\s-]/g, ""))) {
      fieldErrors[field.field_key] = "رقم هاتف غير صحيح";
      continue;
    }
    if (field.type === "number") {
      const n = Number(str);
      if (Number.isNaN(n)) {
        fieldErrors[field.field_key] = "يجب إدخال رقم";
        continue;
      }
      if (field.validation.min_value !== undefined && n < field.validation.min_value) {
        fieldErrors[field.field_key] = `يجب ألا يقل عن ${field.validation.min_value}`;
        continue;
      }
      if (field.validation.max_value !== undefined && n > field.validation.max_value) {
        fieldErrors[field.field_key] = `يجب ألا يزيد عن ${field.validation.max_value}`;
        continue;
      }
    }
    if (field.type === "date" && Number.isNaN(Date.parse(str))) {
      fieldErrors[field.field_key] = "تاريخ غير صحيح";
      continue;
    }
    if (field.validation.min_length !== undefined && str.length < field.validation.min_length) {
      fieldErrors[field.field_key] = `يجب ألا يقل عن ${field.validation.min_length} حرف`;
      continue;
    }
    if (field.validation.max_length !== undefined && str.length > field.validation.max_length) {
      fieldErrors[field.field_key] = `يجب ألا يزيد عن ${field.validation.max_length} حرف`;
      continue;
    }

    data[field.field_key] = str;
  }

  return { ok: Object.keys(fieldErrors).length === 0, data, fieldErrors };
}

/** Value formatter for tables / exports / response detail view. */
export function formatFieldValue(value: unknown): string {
  if (Array.isArray(value)) return value.join("، ");
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
