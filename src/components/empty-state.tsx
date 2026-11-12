import Link from "next/link";

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  actionHref,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon ? (
        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-panel-2 text-fg-dim">
          {icon}
        </span>
      ) : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-fg-muted">{body}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="btn btn-outline mt-2">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
