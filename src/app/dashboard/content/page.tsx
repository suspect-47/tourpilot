import { getSessionOrDemo as getSession } from "@/lib/demoSession";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";
import { ContentCard } from "@/components/ContentCard";
import { AutopilotButton } from "@/components/AutopilotButton";
import { StatTile } from "@/components/analytics/Viz";
import { contentInsights, type ContentRow } from "@/lib/insights";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const session = await getSession();
  const user = await getOrCreateUserAndBusiness(
    session!.user.sub,
    session!.user.email,
    session!.user.name
  );
  const business = user.business;

  const rows = await prisma.contentItem.findMany({
    where: { businessId: business.id },
    orderBy: { scheduledFor: "asc" },
  });
  const items = JSON.parse(JSON.stringify(rows)) as ContentRow[];

  const brand = {
    name: business.name,
    location: business.location,
    tourTypes: business.tourTypes,
  };
  const con = contentInsights(items, brand);

  const nextUpLabel = con.nextUp
    ? new Date(con.nextUp.scheduledFor).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "Nothing scheduled";

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Content Management</h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
            Posts written from your season and your guests&apos; own words. Each one is checked
            against the brief before it reaches you.
          </p>
        </div>
        <AutopilotButton
          endpoint="/api/autopilot/content"
          label="Generate this week's posts"
          runningLabel="Writing captions…"
        />
      </header>

      {items.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile value={con.drafted} label="Awaiting approval" tone="ochre" />
          <StatTile value={con.approved} label="Approved" tone="moss" />
          <StatTile
            value={`${con.onBrief}/${con.total}`}
            label="Pass every rule"
            tone={con.onBrief === con.total ? "moss" : "rust"}
            sub="Audited on each card"
          />
          <StatTile
            value={con.runwayDays > 0 ? `${con.runwayDays}d` : "0d"}
            label="Queue runway"
            tone="ink"
            sub={`Next up ${nextUpLabel}`}
          />
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ContentCard key={item.id} item={item as never} business={brand} />
        ))}
        {items.length === 0 && (
          <div className="glass-card rounded-panel border-dashed p-8 text-center text-sm text-ink-soft md:col-span-2 xl:col-span-3">
            No posts yet. Generate this week&apos;s batch above.
          </div>
        )}
      </div>
    </div>
  );
}
