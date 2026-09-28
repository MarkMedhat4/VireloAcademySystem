"use client";

import { useMemo, useState } from "react";
import { Download, Search, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inputBase, inputOk } from "@/components/ui/field";
import { PaymentsTable, paymentCsvHeaders, paymentCsvRow } from "@/components/tables/payments-table";
import { ProofDialog, type ProofState } from "@/components/dashboard/proof-dialog";
import { getPaymentProofUrl, setPaymentStatus } from "@/app/admin/actions";
import { computeKpis, filterPayments, NO_FILTERS, STATE_LABEL, type Filters } from "@/lib/analytics";
import { GRADES, GRADE_SHORT, type Grade } from "@/lib/config";
import { downloadCsv } from "@/lib/csv";
import { formatEgp } from "@/lib/payment";
import type { Payment, PaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const fieldClass = cn(inputBase, inputOk, "h-11 text-sm");

export function PaymentsView({ payments }: { payments: Payment[] }) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [overrides, setOverrides] = useState<Record<string, PaymentStatus>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [proof, setProof] = useState<ProofState>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);

  const allPayments = useMemo(() => payments.map((p) => (overrides[p.id] ? { ...p, status: overrides[p.id] } : p)), [payments, overrides]);
  const rows = useMemo(() => filterPayments(allPayments, filters), [allPayments, filters]);
  const stamp = new Date().toISOString().slice(0, 10);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">المدفوعات</h1>
        <p className="text-ink-2 num">{payments.length} عملية · {formatEgp(computeKpis([], allPayments).revenue)}</p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_auto]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <label htmlFor="p-search" className="sr-only">بحث</label>
            <Search className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-mute" aria-hidden />
            <input
              id="p-search"
              type="search"
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="ابحث بالاسم أو الهاتف أو الصف…"
              className={cn(fieldClass, "ps-10")}
            />
          </div>
          <select aria-label="الصف" value={filters.grade} onChange={(e) => set({ grade: e.target.value })} className={fieldClass}>
            <option value="">كل الصفوف</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {GRADE_SHORT[g as Grade]}
              </option>
            ))}
          </select>
          <select aria-label="حالة الدفع" value={filters.status} onChange={(e) => set({ status: e.target.value })} className={fieldClass}>
            <option value="">كل الحالات</option>
            {(["paid", "pending", "rejected", "unpaid"] as const).map((s) => (
              <option key={s} value={s}>
                {STATE_LABEL[s]}
              </option>
            ))}
          </select>
          <input aria-label="من تاريخ" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set({ from: e.target.value })} className={cn(fieldClass, "num")} dir="ltr" />
          <input aria-label="إلى تاريخ" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set({ to: e.target.value })} className={cn(fieldClass, "num")} dir="ltr" />
          <Button variant="secondary" size="sm" onClick={() => setFilters(NO_FILTERS)} disabled={!hasFilters}>
            <X className="size-4" aria-hidden />
            مسح
          </Button>
        </div>
      </Card>

      {notice && <Alert variant="error">{notice}</Alert>}

      <Card accent className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <p className="text-sm text-ink-2 num">{rows.length} من {payments.length}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadCsv(`virelo-payments-${stamp}.csv`, paymentCsvHeaders, rows.map(paymentCsvRow))}
            disabled={rows.length === 0}
          >
            <Download className="size-4" aria-hidden />
            تصدير CSV
          </Button>
        </div>
        <div className="mt-3">
          <PaymentsTable rows={rows} filtered={hasFilters} onChangeStatus={changeStatus} onViewProof={viewProof} busyId={busyId} />
        </div>
      </Card>

      <ProofDialog state={proof} onClose={() => setProof(null)} />
    </div>
  );
}
