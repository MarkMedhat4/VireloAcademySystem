import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { StudentPortal } from "@/components/forms/student-portal";
import { createServerSupabase } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Student } from "@/lib/types";

export const metadata: Metadata = { title: "بيانات الطالب" };
export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const configured = isSupabaseConfigured();
  let student: Student | null = null;

  if (configured) {
    try {
      const supabase = await createServerSupabase();
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.phone) {
        // RLS returns only the row that matches the OTP-verified phone of this session.
        const { data } = await supabase
          .from("students")
          .select("id, student_name, student_phone, guardian_name, guardian_phone, grade, created_at, updated_at")
          .maybeSingle();
        student = (data as Student | null) ?? null;
      }
    } catch (e) {
      console.error("[student page]", e);
    }
  }

  return (
    <PageShell eyebrow="Student Portal" title="بيانات الطالب" subtitle="ادخل برقم هاتفك لعرض بياناتك وتعديلها.">
      <StudentPortal initialStudent={student} configured={configured} />
    </PageShell>
  );
}
