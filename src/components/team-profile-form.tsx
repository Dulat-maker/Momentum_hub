"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import { updateTeamAction } from "@/lib/actions/teams";
import type { Team } from "@/lib/types";

import { ErrorAlert, SuccessAlert } from "./alert";
import { SubmitButton } from "./submit-button";

export function TeamProfileForm({ team }: { team: Team }) {
  const [state, formAction] = useActionState(updateTeamAction, emptyActionState);

  return (
    <form action={formAction} className="space-y-5">
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
            defaultValue={team.name}
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
            defaultValue={team.organization ?? ""}
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
            defaultValue={team.city ?? ""}
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
            defaultValue={team.country ?? "Kazakhstan"}
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
            defaultValue={team.rookie_year ?? ""}
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
          defaultValue={team.about ?? ""}
          className="input resize-y"
          placeholder="Who you are, how long you have competed, what you are proud of, what you need help with."
        />
      </div>

      <div>
        <label className="field-label" htmlFor="logo_url">
          Logo URL
        </label>
        <input
          id="logo_url"
          name="logo_url"
          defaultValue={team.logo_url ?? ""}
          className="input"
          placeholder="https://..."
        />
        <p className="mt-1.5 text-xs text-fg-dim">
          Paste a link to a square image. Your initials are used if you leave
          this empty.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="website">
            Website
          </label>
          <input
            id="website"
            name="website"
            defaultValue={team.website ?? ""}
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
            defaultValue={team.instagram ?? ""}
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
            defaultValue={team.contact_email ?? ""}
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
