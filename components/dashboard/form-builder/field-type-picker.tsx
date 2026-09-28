"use client";

import { useRef } from "react";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDownSquare,
  CircleDot,
  Hash,
  Mail,
  Minus,
  Phone,
  Type,
  X,
} from "lucide-react";
import { FIELD_TYPES, type FieldType } from "@/lib/forms";

const ICONS: Record<FieldType, typeof Type> = {
  short_text: Type,
  long_text: AlignLeft,
  number: Hash,
  phone: Phone,
  email: Mail,
  date: Calendar,
  dropdown: ChevronDownSquare,
  radio: CircleDot,
  checkbox_group: CheckSquare,
  section: AlignLeft,
  divider: Minus,
};

export function FieldTypePicker({ onPick, onClose }: { onPick: (type: FieldType) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/60 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="اختر نوع الحقل"
    >
      <div ref={ref} className="max-h-[85vh] w-full max-w-lg animate-rise overflow-y-auto rounded-t-xl bg-white p-5 shadow-2xl sm:rounded-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg">إضافة حقل</h2>
          <button type="button" onClick={onClose} className="on-light flex size-11 items-center justify-center rounded-md hover:bg-navy/5" aria-label="إغلاق">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FIELD_TYPES.map(({ type, labelAr, labelEn }) => {
            const Icon = ICONS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => onPick(type)}
                className="on-light flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-line p-3 text-center transition duration-200 hover:-translate-y-px hover:border-gold hover:shadow-card"
              >
                <Icon className="size-6 text-gold" strokeWidth={1.75} aria-hidden />
                <span className="text-sm font-semibold leading-tight">{labelAr}</span>
                <span className="text-[11px] text-ink-2" lang="en" dir="ltr">
                  {labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
