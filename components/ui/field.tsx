import { ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "h-12 w-full rounded-md border bg-white px-4 text-base text-ink outline-none transition duration-200 ease-out " +
  "placeholder:text-mute focus:ring-4 disabled:bg-canvas disabled:text-ink-2";
const inputOk = "border-line focus:border-gold focus:ring-gold/25";
const inputBad = "border-danger focus:border-danger focus:ring-danger/20";

export function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  optionalLabel,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optionalLabel?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
        {label}
        {required && <span className="text-danger" aria-hidden>*</span>}
        {optionalLabel && <span className="text-xs font-normal text-ink-2">(اختياري)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-sm text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

interface TextFieldProps extends Omit<ComponentProps<"input">, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optionalLabel?: boolean;
  ltr?: boolean;
}

/** Labelled text input with accessible error / hint wiring. `ltr` is for phone numbers, emails, codes. */
export function TextField({ id, label, hint, error, optionalLabel, ltr, className, required, ...props }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} optionalLabel={optionalLabel}>
      <input
        id={id}
        name={props.name ?? id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        dir={ltr ? "ltr" : undefined}
        className={cn(inputBase, error ? inputBad : inputOk, ltr && "text-start", className)}
        {...props}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<ComponentProps<"select">, "id"> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: readonly string[];
}

export function SelectField({ id, label, hint, error, placeholder = "اختر…", options, required, className, ...props }: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <select
          id={id}
          name={props.name ?? id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(inputBase, "appearance-none pe-12", error ? inputBad : inputOk, className)}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-ink-2" aria-hidden />
      </div>
    </FieldShell>
  );
}

export { inputBase, inputOk, inputBad };
