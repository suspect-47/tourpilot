const STYLES: Record<string, string> = {
  none: "bg-ink/10 text-ink-soft",
  not_due: "bg-ink/10 text-ink-soft",
  drafted: "bg-ochre/20 text-ochre",
  approved: "bg-moss/20 text-moss",
  sent: "bg-moss text-paper-raised",
  flagged: "bg-brick/15 text-brick",
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-mono uppercase tracking-wide ${
        STYLES[status] ?? STYLES.none
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
