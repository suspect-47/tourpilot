import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/prisma";
import { generateReengagementMessage } from "@/lib/anthropic";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";

const REENGAGE_AFTER_DAYS = 7;

// Finds guests whose booking is old enough to follow up on and drafts
// a personalized re-engagement message automatically — nobody has to
// remember to check in on past guests.
export async function POST() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUserAndBusiness(session.user.sub, session.user.email, session.user.name);
  const business = user.business;
  const cutoff = new Date(Date.now() - REENGAGE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const guests = await prisma.guest.findMany({
    where: {
      businessId: business.id,
      bookingDate: { lte: cutoff },
      reengagementStatus: "not_due",
    },
  });

  const updated = [];
  for (const guest of guests) {
    const draft = await generateReengagementMessage(business, guest.name, guest.tourType);
    const result = await prisma.guest.update({
      where: { id: guest.id },
      data: { reengagementDraft: draft, reengagementStatus: "drafted" },
    });
    updated.push(result);
  }

  return NextResponse.json({ updated: updated.length });
}
