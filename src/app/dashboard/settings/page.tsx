import { getSession } from "@auth0/nextjs-auth0";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";
import { TIERS } from "@/lib/stripe";
import { UpgradeButton } from "@/components/UpgradeButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  const user = await getOrCreateUserAndBusiness(session!.user.sub, session!.user.email, session!.user.name);
  const currentTier = user.business.subscriptionTier;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Billing</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Auto-replies and messages sent per month scale with your plan.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(Object.entries(TIERS) as [string, (typeof TIERS)[keyof typeof TIERS]][]).map(([key, tier]) => (
          <div
            key={key}
            className={`glass-card glass-lift rounded-panel p-5 ${
              currentTier === key ? "border-rust/60 shadow-[0_0_0_1px_rgba(246,134,74,0.25)]" : ""
            }`}
          >
            <p className="font-display text-lg font-semibold text-ink">{tier.label}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {tier.autoRepliesPerMonth === Infinity
                ? "Unlimited autopilot actions"
                : `${tier.autoRepliesPerMonth} autopilot actions / month`}
            </p>
            {currentTier === key ? (
              <span className="mt-4 inline-block rounded-control border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-ink">
                Current plan
              </span>
            ) : key === "free" ? null : (
              <div className="mt-4">
                <UpgradeButton tier={key as "starter" | "pro"} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
