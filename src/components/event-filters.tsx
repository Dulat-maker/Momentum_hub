import Link from "next/link";

import {
  EVENT_FORMATS,
  EVENT_KINDS,
  FORMAT_LABELS,
  KIND_LABELS,
} from "@/lib/types";

import { AutoSubmitForm } from "./auto-submit-form";
import { SearchIcon } from "./icons";

export type EventFilterValues = {
  q: string;
  city: string;
  format: string;
  kind: string;
  when: string;
};

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: [string, string][];
}) {
  return (
    <div className="min-w-36">
      <label className="field-label" htmlFor={`filter-${name}`}>
        {label}
      </label>
      <select
        id={`filter-${name}`}
        name={name}
        defaultValue={value}
        className="input"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

export function EventFilters({
  cities,
  current,
}: {
  cities: string[];
  current: EventFilterValues;
}) {
  const isFiltered =
    Boolean(current.q || current.city || current.format || current.kind) ||
    (current.when !== "" && current.when !== "upcoming");

  return (
    <AutoSubmitForm
      action="/events"
      className="card flex flex-wrap items-end gap-3 p-4"
    >
      <div className="min-w-55 flex-1">
        <label className="field-label" htmlFor="filter-q">
          Search
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-dim" />
          <input
            id="filter-q"
            name="q"
            defaultValue={current.q}
            className="input pl-9"
            placeholder="Title, venue, keyword"
          />
        </div>
      </div>

      <Select
        name="when"
        label="When"
        value={current.when || "upcoming"}
        options={[
          ["upcoming", "Upcoming"],
          ["past", "Past"],
          ["all", "All dates"],
        ]}
      />

      <Select
        name="city"
        label="City"
        value={current.city}
        options={[
          ["", "Everywhere"],
          ...cities.map((city) => [city, city] as [string, string]),
        ]}
      />

      <Select
        name="format"
        label="Format"
        value={current.format}
        options={[
          ["", "Any format"],
          ...EVENT_FORMATS.map(
            (format) => [format, FORMAT_LABELS[format]] as [string, string],
          ),
        ]}
      />

      <Select
        name="kind"
        label="Kind"
        value={current.kind}
        options={[
          ["", "Any kind"],
          ...EVENT_KINDS.map(
            (kind) => [kind, KIND_LABELS[kind]] as [string, string],
          ),
        ]}
      />

      <div className="flex items-center gap-2">
        <button type="submit" className="btn btn-outline">
          Apply
        </button>
        {isFiltered ? (
          <Link href="/events" className="btn btn-ghost">
            Reset
          </Link>
        ) : null}
      </div>
    </AutoSubmitForm>
  );
}
