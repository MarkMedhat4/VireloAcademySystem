/** Move keyboard focus to the first invalid control after a failed submit. */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}

/** Hidden honeypot field styles (bots fill it, humans never see it). */
export const honeypotClass = "absolute -start-[9999px] top-auto h-px w-px overflow-hidden opacity-0";
