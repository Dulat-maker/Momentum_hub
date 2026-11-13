export type ActionState = {
  error: string | null;
  success?: string | null;
  /** Which input the error is about, so the form can point straight at it. */
  field?: string | null;
  /**
   * What was typed. React clears an uncontrolled form once its action
   * finishes, so a rejected form has to be handed its own values back or the
   * writer loses everything.
   */
  values?: Record<string, string>;
  /** Changes on every rejection, so the form knows to refill itself. */
  stamp?: number;
};

export const emptyActionState: ActionState = { error: null };

export function failure(
  message: string,
  options?: { field?: string; values?: Record<string, string> },
): ActionState {
  return {
    error: message,
    field: options?.field ?? null,
    values: options?.values,
    stamp: Date.now(),
  };
}

export function success(message?: string): ActionState {
  return { error: null, success: message ?? null };
}

/**
 * A snapshot of the submitted text, to put back into a rejected form.
 * Passwords are left out on purpose: they should not travel back down to the
 * page and sit in the markup.
 */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    if (/password/i.test(key)) continue;
    values[key] = value;
  }

  return values;
}

/** Guards against open redirects coming from a `?next=` query parameter. */
export function safeInternalPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
