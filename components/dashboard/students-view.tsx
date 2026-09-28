"use client";

import { useMemo, useState } from "react";
import { Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inputBase, inputOk } from "@/components/ui/field";
import { StudentsTable, studentCsvHeaders, studentCsvRow } from "@/components/tables/students-table";
import { filterStudents, NO_FILTERS, type Filters } from "@/lib/analytics";
import { GRADES, GRADE_SHORT, type Grade } from "@/lib/config";
import { downloadCsv } from "@/lib/csv";
import type { Student } from "@/lib/types";
import { cn } from "@/lib/utils";

const fieldClass = cn(inputBase, inputOk, "h-11 text-sm");

export function StudentsView({ students }: { students: Student[] }) {
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);

  const rows = useMemo(() => filterStudents(students, filters), [students, filters]);
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">الطلاب</h1>
        <p className="text-ink-2 num">{students.length} طالب مسجّل</p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1.4fr_1fr_1fr_auto]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <label htmlFor="s-search" className="sr-only">بحث</label>
            <Search className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-mute" aria-hidden />
            <input
              id="s-search"
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
          <input aria-label="من تاريخ" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set({ from: e.target.value })} className={cn(fieldClass, "num")} dir="ltr" />
          <input aria-label="إلى تاريخ" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set({ to: e.target.value })} className={cn(fieldClass, "num")} dir="ltr" />
          <Button variant="secondary" size="sm" onClick={() => setFilters(NO_FILTERS)} disabled={!hasFilters}>
            <X className="size-4" aria-hidden />
            مسح
          </Button>
        </div>
      </Card>

      <Card accent className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <p className="text-sm text-ink-2 num">{rows.length} من {students.length}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadCsv(`virelo-students-${stamp}.csv`, studentCsvHeaders, rows.map(studentCsvRow))}
            disabled={rows.length === 0}
          >
            <Download className="size-4" aria-hidden />
            تصدير CSV
          </Button>
        </div>
        <div className="mt-3">
          <StudentsTable rows={rows} filtered={hasFilters} />
        </div>
      </Card>
    </div>
  );
}
