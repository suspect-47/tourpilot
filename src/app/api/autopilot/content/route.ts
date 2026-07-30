import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/prisma";
import { generateContentIdeas } from "@/lib/anthropic";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";

// Generates a fresh batch of social post ideas from the business
// profile and recent positive reviews — a content calendar the owner
// never had to sit down and write from scratch.
export async function POST() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUserAndBusiness(session.user.sub, session.user.email, session.user.name);
  const business = user.business;

  const testimonials = await prisma.guest.findMany({
    where: { businessId: business.id, reviewSentiment: "positive" },
    select: { reviewText: true },
    take: 3,
  });

  const month = new Date().toLocaleString("default", { month: "long" });
  const captions = await generateContentIdeas(
    business,
    `${month}, peak season`,
    testimonials.map((t: { reviewText: string | null }) => t.reviewText!).filter(Boolean)
  );

  const created = await prisma.$transaction(
    captions.map((caption, i) =>
      prisma.contentItem.create({
        data: {
          businessId: business.id,
          caption,
          theme: i === 0 ? "seasonal" : "testimonial",
          scheduledFor: new Date(Date.now() + (i + 1) * 2 * 24 * 60 * 60 * 1000),
        },
      })
    )
  );

  return NextResponse.json({ created: created.length });
}
