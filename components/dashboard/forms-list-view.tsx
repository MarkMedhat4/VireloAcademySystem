"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ClipboardList, Copy, ExternalLink, ListChecks, Pencil, Plus, RotateCcw } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { archiveForm, duplicateForm, restoreForm } from "@/app/admin/forms-actions";
import { SITE } from "@/lib/config";
import { STATUS_LABEL_AR, type FormRecord, type FormStatus } from "@/lib/forms";
import { formatDate } from "@/lib/payment";

const STATUS_TONE: Record<FormStatus, "gold" | "success" | "muted"> = { draft: "gold", published: "success", archived: "muted" };

export function FormsListView({ forms }: { forms: Array<FormRecord & { responseCount: number }> }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(id: string, action: (id: string) => Promise<{ ok: boolean; message?: string }>) {
    setBusyId(id);
    setError(null);
    const res = await action(id);
    setBusyId(null);
    if (!res.ok) setError(res.message ?? "حدث خطأ.");
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">النماذج</h1>
          <p className="text-ink-2 num">{forms.length} نموذج</p>
        </div>
        <ButtonLink href="/admin/forms/create">
          <Plus className="size-4" aria-hidden />
          إنشاء نموذج
        </ButtonLink>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {forms.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="لا توجد نماذج بعد"
            description="أنشئ أول نموذج لأكاديمية Virelo وابدأ في استقبال الردود."
            action={
              <ButtonLink href="/admin/forms/create">
                <Plus className="size-4" aria-hidden />
                إنشاء نموذج
              </ButtonLink>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {forms.map((f) => (
            <Card key={f.id} accent className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">{f.name}</p>
                  <p className="truncate text-sm text-ink-2">{f.title}</p>
                </div>
                <Badge tone={STATUS_TONE[f.status]}>{STATUS_LABEL_AR[f.status]}</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-2 num">
                {f.responseCount} رد · أُنشئ {formatDate(f.created_at)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/forms/${f.id}`} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-navy px-3 text-sm font-semibold hover:border-gold">
                  <Pencil className="size-3.5" aria-hidden />
                  تعديل
                </Link>
                <Link href={`/admin/forms/${f.id}/responses`} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-navy px-3 text-sm font-semibold hover:border-gold">
                  <ListChecks className="size-3.5" aria-hidden />
                  الردود
                </Link>
                {f.status === "published" && (
                  <a
                    href={`${SITE.url}/forms/${f.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center gap-1 rounded-md border border-navy px-3 text-sm font-semibold hover:border-gold"
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                    فتح
                  </a>
                )}
                {f.status === "published" && (
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(`${SITE.url}/forms/${f.slug}`).catch(() => {});
                    }}
                    className="inline-flex min-h-9 items-center gap-1 rounded-md border border-navy px-3 text-sm font-semibold hover:border-gold"
                  >
                    <Copy className="size-3.5" aria-hidden />
                    نسخ الرابط
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                <Button variant="ghost" size="sm" loading={busyId === f.id} onClick={() => run(f.id, duplicateForm)}>
                  <Copy className="size-3.5" aria-hidden />
                  تكرار
                </Button>
                {f.status !== "archived" ? (
                  <Button variant="ghost" size="sm" loading={busyId === f.id} onClick={() => run(f.id, archiveForm)}>
                    <Archive className="size-3.5" aria-hidden />
                    أرشفة
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" loading={busyId === f.id} onClick={() => run(f.id, restoreForm)}>
                    <RotateCcw className="size-3.5" aria-hidden />
                    استعادة
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
