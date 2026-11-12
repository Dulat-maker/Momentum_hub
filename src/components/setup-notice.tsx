import { AlertIcon } from "./icons";

/**
 * Rendered in place of any data-backed page while the Supabase keys are still
 * missing, so a fresh clone never shows a stack trace.
 */
export function SetupNotice() {
  return (
    <div className="card mx-auto max-w-2xl p-6 sm:p-8">
      <p className="flex items-center gap-2 text-brand-mid">
        <AlertIcon className="size-5" />
        <span className="eyebrow">One step left</span>
      </p>

      <h2 className="mt-3 text-2xl font-semibold">Connect Supabase</h2>
      <p className="mt-2 text-sm text-fg-muted">
        The hub stores teams, events and posts in Supabase. It takes about five
        minutes to hook up:
      </p>

      <ol className="mt-5 space-y-4 text-sm">
        <li className="flex gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-panel-2 text-xs font-semibold text-brand-mid">
            1
          </span>
          <span className="text-fg-muted">
            Create a free project at{" "}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-fg underline decoration-line underline-offset-4 hover:decoration-brand-mid"
            >
              supabase.com/dashboard
            </a>
            .
          </span>
        </li>
        <li className="flex gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-panel-2 text-xs font-semibold text-brand-mid">
            2
          </span>
          <span className="text-fg-muted">
            Open the SQL editor, paste everything from{" "}
            <code className="rounded bg-panel-2 px-1.5 py-0.5 text-xs text-fg">
              supabase/schema.sql
            </code>{" "}
            and press Run.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-panel-2 text-xs font-semibold text-brand-mid">
            3
          </span>
          <span className="text-fg-muted">
            Copy the project URL and anon key from Project Settings → API into{" "}
            <code className="rounded bg-panel-2 px-1.5 py-0.5 text-xs text-fg">
              .env.local
            </code>
            , then restart <code className="text-fg">npm run dev</code>.
          </span>
        </li>
      </ol>

      <pre className="mt-6 overflow-x-auto rounded-xl border border-line bg-canvas p-4 text-xs leading-relaxed text-fg-muted">
        {`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...`}
      </pre>
    </div>
  );
}
