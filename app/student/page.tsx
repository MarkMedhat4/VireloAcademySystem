import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { StudentPortal } from "@/components/forms/student-portal";
import { getSessionStudent } from "@/lib/student-session";
import { isServiceRoleConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "بيانات الطالب" };
export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const configured = isServiceRoleConfigured();
  let student = null;
  if (configured) {
    try {
      student = await getSessionStudent();
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
