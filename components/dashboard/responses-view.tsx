"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CalendarDays, Download, Eye, MessageSquareText, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inputBase, inputOk } from "@/components/ui/field";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/tables/data-table";
import { ResponseDetailDialog } from "@/components/dashboard/response-detail-dialog";
import { normalizeText } from "@/lib/analytics";
import { downloadCsv } from "@/lib/csv";
import { LAYOUT_TYPES, formatFieldValue, type FormField, type FormRecord, type FormResponse } from "@/lib/forms";
import { cairoDay, formatDateTime } from "@/lib/payment";
import { cn } from "@/lib/utils";

const fieldClass = cn(inputBase, inputOk, "h-11 text-sm");

export function ResponsesView({
  form,
  fields,
  responses,
  todayCount,
  weekCount,
}: {
  form: FormRecord;
  fields: FormField[];
  responses: FormResponse[];
  todayCount: number;
  weekCount: number;
}) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<FormResponse | null>(null);

  const dataFields = useMemo(() => fields.filter((f) => !LAYOUT_TYPES.includes(f.type)), [fields]);

  const filtered = useMemo(() => {
    const needle = normalizeText(q.trim());
    return responses.filter((r) => {
      const day = cairoDay(r.created_at);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (!needle) return true;
      const hay = normalizeText(Object.values(r.response_data).map((v) => formatFieldValue(v)).join(" | "));
      return needle.split(/\s+/).every((w) => hay.includes(w));
    });
  }, [responses, q, from, to]);

  // "Today" / "this week" depend on the current time, computed server-side (page.tsx) rather
  // than during render here, since reading the clock is not a pure operation.
  const last = responses[0]; // already sorted desc from the server

  const columns: Column<FormResponse>[] = [
    ...dataFields.map((f): Column<FormResponse> => ({
      key: f.field_key,
      header: f.label,
      sort: (r) => formatFieldValue(r.response_data[f.field_key]),
      render: (r) => <span className="max-w-xs truncate">{formatFieldValue(r.response_data[f.field_key])}</span>,
    })),
    {
      key: "created_at",
      header: "تاريخ الإرسال",
      sort: (r) => r.created_at,
      render: (r) => <span className="num whitespace-nowrap">{formatDateTime(r.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <button type="button" onClick={() => setSelected(r)} className="on-light inline-flex min-h-9 items-center gap-1 rounded-md border border-line px-3 text-sm font-semibold hover:border-gold">
          <Eye className="size-3.5" aria-hidden />
          عرض
        </button>
      ),
    },
  ];

  function exportCsv() {
    const stamp = new Date().toISOString().slice(0, 10);
    const headers = [...dataFields.map((f) => f.label), "تاريخ الإرسال"];
    const rows = filtered.map((r) => [...dataFields.map((f) => formatFieldValue(r.response_data[f.field_key])), r.created_at]);
    downloadCsv(`${form.slug}-responses-${stamp}.csv`, headers, rows);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/forms" className="on-light inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-ink-2 hover:text-navy">
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
          كل النماذج
        </Link>
        <h1 className="mt-2 text-2xl">ردود: {form.name}</h1>
      </div>

      <section aria-label="إحصائيات الردود" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard icon={MessageSquareText} label="إجمالي الردود" value={responses.length} />
        <KpiCard icon={CalendarDays} label="اليوم" value={todayCount} />
        <KpiCard icon={CalendarClock} label="هذا الأسبوع" value={weekCount} />
        <Card accent className="p-5">
          <p className="text-sm font-semibold text-ink-2">آخر رد</p>
          <p className="mt-3 text-lg font-bold">{last ? formatDateTime(last.created_at) : "—"}</p>
        </Card>
      </section>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_auto]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <label htmlFor="r-search" className="sr-only">بحث</label>
            <Search className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-mute" aria-hidden />
            <input id="r-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في الردود…" className={cn(fieldClass, "ps-10")} />
          </div>
          <input aria-label="من تاريخ" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={cn(fieldClass, "num")} dir="ltr" />
          <input aria-label="إلى تاريخ" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={cn(fieldClass, "num")} dir="ltr" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setQ("");
              setFrom("");
              setTo("");
            }}
            disabled={!q && !from && !to}
          >
            <X className="size-4" aria-hidden />
            مسح
          </Button>
        </div>
      </Card>

      <Card accent className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <p className="text-sm text-ink-2 num">{filtered.length} من {responses.length}</p>
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="size-4" aria-hidden />
            تصدير CSV
          </Button>
        </div>
        <div className="mt-3">
          <DataTable rows={filtered} columns={columns} rowKey={(r) => r.id} caption={`ردود ${form.name}`} filtered={!!(q || from || to)} defaultSort={{ key: "created_at", dir: "desc" }} />
        </div>
      </Card>

      <ResponseDetailDialog response={selected} fields={fields} onClose={() => setSelected(null)} />
    </div>
  );
}
