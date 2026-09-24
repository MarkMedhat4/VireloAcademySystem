"use client";

import { ImageUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { validateProofFile } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function ProofUpload({
  file,
  onChange,
  error,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  // Revoke the blob URL when the component unmounts.
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function setPreviewFor(f: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = f ? URL.createObjectURL(f) : null;
    setPreview(previewRef.current);
  }

  const shownError = localError ?? error;
  const kb = file ? Math.max(1, Math.round(file.size / 1024)) : 0;

  return (
    <div>
      <p id="proof-label" className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
        صورة الدفع <span className="text-danger" aria-hidden>*</span>
      </p>

      {!file ? (
        <label
          htmlFor="proof"
          className={cn(
            "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-white px-4 py-6 text-center transition duration-200",
            "focus-within:border-gold focus-within:ring-4 focus-within:ring-gold/25 hover:border-gold",
            shownError ? "border-danger" : "border-line",
          )}
        >
          <ImageUp className="size-8 text-gold" strokeWidth={1.5} aria-hidden />
          <span className="font-semibold">اضغط لاختيار صورة التحويل</span>
          <span className="text-sm text-ink-2" dir="ltr" lang="en">
            JPG · PNG · WEBP — max 5MB
          </span>
          <input
            id="proof"
            name="proof"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-labelledby="proof-label"
            aria-invalid={shownError ? true : undefined}
            aria-describedby={shownError ? "proof-error" : undefined}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              if (!f) return;
              const problem = validateProofFile(f);
              setLocalError(problem);
              if (!problem) {
                setPreviewFor(f);
                onChange(f);
              }
            }}
          />
        </label>
      ) : (
        <div className="flex items-center gap-4 rounded-md border border-line bg-white p-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimizable
            <img src={preview} alt="معاينة صورة الدفع" className="size-20 shrink-0 rounded-md border border-line object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold" dir="ltr">
              {file.name}
            </p>
            <p className="text-sm text-ink-2 num" dir="ltr">
              {kb} KB
            </p>
          </div>
          <button
            type="button"
            className="on-light flex size-11 shrink-0 items-center justify-center rounded-md border border-line transition hover:border-danger hover:text-danger"
            aria-label="إزالة الصورة"
            onClick={() => {
              setPreviewFor(null);
              setLocalError(null);
              onChange(null);
            }}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      )}
      {shownError && (
        <p id="proof-error" className="mt-2 text-sm font-medium text-danger">
          {shownError}
        </p>
      )}
    </div>
  );
}
