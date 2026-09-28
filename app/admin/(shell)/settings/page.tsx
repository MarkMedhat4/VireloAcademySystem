import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAdminContext } from "@/lib/auth";

export const metadata: Metadata = { title: "الإعدادات", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = await getAdminContext();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl">الإعدادات</h1>
      <Card accent className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-gold-soft/70">
            <Settings className="size-5 text-gold" aria-hidden />
          </div>
          <div>
            <p className="font-semibold">{admin?.fullName ?? admin?.username}</p>
            <p className="text-sm text-ink-2" dir="ltr">{admin?.username}</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-ink-2">
          إعدادات النظام العامة (بيانات التواصل، طرق الدفع، إدارة حسابات المسؤولين) غير متاحة من هذه الصفحة بعد — تُدار حالياً من ملفات المشروع
          (<code dir="ltr">lib/config.ts</code>) ومن Supabase مباشرة. هذه الصفحة مجهّزة لتوسيع الإعدادات لاحقاً.
        </p>
      </Card>
    </div>
  );
}
