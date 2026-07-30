import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
  : null;

export const TIERS = {
  free: { label: "Free", autoRepliesPerMonth: 10, priceId: null },
  starter: { label: "Starter", autoRepliesPerMonth: 100, priceId: process.env.STRIPE_PRICE_STARTER },
  pro: { label: "Pro", autoRepliesPerMonth: Infinity, priceId: process.env.STRIPE_PRICE_PRO },
} as const;

export type TierKey = keyof typeof TIERS;
