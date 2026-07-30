import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.contentItem.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  const business = await prisma.business.create({
    data: {
      name: "Blue Cove Kayak Tours",
      description:
        "Small-group guided kayak tours and sunset paddles along the coast. Family-run, 3 guides, 2 boats.",
      brandVoice: "warm, a little playful, never corporate",
      location: "Half Moon Bay, CA",
      tourTypes: "kayak tours, sunset paddles, whale-watching paddles",
      subscriptionTier: "free",
    },
  });

  const day = 1000 * 60 * 60 * 24;
  const now = Date.now();

  const guests = [
    {
      ticketNo: "GST-0041",
      name: "Priya Nandan",
      email: "priya@example.com",
      tourType: "Sunset Paddle",
      bookingDate: new Date(now - 2 * day),
      reviewText:
        "Absolutely loved this. Marco timed it so we were rounding Pillar Point right as the sun dropped, and a harbor seal tailed us for a good ten minutes. Six of us total, felt like a private tour. Will book again.",
      reviewSentiment: "positive",
      reviewReply:
        "Priya, it sounds like Marco nailed the timing on that sunset. Having a harbor seal join your paddle is always a treat. We're glad it felt like a private tour for you and your group. Looking forward to welcoming you back.\n\nBlue Cove Kayak Tours",
      reviewStatus: "drafted",
    },
    {
      ticketNo: "GST-0042",
      name: "Derek Holm",
      email: "derek@example.com",
      tourType: "Whale-Watching Paddle",
      bookingDate: new Date(now - 1 * day),
      reviewText:
        "Kayaks were older and one had a slow leak, had to switch mid-tour. Guide handled it fine but felt disorganized.",
      reviewSentiment: "negative",
      reviewReply:
        "Derek, I'm really sorry about the kayak with the slow leak. That shouldn't have happened. We're replacing it rather than patching it again. Please contact us directly and we'll set up a free tour for you. I want you to see how this trip should have gone.\n\nBlue Cove Kayak Tours",
      reviewStatus: "flagged",
    },
    {
      ticketNo: "GST-0043",
      name: "Ana Ruiz",
      email: "ana@example.com",
      tourType: "Kayak Tour",
      bookingDate: new Date(now - 3 * day),
      reviewText:
        "First time in a kayak for all four of us and the kids (7 and 9) were comfortable within ten minutes. Guides were patient, and the water inside the breakwater stayed flat the whole morning. Only note, one more shade stop on the way back would have helped.",
      reviewSentiment: "positive",
      // Left unanswered on purpose so "Run review autopilot" has live work
      // to do in the demo. Priya and Derek are pre-drafted so the timeline
      // already looks worked when the page first opens.
      reviewStatus: "none",
    },
    {
      ticketNo: "GST-0044",
      name: "Sam Okafor",
      email: "sam@example.com",
      tourType: "Sunset Paddle",
      bookingDate: new Date(now - 9 * day),
      reengagementDraft:
        "Sam, it's been a week and a half since your Sunset Paddle. If you have a minute, a short review helps other people find us, and it means a lot to a three-guide operation like ours.\n\nBlue Cove Kayak Tours",
      reengagementStatus: "drafted",
    },
    {
      ticketNo: "GST-0045",
      name: "Lena Voss",
      email: "lena@example.com",
      tourType: "Kayak Tour",
      bookingDate: new Date(now - 11 * day),
      reengagementStatus: "not_due",
    },
    {
      ticketNo: "GST-0046",
      name: "Marcus Webb",
      email: "marcus@example.com",
      tourType: "Whale-Watching Paddle",
      bookingDate: new Date(now + 2 * day),
      reengagementStatus: "not_due",
    },
  ];

  for (const g of guests) {
    await prisma.guest.create({ data: { ...g, businessId: business.id } });
  }

  await prisma.contentItem.createMany({
    data: [
      {
        businessId: business.id,
        caption:
          "Sunset paddles are booking up fast this month. Golden hour off Pillar Point hits different. 🌅",
        theme: "seasonal",
        status: "drafted",
        scheduledFor: new Date(now + 1 * day),
      },
      {
        businessId: business.id,
        caption:
          '"A harbor seal tailed us for a good ten minutes." This week\'s favorite line from a Sunset Paddle guest.',
        theme: "testimonial",
        status: "drafted",
        scheduledFor: new Date(now + 3 * day),
      },
    ],
  });

  console.log(`Seeded business "${business.name}" with ${guests.length} guests.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
