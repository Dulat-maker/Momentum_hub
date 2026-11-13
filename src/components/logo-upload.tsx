"use client";

import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { TeamAvatar } from "./team-avatar";

const BUCKET = "team-logos";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  return file.type === "image/png" ? "png" : "jpg";
}

/**
 * Uploads straight from the browser into the team's own folder, then hands
 * the public URL to the surrounding form through a hidden input - so the
 * profile is still saved by the same server action as everything else.
 */
export function LogoUpload({
  teamId,
  teamName,
  defaultValue,
}: {
  teamId: string;
  teamName: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED.includes(file.type)) {
      setError("Use a PNG, JPG, WebP or SVG.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Keep it under 2 MB.`,
      );
      return;
    }

    setBusy(true);

    try {
      const supabase = createClient();
      // The timestamp keeps the old file cached while the new one appears.
      const path = `${teamId}/logo-${Date.now()}.${extensionFor(file)}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setError(
          /bucket/i.test(uploadError.message)
            ? "Storage is not set up yet. Run the newest file in supabase/migrations/."
            : uploadError.message,
        );
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch {
      setError("The upload did not go through. Check the connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="field-label">Team logo</span>

      <div className="flex flex-wrap items-center gap-4">
        <TeamAvatar name={teamName} logoUrl={url || null} size="lg" />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "Uploading..." : url ? "Replace" : "Upload a logo"}
          </button>

          {url ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => {
                setUrl("");
                setError(null);
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Clear it, or picking the same file twice does nothing.
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      {/* What the form actually submits. */}
      <input type="hidden" name="logo_url" value={url} />

      {error ? (
        <p className="mt-2 text-xs text-red-300">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-fg-dim">
          Square works best. PNG, JPG, WebP or SVG, up to 2 MB.
        </p>
      )}
    </div>
  );
}
