"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Copy, ExternalLink, Eye, ListChecks, Plus, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TextField } from "@/components/ui/field";
import { DynamicFormRenderer } from "@/components/forms/dynamic-form-renderer";
import { FieldRow } from "@/components/dashboard/form-builder/field-row";
import { FieldSettingsPanel } from "@/components/dashboard/form-builder/field-settings-panel";
import { FieldTypePicker } from "@/components/dashboard/form-builder/field-type-picker";
import { archiveForm, createForm, publishForm, restoreForm, saveFormFields, updateFormMeta } from "@/app/admin/forms-actions";
import { SITE } from "@/lib/config";
import { emptyField, isValidSlug, newFieldId, newFieldKey, slugify, STATUS_LABEL_AR, type DraftField, type FieldType, type FormField, type FormRecord } from "@/lib/forms";

interface Props {
  mode: "create" | "edit";
  initialForm?: FormRecord;
  initialFields?: FormField[];
}

function toDraft(fields: FormField[]): DraftField[] {
  return fields.map((f) => ({ ...f }));
}

export function FormBuilder({ mode, initialForm, initialFields }: Props) {
  const router = useRouter();
  const [formId, setFormId] = useState<string | null>(initialForm?.id ?? null);
  const [status, setStatus] = useState(initialForm?.status ?? "draft");
  const [meta, setMeta] = useState({
    name: initialForm?.name ?? "",
    title: initialForm?.title ?? "",
    description: initialForm?.description ?? "",
    slug: initialForm?.slug ?? "",
  });
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [fields, setFields] = useState<DraftField[]>(() => (initialFields ? toDraft(initialFields) : []));
  const [selectedId, setSelectedId] = useState<string | null>(fields[0]?.id ?? null);
  const [showPicker, setShowPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | "archive" | "restore" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selected = fields.find((f) => f.id === selectedId) ?? null;
  const publicUrl = `${SITE.url}/forms/${meta.slug}`;

  function updateField(id: string, patch: Partial<DraftField>) {
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function addField(type: FieldType) {
    const field = emptyField(type, fields.length);
    setFields((fs) => [...fs, field]);
    setSelectedId(field.id);
    setShowPicker(false);
  }

  function move(id: string, dir: -1 | 1) {
    setFields((fs) => {
      const i = fs.findIndex((f) => f.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= fs.length) return fs;
      const next = [...fs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function duplicate(id: string) {
    setFields((fs) => {
      const i = fs.findIndex((f) => f.id === id);
      if (i < 0) return fs;
      const clone: DraftField = { ...fs[i], id: newFieldId(), field_key: newFieldKey() };
      const next = [...fs];
      next.splice(i + 1, 0, clone);
      return next;
    });
  }

  function remove(id: string) {
    setFields((fs) => fs.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function validateMeta(): string | null {
    if (meta.name.trim().length < 2) return "أدخل اسم النموذج.";
    if (meta.title.trim().length < 2) return "أدخل عنوان النموذج.";
    if (!isValidSlug(meta.slug)) return "الرابط يجب أن يكون بحروف إنجليزية صغيرة وأرقام وشرطات فقط، مثل: student-survey.";
    return null;
  }

  async function persist(): Promise<string | null> {
    const err = validateMeta();
    if (err) {
      setError(err);
      return null;
    }
    let id = formId;
    if (!id) {
      const res = await createForm(meta);
      if (!res.ok) {
        setError(res.message);
        return null;
      }
      id = res.data.id;
      setFormId(id);
    } else {
      const res = await updateFormMeta(id, meta);
      if (!res.ok) {
        setError(res.message);
        return null;
      }
    }
    const fieldsRes = await saveFormFields(id, fields);
    if (!fieldsRes.ok) {
      setError(fieldsRes.message);
      return null;
    }
    return id;
  }

  async function onSaveDraft() {
    setBusy("save");
    setError(null);
    setSuccess(null);
    try {
      const id = await persist();
      if (id) {
        setSuccess("تم الحفظ.");
        if (mode === "create") router.push(`/admin/forms/${id}`);
        else router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function onPublish() {
    if (fields.filter((f) => f.type !== "section" && f.type !== "divider").length === 0) {
      setError("أضف حقلاً واحداً على الأقل قبل النشر.");
      return;
    }
    setBusy("publish");
    setError(null);
    setSuccess(null);
    try {
      const id = await persist();
      if (!id) return;
      const res = await publishForm(id);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setStatus("published");
      setSuccess("تم نشر النموذج بنجاح.");
      if (mode === "create") router.push(`/admin/forms/${id}`);
      else router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function onArchive() {
    if (!formId) return;
    setBusy("archive");
    setError(null);
    const res = await archiveForm(formId);
    setBusy(null);
    if (!res.ok) return setError(res.message);
    setStatus("archived");
    router.refresh();
  }

  async function onRestore() {
    if (!formId) return;
    setBusy("restore");
    setError(null);
    const res = await restoreForm(formId);
    setBusy(null);
    if (!res.ok) return setError(res.message);
    setStatus("draft");
    router.refresh();
  }

  const previewFields: FormField[] = useMemo(
    () => fields.map((f) => ({ ...f, id: f.id, form_id: formId ?? "preview" })),
    [fields, formId],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">{mode === "create" ? "إنشاء نموذج" : meta.title || meta.name}</h1>
          {mode === "edit" && (
            <span className="mt-1 inline-block rounded-full bg-canvas px-3 py-0.5 text-xs font-semibold text-ink-2 ring-1 ring-inset ring-line">{STATUS_LABEL_AR[status]}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="size-4" aria-hidden />
            معاينة
          </Button>
          {status !== "published" && (
            <Button variant="secondary" size="sm" onClick={onSaveDraft} loading={busy === "save"}>
              حفظ كمسودة
            </Button>
          )}
          {status === "published" && (
            <Button variant="secondary" size="sm" onClick={onSaveDraft} loading={busy === "save"}>
              حفظ التغييرات
            </Button>
          )}
          {status === "draft" && (
            <Button size="sm" onClick={onPublish} loading={busy === "publish"}>
              نشر
            </Button>
          )}
          {status === "published" && (
            <Button variant="secondary" size="sm" onClick={onArchive} loading={busy === "archive"}>
              أرشفة
            </Button>
          )}
          {status === "archived" && (
            <Button size="sm" onClick={onRestore} loading={busy === "restore"}>
              استعادة كمسودة
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {status === "published" && meta.slug && (
        <Card accent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-sm text-ink-2">الرابط العام</p>
            <p className="truncate font-semibold num" dir="ltr">
              {publicUrl}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(publicUrl);
                  setSuccess("تم نسخ الرابط.");
                } catch {
                  /* ignore */
                }
              }}
            >
              <Copy className="size-4" aria-hidden />
              نسخ الرابط
            </Button>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-navy px-4 text-sm font-semibold hover:border-gold">
              <ExternalLink className="size-4" aria-hidden />
              فتح النموذج
            </a>
            {formId && (
              <Link href={`/admin/forms/${formId}/responses`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-gold px-4 text-sm font-semibold text-navy hover:brightness-105">
                <ListChecks className="size-4" aria-hidden />
                الردود
              </Link>
            )}
          </div>
        </Card>
      )}

      <Card className="space-y-4 p-5">
        <h2 className="text-lg">معلومات النموذج</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="form-name"
            label="اسم النموذج"
            hint="للاستخدام الداخلي في لوحة الإدارة"
            required
            value={meta.name}
            onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
          />
          <TextField
            id="form-title"
            label="العنوان الظاهر للطلاب"
            required
            value={meta.title}
            onChange={(e) => {
              const title = e.target.value;
              setMeta((m) => ({ ...m, title, slug: slugTouched ? m.slug : slugify(title) }));
            }}
          />
        </div>
        <TextField
          id="form-desc"
          label="الوصف (اختياري)"
          value={meta.description}
          onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
        />
        <TextField
          id="form-slug"
          label="الرابط (Slug)"
          required
          ltr
          hint={`سيكون الرابط العام: ${SITE.url}/forms/${meta.slug || "…"}`}
          value={meta.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setMeta((m) => ({ ...m, slug: e.target.value.trim().toLowerCase() }));
          }}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg">الحقول</h2>
            <Button size="sm" onClick={() => setShowPicker(true)}>
              <Plus className="size-4" aria-hidden />
              إضافة حقل
            </Button>
          </div>
          {fields.length === 0 ? (
            <EmptyState title="لا توجد حقول بعد" description="أضف أول حقل لبدء بناء النموذج." />
          ) : (
            <div className="space-y-2">
              {fields.map((f, i) => (
                <FieldRow
                  key={f.id}
                  field={f}
                  selected={f.id === selectedId}
                  isFirst={i === 0}
                  isLast={i === fields.length - 1}
                  onSelect={() => setSelectedId(f.id)}
                  onMoveUp={() => move(f.id, -1)}
                  onMoveDown={() => move(f.id, 1)}
                  onDuplicate={() => duplicate(f.id)}
                  onDelete={() => remove(f.id)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 lg:sticky lg:top-24 lg:h-fit">
          <h2 className="mb-3 text-lg">إعدادات الحقل</h2>
          {selected ? (
            <FieldSettingsPanel field={selected} onChange={(patch) => updateField(selected.id, patch)} />
          ) : (
            <p className="text-sm text-ink-2">اختر حقلاً من القائمة لتعديل إعداداته، أو أضف حقلاً جديداً.</p>
          )}
        </Card>
      </div>

      {showPicker && <FieldTypePicker onPick={addField} onClose={() => setShowPicker(false)} />}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/60 p-4 sm:p-8" onClick={(e) => e.target === e.currentTarget && setShowPreview(false)}>
          <div className="w-full max-w-xl animate-rise rounded-xl bg-white p-5 shadow-2xl sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg">{meta.title || "معاينة النموذج"}</h2>
              <button type="button" onClick={() => setShowPreview(false)} aria-label="إغلاق" className="on-light flex size-11 items-center justify-center rounded-md hover:bg-navy/5">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {meta.description && <p className="mb-4 text-ink-2">{meta.description}</p>}
            <DynamicFormRenderer fields={previewFields} preview />
          </div>
        </div>
      )}
    </div>
  );
}
