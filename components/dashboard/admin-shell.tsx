"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CreditCard, Download, GraduationCap, Hourglass, LayoutDashboard, LogOut, RefreshCw, Search, Users, Wallet, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DailyPaymentsChart, MonthlyRevenueChart, PaymentsByGradeChart, StudentsByGradeChart } from "@/components/dashboard/charts";
import { ProofDialog, type ProofState } from "@/components/dashboard/proof-dialog";
import { StudentsTable, studentCsvHeaders, studentCsvRow } from "@/components/tables/students-table";
import { PaymentsTable, paymentCsvHeaders, paymentCsvRow } from "@/components/tables/payments-table";
import { adminLogout, getPaymentProofUrl, setPaymentStatus } from "@/app/admin/actions";
import {
  computeKpis,
  dailyPayments,
  filterPayments,
  filterStudents,
  monthlyRevenue,
  NO_FILTERS,
  paymentsByGrade,
  STATE_LABEL,
  studentsByGrade,
  type Filters,
} from "@/lib/analytics";
import { GRADES, GRADE_SHORT, type Grade } from "@/lib/config";
import { downloadCsv } from "@/lib/csv";
import { formatEgp } from "@/lib/payment";
import type { Payment, PaymentStatus, Student } from "@/lib/types";
import { cn } from "@/lib/utils";
import { inputBase, inputOk } from "@/components/ui/field";

type View = "dashboard" | "students" | "payments";

const NAV: Array<{ id: View; label: string; icon: typeof Users }> = [
  { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { id: "students", label: "الطلاب", icon: Users },
  { id: "payments", label: "المدفوعات", icon: Wallet },
];

const fieldClass = cn(inputBase, inputOk, "h-11 text-sm");

export function AdminShell({ admin, students, payments }: { admin: { name: string }; students: Student[]; payments: Payment[] }) {
  const router = useRouter();
  const [view, setView] = useState<View>("dashboard");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [overrides, setOverrides] = useState<Record<string, PaymentStatus>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [proof, setProof] = useState<ProofState>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const [loggingOut, setLoggingOut] = useState(false);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);

  const allPayments = useMemo(() => payments.map((p) => (overrides[p.id] ? { ...p, status: overrides[p.id] } : p)), [payments, overrides]);

  // KPIs + charts respond to the "slicers" (grade + dates) only; search/status narrow the tables.
  const slicers: Filters = { ...NO_FILTERS, grade: filters.grade, from: filters.from, to: filters.to };
  const kpiStudents = useMemo(() => filterStudents(students, slicers), [students, filters.grade, filters.from, filters.to]); // eslint-disable-line react-hooks/exhaustive-deps
  const kpiPayments = useMemo(() => filterPayments(allPayments, slicers), [allPayments, filters.grade, filters.from, filters.to]); // eslint-disable-line react-hooks/exhaustive-deps
  const kpis = computeKpis(kpiStudents, kpiPayments);

  const tableStudents = useMemo(() => filterStudents(students, filters), [students, filters]);
  const paymentFilters = view === "payments" ? filters : { ...filters, status: "" };
  const tablePayments = useMemo(() => filterPayments(allPayments, paymentFilters), [allPayments, filters, view]); // eslint-disable-line react-hooks/exhaustive-deps

  async function viewProof(path: string) {
    setProof({ status: "loading" });
    try {
      const res = await getPaymentProofUrl(path);
      setProof(res.ok ? { status: "ready", url: res.data.url } : { status: "error", message: res.message });
    } catch {
      setProof({ status: "error", message: "تعذر تحميل الصورة. حاول مرة أخرى." });
    }
  }

  async function changeStatus(id: string, status: PaymentStatus) {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await setPaymentStatus(id, status);
      if (res.ok) setOverrides((o) => ({ ...o, [id]: res.data.status }));
      else setNotice(res.message);
    } catch {
      setNotice("تعذر تحديث الحالة. تحقق من الإنترنت وحاول مرة أخرى.");
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await adminLogout();
    } finally {
      router.refresh();
    }
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const exportStudents = () => downloadCsv(`virelo-students-${stamp}.csv`, studentCsvHeaders, tableStudents.map(studentCsvRow));
  const exportPayments = () => downloadCsv(`virelo-payments-${stamp}.csv`, paymentCsvHeaders, tablePayments.map(paymentCsvRow));

  const searching = filters.q.trim().length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[248px_1fr] lg:items-start">
      {/* ───────── Sidebar ───────── */}
      <aside className="rounded-lg bg-navy p-4 text-white shadow-lift lg:sticky lg:top-24">
        <div className="hidden lg:block">
          <p className="text-lg font-bold">
            <bdi lang="en" dir="ltr">
              Virelo <span className="text-gold">Admin</span>
            </bdi>
          </p>
          <p className="mt-1 truncate text-sm text-white/70">{admin.name}</p>
          <div className="gold-rule my-4" />
        </div>
        <nav aria-label="أقسام لوحة التحكم" className="grid grid-cols-3 gap-2 lg:grid-cols-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors duration-200 lg:min-h-11 lg:flex-row lg:justify-start lg:gap-2 lg:px-3 lg:text-sm",
                view === id ? "bg-white/10 text-gold shadow-[inset_3px_0_0_var(--color-gold)] rtl:shadow-[inset_-3px_0_0_var(--color-gold)]" : "text-white/80 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 lg:grid-cols-1">
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={refreshing}
            className="flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white disabled:opacity-60 lg:justify-start"
          >
            <RefreshCw className={cn("size-5", refreshing && "animate-spin")} aria-hidden />
            تحديث البيانات
          </button>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white disabled:opacity-60 lg:justify-start"
          >
            <LogOut className="size-5" aria-hidden />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ───────── Main ───────── */}
      <div className="min-w-0 space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1.4fr_1.2fr_1fr_1fr_auto]">
            <div className="relative sm:col-span-2 xl:col-span-1">
              <label htmlFor="admin-search" className="sr-only">بحث في الطلاب والمدفوعات</label>
              <Search className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-mute" aria-hidden />
              <input
                id="admin-search"
                type="search"
                value={filters.q}
                onChange={(e) => set({ q: e.target.value })}
                placeholder="ابحث بالاسم أو الهاتف أو الصف…"
                className={cn(fieldClass, "ps-10")}
              />
            </div>
            <div>
              <label htmlFor="f-grade" className="sr-only">الصف</label>
              <select id="f-grade" value={filters.grade} onChange={(e) => set({ grade: e.target.value })} className={fieldClass}>
                <option value="">كل الصفوف</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {GRADE_SHORT[g as Grade]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-status" className="sr-only">حالة الدفع</label>
              <select
                id="f-status"
                value={view === "payments" ? filters.status : ""}
                onChange={(e) => set({ status: e.target.value })}
                disabled={view !== "payments"}
                className={fieldClass}
                title={view !== "payments" ? "فلتر الحالة متاح في قسم المدفوعات" : undefined}
              >
                <option value="">كل الحالات</option>
                {(["paid", "pending", "rejected", "unpaid"] as const).map((s) => (
                  <option key={s} value={s}>
                    {STATE_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-from" className="sr-only">من تاريخ</label>
              <input id="f-from" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set({ from: e.target.value })} className={cn(fieldClass, "num")} dir="ltr" title="من تاريخ" />
            </div>
            <div>
              <label htmlFor="f-to" className="sr-only">إلى تاريخ</label>
              <input id="f-to" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set({ to: e.target.value })} className={cn(fieldClass, "num")} dir="ltr" title="إلى تاريخ" />
            </div>
            <Button variant="secondary" size="sm" onClick={() => setFilters(NO_FILTERS)} disabled={!hasFilters} className="sm:col-span-2 xl:col-span-1">
              <X className="size-4" aria-hidden />
              مسح
            </Button>
          </div>
        </Card>

        {notice && <Alert variant="error">{notice}</Alert>}

        {/* ───────── Dashboard ───────── */}
        {view === "dashboard" && (
          <div className="space-y-6 animate-fade">
            {searching && (
              <Card accent className="overflow-hidden">
                <div className="px-5 pt-5">
                  <h2 className="text-lg">نتائج البحث</h2>
                  <p className="text-sm text-ink-2 num">
                    {tableStudents.length} طالب · {tablePayments.length} عملية دفع
                  </p>
                </div>
                <div className="mt-3 space-y-4">
                  <div>
                    <p className="flex items-center justify-between px-5 text-sm font-bold">
                      الطلاب
                      <button type="button" className="on-light min-h-11 px-2 font-semibold underline underline-offset-4" onClick={() => setView("students")}>عرض الكل</button>
                    </p>
                    <StudentsTable rows={tableStudents.slice(0, 50)} pageSize={5} filtered />
                  </div>
                  <div>
                    <p className="flex items-center justify-between px-5 text-sm font-bold">
                      المدفوعات
                      <button type="button" className="on-light min-h-11 px-2 font-semibold underline underline-offset-4" onClick={() => setView("payments")}>عرض الكل</button>
                    </p>
                    <PaymentsTable rows={tablePayments.slice(0, 50)} pageSize={5} filtered onViewProof={viewProof} />
                  </div>
                </div>
              </Card>
            )}

            <section aria-label="المؤشرات الرئيسية" className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              <KpiCard icon={Users} label="إجمالي الطلاب" value={kpis.totalStudents} />
              <KpiCard icon={CreditCard} label="عمليات الدفع" value={kpis.paymentOps} />
              <KpiCard icon={Wallet} label="إجمالي المدفوعات المسجلة" value={kpis.revenue} suffix="ج.م" />
              <KpiCard icon={Hourglass} label="بانتظار المراجعة" value={kpis.pendingReview} />
              <KpiCard icon={GraduationCap} label="طلاب الأول الثانوي" value={kpis.firstSecondary} />
              <KpiCard icon={GraduationCap} label="طلاب الثاني الثانوي" value={kpis.secondSecondary} />
            </section>

            <section aria-label="الرسوم البيانية" className="grid gap-4 xl:grid-cols-2">
              <StudentsByGradeChart data={studentsByGrade(kpiStudents)} />
              <PaymentsByGradeChart data={paymentsByGrade(kpiPayments)} />
              <DailyPaymentsChart data={dailyPayments(kpiPayments, 30)} />
              <MonthlyRevenueChart data={monthlyRevenue(kpiPayments, 6)} />
            </section>

            <Card accent className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <h2 className="text-lg">آخر المدفوعات</h2>
                <button type="button" className="on-light min-h-11 px-2 text-sm font-semibold underline underline-offset-4" onClick={() => setView("payments")}>عرض الكل</button>
              </div>
              <div className="mt-3">
                <PaymentsTable rows={kpiPayments} pageSize={5} onViewProof={viewProof} filtered={hasFilters} />
              </div>
            </Card>
          </div>
        )}

        {/* ───────── Students ───────── */}
        {view === "students" && (
          <Card accent className="animate-fade overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
              <div>
                <h2 className="text-lg">الطلاب</h2>
                <p className="text-sm text-ink-2 num">{tableStudents.length} من {students.length}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={exportStudents} disabled={tableStudents.length === 0}>
                <Download className="size-4" aria-hidden />
                تصدير CSV
              </Button>
            </div>
            <div className="mt-3">
              <StudentsTable rows={tableStudents} filtered={hasFilters} />
            </div>
          </Card>
        )}

        {/* ───────── Payments ───────── */}
        {view === "payments" && (
          <Card accent className="animate-fade overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
              <div>
                <h2 className="text-lg">المدفوعات</h2>
                <p className="text-sm text-ink-2 num">
                  {tablePayments.length} من {payments.length} · {formatEgp(computeKpis([], tablePayments).revenue)}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={exportPayments} disabled={tablePayments.length === 0}>
                <Download className="size-4" aria-hidden />
                تصدير CSV
              </Button>
            </div>
            <div className="mt-3">
              <PaymentsTable rows={tablePayments} filtered={hasFilters} onChangeStatus={changeStatus} onViewProof={viewProof} busyId={busyId} />
            </div>
          </Card>
        )}

        {students.length === 0 && payments.length === 0 && (
          <Card>
            <EmptyState />
          </Card>
        )}
      </div>

      <ProofDialog state={proof} onClose={() => setProof(null)} />
    </div>
  );
}
