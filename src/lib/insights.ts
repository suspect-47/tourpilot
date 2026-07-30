/**
 * Every number Inlet shows is derived here, from rows that actually exist.
 *
 * There is no analytics integration and no engagement data in the schema, so
 * there are deliberately no impressions, likes, or reach figures anywhere in
 * this file. Inventing them would put fabricated numbers in front of anyone
 * reading the dashboard. What follows is computed from Guest and ContentItem
 * columns only.
 */

export type GuestRow = {
  id: string;
  name: string;
  tourType: string;
  bookingDate: string | Date;
  reviewText: string | null;
  reviewSentiment: string | null;
  reviewReply: string | null;
  reviewStatus: string;
  reengagementDraft: string | null;
  reengagementStatus: string;
};

export type ContentRow = {
  id: string;
  caption: string;
  theme: string;
  status: string;
  scheduledFor: string | Date;
};

const ms = (d: string | Date) => new Date(d).getTime();

// ── Reputation ──────────────────────────────────────────────────────────

export type ReputationInsights = ReturnType<typeof reputationInsights>;

export function reputationInsights(guests: GuestRow[]) {
  const withReview = guests.filter((g) => !!g.reviewText);
  const positive = withReview.filter((g) => g.reviewSentiment === "positive").length;
  const negative = withReview.filter((g) => g.reviewSentiment === "negative").length;
  const neutral = withReview.length - positive - negative;

  const flagged = guests.filter((g) => g.reviewStatus === "flagged").length;
  const unanswered = withReview.filter((g) => g.reviewStatus === "none").length;
  const drafted = guests.filter((g) => g.reviewStatus === "drafted").length;
  const approved = guests.filter((g) => g.reviewStatus === "approved").length;
  const sent = guests.filter((g) => g.reviewStatus === "sent").length;

  // "Handled" means the autopilot produced something: a draft the owner can
  // act on, or a reply already out the door. Flagged counts as handled: the
  // draft exists, it is deliberately waiting on a person.
  const handled = withReview.length - unanswered;
  const coverage = withReview.length ? Math.round((handled / withReview.length) * 100) : 0;

  const followUpsDrafted = guests.filter((g) => g.reengagementStatus === "drafted").length;
  const followUpsSent = guests.filter((g) => g.reengagementStatus === "sent").length;
  const followUpsDue = guests.filter((g) => g.reengagementStatus === "not_due").length;

  return {
    guests: guests.length,
    reviews: withReview.length,
    positive,
    negative,
    neutral,
    flagged,
    unanswered,
    drafted,
    approved,
    sent,
    handled,
    coverage,
    followUpsDrafted,
    followUpsSent,
    followUpsDue,
  };
}

/** The review pipeline, in the order the status flow actually moves. */
export function reviewPipeline(i: ReputationInsights) {
  return [
    { key: "unanswered", label: "No reply yet", value: i.unanswered, tone: "rust" as const },
    { key: "flagged", label: "Held for you", value: i.flagged, tone: "brick" as const },
    { key: "drafted", label: "Drafted", value: i.drafted, tone: "ochre" as const },
    { key: "approved", label: "Approved", value: i.approved, tone: "moss" as const },
    { key: "sent", label: "Sent", value: i.sent, tone: "moss" as const },
  ];
}

// ── Bookings over time ──────────────────────────────────────────────────

/** Bookings bucketed into the last `weeks` calendar weeks, oldest first. */
export function bookingSeries(guests: GuestRow[], weeks = 8, now = Date.now()) {
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const buckets = Array.from({ length: weeks }, (_, idx) => {
    const end = now - (weeks - 1 - idx) * WEEK;
    return { start: end - WEEK, end, count: 0, label: "" };
  });

  for (const g of guests) {
    const t = ms(g.bookingDate);
    for (const b of buckets) {
      if (t > b.start && t <= b.end) {
        b.count++;
        break;
      }
    }
  }

  return buckets.map((b) => ({
    count: b.count,
    label: new Date(b.end).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));
}

/** Which tours the bookings are actually made up of. */
export function tourMix(guests: GuestRow[]) {
  const counts = new Map<string, number>();
  for (const g of guests) counts.set(g.tourType, (counts.get(g.tourType) ?? 0) + 1);
  const total = guests.length || 1;
  return [...counts.entries()]
    .map(([tourType, count]) => ({
      tourType,
      count,
      share: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

// ── Content ─────────────────────────────────────────────────────────────

// Mirrors the constraints the generators in src/lib/ai.ts are told to follow,
// so the dashboard can audit the AI's own output against its own brief rather
// than taking it on trust.
const BANNED = [
  "unforgettable",
  "magic",
  "magical",
  "adventure awaits",
  "make memories",
  "hidden gem",
  "come see why",
  "book now",
  "dive in",
  "your next adventure",
  "endless fun",
  "don't hesitate",
  "we strive to",
];

const EMOJI =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu;

export type CaptionQuality = ReturnType<typeof captionQuality>;

export function captionQuality(
  caption: string,
  business: { name: string; location: string; tourTypes: string }
) {
  const lower = caption.toLowerCase();
  const words = caption.trim().split(/\s+/).filter(Boolean).length;
  const emoji = caption.match(EMOJI)?.length ?? 0;
  const hashtags = caption.match(/#\w+/g)?.length ?? 0;
  const bannedHits = BANNED.filter((p) => lower.includes(p));
  const hasEmDash = /[—–]/.test(caption);

  // "Specific" means it names something only this operator could name: the
  // town, one of its tours, or a proper noun lifted from a real guest quote.
  const tours = business.tourTypes
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const namesLocation = !!business.location && lower.includes(business.location.toLowerCase());
  const namesTour = tours.some((t) => t && lower.includes(t));
  // Proper nouns past the first word, ignoring the business's own name.
  const properNouns = (caption.match(/(?<!^)(?<![.!?]\s)\b[A-Z][a-z]{2,}/g) ?? []).filter(
    (w) => !business.name.toLowerCase().includes(w.toLowerCase())
  );
  const specific = namesLocation || namesTour || properNouns.length > 0;

  const checks = [
    { label: "Under 30 words", pass: words > 0 && words <= 30, detail: `${words} words` },
    {
      label: "Specific to this operator",
      pass: specific,
      detail: specific
        ? namesLocation
          ? `names ${business.location}`
          : namesTour
            ? "names a tour"
            : `names ${properNouns[0]}`
        : "could be any operator",
    },
    {
      label: "No banned phrases",
      pass: bannedHits.length === 0,
      detail: bannedHits.length ? `uses "${bannedHits[0]}"` : "clean",
    },
    { label: "No em dash", pass: !hasEmDash, detail: hasEmDash ? "found one" : "clean" },
    {
      label: "At most 1 emoji",
      pass: emoji <= 1,
      detail: emoji === 0 ? "none" : `${emoji}`,
    },
    {
      label: "At most 1 hashtag",
      pass: hashtags <= 1,
      detail: hashtags === 0 ? "none" : `${hashtags}`,
    },
  ];

  const passed = checks.filter((c) => c.pass).length;
  return { words, emoji, hashtags, checks, passed, total: checks.length, specific };
}

export type ContentInsights = ReturnType<typeof contentInsights>;

export function contentInsights(
  items: ContentRow[],
  business: { name: string; location: string; tourTypes: string }
) {
  const quality = items.map((i) => captionQuality(i.caption, business));
  const onBrief = quality.filter((q) => q.passed === q.total).length;
  const specific = quality.filter((q) => q.specific).length;

  const themes = new Map<string, number>();
  for (const i of items) themes.set(i.theme, (themes.get(i.theme) ?? 0) + 1);

  const now = Date.now();
  const upcoming = items.filter((i) => ms(i.scheduledFor) >= now);
  const nextUp = [...upcoming].sort((a, b) => ms(a.scheduledFor) - ms(b.scheduledFor))[0];

  // How many days the queue covers from now to the last scheduled post.
  const last = items.length
    ? Math.max(...items.map((i) => ms(i.scheduledFor)))
    : now;
  const runwayDays = Math.max(0, Math.ceil((last - now) / (24 * 60 * 60 * 1000)));

  return {
    total: items.length,
    drafted: items.filter((i) => i.status === "drafted").length,
    approved: items.filter((i) => i.status === "approved").length,
    onBrief,
    specific,
    avgWords: quality.length
      ? Math.round(quality.reduce((s, q) => s + q.words, 0) / quality.length)
      : 0,
    themes: [...themes.entries()].map(([theme, count]) => ({ theme, count })),
    runwayDays,
    nextUp: nextUp ?? null,
  };
}

// ── Plain-language read-outs ────────────────────────────────────────────

/**
 * Turns the numbers above into the sentence an owner would actually want.
 * Deterministic, and every branch is backed by a computed value, so this can
 * never claim something the data does not show.
 */
export function headlineInsights(rep: ReputationInsights, con: ContentInsights): string[] {
  const out: string[] = [];

  if (rep.flagged > 0) {
    out.push(
      `${rep.flagged} negative review${rep.flagged > 1 ? "s are" : " is"} waiting on you. The autopilot drafted a reply but will not send it without a person reading it first.`
    );
  }
  if (rep.unanswered > 0) {
    out.push(
      `${rep.unanswered} review${rep.unanswered > 1 ? "s have" : " has"} no reply drafted yet. Running review autopilot clears ${rep.unanswered > 1 ? "them" : "it"}.`
    );
  }
  if (rep.reviews > 0) {
    out.push(
      `Autopilot has handled ${rep.coverage}% of your reviews, ${rep.handled} of ${rep.reviews}.`
    );
  }
  if (rep.followUpsDrafted > 0) {
    out.push(
      `${rep.followUpsDrafted} follow-up message${rep.followUpsDrafted > 1 ? "s are" : " is"} drafted and waiting on approval.`
    );
  }
  if (con.total > 0) {
    out.push(
      con.onBrief === con.total
        ? `All ${con.total} queued posts pass every copy rule in the brief.`
        : `${con.onBrief} of ${con.total} queued posts pass every copy rule. The rest are flagged on their cards.`
    );
  }
  if (con.runwayDays > 0) {
    out.push(`Your content queue covers the next ${con.runwayDays} day${con.runwayDays > 1 ? "s" : ""}.`);
  }

  return out;
}
