"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { LAYOUT_TYPES, formatFieldValue, type FormField, type FormResponse } from "@/lib/forms";
import { formatDateTime } from "@/lib/payment";

export function ResponseDetailDialog({ response, fields, onClose }: { response: FormResponse | null; fields: FormField[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (response && !d.open) d.showModal();
    if (!response && d.open) d.close();
  }, [response]);

  const dataFields = fields.filter((f) => !LAYOUT_TYPES.includes(f.type));

  return (
    <dialog
      ref={ref}
      aria-label="تفاصيل الرد"
      className="m-auto w-[min(92vw,640px)] rounded-xl border border-line bg-white p-0 text-ink shadow-2xl"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <h2 className="text-base">تفاصيل الرد</h2>
        <button type="button" onClick={onClose} aria-label="إغلاق" className="on-light flex size-11 items-center justify-center rounded-md hover:bg-navy/5">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      {response && (
        <dl className="max-h-[70vh] divide-y divide-line overflow-y-auto p-4">
          {dataFields.map((f) => (
            <div key={f.id} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-ink-2">{f.label}</dt>
              <dd className="font-semibold">{formatFieldValue(response.response_data[f.field_key])}</dd>
            </div>
          ))}
          <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
            <dt className="text-sm font-semibold text-ink-2">تاريخ الإرسال</dt>
            <dd className="font-semibold num">{formatDateTime(response.created_at)}</dd>
          </div>
        </dl>
      )}
    </dialog>
  );
}
