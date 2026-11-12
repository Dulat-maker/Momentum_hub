"use client";

import { useRef } from "react";

/**
 * A plain GET form that resubmits itself as soon as a <select> changes, so the
 * filters feel instant without any client-side state. Text inputs still submit
 * on Enter.
 */
export function AutoSubmitForm({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      method="get"
      action={action}
      className={className}
      onChange={(event) => {
        if ((event.target as HTMLElement).tagName === "SELECT") {
          formRef.current?.requestSubmit();
        }
      }}
    >
      {children}
    </form>
  );
}
