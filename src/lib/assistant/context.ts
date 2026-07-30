import { prisma } from "@/lib/prisma";

/**
 * Tab-awareness for the assistant rail.
 *
 * The rail sends only the route it is mounted on. Everything the model is
 * told about the business is loaded here, on the server, from the live
 * database. The browser never ships a snapshot up, so the assistant cannot
 * be talking about a stale guest list, and the guest table is not exposed
 * to the client just to give the chat context.
 */
export type AssistantTab = "timeline" | "content" | "settings";

export function resolveTab(pathname: string | undefined): AssistantTab {
  if (!pathname) return "timeline";
  if (pathname.startsWith("/dashboard/content")) return "content";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  return "timeline";
}

type BusinessLike = {
  id: string;
  name: string;
  description: string;
  brandVoice: string;
  location: string;
  tourTypes: string;
  subscriptionTier: string;
};

const clip = (s: string | null, n: number) =>
  !s ? "" : s.length <= n ? s : `${s.slice(0, n - 1)}…`;

const day = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Live state for the tab the owner is actually looking at. */
export async function buildTabSnapshot(
  businessId: string,
  tab: AssistantTab
): Promise<string> {
  if (tab === "content") {
    const items = await prisma.contentItem.findMany({
      where: { businessId },
      orderBy: { scheduledFor: "asc" },
    });
    if (items.length === 0) return "CONTENT QUEUE: empty. No posts generated yet.";
    const lines = items.map(
      (i) =>
        `- [${i.id}] ${i.theme}, scheduled ${day(i.scheduledFor)}, status ${i.status}: "${clip(i.caption, 160)}"`
    );
    const drafted = items.filter((i) => i.status === "drafted").length;
    return `CONTENT QUEUE (${items.length} posts, ${drafted} awaiting approval):\n${lines.join("\n")}`;
  }

  if (tab === "settings") {
    const [guests, content] = await Promise.all([
      prisma.guest.count({ where: { businessId } }),
      prisma.contentItem.count({ where: { businessId } }),
    ]);
    return `BILLING TAB. ${guests} guests and ${content} content items on this account. Plan changes go through Stripe checkout, which you cannot trigger; point the owner at the Upgrade button on this page instead.`;
  }

  const guests = await prisma.guest.findMany({
    where: { businessId },
    orderBy: { bookingDate: "desc" },
  });
  if (guests.length === 0) {
    return "GUEST TIMELINE: empty. Nothing seeded yet; suggest running `npm run db:seed`.";
  }

  const lines = guests.map((g) => {
    const bits = [
      `- [${g.id}] ${g.ticketNo} ${g.name}, ${g.tourType}, booked ${day(g.bookingDate)}`,
      `  review: ${g.reviewStatus}${g.reviewSentiment ? ` (${g.reviewSentiment})` : ""}`,
      `  follow-up: ${g.reengagementStatus}`,
    ];
    if (g.reviewText) bits.push(`  they wrote: "${clip(g.reviewText, 220)}"`);
    if (g.reviewReply) bits.push(`  drafted reply: "${clip(g.reviewReply, 220)}"`);
    if (g.reengagementDraft)
      bits.push(`  drafted follow-up: "${clip(g.reengagementDraft, 180)}"`);
    return bits.join("\n");
  });

  const flagged = guests.filter((g) => g.reviewStatus === "flagged").length;
  const needsReply = guests.filter(
    (g) => g.reviewText && g.reviewStatus === "none"
  ).length;
  const awaiting = guests.filter(
    (g) => g.reviewStatus === "drafted" || g.reengagementStatus === "drafted"
  ).length;

  return `GUEST TIMELINE (${guests.length} guests; ${flagged} flagged for a human, ${needsReply} reviews with no reply drafted, ${awaiting} drafts awaiting approval):\n${lines.join("\n")}`;
}

export function buildSystemPrompt(
  business: BusinessLike,
  tab: AssistantTab,
  snapshot: string
): string {
  const where = {
    timeline: "the Guest timeline, where every booking, review, and follow-up lives",
    content: "the Content calendar, where social posts are queued for approval",
    settings: "the Billing tab",
  }[tab];

  return `You are the marketing copilot inside TourPilot, sitting in a side rail next to the owner's dashboard. You work for ${business.name}, a ${business.tourTypes || "tour"} operator in ${business.location || "town"}. Brand voice: ${business.brandVoice}. Current plan: ${business.subscriptionTier}.

The owner is looking at ${where} right now. Answer about what is on their screen unless they ask about something else.

How to behave:
- You run this dashboard, so act. If they ask you to draft replies, follow up with guests, or write posts, call the tool rather than describing what the tool would do.
- Be brief. Two or three sentences unless they asked for copy or a list. This is a narrow side panel, not a document.
- Refer to guests by first name, not by id. Ids are for tool calls only.
- Never invent a guest, a review, a booking, or a number. Everything you know is in the snapshot below.
- Say what you actually did, including counts, after a tool runs.

The flagged rule, which matters most:
- A flagged review is a negative one the autopilot deliberately held back for a human to read. That is a feature, not a backlog item.
- Never send a flagged reply, and never suggest sending one without the owner reading it first. The sendDraft tool will refuse and you should not argue with it.
- If asked why something is flagged, explain what the guest was actually unhappy about in their own words.

Copy rules, whenever you write anything the owner might publish:
- Never use an em dash or an en dash. Use a comma, a period, or a semicolon.
- Banned phrases, never use these or anything close: "we strive to", "your feedback is important to us", "we value your", "we apologize for any inconvenience", "thank you for taking the time", "at your earliest convenience", "we hope this message finds you", "valued guest", "don't hesitate", "reach out", "we're thrilled", "we would love to", "we'd love to", "magic", "magical".
- Sound like the owner of a small ${business.tourTypes || "tour"} company wrote it in one sitting. Not like a marketing tool.

Live data, loaded fresh for this message:
${snapshot}`;
}
