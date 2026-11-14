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
  { top: "6%", left: "-18%", width: "125vw", rotate: -5, opacity: 0.38 },
  { top: "24%", left: "-5%", width: "95vw", rotate: 4, opacity: 0.24, flip: true },
  { top: "44%", left: "-30%", width: "135vw", rotate: 3, opacity: 0.3 },
  { top: "63%", left: "-10%", width: "110vw", rotate: -4, opacity: 0.26, flip: true },
  { top: "82%", left: "-22%", width: "128vw", rotate: 5, opacity: 0.32 },
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
      {/* non-scaling-stroke: the bolts are stretched well past the viewport,
          which would otherwise scale the line with them and turn thin
          lightning into fat ribbons. */}
      <path
        d="M2 30 L74 14 L54 32 L142 10 L118 30 L206 12 L180 32 L268 14 L246 30 L318 18"
        stroke="var(--color-volt)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
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
              "drop-shadow(0 0 18px color-mix(in oklch, var(--color-volt) 70%, transparent))",
          }}
        />
      ))}
    </div>
  );
}
