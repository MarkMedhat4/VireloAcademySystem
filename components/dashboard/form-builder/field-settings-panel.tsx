"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { TextField } from "@/components/ui/field";
import { CHOICE_TYPES, fieldMeta, LAYOUT_TYPES, type DraftField } from "@/lib/forms";
import { cn } from "@/lib/utils";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-line bg-white px-4">
      <span className="text-sm font-semibold">{label}</span>
      <span
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 outline-none focus-visible:ring-4 focus-visible:ring-gold/30", checked ? "bg-gold" : "bg-line")}
      >
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200", checked ? "start-0.5" : "start-5")} />
      </span>
    </label>
  );
}

export function FieldSettingsPanel({ field, onChange }: { field: DraftField; onChange: (patch: Partial<DraftField>) => void }) {
  const isChoice = CHOICE_TYPES.includes(field.type);
  const isLayout = LAYOUT_TYPES.includes(field.type);
  const isText = field.type === "short_text" || field.type === "long_text" || field.type === "phone" || field.type === "email";
  const isNumber = field.type === "number";

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-2" lang="en" dir="ltr">
        {fieldMeta(field.type).labelEn}
      </p>

      <TextField id="fs-label" label={field.type === "divider" ? "تسمية داخلية (اختياري)" : "التسمية"} value={field.label} onChange={(e) => onChange({ label: e.target.value })} />

      {field.type === "section" && (
        <div>
          <label htmlFor="fs-desc" className="mb-2 block text-[15px] font-semibold">
            نص توضيحي
          </label>
          <textarea
            id="fs-desc"
            rows={2}
            className="w-full rounded-md border border-line bg-white px-4 py-3 outline-none focus:border-gold focus:ring-4 focus:ring-gold/25"
            value={field.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
      )}

      {!isLayout && (
        <>
          {(isText || isNumber) && (
            <TextField id="fs-placeholder" label="نص توضيحي داخل الحقل" value={field.placeholder ?? ""} onChange={(e) => onChange({ placeholder: e.target.value })} />
          )}
          <TextField id="fs-help" label="نص مساعد" hint="يظهر أسفل الحقل" value={field.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} />

          <Toggle checked={field.required} onChange={(v) => onChange({ required: v })} label="حقل مطلوب" />

          {isText && (
            <div className="grid grid-cols-2 gap-3">
              <TextField
                id="fs-min"
                label="أقل عدد أحرف"
                type="number"
                min={0}
                value={field.validation.min_length?.toString() ?? ""}
                onChange={(e) => onChange({ validation: { ...field.validation, min_length: e.target.value ? Number(e.target.value) : undefined } })}
              />
              <TextField
                id="fs-max"
                label="أقصى عدد أحرف"
                type="number"
                min={1}
                value={field.validation.max_length?.toString() ?? ""}
                onChange={(e) => onChange({ validation: { ...field.validation, max_length: e.target.value ? Number(e.target.value) : undefined } })}
              />
            </div>
          )}
          {isNumber && (
            <div className="grid grid-cols-2 gap-3">
              <TextField
                id="fs-minv"
                label="أقل قيمة"
                type="number"
                value={field.validation.min_value?.toString() ?? ""}
                onChange={(e) => onChange({ validation: { ...field.validation, min_value: e.target.value ? Number(e.target.value) : undefined } })}
              />
              <TextField
                id="fs-maxv"
                label="أقصى قيمة"
                type="number"
                value={field.validation.max_value?.toString() ?? ""}
                onChange={(e) => onChange({ validation: { ...field.validation, max_value: e.target.value ? Number(e.target.value) : undefined } })}
              />
            </div>
          )}

          {isChoice && (
            <div>
              <p className="mb-2 text-[15px] font-semibold">الخيارات</p>
              <div className="space-y-2">
                {(field.options ?? []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <GripVertical className="size-4 shrink-0 text-mute" aria-hidden />
                    <input
                      aria-label={`خيار ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...(field.options ?? [])];
                        next[i] = e.target.value;
                        onChange({ options: next });
                      }}
                      className="h-11 w-full rounded-md border border-line bg-white px-3 outline-none focus:border-gold focus:ring-4 focus:ring-gold/25"
                    />
                    <button
                      type="button"
                      aria-label="حذف الخيار"
                      onClick={() => onChange({ options: (field.options ?? []).filter((_, idx) => idx !== i) })}
                      disabled={(field.options ?? []).length <= 1}
                      className="flex size-11 shrink-0 items-center justify-center rounded-md text-ink-2 transition hover:bg-danger-soft hover:text-danger disabled:opacity-40"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onChange({ options: [...(field.options ?? []), `خيار ${(field.options?.length ?? 0) + 1}`] })}
                className="on-light mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-navy underline underline-offset-4 hover:text-gold"
              >
                <Plus className="size-4" aria-hidden />
                إضافة خيار
              </button>
            </div>
          )}

          {(field.type === "dropdown" || field.type === "radio") && (
            <TextField id="fs-default" label="القيمة الافتراضية (اختياري)" value={field.default_value ?? ""} onChange={(e) => onChange({ default_value: e.target.value })} />
          )}
        </>
      )}
    </div>
  );
}
