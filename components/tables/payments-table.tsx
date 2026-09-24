"use client";

import { FileImage } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/tables/data-table";
import { paymentState, STATE_LABEL, type PaymentState } from "@/lib/analytics";
import { GRADE_SHORT, type Grade } from "@/lib/config";
import { formatDate, formatDateTime, formatEgp } from "@/lib/payment";
import type { Payment, PaymentStatus } from "@/lib/types";

const TONE: Record<PaymentState, "muted" | "gold" | "success" | "danger"> = {
  unpaid: "muted",
  pending: "gold",
  paid: "success",
  rejected: "danger",
};

export function StatusBadge({ payment }: { payment: Pick<Payment, "paid" | "status"> }) {
  const state = paymentState(payment);
  return <Badge tone={TONE[state]}>{STATE_LABEL[state]}</Badge>;
}

export const paymentCsvHeaders = ["الطالب", "هاتف الطالب", "الرقم الذي تم التحويل منه", "الصف", "المبلغ", "الحالة", "التاريخ"];
export const paymentCsvRow = (p: Payment) => [p.student_name, p.student_phone, p.sender_number ?? "", p.grade, p.amount, STATE_LABEL[paymentState(p)], p.created_at];

interface Props {
  rows: Payment[];
  pageSize?: number;
  filtered?: boolean;
  /** When provided, an actions column with a status selector is shown. */
  onChangeStatus?: (id: string, status: PaymentStatus) => void;
  onViewProof: (path: string) => void;
  busyId?: string | null;
}

export function PaymentsTable({ rows, pageSize, filtered, onChangeStatus, onViewProof, busyId }: Props) {
  const columns: Column<Payment>[] = [
    { key: "name", header: "الطالب", sort: (p) => p.student_name, render: (p) => <span className="font-semibold">{p.student_name}</span> },
    { key: "phone", header: "هاتف الطالب", render: (p) => <span className="num" dir="ltr">{p.student_phone}</span> },
    {
      key: "sender",
      header: "الرقم الذي تم التحويل منه",
      render: (p) => (p.sender_number ? <span className="num" dir="ltr">{p.sender_number}</span> : <span className="text-mute">—</span>),
    },
    { key: "grade", header: "الصف", sort: (p) => p.grade, render: (p) => GRADE_SHORT[p.grade as Grade] ?? p.grade },
    { key: "amount", header: "المبلغ", sort: (p) => p.amount, render: (p) => <span className="num font-semibold">{formatEgp(p.amount)}</span> },
    { key: "status", header: "الحالة", sort: (p) => paymentState(p), render: (p) => <StatusBadge payment={p} /> },
    {
      key: "proof",
      header: "الإثبات",
      render: (p) =>
        p.proof_path ? (
          <button
            type="button"
            className="on-light inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold transition hover:border-gold"
            onClick={() => onViewProof(p.proof_path!)}
          >
            <FileImage className="size-4 text-gold" aria-hidden />
            عرض
          </button>
        ) : (
          <span className="text-mute">—</span>
        ),
    },
    { key: "date", header: "التاريخ", sort: (p) => p.created_at, render: (p) => <span className="num" title={formatDateTime(p.created_at)}>{formatDate(p.created_at)}</span> },
  ];

  if (onChangeStatus) {
    columns.push({
      key: "actions",
      header: "مراجعة",
      render: (p) =>
        p.paid ? (
          <select
            aria-label={`تغيير حالة دفع ${p.student_name}`}
            className="min-h-11 rounded-md border border-line bg-white px-3 text-sm font-semibold outline-none focus:border-gold focus:ring-4 focus:ring-gold/25 disabled:opacity-60"
            value={p.status}
            disabled={busyId === p.id}
            onChange={(e) => onChangeStatus(p.id, e.target.value as PaymentStatus)}
          >
            <option value="pending">قيد المراجعة</option>
            <option value="paid">مؤكد</option>
            <option value="rejected">مرفوض</option>
          </select>
        ) : (
          <span className="text-mute">—</span>
        ),
    });
  }

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(p) => p.id}
      caption="جدول المدفوعات"
      pageSize={pageSize}
      filtered={filtered}
      defaultSort={{ key: "date", dir: "desc" }}
    />
  );
}
