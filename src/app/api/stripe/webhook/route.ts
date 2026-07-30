import { NextResponse } from "next/server";
import { stripe, TierKey } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: { businessId?: string; tier?: TierKey } };
    const businessId = session.metadata?.businessId;
    const tier = session.metadata?.tier;
    if (businessId && tier) {
      await prisma.business.update({ where: { id: businessId }, data: { subscriptionTier: tier } });
    }
  }

  return NextResponse.json({ received: true });
}
