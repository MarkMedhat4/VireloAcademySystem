"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

/**
 * The admin system is a separate experience from the public site (per the brief), so it gets
 * its own chrome (see AdminChrome) instead of the public navbar/footer. Everything else keeps
 * the normal public chrome. Kept as one root layout (rather than two) to avoid the added risk
 * of Next.js's multi-root-layout setup.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <main id="main" className="flex-1">{children}</main>;
  return (
    <>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
