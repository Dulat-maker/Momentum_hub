import { AlertIcon, CheckIcon } from "./icons";

export function ErrorAlert({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-200">
      <AlertIcon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function SuccessAlert({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <p className="flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-3 text-sm text-success">
      <CheckIcon className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-line bg-panel-2 px-3.5 py-3 text-sm text-fg-muted">
      {children}
    </p>
  );
}
