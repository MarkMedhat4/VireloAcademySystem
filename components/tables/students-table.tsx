"use client";

import { DataTable, type Column } from "@/components/tables/data-table";
import { GRADE_SHORT, type Grade } from "@/lib/config";
import { formatDate } from "@/lib/payment";
import type { Student } from "@/lib/types";

const columns: Column<Student>[] = [
  { key: "name", header: "الاسم", sort: (s) => s.student_name, render: (s) => <span className="font-semibold">{s.student_name}</span> },
  { key: "phone", header: "الهاتف", sort: (s) => s.student_phone, render: (s) => <span className="num" dir="ltr">{s.student_phone}</span> },
  { key: "guardian", header: "ولي الأمر", sort: (s) => s.guardian_name, render: (s) => s.guardian_name },
  { key: "gphone", header: "هاتف ولي الأمر", render: (s) => <span className="num" dir="ltr">{s.guardian_phone}</span> },
  { key: "grade", header: "الصف", sort: (s) => s.grade, render: (s) => GRADE_SHORT[s.grade as Grade] ?? s.grade },
  { key: "date", header: "تاريخ التسجيل", sort: (s) => s.created_at, render: (s) => <span className="num">{formatDate(s.created_at)}</span> },
];

export const studentCsvHeaders = ["الاسم", "الهاتف", "ولي الأمر", "هاتف ولي الأمر", "الصف", "تاريخ التسجيل"];
export const studentCsvRow = (s: Student) => [s.student_name, s.student_phone, s.guardian_name, s.guardian_phone, s.grade, s.created_at];

export function StudentsTable({ rows, pageSize, filtered }: { rows: Student[]; pageSize?: number; filtered?: boolean }) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(s) => s.id}
      caption="جدول الطلاب"
      pageSize={pageSize}
      filtered={filtered}
      defaultSort={{ key: "date", dir: "desc" }}
    />
  );
}
