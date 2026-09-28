import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "الحضور", robots: { index: false, follow: false } };

/**
 * Placeholder. Attendance was listed in the admin navigation by the brief, but no attendance
 * data model, rules, or UI were specified — building one honestly needs its own scoped request
 * (session/class model, who marks it, per-lesson vs per-day, etc.). Not implemented yet.
 */
export default function AdminAttendancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl">الحضور</h1>
      <Card>
        <EmptyState icon={CalendarCheck} title="قريباً" description="متابعة الحضور غير مفعّلة بعد في هذا الإصدار." />
      </Card>
    </div>
  );
}
