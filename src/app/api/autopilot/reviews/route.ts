import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/prisma";
import { generateReviewReply } from "@/lib/anthropic";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";

// Drafts (or re-drafts) an AI reply for every guest review that doesn't
// have one yet. Positive reviews are auto-approved so they're ready to
// send without a human writing anything; negative ones are flagged
// for a person to look at first.
export async function POST() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUserAndBusiness(session.user.sub, session.user.email, session.user.name);
  const business = user.business;

  const guests = await prisma.guest.findMany({
    where: { businessId: business.id, reviewText: { not: null }, reviewStatus: "none" },
  });

  const updated = [];
  for (const guest of guests) {
    const sentiment = (guest.reviewSentiment ?? "neutral") as "positive" | "negative" | "neutral";
    const reply = await generateReviewReply(business, guest.name, guest.reviewText!, sentiment);
    const status = sentiment === "negative" ? "flagged" : "drafted";
    const result = await prisma.guest.update({
      where: { id: guest.id },
      data: { reviewReply: reply, reviewStatus: status },
    });
    updated.push(result);
  }

  return NextResponse.json({ updated: updated.length });
}
