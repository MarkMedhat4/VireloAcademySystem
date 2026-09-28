"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { CalendarCheck, ClipboardList, LayoutDashboard, LogOut, Menu, RefreshCw, Settings, Users, Wallet, X } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { adminLogout } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/students", label: "الطلاب", icon: Users },
  { href: "/admin/payments", label: "المدفوعات", icon: Wallet },
  { href: "/admin/forms", label: "النماذج", icon: ClipboardList },
  { href: "/admin/attendance", label: "الحضور", icon: CalendarCheck },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
] as const;

function NavList({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <nav aria-label="أقسام لوحة التحكم" className="space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors duration-200",
              active
                ? "bg-white/10 text-gold shadow-[inset_3px_0_0_var(--color-gold)] rtl:shadow-[inset_-3px_0_0_var(--color-gold)]"
                : "text-white/80 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminChrome({ admin, children }: { admin: { name: string }; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await adminLogout();
    } finally {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="min-h-[calc(100dvh-1px)] bg-canvas">
      {/* Top bar — the admin system's own header, separate from the public navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy text-white">
        <div className="mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-md border border-white/20 hover:border-gold lg:hidden"
              aria-expanded={open}
              aria-controls="admin-mobile-nav"
              aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
            <Logo size={40} />
            <p className="hidden text-base font-bold sm:block">
              <bdi lang="en" dir="ltr">
                Virelo <span className="text-gold">Admin</span>
              </bdi>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden truncate text-sm text-white/70 sm:block">{admin.name}</span>
            <button
              type="button"
              onClick={() => startRefresh(() => router.refresh())}
              disabled={refreshing}
              aria-label="تحديث البيانات"
              title="تحديث البيانات"
              className="flex size-11 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              <RefreshCw className={cn("size-5", refreshing && "animate-spin")} aria-hidden />
            </button>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
              className="flex size-11 items-center justify-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              <LogOut className="size-5" aria-hidden />
            </button>
          </div>
        </div>
        {open && (
          <div id="admin-mobile-nav" className="animate-fade border-t border-white/10 bg-navy-800 px-4 py-3 lg:hidden">
            <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        )}
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8 lg:py-8">
        <aside className="hidden rounded-lg bg-navy p-4 text-white shadow-lift lg:sticky lg:top-24 lg:block lg:h-fit">
          <NavList pathname={pathname} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
