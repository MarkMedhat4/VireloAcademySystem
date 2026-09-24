import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function KpiCard({ icon: Icon, label, value, suffix }: { icon: LucideIcon; label: string; value: number; suffix?: string }) {
  return (
    <Card accent className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-2">{label}</p>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gold-soft/70">
          <Icon className="size-5 text-gold" strokeWidth={1.75} aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold leading-none num">
        {new Intl.NumberFormat("en-US").format(value)}
        {suffix && <span className="ms-2 text-base font-semibold text-ink-2">{suffix}</span>}
      </p>
    </Card>
  );
}
