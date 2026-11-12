export type ActionState = {
  error: string | null;
  success?: string | null;
};

export const emptyActionState: ActionState = { error: null };

export function failure(message: string): ActionState {
  return { error: message };
}

export function success(message?: string): ActionState {
  return { error: null, success: message ?? null };
}

/** Guards against open redirects coming from a `?next=` query parameter. */
export function safeInternalPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
