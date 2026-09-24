import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends ComponentProps<"div"> {
  /** Small gold top accent line */
  accent?: boolean;
  /** Lift on hover (for clickable cards) */
  interactive?: boolean;
}

export function Card({ accent, interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-line bg-surface shadow-card",
        accent && "before:absolute before:top-0 before:start-6 before:h-0.5 before:w-12 before:rounded-b before:bg-gold before:content-['']",
        interactive && "transition duration-300 ease-out hover:-translate-y-[3px] hover:border-gold/60 hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}
