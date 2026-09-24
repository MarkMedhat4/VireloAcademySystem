import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = { title: "تسجيل طالب" };

export default function RegisterPage() {
  return (
    <PageShell eyebrow="Student Registration" title="تسجيل طالب" subtitle="املأ البيانات بدقة. جميع الحقول مطلوبة.">
      <Card accent className="p-6 md:p-8">
        <RegisterForm />
      </Card>
    </PageShell>
  );
}
