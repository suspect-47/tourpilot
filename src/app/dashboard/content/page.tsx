import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";
import { ContentCard } from "@/components/ContentCard";
import { AutopilotButton } from "@/components/AutopilotButton";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const session = await getSession();
  const user = await getOrCreateUserAndBusiness(session!.user.sub, session!.user.email, session!.user.name);

  const items = await prisma.contentItem.findMany({
    where: { businessId: user.business.id },
    orderBy: { scheduledFor: "asc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Content calendar</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Fresh post ideas generated from your season and recent guest testimonials.
          </p>
        </div>
        <AutopilotButton
          endpoint="/api/autopilot/content"
          label="Generate this week's posts"
          runningLabel="Writing captions…"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item: { id: string }) => (
          <ContentCard key={item.id} item={JSON.parse(JSON.stringify(item))} />
        ))}
        {items.length === 0 && (
          <div className="rounded-xl border border-dashed border-ink/20 p-8 text-center text-sm text-ink-soft md:col-span-2">
            No posts yet — generate this week&apos;s batch above.
          </div>
        )}
      </div>
    </div>
  );
}
