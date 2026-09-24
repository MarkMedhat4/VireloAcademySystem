import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "info" | "warning";

const styles: Record<Variant, { box: string; icon: typeof Info }> = {
  success: { box: "border-success/30 bg-success-soft text-[#1b5e20]", icon: CircleCheck },
  error: { box: "border-danger/30 bg-danger-soft text-[#8e1b1b]", icon: CircleAlert },
  info: { box: "border-line bg-white text-ink", icon: Info },
  warning: { box: "border-gold/50 bg-gold-soft text-[#5c4708]", icon: TriangleAlert },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
  ref,
}: {
  variant?: Variant;
  title?: string;
  children?: ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const { box, icon: Icon } = styles[variant];
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-md border p-4 text-sm leading-7 outline-none animate-fade", box, className)}
    >
      <Icon className="mt-1 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-bold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
