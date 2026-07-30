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
        "Absolutely loved this! Our guide Marco knew every hidden cove and the sunset timing was perfect. Will book again.",
      reviewSentiment: "positive",
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
      reviewStatus: "flagged",
    },
    {
      ticketNo: "GST-0043",
      name: "Ana Ruiz",
      email: "ana@example.com",
      tourType: "Kayak Tour",
      bookingDate: new Date(now - 3 * day),
      reviewText:
        "Great intro tour, easy for beginners, kids had a blast. Would love more shade breaks next time.",
      reviewSentiment: "positive",
      reviewStatus: "drafted",
    },
    {
      ticketNo: "GST-0044",
      name: "Sam Okafor",
      email: "sam@example.com",
      tourType: "Sunset Paddle",
      bookingDate: new Date(now - 9 * day),
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
          "Sunset paddles are booking up fast this month — golden hour on the water hits different. 🌅",
        theme: "seasonal",
        status: "drafted",
        scheduledFor: new Date(now + 1 * day),
      },
      {
        businessId: business.id,
        caption:
          '"Our guide knew every hidden cove" — this week\'s favorite from a Sunset Paddle guest.',
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
