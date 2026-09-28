import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PublicFormClient } from "@/components/forms/public-form-client";
import { getFormForPublicView } from "@/app/actions/forms";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const view = await getFormForPublicView(slug);
  if (view.status === "ready") return { title: view.form.title };
  if (view.status === "archived" || view.status === "closed") return { title: view.title };
  return { title: "النموذج غير موجود" };
}

export default async function PublicFormPage({ params }: Props) {
  const { slug } = await params;
  const view = await getFormForPublicView(slug);

  if (view.status === "not_found") {
    return (
      <PageShell eyebrow="Virelo Forms" title="النموذج غير موجود" subtitle="تحقق من الرابط أو تواصل مع الأكاديمية.">
        <Card className="p-6 md:p-8">
          <EmptyState title="لا يوجد نموذج بهذا الرابط" description="قد يكون الرابط غير صحيح أو تم حذف النموذج." />
        </Card>
      </PageShell>
    );
  }

  if (view.status === "archived" || view.status === "closed") {
    return (
      <PageShell eyebrow="Virelo Forms" title={view.title} subtitle="هذا النموذج لم يعد يستقبل ردوداً.">
        <Card className="p-6 md:p-8">
          <EmptyState title="لم يعد هذا النموذج متاحاً" description="هذا النموذج لم يعد يستقبل ردوداً. تواصل مع إدارة الأكاديمية لمزيد من المعلومات." />
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Virelo Forms" title={view.form.title} subtitle={view.form.description ?? undefined}>
      <Card accent className="p-6 md:p-8">
        <PublicFormClient slug={slug} fields={view.fields} />
      </Card>
    </PageShell>
  );
}
