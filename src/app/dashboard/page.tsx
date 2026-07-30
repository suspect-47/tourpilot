import { getSessionOrDemo as getSession } from "@/lib/demoSession";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";
import { GuestTicketCard } from "@/components/GuestTicketCard";
import { AutopilotButton } from "@/components/AutopilotButton";
import { StatTile } from "@/components/analytics/Viz";
import { reputationInsights, type GuestRow } from "@/lib/insights";

export const dynamic = "force-dynamic";

/**
 * Cards are grouped by what they ask of a person, not by booking date.
 *
 * The old flat list sorted by attention rank, which put the right card first
 * but gave no reason why. Three labelled sections say it outright: this needs
 * you, this is ready when you are, this is done. Nothing is hidden, so the
 * page stays scannable without a filter bar to learn.
 */
type Bucket = "needsYou" | "ready" | "settled";

function bucketOf(g: GuestRow, now: number): Bucket {
  if (g.reviewStatus === "flagged") return "needsYou";
  if (g.reviewText && g.reviewStatus === "none") return "needsYou";
  if (g.reviewStatus === "drafted" || g.reengagementStatus === "drafted") return "ready";
  if (new Date(g.bookingDate).getTime() > now) return "settled";
  return "settled";
}

const SECTIONS: { key: Bucket; title: string; hint: string }[] = [
  {
    key: "needsYou",
    title: "Needs you",
    hint: "A negative review the autopilot held back, or a review with nothing drafted yet.",
  },
  {
    key: "ready",
    title: "Ready when you are",
    hint: "Drafted and waiting on one click.",
  },
  {
    key: "settled",
    title: "Nothing due",
    hint: "Already sent, or the tour has not happened yet.",
  },
];

export default async function ReputationPage() {
  const session = await getSession();
  const user = await getOrCreateUserAndBusiness(
    session!.user.sub,
    session!.user.email,
    session!.user.name
  );

  const rows = await prisma.guest.findMany({
    where: { businessId: user.business.id },
    orderBy: { bookingDate: "desc" },
  });
  const guests = JSON.parse(JSON.stringify(rows)) as GuestRow[];

  const now = Date.now();
  const rep = reputationInsights(guests);

  const grouped: Record<Bucket, GuestRow[]> = { needsYou: [], ready: [], settled: [] };
  for (const g of guests) grouped[bucketOf(g, now)].push(g);
  // Flagged first inside "Needs you": it is the one thing a person must read.
  grouped.needsYou.sort((a, b) =>
    a.reviewStatus === "flagged" ? -1 : b.reviewStatus === "flagged" ? 1 : 0
  );

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Reputation Management</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
            Every review and follow-up, answered automatically where that is safe and held for you
            where it is not.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AutopilotButton
            endpoint="/api/autopilot/reviews"
            label={`Run review autopilot${rep.unanswered ? ` (${rep.unanswered})` : ""}`}
            runningLabel="Drafting replies…"
          />
          <AutopilotButton
            endpoint="/api/autopilot/reengagement"
            label="Run re-engagement autopilot"
            runningLabel="Drafting messages…"
          />
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value={rep.flagged} label="Held for you" tone="brick" sub="Never auto-sent" />
        <StatTile
          value={rep.drafted + rep.followUpsDrafted}
          label="Drafts ready"
          tone="ochre"
          sub={`${rep.drafted} replies · ${rep.followUpsDrafted} follow-ups`}
        />
        <StatTile value={rep.unanswered} label="Reviews unanswered" tone="rust" />
        <StatTile
          value={`${rep.coverage}%`}
          label="Handled by autopilot"
          tone="moss"
          sub={`${rep.handled} of ${rep.reviews} reviews`}
        />
      </div>

      {guests.length === 0 && (
        <div className="glass-card mt-6 rounded-panel border-dashed p-8 text-center text-sm text-ink-soft">
          No guests yet. Run <code className="font-mono">npm run db:seed</code> to load demo data.
        </div>
      )}

      {SECTIONS.map((section) => {
        const list = grouped[section.key];
        if (list.length === 0) return null;
        return (
          <section key={section.key} className="mt-7">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-[15px] font-bold text-ink">{section.title}</h2>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                {list.length}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-ink-soft">{section.hint}</p>
            <div className="mt-3 grid gap-4">
              {list.map((guest) => (
                <GuestTicketCard key={guest.id} guest={guest as never} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
