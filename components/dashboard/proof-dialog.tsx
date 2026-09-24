"use client";

import { ExternalLink, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";

export type ProofState = { status: "loading" } | { status: "ready"; url: string } | { status: "error"; message: string } | null;

/** Modal viewer for a payment proof. The image comes from a 2-minute signed URL — never a public link. */
export function ProofDialog({ state, onClose }: { state: ProofState; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (state && !d.open) d.showModal();
    if (!state && d.open) d.close();
  }, [state]);

  return (
    <dialog
      ref={ref}
      aria-label="صورة إثبات الدفع"
      className="m-auto w-[min(92vw,720px)] rounded-xl border border-line bg-white p-0 text-ink shadow-2xl"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <h2 className="text-base">صورة إثبات الدفع</h2>
        <button type="button" onClick={onClose} className="on-light flex size-11 items-center justify-center rounded-md hover:bg-navy/5" aria-label="إغلاق">
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="p-4">
        {state?.status === "loading" && (
          <div className="flex min-h-48 items-center justify-center text-ink-2" role="status">
            <LoaderCircle className="me-2 size-5 animate-spin" aria-hidden />
            جارٍ تحميل الصورة…
          </div>
        )}
        {state?.status === "error" && <Alert variant="error">{state.message}</Alert>}
        {state?.status === "ready" && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, must not be proxied/optimized */}
            <img src={state.url} alt="صورة إثبات الدفع المرفوعة من الطالب" className="mx-auto max-h-[65vh] w-auto max-w-full rounded-md border border-line" />
            <a
              href={state.url}
              target="_blank"
              rel="noopener noreferrer"
              className="on-light mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-navy underline underline-offset-4 hover:text-gold"
            >
              <ExternalLink className="size-4" aria-hidden />
              فتح في تبويب جديد (الرابط ينتهي خلال دقيقتين)
            </a>
          </>
        )}
      </div>
    </dialog>
  );
}
