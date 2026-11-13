"use client";

import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { TeamAvatar } from "./team-avatar";

const DEFAULT_TYPES = ["image/png", "image/jpeg", "image/webp"];

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  return file.type === "image/png" ? "png" : "jpg";
}

/**
 * Uploads straight from the browser into the team's own folder, then hands
 * the public URL to the surrounding form through a hidden input - so whatever
 * is being edited is still saved by the same server action as everything
 * else, and the URL travels back with the form if the save is rejected.
 */
export function ImageUpload({
  name,
  bucket,
  teamId,
  label,
  hint,
  defaultValue,
  maxBytes = 2 * 1024 * 1024,
  accept = DEFAULT_TYPES,
  preview = "avatar",
  previewName = "",
  prefix = "image",
}: {
  name: string;
  bucket: string;
  teamId: string;
  label: string;
  hint: string;
  defaultValue?: string | null;
  maxBytes?: number;
  accept?: string[];
  preview?: "avatar" | "wide";
  previewName?: string;
  prefix?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!accept.includes(file.type)) {
      setError(
        `Use ${accept.map((type) => type.replace("image/", "").toUpperCase()).join(", ")}.`,
      );
      return;
    }
    if (file.size > maxBytes) {
      setError(
        `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Keep it under ${Math.round(maxBytes / 1024 / 1024)} MB.`,
      );
      return;
    }

    setBusy(true);

    try {
      const supabase = createClient();
      // The timestamp means a replacement never collides with a cached copy.
      const path = `${teamId}/${prefix}-${Date.now()}.${extensionFor(file)}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        setError(
          /bucket/i.test(uploadError.message)
            ? "Storage is not set up yet. Run the newest file in supabase/migrations/."
            : uploadError.message,
        );
        return;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch {
      setError("The upload did not go through. Check the connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="field-label">{label}</span>

      <div
        className={
          preview === "wide"
            ? "space-y-3"
            : "flex flex-wrap items-center gap-4"
        }
      >
        {preview === "wide" ? (
          url ? (
            <img
              src={url}
              alt=""
              className="aspect-[16/7] w-full max-w-md rounded-xl border border-line object-cover"
            />
          ) : (
            <div className="grid aspect-[16/7] w-full max-w-md place-items-center rounded-xl border border-dashed border-line bg-panel-2 text-xs text-fg-dim">
              No cover yet
            </div>
          )
        ) : (
          <TeamAvatar name={previewName} logoUrl={url || null} size="lg" />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "Uploading..." : url ? "Replace" : "Upload"}
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
        accept={accept.join(",")}
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
      <input type="hidden" name={name} value={url} />

      {error ? (
        <p className="mt-2 text-xs text-red-300">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-fg-dim">{hint}</p>
      )}
    </div>
  );
}
