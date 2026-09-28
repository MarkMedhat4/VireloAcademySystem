import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/site/page-shell";
import { AdminLogin } from "@/components/dashboard/admin-login";
import { getAdminContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "لوحة الإدارة", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminEntryPage() {
  const configured = isSupabaseConfigured();
  const admin = configured ? await getAdminContext() : null;
  if (admin) redirect("/admin/dashboard");

  return (
    <PageShell eyebrow="Virelo Admin" title="لوحة الإدارة" subtitle="تسجيل الدخول للإدارة فقط." width="max-w-2xl">
      <AdminLogin configured={configured} />
    </PageShell>
  );
}
