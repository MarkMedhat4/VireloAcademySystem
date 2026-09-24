"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/site/logo";
import { NAV_LINKS } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10 bg-navy text-white"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Virelo Academy — الصفحة الرئيسية" onClick={() => setOpen(false)}>
          <Logo size={56} priority />
          <span className="hidden text-lg font-semibold sm:block" lang="en" dir="ltr">
            Virelo <span className="text-gold">Academy</span>
          </span>
        </Link>

        <nav aria-label="التنقل الرئيسي" className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 items-center px-4 text-[15px] font-semibold transition-colors duration-200",
                "after:absolute after:inset-x-4 after:bottom-1 after:h-0.5 after:origin-center after:scale-x-0 after:bg-gold after:transition-transform after:duration-300",
                isActive(link.href) ? "text-gold after:scale-x-100" : "text-white/85 hover:text-white hover:after:scale-x-100",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-md border border-white/20 transition-colors hover:border-gold md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="التنقل الرئيسي (جوال)" className="animate-fade border-t border-white/10 bg-navy-800 px-4 pb-4 pt-2 md:hidden">
          <ul className="mx-auto flex max-w-[1280px] flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center border-b border-white/10 px-2 text-base font-semibold last:border-b-0",
                    isActive(link.href) ? "text-gold" : "text-white",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
