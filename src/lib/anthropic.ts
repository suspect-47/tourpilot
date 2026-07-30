import Anthropic from "@anthropic-ai/sdk";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Balanced quality/cost for on-brand writing tasks like these.
const MODEL = "claude-sonnet-5";

type BusinessProfile = {
  name: string;
  description: string;
  brandVoice: string;
  location: string;
  tourTypes: string;
};

async function complete(system: string, user: string, fallback: string) {
  if (!client) {
    // Demo-mode safety net when no ANTHROPIC_API_KEY is set.
    return fallback;
  }
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : fallback;
}

export async function generateReviewReply(
  business: BusinessProfile,
  guestName: string,
  reviewText: string,
  sentiment: "positive" | "negative" | "neutral"
) {
  const system = `You write review replies for ${business.name}, a ${business.tourTypes} operator in ${business.location}. Brand voice: ${business.brandVoice}. Keep replies under 60 words, specific to what the guest said, never generic. Sign off with the business name, not a person's name.`;
  const user = `Guest ${guestName} left this ${sentiment} review:\n"${reviewText}"\n\nDraft a reply.`;
  const fallback =
    sentiment === "negative"
      ? `Hi ${guestName}, thank you for the honest feedback — we're sorry the experience didn't match what we aim for. We'd like to make it right; please reach out directly so we can follow up. — ${business.name}`
      : `Thanks so much for the kind words, ${guestName}! We loved having you out with us and hope to see you again soon. — ${business.name}`;
  return complete(system, user, fallback);
}

export async function generateReengagementMessage(
  business: BusinessProfile,
  guestName: string,
  tourType: string
) {
  const system = `You write short, warm post-visit follow-up messages for ${business.name}, a ${business.tourTypes} operator in ${business.location}. Brand voice: ${business.brandVoice}. Under 70 words. Include a soft ask: leave a review or refer a friend. No corporate tone.`;
  const user = `Write a follow-up message to ${guestName}, who joined our "${tourType}" recently.`;
  const fallback = `Hi ${guestName}, thanks again for joining us for ${tourType}! If you had a great time, a quick review helps other travelers find us — and if you know anyone who'd love it too, send them our way. — ${business.name}`;
  return complete(system, user, fallback);
}

export async function generateContentIdeas(
  business: BusinessProfile,
  season: string,
  testimonialSnippets: string[]
) {
  const system = `You are a social media content planner for ${business.name}, a ${business.tourTypes} operator in ${business.location}. Brand voice: ${business.brandVoice}. Generate exactly 5 short post captions (under 30 words each), one per line, no numbering, no hashtags block — weave in relevant hashtags inline sparingly.`;
  const user = `Season/context: ${season}.\nRecent guest testimonial snippets to draw inspiration from:\n${testimonialSnippets.map((t) => `- ${t}`).join("\n")}\n\nGenerate 5 post captions.`;
  const fallback = [
    `${season} is here — book your ${business.tourTypes.split(",")[0]?.trim() || "next adventure"} with us today!`,
    `Nothing beats a day out on the water. Come see why guests keep coming back.`,
    `Local, small-group, unforgettable. That's the ${business.name} difference.`,
    `Guest favorite this week: "${testimonialSnippets[0] ?? "an amazing experience"}"`,
    `Spots are filling up for this week — grab yours before they're gone.`,
  ].join("\n");
  const text = await complete(system, user, fallback);
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
}
