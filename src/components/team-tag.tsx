import { PROGRAM_LABELS, type Program } from "@/lib/types";

/**
 * "FTC #12345 Momentum". The programme is part of the name now: FIRST hands
 * out the same numbers in FTC and FLL, so a bare number is ambiguous.
 */
export function TeamTag({
  team,
  className = "",
}: {
  team: { program: Program; team_number: number; name: string };
  className?: string;
}) {
  return (
    <span className={`truncate ${className}`}>
      <span className="text-fg-dim">
        {PROGRAM_LABELS[team.program]} #{team.team_number}
      </span>{" "}
      {team.name}
    </span>
  );
}
