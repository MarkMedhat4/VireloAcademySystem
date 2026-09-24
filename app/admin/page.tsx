import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { Alert } from "@/components/ui/alert";
import { AdminLogin } from "@/components/dashboard/admin-login";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { getAdminContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Payment, Student } from "@/lib/types";

export const metadata: Metadata = { title: "لوحة الإدارة", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ROW_CAP = 5000;

export default async function AdminPage() {
  const configured = isSupabaseConfigured();
  const admin = configured ? await getAdminContext() : null;

  if (!admin) {
    return (
      <PageShell eyebrow="Virelo Admin" title="لوحة الإدارة" subtitle="تسجيل الدخول للإدارة فقط." width="max-w-2xl">
        <AdminLogin configured={configured} />
      </PageShell>
    );
  }

  // Runs as the signed-in admin → Row Level Security decides what is returned.
  const supabase = await createServerSupabase();
  const [studentsRes, paymentsRes] = await Promise.all([
    supabase.from("students").select("*").order("created_at", { ascending: false }).limit(ROW_CAP),
    supabase
      .from("payments")
      .select("id, student_name, student_phone, sender_number, grade, amount, paid, status, proof_path, created_at")
      .order("created_at", { ascending: false })
      .limit(ROW_CAP),
  ]);

  const failed = studentsRes.error || paymentsRes.error;
  if (failed) console.error("[admin page] load failed", studentsRes.error?.message, paymentsRes.error?.message);

  return (
    <PageShell eyebrow="Virelo Admin" title="لوحة التحكم" subtitle="الطلاب والمدفوعات في مكان واحد." width="max-w-[1440px]">
      {failed ? (
        <Alert variant="error" title="تعذر تحميل البيانات">
          تحقق من إعداد قاعدة البيانات وسياسات الأمان (RLS)، ثم{" "}
          <Link href="/admin" className="font-bold underline">
            أعد المحاولة
          </Link>
          .
        </Alert>
      ) : (
        <AdminShell
          admin={{ name: admin.fullName ?? admin.username ?? "Admin" }}
          students={(studentsRes.data ?? []) as Student[]}
          payments={(paymentsRes.data ?? []) as Payment[]}
        />
      )}
    </PageShell>
  );
}
