import { StarIcon } from "./icons";

export function StarRating({
  value,
  className = "size-3.5",
}: {
  value: number;
  className?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((step) => (
        <StarIcon
          key={step}
          filled={step <= value}
          className={`${className} ${step <= value ? "text-warn" : "text-fg-dim"}`}
        />
      ))}
    </span>
  );
}
