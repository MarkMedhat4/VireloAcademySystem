"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldShell, TextField, inputBase, inputBad, inputOk } from "@/components/ui/field";
import { Logo } from "@/components/site/logo";
import { focusFirstInvalid } from "@/components/forms/form-utils";
import { adminLogin } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const next: Record<string, string> = {};
    if (identifier.trim().length < 3) next.identifier = "أدخل اسم المستخدم";
    if (!password) next.password = "أدخل كلمة المرور";
    setErrs(next);
    if (Object.keys(next).length) {
      focusFirstInvalid(formRef.current);
      return;
    }
    setBusy(true);
    try {
      const res = await adminLogin({ identifier, password });
      if (res.ok) {
        setPassword("");
        router.refresh();
      } else {
        setError(res.message);
        setPassword("");
      }
    } catch {
      setError("تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card accent className="mx-auto max-w-md p-6 md:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo size={88} />
        <h2 className="mt-4 flex items-center gap-2 text-xl" lang="en" dir="ltr">
          <Lock className="size-5 text-gold" aria-hidden />
          Virelo Admin
        </h2>
        <p className="mt-1 text-sm text-ink-2">تسجيل الدخول للإدارة فقط.</p>
      </div>

      {!configured && <Alert variant="warning" className="mb-5">لم يتم ربط قاعدة البيانات بعد. راجع ملف README لإعداد Supabase.</Alert>}
      {error && <Alert variant="error" className="mb-5">{error}</Alert>}

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
        <TextField
          id="identifier"
          label="اسم المستخدم"
          required
          ltr
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errs.identifier}
        />
        <FieldShell id="password" label="كلمة المرور" required error={errs.password}>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              dir="ltr"
              autoComplete="current-password"
              aria-invalid={errs.password ? true : undefined}
              aria-describedby={errs.password ? "password-error" : undefined}
              className={cn(inputBase, "pe-14 text-start", errs.password ? inputBad : inputOk)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="on-light absolute end-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-ink-2 hover:text-navy"
            >
              {show ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
            </button>
          </div>
        </FieldShell>
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!configured}>
          دخول
        </Button>
      </form>
    </Card>
  );
}
