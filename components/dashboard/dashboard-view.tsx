"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList, CreditCard, FileText, GraduationCap, Hourglass, MessageSquareText, Plus, Users, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DailyPaymentsChart, MonthlyRevenueChart, PaymentsByGradeChart, StudentsByGradeChart } from "@/components/dashboard/charts";
import { PaymentsTable } from "@/components/tables/payments-table";
import { getPaymentProofUrl } from "@/app/admin/actions";
import { ProofDialog, type ProofState } from "@/components/dashboard/proof-dialog";
import { computeKpis, dailyPayments, monthlyRevenue, paymentsByGrade, studentsByGrade } from "@/lib/analytics";
import { STATUS_LABEL_AR } from "@/lib/forms";
import type { RecentResponse } from "@/app/admin/forms-actions";
import type { FormRecord } from "@/lib/forms";
import type { Payment, Student } from "@/lib/types";

function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `منذ ${Math.floor(s / 60)} دقيقة`;
  if (s < 86400) return `منذ ${Math.floor(s / 3600)} ساعة`;
  return `منذ ${Math.floor(s / 86400)} يوم`;
}

export function DashboardView({
  students,
  payments,
  forms,
  recentResponses,
}: {
  students: Student[];
  payments: Payment[];
  forms: Array<FormRecord & { responseCount: number }>;
  recentResponses: RecentResponse[];
}) {
  const [proof, setProof] = useState<ProofState>(null);
  const kpis = computeKpis(students, payments);
  const totalResponses = forms.reduce((s, f) => s + f.responseCount, 0);
  const recentForms = [...forms].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)).slice(0, 5);
  const recentPayments = [...payments].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);

  async function viewProof(path: string) {
    setProof({ status: "loading" });
    try {
      const res = await getPaymentProofUrl(path);
      setProof(res.ok ? { status: "ready", url: res.data.url } : { status: "error", message: res.message });
    } catch {
      setProof({ status: "error", message: "تعذر تحميل الصورة." });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">لوحة التحكم</h1>

      <section aria-label="المؤشرات الرئيسية" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard icon={Users} label="إجمالي الطلاب" value={kpis.totalStudents} />
        <KpiCard icon={CreditCard} label="عمليات الدفع" value={kpis.paymentOps} />
        <KpiCard icon={Wallet} label="إجمالي المدفوعات المسجلة" value={kpis.revenue} suffix="ج.م" />
        <KpiCard icon={Hourglass} label="بانتظار المراجعة" value={kpis.pendingReview} />
        <KpiCard icon={GraduationCap} label="طلاب الأول الثانوي" value={kpis.firstSecondary} />
        <KpiCard icon={GraduationCap} label="طلاب الثاني الثانوي" value={kpis.secondSecondary} />
        <KpiCard icon={ClipboardList} label="النماذج" value={forms.length} />
        <KpiCard icon={MessageSquareText} label="ردود النماذج" value={totalResponses} />
      </section>

      <section aria-label="الرسوم البيانية" className="grid gap-4 xl:grid-cols-2">
        <StudentsByGradeChart data={studentsByGrade(students)} />
        <PaymentsByGradeChart data={paymentsByGrade(payments)} />
        <DailyPaymentsChart data={dailyPayments(payments, 30)} />
        <MonthlyRevenueChart data={monthlyRevenue(payments, 6)} />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card accent className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <h2 className="text-lg">النماذج</h2>
            <Link href="/admin/forms/create" className="on-light inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-navy underline underline-offset-4 hover:text-gold">
              <Plus className="size-4" aria-hidden />
              إنشاء نموذج
            </Link>
          </div>
          <div className="mt-3">
            {recentForms.length === 0 ? (
              <EmptyState icon={FileText} title="لا توجد نماذج بعد" description="أنشئ أول نموذج لبدء استقبال الردود." />
            ) : (
              <ul className="divide-y divide-line">
                {recentForms.map((f) => (
                  <li key={f.id}>
                    <Link href={`/admin/forms/${f.id}`} className="on-light flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-navy/[0.03]">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{f.name}</p>
                        <p className="text-sm text-ink-2 num">{f.responseCount} رد</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-canvas px-3 py-0.5 text-xs font-semibold text-ink-2 ring-1 ring-inset ring-line">
                        {STATUS_LABEL_AR[f.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card accent className="overflow-hidden">
          <div className="px-5 pt-5">
            <h2 className="text-lg">آخر ردود النماذج</h2>
          </div>
          <div className="mt-3">
            {recentResponses.length === 0 ? (
              <EmptyState icon={MessageSquareText} title="لا توجد ردود بعد" description="ستظهر هنا ردود الطلاب بعد إرسال النماذج." />
            ) : (
              <ul className="divide-y divide-line">
                {recentResponses.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/forms/${r.formId}/responses`} className="on-light flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-navy/[0.03]">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{r.preview}</p>
                        <p className="truncate text-sm text-ink-2">{r.formName}</p>
                      </div>
                      <span className="shrink-0 text-xs text-ink-2 num">{timeAgo(r.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card accent className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <h2 className="text-lg">آخر المدفوعات</h2>
          <Link href="/admin/payments" className="on-light min-h-11 px-2 text-sm font-semibold underline underline-offset-4">
            عرض الكل
          </Link>
        </div>
        <div className="mt-3">
          <PaymentsTable rows={recentPayments} pageSize={5} onViewProof={viewProof} />
        </div>
      </Card>

      <ProofDialog state={proof} onClose={() => setProof(null)} />
    </div>
  );
}
