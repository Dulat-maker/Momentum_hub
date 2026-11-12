"use client";

import { useState } from "react";

import { StarIcon } from "./icons";

export function StarRatingInput({
  name,
  defaultValue = 0,
}: {
  name: string;
  defaultValue?: number;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex items-center gap-1">
      <input type="hidden" name={name} value={value || ""} />
      {[1, 2, 3, 4, 5].map((step) => (
        <button
          key={step}
          type="button"
          aria-label={`Rate ${step} out of 5`}
          aria-pressed={value === step}
          onClick={() => setValue(value === step ? 0 : step)}
          className="cursor-pointer p-0.5"
        >
          <StarIcon
            filled={step <= value}
            className={`size-6 transition-colors ${
              step <= value ? "text-warn" : "text-fg-dim hover:text-fg-muted"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-xs text-fg-dim">
        {value ? `${value} / 5` : "optional"}
      </span>
    </div>
  );
}
