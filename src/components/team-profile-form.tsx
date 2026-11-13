"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import { updateTeamAction } from "@/lib/actions/teams";
import type { Team } from "@/lib/types";

import { ErrorAlert, SuccessAlert } from "./alert";
import { ImageUpload } from "./image-upload";
import { SubmitButton } from "./submit-button";

export function TeamProfileForm({ team }: { team: Team }) {
  const [state, formAction] = useActionState(updateTeamAction, emptyActionState);

  const value = (name: string, fallback?: string | number | null) =>
    state.values?.[name] ?? (fallback == null ? "" : String(fallback));
  const invalid = (name: string) => state.field === name;

  return (
    <form
      key={state.stamp ?? "new"}
      action={formAction}
      className="space-y-5"
    >
      <ErrorAlert message={state.error} />
      <SuccessAlert message={state.success} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">
            Team name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={value("name", team.name)}
            aria-invalid={invalid("name") || undefined}
            autoFocus={invalid("name")}
            className="input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="organization">
            School or organization
          </label>
          <input
            id="organization"
            name="organization"
            defaultValue={value("organization", team.organization)}
            className="input"
            placeholder="NIS Almaty"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="city">
            City
          </label>
          <input
            id="city"
            name="city"
            required
            defaultValue={value("city", team.city)}
            aria-invalid={invalid("city") || undefined}
            autoFocus={invalid("city")}
            className="input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="country">
            Country
          </label>
          <input
            id="country"
            name="country"
            defaultValue={value("country", team.country ?? "Kazakhstan")}
            className="input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="rookie_year">
            Rookie year
          </label>
          <input
            id="rookie_year"
            name="rookie_year"
            type="number"
            min={1990}
            max={2100}
            defaultValue={value("rookie_year", team.rookie_year)}
            aria-invalid={invalid("rookie_year") || undefined}
            autoFocus={invalid("rookie_year")}
            className="input"
            placeholder="2024"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="about">
          About your team
        </label>
        <textarea
          id="about"
          name="about"
          rows={6}
          defaultValue={value("about", team.about)}
          className="input resize-y"
          placeholder="Who you are, how long you have competed, what you are proud of, what you need help with."
        />
      </div>

      <ImageUpload
        name="logo_url"
        bucket="team-logos"
        prefix="logo"
        teamId={team.id}
        label="Team logo"
        hint="Square works best. PNG, JPG, WebP or SVG, up to 2 MB."
        accept={["image/png", "image/jpeg", "image/webp", "image/svg+xml"]}
        previewName={team.name}
        defaultValue={value("logo_url", team.logo_url)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="website">
            Website
          </label>
          <input
            id="website"
            name="website"
            defaultValue={value("website", team.website)}
            className="input"
            placeholder="team12345.kz"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="instagram">
            Instagram
          </label>
          <input
            id="instagram"
            name="instagram"
            defaultValue={value("instagram", team.instagram)}
            className="input"
            placeholder="@team12345"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="contact_email">
            Public contact email
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={value("contact_email", team.contact_email)}
            className="input"
            placeholder="hello@team12345.kz"
          />
        </div>
      </div>

      <p className="text-xs text-fg-dim">
        Everything on this form is shown on your public team page.
      </p>

      <SubmitButton>Save profile</SubmitButton>
    </form>
  );
}
