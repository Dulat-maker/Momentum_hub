"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingLabel = "Saving...",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Icon-only submit used for destructive row actions. */
export function IconSubmitButton({
  children,
  className = "btn btn-ghost btn-sm",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      title={title}
      aria-label={title}
      disabled={pending}
    >
      {children}
    </button>
  );
}
