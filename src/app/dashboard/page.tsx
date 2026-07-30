import { getSessionOrDemo as getSession } from "@/lib/demoSession";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";
import { GuestTicketCard } from "@/components/GuestTicketCard";
import { AutopilotButton } from "@/components/AutopilotButton";

export const dynamic = "force-dynamic";

type GuestRow = {
  id: string;
  bookingDate: string | Date;
  reviewText: string | null;
  reviewStatus: string;
  reengagementStatus: string;
};

/**
 * Cards are ordered by what needs a human, not by booking date. A flagged
 * review is the one thing the autopilot deliberately refused to handle on
 * its own, so it leads the timeline. Guests whose tour hasn't happened yet
 * sort last: nothing is due on them, and sorting them first (which plain
 * bookingDate desc did) opened the page on an empty card.
 */
function attentionRank(g: GuestRow, now: number): number {
  if (g.reviewStatus === "flagged") return 0; // held for a person
  if (g.reviewText && g.reviewStatus === "none") return 1; // review with no reply yet
  if (g.reviewStatus === "drafted" || g.reengagementStatus === "drafted") return 2; // waiting on approval
  if (new Date(g.bookingDate).getTime() > now) return 5; // tour hasn't happened
  if (g.reviewStatus === "approved" || g.reengagementStatus === "approved") return 3;
  return 4;
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "brick" | "rust" | "ochre" | "moss";
}) {
  const toneClass = {
    brick: "text-brick",
    rust: "text-rust",
    ochre: "text-ochre",
    moss: "text-moss",
  }[tone];

  return (
    <div className="glass-card rounded-tile px-4 py-3">
      <p className={`font-display text-2xl font-semibold leading-none ${toneClass}`}>{value}</p>
      <p className="mt-1.5 text-xs leading-tight text-ink-soft">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  const user = await getOrCreateUserAndBusiness(session!.user.sub, session!.user.email, session!.user.name);

  const guests = await prisma.guest.findMany({
    where: { businessId: user.business.id },
    orderBy: { bookingDate: "desc" },
  });

  const now = Date.now();
  const ordered = [...guests].sort((a: GuestRow, b: GuestRow) => {
    const byAttention = attentionRank(a, now) - attentionRank(b, now);
    if (byAttention !== 0) return byAttention;
    return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
  });

  const heldForYou = guests.filter((g: GuestRow) => g.reviewStatus === "flagged").length;
  const needsReview = guests.filter((g: GuestRow) => g.reviewText && g.reviewStatus === "none").length;
  const draftsReady = guests.filter(
    (g: GuestRow) => g.reviewStatus === "drafted" || g.reengagementStatus === "drafted"
  ).length;
  const alreadySent = guests.filter(
    (g: GuestRow) => g.reviewStatus === "sent" || g.reengagementStatus === "sent"
  ).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Guest timeline</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Every booking, review, and follow-up in one place, drafted automatically, sent when you say so.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AutopilotButton
            endpoint="/api/autopilot/reviews"
            label={`Run review autopilot${needsReview ? ` (${needsReview})` : ""}`}
            runningLabel="Drafting replies…"
          />
          <AutopilotButton
            endpoint="/api/autopilot/reengagement"
            label="Run re-engagement autopilot"
            runningLabel="Drafting messages…"
          />
        </div>
      </div>

      {/* The whole pitch in one row: work the autopilot already did, and the
          one thing it deliberately left for a person. */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={heldForYou} label="Held for you" tone="brick" />
        <Stat value={draftsReady} label="Drafts ready to send" tone="ochre" />
        <Stat value={needsReview} label="Reviews unanswered" tone="rust" />
        <Stat value={alreadySent} label="Sent" tone="moss" />
      </div>

      <div className="mt-6 grid gap-4">
        {ordered.map((guest: GuestRow) => (
          <GuestTicketCard key={guest.id} guest={JSON.parse(JSON.stringify(guest))} />
        ))}
        {guests.length === 0 && (
          <div className="glass-card rounded-panel border-dashed p-8 text-center text-sm text-ink-soft">
            No guests yet. Run <code className="font-mono">npm run db:seed</code> to load demo data.
          </div>
        )}
      </div>
    </div>
  );
}
