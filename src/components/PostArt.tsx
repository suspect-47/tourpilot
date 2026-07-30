/**
 * Deterministic cover art for a queued post.
 *
 * Inlet has no image storage and no image generation, so rather than shipping
 * a grey placeholder or a stock photo that misrepresents the operator, each
 * post gets generated art: a small SVG scene built from the brand palette and
 * seeded by the post's own id, so the same post always looks the same and two
 * posts never look identical.
 */

// Order is [sun, mid sky, high sky]. The themes are pulled well apart so two
// cards side by side never read as the same picture: seasonal is a bright
// gold-and-orange daylight scene, testimonial a deep dusk one.
const PALETTES = {
  seasonal: ["#FFD9A0", "#F6864A", "#B8431A"],
  testimonial: ["#FBA875", "#A6193B", "#2A1420"],
  default: ["#F6C78F", "#D9663A", "#5A2030"],
} as const;

function seedFrom(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function PostArt({
  id,
  theme,
  className = "",
}: {
  id: string;
  theme: string;
  className?: string;
}) {
  const palette = PALETTES[theme as keyof typeof PALETTES] ?? PALETTES.default;
  const seed = seedFrom(id);

  // Everything below is derived from the seed, so the scene is stable per post.
  const sunX = 22 + (seed % 56);
  const sunY = 30 + ((seed >> 3) % 18);
  const sunR = 9 + ((seed >> 7) % 6);
  const hills = [
    { y: 58 + ((seed >> 2) % 6), amp: 6 + ((seed >> 5) % 5) },
    { y: 68 + ((seed >> 6) % 6), amp: 8 + ((seed >> 9) % 6) },
  ];
  const gid = `pa-${seed.toString(36)}`;

  const wave = (y: number, amp: number) =>
    `M0 ${y} Q 25 ${y - amp}, 50 ${y} T 100 ${y} L100 100 L0 100 Z`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
        role="presentation"
      >
        <defs>
          <linearGradient id={`${gid}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette[2]} />
            <stop offset="60%" stopColor={palette[1]} stopOpacity="0.75" />
            <stop offset="100%" stopColor={palette[0]} stopOpacity="0.45" />
          </linearGradient>
          <radialGradient id={`${gid}-sun`}>
            <stop offset="0%" stopColor="#FFE6C8" />
            <stop offset="100%" stopColor={palette[0]} />
          </radialGradient>
        </defs>

        <rect width="100" height="100" fill={`url(#${gid}-sky)`} />
        <circle cx={sunX} cy={sunY} r={sunR * 1.9} fill={palette[0]} opacity="0.16" />
        <circle cx={sunX} cy={sunY} r={sunR} fill={`url(#${gid}-sun)`} opacity="0.95" />
        {/* Seeded birds, the cheapest way to make two scenes with the same
            palette still read as different pictures. */}
        {[0, 1, 2].map((n) => {
          const bx = 8 + ((seed >> (n * 4 + 1)) % 84);
          const by = 14 + ((seed >> (n * 3 + 2)) % 26);
          const bs = 2 + ((seed >> (n + 5)) % 2);
          return (
            <path
              key={n}
              d={`M${bx} ${by} q ${bs} ${-bs}, ${bs * 2} 0 M${bx + bs * 2} ${by} q ${bs} ${-bs}, ${bs * 2} 0`}
              stroke="#1A1512"
              strokeWidth="0.7"
              fill="none"
              opacity="0.35"
            />
          );
        })}
        <path d={wave(hills[0].y, hills[0].amp)} fill={palette[2]} opacity="0.5" />
        <path d={wave(hills[1].y, hills[1].amp)} fill="#1A1512" opacity="0.62" />
      </svg>

      {/* Keeps the badges above it legible whatever the seed produced. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
    </div>
  );
}
