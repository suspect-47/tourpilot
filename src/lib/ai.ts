import OpenAI from "openai";

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Balanced quality/cost for on-brand writing tasks like these.
const MODEL = "gpt-4o";

// Shared copy constraints. The model defaults hard to em dashes and to
// corporate filler in a marketing voice, so both are banned explicitly
// rather than left to "sound natural".
const NO_EM_DASH =
  "Never use an em dash or an en dash. Use a comma, a period, or a semicolon instead.";
// Buried mid-prompt as one more bullet, this list was getting diluted:
// "we're thrilled" and "we'd love to" both survived into live output. Trimmed
// to the phrases that actually leak and moved to the very end of the system
// prompt as an explicit re-read pass, which holds far better.
const BANNED_PHRASES = [
  "we're thrilled",
  "we'd love to",
  "we would love to",
  "we strive to",
  "your feedback is important to us",
  "reach out",
  "valued guest",
  "don't hesitate",
  "we hope this message finds you",
  "magical",
];
const FINAL_CHECK = `FINAL PASS, do this before you answer. Re-read your draft. If it contains any of the following, rewrite that sentence in plainer words: ${BANNED_PHRASES.join(
  "; "
)}. Even one of these makes the copy read as machine-written, which is a failure.`;

type BusinessProfile = {
  name: string;
  description: string;
  brandVoice: string;
  location: string;
  tourTypes: string;
};

async function complete(system: string, user: string, fallback: string) {
  if (!client) {
    // Demo-mode safety net when no OPENAI_API_KEY is set.
    return fallback;
  }
  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 400,
    // Default of 1.0 was drifting past the banned-phrase and sign-off rules.
    // 0.7 keeps the voice but follows the format constraints far more reliably.
    temperature: 0.7,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0]?.message?.content?.trim() || fallback;
}

export async function generateReviewReply(
  business: BusinessProfile,
  guestName: string,
  reviewText: string,
  sentiment: "positive" | "negative" | "neutral"
) {
  const base = `You write public review replies for ${business.name}, a ${business.tourTypes} operator in ${business.location}. Brand voice: ${business.brandVoice}.

Hard rules:
- Under 60 words. One paragraph.
- Open with the guest's first name.
- Name at least one concrete thing this guest actually mentioned, using their own word for it. Generic praise or generic apology is a failure.
- Never invent a detail the guest did not state.
- ${NO_EM_DASH}
- No emoji. At most one exclamation mark in the whole reply.
- Sign-off format, exactly this and nothing else: finish the message, then one blank line, then a final line containing only "${business.name}". Never put the name on the same line as the message. Never put a farewell such as "Cheers" or "Best" before it. Never put anything after it.`;

  // Negative reviews are the moment a human is actually reading closely,
  // so responsibility and a concrete fix override the playful house voice.
  const negative = `

This is a negative review. These override tone:
- Take responsibility in plain words. Name the specific thing that went wrong.
- State one concrete thing you are doing about it. "We are looking into it" is a failure.
- Do not defend the guide, the equipment, or the company. Do not explain why it happened.
- Offer to make it right once, directly, without legal or PR phrasing.
- Sound like the owner wrote it in one sitting, not like a company statement.`;

  const other = `

This is a ${sentiment} review. Also:
- Match the guest's energy, do not inflate it. Do not use superlatives the guest did not use.
- Do not upsell. One light invitation back is enough.`;

  const system = `${base}${sentiment === "negative" ? negative : other}\n\n${FINAL_CHECK}`;
  const user = `Guest ${guestName} left this ${sentiment} review:\n"${reviewText}"\n\nDraft the reply.`;
  const fallback =
    sentiment === "negative"
      ? `${guestName}, I'm sorry the day didn't go the way it should have. That's on us, and we're fixing it. Tell us what would make it right and we'll sort it out.\n\n${business.name}`
      : `Thanks so much for the kind words, ${guestName}! We loved having you out with us and hope to see you again soon.\n\n${business.name}`;
  return complete(system, user, fallback);
}

export async function generateReengagementMessage(
  business: BusinessProfile,
  guestName: string,
  tourType: string
) {
  const system = `You write short post-visit follow-up messages for ${business.name}, a ${business.tourTypes} operator in ${business.location}. Brand voice: ${business.brandVoice}.

Hard rules:
- Under 70 words.
- Open with the guest's first name.
- Reference ONLY the one tour named by the user. Do not mention any other tour this business runs. Do not invent wildlife, weather, guides, or events that were not stated.
- Exactly one soft ask: either leave a review or refer a friend, not both.
- ${NO_EM_DASH}
- No emoji. At most one exclamation mark.
- Sign-off format, exactly this and nothing else: finish the message, then one blank line, then a final line containing only "${business.name}". Never put the name on the same line as the message. Never put a farewell such as "Cheers" or "Best" before it. Never put anything after it.

${FINAL_CHECK}`;
  const user = `Write a follow-up message to ${guestName}, who joined our "${tourType}" about a week and a half ago.`;
  const fallback = `Hi ${guestName}, thanks again for joining us for ${tourType}. If you had a good time, a quick review helps other travelers find us.\n\n${business.name}`;
  return complete(system, user, fallback);
}

export async function generateContentIdeas(
  business: BusinessProfile,
  season: string,
  testimonialSnippets: string[]
) {
  const system = `You write social captions for ${business.name}, a ${business.tourTypes} operator in ${business.location}. Brand voice: ${business.brandVoice}.

Output format: exactly 5 captions, one per line, no numbering, no blank lines, nothing else.

Hard rules:
- Under 30 words each.
- Every caption must contain at least one thing specific to this business: ${business.location} by name, a specific named tour, a season-specific condition, or a detail lifted from a real guest quote below. If a competing operator could post the caption word for word, it is a failure.
- Never name a guide or staff member, even if a guest quote below names one. Refer to "our guides" instead.
- ${NO_EM_DASH}
- Banned words and phrases: "unforgettable", "magic", "magical", "adventure awaits", "make memories", "make waves", "hidden gem", "come see why", "book now", "dive in", "your next adventure", "family bonding", "endless fun".
- At most 2 of the 5 captions may use an emoji, one emoji maximum each.
- At most 2 of the 5 may carry a hashtag, inline, one hashtag maximum each.

${FINAL_CHECK}`;
  const user = `Season/context: ${season}.\nRecent guest testimonial snippets to draw inspiration from:\n${testimonialSnippets.map((t) => `- ${t}`).join("\n")}\n\nGenerate 5 post captions.`;
  const fallback = [
    `${season} is here. Book your ${business.tourTypes.split(",")[0]?.trim() || "next paddle"} with us today.`,
    `Nothing beats a day out on the water. Come see why guests keep coming back.`,
    `Local, small-group, unforgettable. That's the ${business.name} difference.`,
    `Guest favorite this week: "${testimonialSnippets[0] ?? "an amazing experience"}"`,
    `Spots are filling up for this week. Grab yours before they're gone.`,
  ].join("\n");
  const text = await complete(system, user, fallback);
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);
}
