"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CircleCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { focusFirstInvalid, honeypotClass } from "@/components/forms/form-utils";
import { registerStudent } from "@/app/actions/register";
import { GRADES } from "@/lib/config";
import { fieldErrorsOf, registerSchema } from "@/lib/validation";

const empty = { student_name: "", student_phone: "", guardian_name: "", guardian_phone: "", grade: "", website: "" };

export function RegisterForm() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ phone: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      focusFirstInvalid(formRef.current);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await registerStudent(values);
      if (res.ok) {
        setDone({ phone: parsed.data.student_phone });
        requestAnimationFrame(() => successRef.current?.focus());
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
        <div ref={successRef} tabIndex={-1} role="status" className="mt-6 outline-none">
          <h2 className="text-2xl text-success">تم تسجيل الطالب بنجاح.</h2>
          <p className="mt-2 text-ink-2">احتفظ برقم الهاتف لاستخدام بوابة الطالب.</p>
          <p className="mt-4 inline-block rounded-md border border-line bg-canvas px-4 py-2 font-semibold num" dir="ltr">
            {done.phone}
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/payment">دفع حصة</ButtonLink>
          <ButtonLink href="/student" variant="secondary">
            بوابة الطالب
          </ButtonLink>
        </div>
        <button
          type="button"
          className="mt-4 min-h-11 px-4 text-sm font-semibold text-ink-2 underline underline-offset-4 hover:text-navy"
          onClick={() => {
            setValues(empty);
            setDone(null);
          }}
        >
          تسجيل طالب آخر
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert variant="error">{formError}</Alert>}

      <TextField
        id="student_name"
        label="الاسم الرباعي"
        required
        autoComplete="name"
        value={values.student_name}
        onChange={set("student_name")}
        error={errors.student_name}
        maxLength={100}
      />
      <TextField
        id="student_phone"
        label="الرقم تلفون"
        required
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        ltr
        placeholder="01012345678"
        value={values.student_phone}
        onChange={set("student_phone")}
        error={errors.student_phone}
        hint="رقم الطالب هو اسم الدخول إلى بوابة الطالب."
      />
      <TextField
        id="guardian_name"
        label="الاسم ولي الأمر"
        required
        autoComplete="off"
        value={values.guardian_name}
        onChange={set("guardian_name")}
        error={errors.guardian_name}
        maxLength={100}
      />
      <TextField
        id="guardian_phone"
        label="رقم ولي الأمر"
        required
        type="tel"
        inputMode="numeric"
        autoComplete="off"
        ltr
        placeholder="01012345678"
        value={values.guardian_phone}
        onChange={set("guardian_phone")}
        error={errors.guardian_phone}
      />
      <SelectField
        id="grade"
        label="الصف الدراسي"
        required
        options={GRADES}
        value={values.grade}
        onChange={set("grade")}
        error={errors.grade}
      />

      <div className={honeypotClass} aria-hidden>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
        </label>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={busy}>
        {busy ? "جارٍ الحفظ…" : "تسجيل الطالب"}
      </Button>
      <p className="text-center text-sm text-ink-2">
        مسجّل بالفعل؟{" "}
        <Link href="/student" className="on-light font-semibold text-navy underline underline-offset-4 hover:text-gold">
          ادخل إلى بوابة الطالب
        </Link>
      </p>
    </form>
  );
}
