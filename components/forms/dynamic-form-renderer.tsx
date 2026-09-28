"use client";

import { useRef, useState } from "react";
import { CircleCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { focusFirstInvalid, honeypotClass } from "@/components/forms/form-utils";
import type { FormField } from "@/lib/forms";
import { cn } from "@/lib/utils";

type Values = Record<string, string | string[]>;

function initialValues(fields: FormField[]): Values {
  const v: Values = {};
  for (const f of fields) {
    if (f.type === "section" || f.type === "divider") continue;
    v[f.field_key] = f.type === "checkbox_group" ? (f.default_value ? [f.default_value] : []) : (f.default_value ?? "");
  }
  return v;
}

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: FormField;
  value: string | string[] | undefined;
  error?: string;
  onChange: (v: string | string[]) => void;
}) {
  const id = `df_${field.field_key}`;

  if (field.type === "section") {
    return (
      <div className="border-t border-line pt-6 first:border-t-0 first:pt-0">
        {field.label && <h3 className="text-xl">{field.label}</h3>}
        {field.description && <p className="mt-1 text-ink-2">{field.description}</p>}
      </div>
    );
  }
  if (field.type === "divider") return <hr className="border-line" />;

  if (field.type === "long_text") {
    return (
      <div>
        <label htmlFor={id} className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          {field.label} {field.required && <span className="text-danger" aria-hidden>*</span>}
        </label>
        <textarea
          id={id}
          required={field.required}
          placeholder={field.placeholder ?? undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : field.description ? `${id}-hint` : undefined}
          rows={4}
          className={cn(
            "w-full rounded-md border bg-white px-4 py-3 text-base outline-none transition duration-200 ease-out placeholder:text-mute focus:ring-4",
            error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-line focus:border-gold focus:ring-gold/25",
          )}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
        {field.description && !error && (
          <p id={`${id}-hint`} className="mt-2 text-sm text-ink-2">
            {field.description}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="mt-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (field.type === "dropdown") {
    return (
      <div>
        <label htmlFor={id} className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          {field.label} {field.required && <span className="text-danger" aria-hidden>*</span>}
        </label>
        <select
          id={id}
          required={field.required}
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-12 w-full rounded-md border bg-white px-4 text-base outline-none transition duration-200 ease-out focus:ring-4",
            error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-line focus:border-gold focus:ring-gold/25",
          )}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">اختر…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      </div>
    );
  }

  if (field.type === "radio" || field.type === "checkbox_group") {
    const selected = field.type === "checkbox_group" ? ((value as string[]) ?? []) : (value as string);
    return (
      <fieldset>
        <legend className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          {field.label} {field.required && <span className="text-danger" aria-hidden>*</span>}
        </legend>
        <div className="space-y-2">
          {(field.options ?? []).map((o) => {
            const checked = field.type === "checkbox_group" ? (selected as string[]).includes(o) : selected === o;
            return (
              <label
                key={o}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-4 transition duration-200",
                  "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gold/30",
                  checked ? "border-gold bg-gold-soft/60" : "border-line bg-white hover:border-gold/50",
                )}
              >
                <input
                  type={field.type === "checkbox_group" ? "checkbox" : "radio"}
                  name={id}
                  checked={checked}
                  onChange={() => {
                    if (field.type === "checkbox_group") {
                      const arr = selected as string[];
                      onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o]);
                    } else {
                      onChange(o);
                    }
                  }}
                  className="size-4 accent-[var(--color-gold)]"
                />
                {o}
              </label>
            );
          })}
        </div>
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      </fieldset>
    );
  }

  const inputType = field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text";
  return (
    <TextField
      id={id}
      label={field.label}
      required={field.required}
      type={inputType}
      ltr={field.type === "number" || field.type === "phone" || field.type === "email" || field.type === "date"}
      placeholder={field.placeholder ?? undefined}
      hint={field.description ?? undefined}
      error={error}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

interface Props {
  fields: FormField[];
  /** Preview mode never calls the server and always shows a static "submit disabled" note. */
  preview?: boolean;
  onSubmit?: (data: Record<string, string | string[]>) => Promise<{ ok: true; message: string } | { ok: false; message: string; fieldErrors?: Record<string, string> }>;
}

export function DynamicFormRenderer({ fields, preview, onSubmit }: Props) {
  const [values, setValues] = useState<Values>(() => initialValues(fields));
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || preview || !onSubmit) return;
    setFormError(null);
    setBusy(true);
    try {
      const res = await onSubmit({ ...values, ...(website ? { website } : {}) });
      if (res.ok) {
        setDone(res.message);
      } else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.message);
        focusFirstInvalid(formRef.current);
      }
    } catch {
      setFormError("تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="animate-rise text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
          <CircleCheck className="size-9" aria-hidden />
        </div>
        <p role="status" className="mt-6 whitespace-pre-line text-lg font-semibold text-success">
          {done}
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
      {preview && (
        <Alert variant="info" title="معاينة">
          هذا عرض تجريبي — لن يتم إرسال أي بيانات.
        </Alert>
      )}
      {formError && <Alert variant="error">{formError}</Alert>}

      {fields.map((f) => (
        <FieldRenderer key={f.id} field={f} value={values[f.field_key]} error={errors[f.field_key]} onChange={(v) => setValues((s) => ({ ...s, [f.field_key]: v }))} />
      ))}

      {!preview && (
        <div className={honeypotClass} aria-hidden>
          <label>
            Website
            <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={busy} disabled={preview}>
        {preview ? "إرسال (معطّل في المعاينة)" : "إرسال"}
      </Button>
    </form>
  );
}
