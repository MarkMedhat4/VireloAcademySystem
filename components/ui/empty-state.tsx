import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Inbox,
  title = "لا توجد بيانات حالياً",
  description = "سيظهر المحتوى هنا بمجرد توفره.",
  action,
}: {
  icon?: typeof Inbox;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-xl border border-gold/40 bg-gold-soft/60 text-navy">
        <Icon className="size-8 text-gold" strokeWidth={1.5} aria-hidden />
      </div>
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-2">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
