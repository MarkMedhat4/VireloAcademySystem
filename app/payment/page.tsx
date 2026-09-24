import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { Card } from "@/components/ui/card";
import { PaymentForm } from "@/components/forms/payment-form";

export const metadata: Metadata = { title: "دفع الحصة" };

export default function PaymentPage() {
  return (
    <PageShell eyebrow="Payment" title="دفع الحصة" subtitle="اختر الصف لتظهر لك طريقة الدفع المناسبة، ثم ارفع صورة التحويل.">
      <Card accent className="p-6 md:p-8">
        <PaymentForm />
      </Card>
    </PageShell>
  );
}
