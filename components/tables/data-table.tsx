"use client";

import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ChevronsUpDown, SearchX } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** When provided the column is sortable by this value. */
  sort?: (row: T) => string | number;
  className?: string;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  caption: string;
  pageSize?: number;
  defaultSort?: { key: string; dir: "asc" | "desc" };
  filtered?: boolean;
}

export function DataTable<T>({ rows, columns, rowKey, caption, pageSize = 25, defaultSort, filtered }: Props<T>) {
  const [sort, setSort] = useState(defaultSort ?? null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sort || !sort) return rows;
    const get = col.sort;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
      return String(x).localeCompare(String(y), "ar") * dir;
    });
  }, [rows, columns, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize);

  if (rows.length === 0) {
    return filtered ? (
      <EmptyState icon={SearchX} title="لا توجد نتائج مطابقة" description="جرّب تعديل البحث أو الفلاتر." />
    ) : (
      <EmptyState />
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line bg-canvas text-navy">
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn("whitespace-nowrap px-3 py-3 text-start font-bold", c.className)}
                  >
                    {c.sort ? (
                      <button
                        type="button"
                        className="on-light -mx-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 hover:bg-navy/5"
                        onClick={() => {
                          setPage(0);
                          setSort(active && sort.dir === "asc" ? { key: c.key, dir: "desc" } : { key: c.key, dir: "asc" });
                        }}
                      >
                        {c.header}
                        {active ? (
                          sort.dir === "asc" ? <ChevronUp className="size-4 text-gold" aria-hidden /> : <ChevronDown className="size-4 text-gold" aria-hidden />
                        ) : (
                          <ChevronsUpDown className="size-4 text-mute" aria-hidden />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line bg-white transition-colors duration-150 last:border-b-0 hover:bg-navy/[0.03]">
                {columns.map((c) => (
                  <td key={c.key} className={cn("whitespace-nowrap px-3 py-2 align-middle", c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-ink-2">
          <p className="num">
            عرض {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} من {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="on-light flex size-11 items-center justify-center rounded-md border border-line bg-white transition hover:border-gold disabled:opacity-40 disabled:hover:border-line"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              aria-label="الصفحة السابقة"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <span className="min-w-16 text-center font-semibold text-navy num" dir="ltr">
              {current + 1} / {pages}
            </span>
            <button
              type="button"
              className="on-light flex size-11 items-center justify-center rounded-md border border-line bg-white transition hover:border-gold disabled:opacity-40 disabled:hover:border-line"
              onClick={() => setPage(current + 1)}
              disabled={current >= pages - 1}
              aria-label="الصفحة التالية"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
