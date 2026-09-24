"use client";

import { useRef, useState } from "react";
import { CircleCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { PaymentInstructions } from "@/components/forms/payment-instructions";
import { ProofUpload } from "@/components/forms/proof-upload";
import { WhatsAppIcon } from "@/components/site/brand-icons";
import { focusFirstInvalid, honeypotClass } from "@/components/forms/form-utils";
import { preparePaymentProof, submitPayment } from "@/app/actions/payment";
import { GRADES, PROOF_BUCKET } from "@/lib/config";
import { buildWhatsAppLink } from "@/lib/payment";
import { createBrowserSupabase } from "@/lib/supabase";
import { fieldErrorsOf, isValidPhone, normalizePhone, paymentFieldsSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

const empty = { student_name: "", student_phone: "", sender_number: "", grade: "", paid: "" as "" | "paid" | "unpaid", website: "" };

type Done = { paid: boolean; student_name: string; sender_number: string | null; grade: string };

export function PaymentForm() {
  const [values, setValues] = useState(empty);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "uploading" | "saving">("idle");
  const [done, setDone] = useState<Done | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const busy = stage !== "idle";

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(null);

    const errs: Record<string, string> = {};
    if (!values.paid) errs.paid = "اختر حالة الدفع";
    const paid = values.paid === "paid";

    const parsed = paymentFieldsSchema.safeParse({ ...values, paid });
    if (!parsed.success) Object.assign(errs, fieldErrorsOf(parsed.error));
    // Zod skips object-level rules while field errors exist, so check the sender number here too.
    if (!errs.sender_number) {
      const sender = normalizePhone(values.sender_number);
      if (paid && !values.sender_number.trim()) errs.sender_number = "الرقم الذي تم التحويل منه مطلوب";
      else if (values.sender_number.trim() && !isValidPhone(sender)) errs.sender_number = "رقم الهاتف غير صحيح. مثال: 01012345678";
    }
    if (paid && !file) errs.proof = "صورة الدفع مطلوبة";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      focusFirstInvalid(formRef.current);
      return;
    }
    setErrors({});

    try {
      let proofPath: string | null = null;
      if (paid && file) {
        setStage("uploading");
        const prep = await preparePaymentProof({ contentType: file.type, size: file.size });
        if (!prep.ok) {
          setFormError(prep.message);
          return;
        }
        const supabase = createBrowserSupabase();
        const { error: upErr } = await supabase.storage
          .from(PROOF_BUCKET)
          .uploadToSignedUrl(prep.data.path, prep.data.token, file, { contentType: file.type });
        if (upErr) {
          console.error("proof upload failed", upErr.message);
          setFormError("تعذر رفع صورة الدفع. تحقق من الإنترنت وحاول مرة أخرى.");
          return;
        }
        proofPath = prep.data.path;
      }

      setStage("saving");
      const res = await submitPayment({ ...values, paid, proof_path: proofPath });
      if (res.ok) {
        setDone(res.data);
        requestAnimationFrame(() => successRef.current?.focus());
      } else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.message);
        focusFirstInvalid(formRef.current);
      }
    } catch {
      setFormError("تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setStage("idle");
    }
  }

  if (done) {
    return (
      <div className="animate-rise text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
          <CircleCheck className="size-9" aria-hidden />
        </div>
        <div ref={successRef} tabIndex={-1} role="status" className="mt-6 outline-none">
          <h2 className="text-2xl text-success">
            {done.paid ? "تم تسجيل الدفع ورفع صورة الإثبات بنجاح." : "تم تسجيل بياناتك."}
          </h2>
          {!done.paid && <p className="mt-2 text-ink-2">يمكنك إتمام الدفع وإرسال صورة التحويل لاحقاً من نفس الصفحة.</p>}
        </div>

        {done.paid && done.sender_number && (
          <div className="mx-auto mt-8 max-w-md rounded-lg border border-line bg-canvas p-5 text-start">
            <p className="font-semibold">أرسل إشعار الدفع عبر واتساب</p>
            <p className="mt-1 text-sm text-ink-2">
              سيفتح واتساب برسالة جاهزة. اضغط «إرسال» داخل واتساب لإتمام الإشعار — هذه رسالة من هاتفك وليست رسالة تلقائية من الخادم.
            </p>
            <a
              href={buildWhatsAppLink({ studentName: done.student_name, senderNumber: done.sender_number, grade: done.grade })}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonClasses("primary", "md"), "mt-4 w-full")}
            >
              <WhatsAppIcon className="size-5" />
              إرسال عبر واتساب
            </a>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/student" variant="secondary">
            بوابة الطالب
          </ButtonLink>
          <Button
            variant="ghost"
            onClick={() => {
              setValues(empty);
              setFile(null);
              setDone(null);
            }}
          >
            تسجيل دفعة أخرى
          </Button>
        </div>
      </div>
    );
  }

  const paid = values.paid === "paid";

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert variant="error">{formError}</Alert>}

      <TextField
        id="student_name"
        label="الاسم الطالب الرباعي"
        required
        autoComplete="name"
        value={values.student_name}
        onChange={set("student_name")}
        error={errors.student_name}
        maxLength={100}
      />
      <TextField
        id="student_phone"
        label="الرقم التلفون طالب"
        required
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        ltr
        placeholder="01012345678"
        value={values.student_phone}
        onChange={set("student_phone")}
        error={errors.student_phone}
      />
      <SelectField id="grade" label="الصف" required options={GRADES} value={values.grade} onChange={set("grade")} error={errors.grade} />

      <PaymentInstructions grade={values.grade} />

      <fieldset aria-describedby={errors.paid ? "paid-error" : undefined}>
        <legend className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
          دفع ولا لا <span className="text-danger" aria-hidden>*</span>
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: "paid", label: "دفع" },
            { v: "unpaid", label: "لم يتم الدفع" },
          ].map((o) => (
            <label
              key={o.v}
              className={cn(
                "flex min-h-12 cursor-pointer items-center justify-center rounded-md border px-4 font-semibold transition duration-200",
                "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gold/30",
                values.paid === o.v ? "border-gold bg-gold-soft/60 text-navy" : "border-line bg-white text-ink-2 hover:border-gold/60",
                errors.paid && "border-danger",
              )}
            >
              <input
                type="radio"
                name="paid"
                value={o.v}
                checked={values.paid === o.v}
                onChange={set("paid")}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
        {errors.paid && (
          <p id="paid-error" className="mt-2 text-sm font-medium text-danger">
            {errors.paid}
          </p>
        )}
      </fieldset>

      <TextField
        id="sender_number"
        label="رقم تم تحويل منه"
        required={paid}
        optionalLabel={!paid}
        type="tel"
        inputMode="numeric"
        ltr
        placeholder="01012345678"
        value={values.sender_number}
        onChange={set("sender_number")}
        error={errors.sender_number}
        hint={paid ? undefined : "اتركه فارغاً إذا لم يتم الدفع بعد."}
      />

      {paid && (
        <div className="animate-rise">
          <ProofUpload
            file={file}
            error={errors.proof}
            onChange={(f) => {
              setFile(f);
              if (errors.proof) setErrors((p) => ({ ...p, proof: "" }));
            }}
          />
        </div>
      )}

      <div className={honeypotClass} aria-hidden>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
        </label>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={busy}>
        {stage === "uploading" ? "جارٍ رفع الصورة…" : stage === "saving" ? "جارٍ حفظ الدفع…" : "تأكيد"}
      </Button>
    </form>
  );
}
