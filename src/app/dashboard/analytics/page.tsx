import { getSessionOrDemo as getSession } from "@/lib/demoSession";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";
import {
  bookingSeries,
  contentInsights,
  headlineInsights,
  reputationInsights,
  reviewPipeline,
  tourMix,
  type ContentRow,
  type GuestRow,
} from "@/lib/insights";
import { BarChart, Funnel, Panel, RankedBars, SegmentBar, StatTile } from "@/components/analytics/Viz";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getSession();
  const user = await getOrCreateUserAndBusiness(
    session!.user.sub,
    session!.user.email,
    session!.user.name
  );
  const business = user.business;

  const [guestRows, contentRows] = await Promise.all([
    prisma.guest.findMany({ where: { businessId: business.id }, orderBy: { bookingDate: "desc" } }),
    prisma.contentItem.findMany({ where: { businessId: business.id } }),
  ]);

  const guests = JSON.parse(JSON.stringify(guestRows)) as GuestRow[];
  const items = JSON.parse(JSON.stringify(contentRows)) as ContentRow[];

  const rep = reputationInsights(guests);
  const con = contentInsights(items, business);
  const headlines = headlineInsights(rep, con);
  const series = bookingSeries(guests, 8);
  const mix = tourMix(guests);

  return (
    <div className="mx-auto max-w-[1100px]">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-ink-soft">
          What the autopilot has done, what it deliberately left for you, and what your queue looks
          like. Every figure is counted from your own bookings, reviews, and posts.
        </p>
      </header>

      {/* The four numbers that answer "is this thing working". */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          value={`${rep.coverage}%`}
          label="Reviews handled"
          tone={rep.coverage === 100 ? "moss" : "rust"}
          sub={`${rep.handled} of ${rep.reviews} have a reply`}
        />
        <StatTile
          value={rep.flagged}
          label="Held for a human"
          tone="brick"
          sub="Negative, never auto-sent"
        />
        <StatTile
          value={rep.drafted + rep.followUpsDrafted}
          label="Waiting on approval"
          tone="ochre"
          sub={`${rep.drafted} replies · ${rep.followUpsDrafted} follow-ups`}
        />
        <StatTile
          value={con.total}
          label="Posts queued"
          tone="moss"
          sub={con.runwayDays > 0 ? `${con.runwayDays} days of runway` : "Nothing scheduled ahead"}
        />
      </div>

      {headlines.length > 0 && (
        <Panel
          className="mt-4"
          title="What this says"
          hint="Generated from the counts above, not written by a model."
        >
          <ul className="flex flex-col gap-2">
            {headlines.map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sunset" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Review pipeline"
          hint="Where every review sits in the none → drafted → approved → sent flow."
          className="lg:col-span-2"
        >
          <Funnel stages={reviewPipeline(rep)} />
        </Panel>

        <Panel title="How guests felt" hint="Sentiment the autopilot classified each review as.">
          <SegmentBar
            segments={[
              { label: "Positive", value: rep.positive, tone: "moss" },
              { label: "Neutral", value: rep.neutral, tone: "ochre" },
              { label: "Negative", value: rep.negative, tone: "brick" },
            ]}
          />
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            {rep.negative === 0
              ? "No negative reviews on the book right now."
              : rep.negative === 1
                ? "The one negative review was held back for you rather than answered automatically."
                : `All ${rep.negative} negative reviews were held back for you rather than answered automatically.`}
          </p>
        </Panel>

        <Panel title="Follow-ups" hint="Re-engagement messages to past guests.">
          <SegmentBar
            segments={[
              { label: "Sent", value: rep.followUpsSent, tone: "moss" },
              { label: "Drafted", value: rep.followUpsDrafted, tone: "ochre" },
              { label: "Not due", value: rep.followUpsDue, tone: "ink" },
            ]}
          />
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            A guest becomes due seven days after their booking. Not due means their tour is still
            too recent to follow up on.
          </p>
        </Panel>

        <Panel title="Bookings" hint="Last eight weeks, counted from booking dates.">
          <BarChart data={series} />
        </Panel>

        <Panel title="Which tours" hint="Share of bookings by experience.">
          <RankedBars rows={mix.map((m) => ({ label: m.tourType, count: m.count, share: m.share }))} />
        </Panel>

        <Panel
          title="Copy quality"
          hint="Queued captions audited against the same brief the generator is given."
          className="lg:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[26px] font-bold leading-none text-ink">
                {con.onBrief}
                <span className="text-base font-semibold text-ink-soft">/{con.total || 0}</span>
              </p>
              <p className="mt-2 text-xs font-semibold text-ink">Pass every rule</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                Length, specificity, banned phrases, em dashes, emoji, hashtags
              </p>
            </div>
            <div>
              <p className="text-[26px] font-bold leading-none text-ink">
                {con.specific}
                <span className="text-base font-semibold text-ink-soft">/{con.total || 0}</span>
              </p>
              <p className="mt-2 text-xs font-semibold text-ink">Name something specific</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                A caption a competitor could post word for word is a failure
              </p>
            </div>
            <div>
              <p className="text-[26px] font-bold leading-none text-ink">{con.avgWords}</p>
              <p className="mt-2 text-xs font-semibold text-ink">Average words</p>
              <p className="mt-0.5 text-[11px] text-ink-soft">The brief caps captions at 30</p>
            </div>
          </div>
          {con.themes.length > 0 && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <RankedBars
                tone="ochre"
                rows={con.themes.map((t) => ({ label: t.theme, count: t.count }))}
              />
            </div>
          )}
        </Panel>
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-ink-soft/70">
        Inlet does not connect to Instagram, Google, or any review platform yet, so there are no
        impressions, likes, or reach figures on this page. Everything above is counted from your own
        records.
      </p>
    </div>
  );
}
