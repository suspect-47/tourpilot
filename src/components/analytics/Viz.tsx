import type { ReactNode } from "react";

/**
 * Small hand-rolled visual primitives. No charting dependency: everything
 * here is a handful of divs and one inline SVG, which is cheaper than pulling
 * a library in for six charts and keeps the glass styling consistent.
 */

const TONE_TEXT = {
  rust: "text-rust",
  brick: "text-brick",
  ochre: "text-ochre",
  moss: "text-moss",
  ink: "text-ink",
} as const;

const TONE_BG = {
  rust: "bg-rust",
  brick: "bg-brick",
  ochre: "bg-ochre",
  moss: "bg-moss",
  ink: "bg-ink-soft",
} as const;

export type Tone = keyof typeof TONE_TEXT;

export function Panel({
  title,
  hint,
  action,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-card rounded-panel p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold leading-tight text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-xs leading-snug text-ink-soft">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StatTile({
  value,
  label,
  tone = "ink",
  sub,
}: {
  value: string | number;
  label: string;
  tone?: Tone;
  sub?: string;
}) {
  return (
    <div className="glass-card glass-lift rounded-tile px-4 py-3.5">
      <p className={`text-[26px] font-bold leading-none ${TONE_TEXT[tone]}`}>{value}</p>
      <p className="mt-2 text-xs font-semibold leading-tight text-ink">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] leading-tight text-ink-soft">{sub}</p>}
    </div>
  );
}

/** Horizontal stacked bar for a share-of-total breakdown. */
export function SegmentBar({
  segments,
}: {
  segments: { label: string; value: number; tone: Tone }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return <p className="text-sm text-ink-soft">Nothing to show yet.</p>;
  }
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              className={TONE_BG[s.tone]}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${s.value}`}
            />
          ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5 text-xs">
            <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_BG[s.tone]}`} />
            <span className="text-ink-soft">{s.label}</span>
            <span className="font-bold text-ink">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Vertical bars. Values are absolute counts, so the axis starts at zero. */
export function BarChart({
  data,
  height = 132,
}: {
  data: { label: string; count: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[11px] font-bold text-ink-soft opacity-0 transition group-hover:opacity-100">
              {d.count}
            </span>
            <div
              className="w-full rounded-t-[5px] bg-gradient-to-t from-sunset-btn to-sunset transition-all"
              style={{ height: `${Math.max(2, (d.count / max) * (height - 22))}px` }}
              title={`${d.label}: ${d.count}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <span
            key={i}
            className="min-w-0 flex-1 truncate text-center text-[10px] text-ink-soft/80"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Ranked rows with an inline proportional track. */
export function RankedBars({
  rows,
  tone = "rust",
  unit = "",
}: {
  rows: { label: string; count: number; share?: number }[];
  tone?: Tone;
  unit?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (rows.length === 0) return <p className="text-sm text-ink-soft">Nothing to show yet.</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-semibold text-ink">{r.label}</span>
            <span className="shrink-0 text-ink-soft">
              {r.count}
              {unit}
              {r.share !== undefined && ` · ${r.share}%`}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full ${TONE_BG[tone]}`}
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Pipeline stages, read left to right in the order the status flow moves. */
export function Funnel({
  stages,
}: {
  stages: { key: string; label: string; value: number; tone: Tone }[];
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <ol className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
      {stages.map((s) => (
        <li key={s.key} className="glass-inset rounded-tile px-3 py-2.5">
          <p className={`text-xl font-bold leading-none ${TONE_TEXT[s.tone]}`}>{s.value}</p>
          <p className="mt-1.5 text-[11px] font-semibold leading-tight text-ink-soft">{s.label}</p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full ${TONE_BG[s.tone]}`}
              style={{ width: `${(s.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
