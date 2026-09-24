import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared inner-page frame: navy header band + content card overlapping it. Keeps every page in one ecosystem. */
export function PageShell({
  eyebrow,
  title,
  subtitle,
  children,
  width = "max-w-2xl",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
}) {
  return (
    <>
      <section className="bg-grid-dark text-white">
        <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-12 sm:px-6 md:pb-28 md:pt-16 lg:px-8">
          <div className="animate-rise">
            {eyebrow && (
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold">
                <bdi lang="en" dir="ltr">{eyebrow}</bdi>
              </p>
            )}
            <h1 className="text-[2rem] md:text-[2.75rem]">{title}</h1>
            {subtitle && <p className="mt-3 max-w-xl text-base text-white/75 md:text-lg">{subtitle}</p>}
            <div className="gold-rule mt-6" />
          </div>
        </div>
      </section>
      <div className={cn("mx-auto -mt-16 w-full px-4 pb-16 sm:px-6 md:-mt-20 md:pb-24 lg:px-8", width)}>
        <div className="animate-rise delay-1">{children}</div>
      </div>
    </>
  );
}
