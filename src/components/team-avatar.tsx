import { initialsOf } from "@/lib/format";

const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
} as const;

export function TeamAvatar({
  name,
  logoUrl,
  size = "md",
  className = "",
}: {
  name: string;
  logoUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const shell = `${SIZES[size]} shrink-0 overflow-hidden rounded-xl border border-line ${className}`;

  if (logoUrl) {
    return (
      <span className={`${shell} bg-panel-2`}>
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </span>
    );
  }

  return (
    <span
      className={`${shell} grid place-items-center bg-gradient-to-br from-panel-2 to-canvas font-semibold tracking-wide text-fg-muted`}
    >
      {initialsOf(name)}
    </span>
  );
}
