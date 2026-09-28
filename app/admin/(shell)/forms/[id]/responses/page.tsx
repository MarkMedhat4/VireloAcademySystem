import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { ResponsesView } from "@/components/dashboard/responses-view";
import { listResponses } from "@/app/admin/forms-actions";
import { cairoDay } from "@/lib/payment";

export const metadata: Metadata = { title: "ردود النموذج", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminFormResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await listResponses(id);
  if (!res.ok) return <Alert variant="error">{res.message}</Alert>;

  const now = new Date();
  const today = cairoDay(now.toISOString());
  const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();
  const todayCount = res.data.responses.filter((r) => cairoDay(r.created_at) === today).length;
  const weekCount = res.data.responses.filter((r) => r.created_at >= weekAgo).length;

  return <ResponsesView form={res.data.form} fields={res.data.fields} responses={res.data.responses} todayCount={todayCount} weekCount={weekCount} />;
}
