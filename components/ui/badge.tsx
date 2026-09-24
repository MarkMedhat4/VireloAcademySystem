import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "gold" | "danger" | "muted" | "navy";

const tones: Record<Tone, string> = {
  success: "bg-success-soft text-success",
  gold: "bg-gold-soft text-[#6f560a]",
  danger: "bg-danger-soft text-danger",
  muted: "bg-canvas text-ink-2 ring-1 ring-inset ring-line",
  navy: "bg-navy text-white",
};

export function Badge({ tone = "muted", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
