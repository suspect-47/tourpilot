// Glass pills: translucent fill, hairline rim, and a status dot so the
// state reads at a glance from across a demo room without relying on the
// label text alone.
const STYLES: Record<string, string> = {
  none: "border-white/10 bg-white/[0.06] text-ink-soft",
  not_due: "border-white/10 bg-white/[0.06] text-ink-soft",
  drafted: "border-ochre/30 bg-ochre/[0.14] text-ochre",
  approved: "border-moss/30 bg-moss/[0.14] text-moss",
  sent: "border-moss/50 bg-moss/25 text-moss",
  flagged: "border-brick/45 bg-brick/[0.16] text-brick",
};

const DOTS: Record<string, string> = {
  none: "bg-ink-soft/50",
  not_due: "bg-ink-soft/50",
  drafted: "bg-ochre",
  approved: "bg-moss",
  sent: "bg-moss",
  flagged: "bg-brick animate-rail-pulse",
};

const LABELS: Record<string, string> = {
  none: "No review",
  not_due: "Not due yet",
  drafted: "Draft ready",
  approved: "Approved",
  sent: "Sent",
  flagged: "Needs review",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide backdrop-blur-glass-sm ${
        STYLES[status] ?? STYLES.none
      }`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[status] ?? DOTS.none}`} />
      {LABELS[status] ?? status}
    </span>
  );
}
