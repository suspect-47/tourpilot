import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";
import { GuestTicketCard } from "@/components/GuestTicketCard";
import { AutopilotButton } from "@/components/AutopilotButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const user = await getOrCreateUserAndBusiness(session!.user.sub, session!.user.email, session!.user.name);

  const guests = await prisma.guest.findMany({
    where: { businessId: user.business.id },
    orderBy: { bookingDate: "desc" },
  });

  type GuestRow = { reviewText: string | null; reviewStatus: string; reengagementStatus: string; id: string };
  const needsReview = guests.filter((g: GuestRow) => g.reviewText && g.reviewStatus === "none").length;
  const needsReengagement = guests.filter((g: GuestRow) => g.reengagementStatus === "drafted").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Guest timeline</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Every booking, review, and follow-up in one place — drafted automatically, sent when you say so.
          </p>
        </div>
        <div className="flex gap-3">
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

      {needsReengagement > 0 && (
        <p className="mt-3 text-xs text-ochre">
          {needsReengagement} re-engagement message{needsReengagement > 1 ? "s" : ""} drafted and waiting on approval.
        </p>
      )}

      <div className="mt-6 grid gap-4">
        {guests.map((guest: GuestRow) => (
          <GuestTicketCard key={guest.id} guest={JSON.parse(JSON.stringify(guest))} />
        ))}
        {guests.length === 0 && (
          <div className="rounded-xl border border-dashed border-ink/20 p-8 text-center text-sm text-ink-soft">
            No guests yet. Run <code className="font-mono">npm run db:seed</code> to load demo data.
          </div>
        )}
      </div>
    </div>
  );
}
