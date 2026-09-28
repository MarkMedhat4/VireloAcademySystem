"use client";

import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDownSquare,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Copy,
  Hash,
  Mail,
  Minus,
  Phone,
  Trash2,
  Type,
} from "lucide-react";
import { fieldMeta, type DraftField, type FieldType } from "@/lib/forms";
import { cn } from "@/lib/utils";

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

export function FieldRow({
  field,
  selected,
  isFirst,
  isLast,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: {
  field: DraftField;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const Icon = ICONS[field.type];
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border p-2 transition-colors duration-150",
        selected ? "border-gold bg-gold-soft/40" : "border-line bg-white hover:border-gold/50",
      )}
    >
      <div className="flex flex-col">
        <button type="button" onClick={onMoveUp} disabled={isFirst} aria-label="نقل للأعلى" className="flex size-7 items-center justify-center rounded text-ink-2 hover:bg-navy/5 disabled:opacity-30">
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <button type="button" onClick={onMoveDown} disabled={isLast} aria-label="نقل للأسفل" className="flex size-7 items-center justify-center rounded text-ink-2 hover:bg-navy/5 disabled:opacity-30">
          <ChevronDown className="size-4" aria-hidden />
        </button>
      </div>

      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 py-1 text-start">
        <Icon className="size-5 shrink-0 text-gold" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-semibold">{field.label || fieldMeta(field.type).labelAr}</span>
        {field.required && <span className="shrink-0 text-xs text-danger">مطلوب</span>}
      </button>

      <button type="button" onClick={onDuplicate} aria-label="تكرار الحقل" className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 hover:bg-navy/5">
        <Copy className="size-4" aria-hidden />
      </button>
      <button type="button" onClick={onDelete} aria-label="حذف الحقل" className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 hover:bg-danger-soft hover:text-danger">
        <Trash2 className="size-4" aria-hidden />
      </button>
    </div>
  );
}
