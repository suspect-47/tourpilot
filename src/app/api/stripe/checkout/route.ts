import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { stripe, TIERS, TierKey } from "@/lib/stripe";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const { tier } = (await req.json()) as { tier: TierKey };
  const priceId = TIERS[tier]?.priceId;
  if (!priceId) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

  const user = await getOrCreateUserAndBusiness(session.user.sub, session.user.email, session.user.name);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.business.id,
    success_url: `${base}/dashboard/settings?upgraded=1`,
    cancel_url: `${base}/dashboard/settings`,
    metadata: { businessId: user.business.id, tier },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
