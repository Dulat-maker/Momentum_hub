/**
 * Lightning running horizontally behind the page.
 *
 * Decoration only: a fixed layer under the content that never takes a click.
 * The bolts are placed by hand rather than tiled - a repeating pattern reads
 * as wallpaper, where a few at different sizes and angles read as weather.
 */

type Bolt = {
  top: string;
  left: string;
  width: string;
  rotate: number;
  opacity: number;
  flip?: boolean;
};

const BOLTS: Bolt[] = [
  { top: "8%", left: "-6%", width: "46vw", rotate: -7, opacity: 0.22 },
  { top: "27%", left: "52%", width: "56vw", rotate: 5, opacity: 0.14 },
  { top: "48%", left: "-12%", width: "38vw", rotate: 4, opacity: 0.1, flip: true },
  { top: "66%", left: "40%", width: "62vw", rotate: -4, opacity: 0.17 },
  { top: "86%", left: "-4%", width: "44vw", rotate: 6, opacity: 0.12, flip: true },
];

/** A single streak: a zigzag that travels left to right, not a struck bolt. */
function Bolt({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 320 48"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M2 30 L74 14 L54 32 L142 10 L118 30 L206 12 L180 32 L268 14 L246 30 L318 18"
        stroke="var(--color-volt)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SiteLightning({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}
    >
      {BOLTS.map((bolt, index) => (
        <Bolt
          key={index}
          className="absolute"
          style={{
            top: bolt.top,
            left: bolt.left,
            width: bolt.width,
            opacity: bolt.opacity,
            transform: `rotate(${bolt.rotate}deg)${bolt.flip ? " scaleX(-1)" : ""}`,
            filter:
              "drop-shadow(0 0 14px color-mix(in oklch, var(--color-volt) 55%, transparent))",
          }}
        />
      ))}
    </div>
  );
}
