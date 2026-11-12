import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center sm:px-6">
      <p className="font-display text-5xl font-semibold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Nothing here</h1>
      <p className="mt-2 text-sm text-fg-muted">
        That page, event or team does not exist - or it was deleted by the team
        that owned it.
      </p>
      <div className="mt-7 flex gap-3">
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
        <Link href="/events" className="btn btn-primary">
          Browse events
        </Link>
      </div>
    </div>
  );
}
