"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { KeyRound, Lock, LogOut, Pencil, Save, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { focusFirstInvalid } from "@/components/forms/form-utils";
import { sendStudentOtp, studentSignOut, updateMyStudent, verifyStudentOtp } from "@/app/actions/student";
import { GRADES } from "@/lib/config";
import type { Student } from "@/lib/types";
import { fieldErrorsOf, isValidPhone, normalizePhone, studentUpdateSchema } from "@/lib/validation";

type Stage = "phone" | "code" | "profile";

const NETWORK_ERROR = "تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.";

export function StudentPortal({ initialStudent, configured }: { initialStudent: Student | null; configured: boolean }) {
  const [stage, setStage] = useState<Stage>(initialStudent ? "profile" : "phone");
  const [student, setStudent] = useState<Student | null>(initialStudent);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ kind: "error" | "success" | "info"; text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ student_name: "", guardian_name: "", guardian_phone: "", grade: "" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    setMessage(null);
    const normalized = normalizePhone(phone);
    if (!isValidPhone(normalized)) {
      setErrors({ phone: "رقم الهاتف غير صحيح. مثال: 01012345678" });
      focusFirstInvalid(formRef.current);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await sendStudentOtp(normalized);
      if (res.ok) {
        setPhone(normalized);
        setStage("code");
        setCode("");
        setCooldown(60);
      } else {
        setErrors(res.fieldErrors ?? {});
        setMessage({ kind: "error", text: res.message });
      }
    } catch {
      setMessage({ kind: "error", text: NETWORK_ERROR });
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setMessage(null);
    setBusy(true);
    try {
      const res = await verifyStudentOtp(phone, code);
      if (res.ok) {
        setStudent(res.data);
        setStage("profile");
        setErrors({});
      } else {
        setErrors(res.fieldErrors ?? {});
        setMessage({ kind: "error", text: res.message });
        focusFirstInvalid(formRef.current);
      }
    } catch {
      setMessage({ kind: "error", text: NETWORK_ERROR });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      await studentSignOut();
    } finally {
      setBusy(false);
      setStudent(null);
      setStage("phone");
      setPhone("");
      setCode("");
      setEditing(false);
      setMessage(null);
    }
  }

  function startEditing() {
    if (!student) return;
    setDraft({ student_name: student.student_name, guardian_name: student.guardian_name, guardian_phone: student.guardian_phone, grade: student.grade });
    setErrors({});
    setMessage(null);
    setEditing(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setMessage(null);
    const parsed = studentUpdateSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      focusFirstInvalid(formRef.current);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await updateMyStudent(draft);
      if (res.ok) {
        setStudent(res.data);
        setEditing(false);
        setMessage({ kind: "success", text: "تم حفظ التعديلات بنجاح." });
      } else {
        setErrors(res.fieldErrors ?? {});
        setMessage({ kind: "error", text: res.message });
        focusFirstInvalid(formRef.current);
      }
    } catch {
      setMessage({ kind: "error", text: NETWORK_ERROR });
    } finally {
      setBusy(false);
    }
  }

  const alert = message && (
    <Alert variant={message.kind} className="mb-5">
      {message.text}
    </Alert>
  );

  /* ───────── Step 1: phone ───────── */
  if (stage === "phone") {
    return (
      <Card accent className="p-6 md:p-8">
        {!configured && <Alert variant="warning" className="mb-5">بوابة الطالب غير متاحة حالياً. يرجى المحاولة لاحقاً.</Alert>}
        {alert}
        <form ref={formRef} onSubmit={requestCode} noValidate className="space-y-5">
          <TextField
            id="phone"
            label="رقم الهاتف"
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            ltr
            placeholder="01012345678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors({});
            }}
            error={errors.phone}
            hint="سنرسل رمز تحقق إلى هذا الرقم للتأكد من هويتك."
          />
          <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!configured}>
            دخول
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-2">
          لم تسجّل بعد؟{" "}
          <Link href="/register" className="on-light font-semibold text-navy underline underline-offset-4 hover:text-gold">
            سجّل من هنا
          </Link>
        </p>
      </Card>
    );
  }

  /* ───────── Step 2: OTP ───────── */
  if (stage === "code") {
    return (
      <Card accent className="p-6 md:p-8">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-gold/40 bg-gold-soft/60">
            <KeyRound className="size-5 text-gold" aria-hidden />
          </div>
          <p className="text-ink-2">
            إذا كان الرقم{" "}
            <span className="font-semibold text-navy num" dir="ltr">
              {phone}
            </span>{" "}
            مسجلاً لدينا فقد أرسلنا إليه رمز تحقق. أدخل الرمز للمتابعة.
          </p>
        </div>
        {alert}
        <form ref={formRef} onSubmit={confirmCode} noValidate className="space-y-5">
          <TextField
            id="code"
            label="رمز التحقق"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            ltr
            maxLength={8}
            placeholder="123456"
            className="text-center text-xl tracking-[0.4em]"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setErrors({});
            }}
            error={errors.code}
          />
          <Button type="submit" size="lg" className="w-full" loading={busy} disabled={code.length < 6}>
            تأكيد
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" size="sm" onClick={() => { setStage("phone"); setMessage(null); setErrors({}); }}>
            تغيير الرقم
          </Button>
          <Button variant="ghost" size="sm" disabled={cooldown > 0 || busy} onClick={() => requestCode()}>
            {cooldown > 0 ? `إعادة إرسال الرمز بعد ${cooldown} ث` : "إعادة إرسال الرمز"}
          </Button>
        </div>
      </Card>
    );
  }

  /* ───────── Step 3: profile ───────── */
  if (!student) return null;

  const rows: Array<[string, string, boolean?]> = [
    ["الاسم", student.student_name],
    ["رقم الطالب", student.student_phone, true],
    ["ولي الأمر", student.guardian_name],
    ["رقم ولي الأمر", student.guardian_phone, true],
    ["الصف", student.grade],
  ];

  return (
    <Card accent className="p-6 md:p-8">
      {alert}
      {editing ? (
        <form ref={formRef} onSubmit={save} noValidate className="space-y-5">
          <TextField
            id="edit_name"
            label="الاسم الرباعي"
            required
            value={draft.student_name}
            onChange={(e) => setDraft((d) => ({ ...d, student_name: e.target.value }))}
            error={errors.student_name}
            maxLength={100}
          />
          <div>
            <p className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
              رقم الطالب <Lock className="size-4 text-ink-2" aria-hidden />
            </p>
            <p className="flex min-h-12 items-center rounded-md border border-line bg-canvas px-4 text-ink-2 num" dir="ltr">
              {student.student_phone}
            </p>
            <p className="mt-2 text-sm text-ink-2">رقم الطالب محمي ولا يمكن تعديله.</p>
          </div>
          <TextField
            id="edit_guardian"
            label="اسم ولي الأمر"
            required
            value={draft.guardian_name}
            onChange={(e) => setDraft((d) => ({ ...d, guardian_name: e.target.value }))}
            error={errors.guardian_name}
            maxLength={100}
          />
          <TextField
            id="edit_guardian_phone"
            label="رقم ولي الأمر"
            required
            type="tel"
            inputMode="numeric"
            ltr
            value={draft.guardian_phone}
            onChange={(e) => setDraft((d) => ({ ...d, guardian_phone: e.target.value }))}
            error={errors.guardian_phone}
          />
          <SelectField
            id="edit_grade"
            label="الصف"
            required
            options={GRADES}
            value={draft.grade}
            onChange={(e) => setDraft((d) => ({ ...d, grade: e.target.value }))}
            error={errors.grade}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" className="sm:flex-1" loading={busy}>
              <Save className="size-5" aria-hidden />
              حفظ التعديلات
            </Button>
            <Button variant="secondary" size="lg" onClick={() => { setEditing(false); setErrors({}); }} disabled={busy}>
              إلغاء
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 text-sm text-success">
            <ShieldCheck className="size-5" aria-hidden />
            تم التحقق من هويتك
          </div>
          <dl className="divide-y divide-line">
            {rows.map(([label, value, ltr]) => (
              <div key={label} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt className="text-sm font-semibold text-ink-2">{label}</dt>
                <dd className={ltr ? "font-semibold num text-start" : "font-semibold"} dir={ltr ? "ltr" : undefined}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="sm:flex-1" onClick={startEditing}>
              <Pencil className="size-5" aria-hidden />
              تعديل البيانات
            </Button>
            <Button variant="secondary" size="lg" onClick={logout} loading={busy}>
              <LogOut className="size-5" aria-hidden />
              تسجيل الخروج
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
