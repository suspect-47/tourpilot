# TourPilot — Project Brief

**Event:** Auth0 × Stripe Projects Hackathon
**Team size:** 2
**Build window:** ~4.5 hours (1:00–5:30pm), demos at 5:30pm

---

## 1. What we're building

A marketing autopilot for small tour and activity businesses — kayak tours, walking tours, boat trips, climbing guides.

The owner connects their business once. After that, the app drafts their review replies, writes follow-up messages to past guests, and generates their social posts. They approve with one click, or let it send on its own.

**One sentence:** TourPilot does the marketing work a 3-person tour company never has time to do.

---

## 2. The problem

Tour and activity operators are a specific kind of small business:

- The owner is usually *on the tour* — in a kayak, on a trail, driving a van — not at a laptop.
- Their entire business depends on reviews and word of mouth. Google and TripAdvisor rankings drive bookings directly.
- They have no marketing person. Hiring one doesn't make sense at their revenue.
- Existing tools (Hootsuite, Podium, Birdeye) assume someone is sitting down to use them. That someone doesn't exist here.

The result: reviews go unanswered for weeks, past guests never hear from the business again, and the social account goes quiet for months.

**The gap we're filling:** every existing tool waits for a human to start the work. Ours starts the work and waits for a human to approve it. That inversion is the whole product.

---

## 3. What "autopilot" actually means here

This is the concept judges need to understand in the first 30 seconds, so we should be precise about it.

Most "AI marketing tools" are a text box. You show up, type what you want, get output. That's still work.

TourPilot is **draft-first**. The work is already done when the owner opens the app. They're reviewing, not creating. Three states:

| State | What it means | Who acts |
| --- | --- | --- |
| **Drafted** | AI wrote it, waiting for a look | AI acted first |
| **Approved** | Human said yes | Human confirms |
| **Sent** | It went out | Done |
| **Flagged** | AI wrote it but wants a human first | AI deferred on purpose |

The **flagged** state is the important one. A negative review gets a drafted reply, but the system deliberately holds it and asks a human to look. That's not a limitation — it's the product showing judgment about when autonomy is appropriate. Worth calling out explicitly in the demo.

---

## 4. The three autopilots

All three run on the same pattern: the system finds work that needs doing, does it, and queues it for approval.

### 4.1 Review Autopilot

**Trigger:** A guest leaves a review.
**What it does:** Reads the review, judges the sentiment, writes an on-brand reply that references what the guest actually said.
**Automation rule:**
- Positive/neutral review → reply drafted and marked ready to send
- Negative review → reply drafted but **flagged** for a human to read first

**Why it matters:** Response rate on reviews affects ranking on Google and TripAdvisor. Most small operators reply to almost none of theirs.

### 4.2 Re-engagement Autopilot

**Trigger:** A booking is more than 7 days old and hasn't been followed up on.
**What it does:** Writes a warm, personal message referencing the specific tour that guest took, with a soft ask — leave a review, or refer a friend.
**Automation rule:** Runs on a time threshold, no human trigger needed. Anyone past the cutoff gets a draft.

**Why it matters:** Repeat and referral bookings are the cheapest revenue a tour operator can get, and nobody has time to chase them.

### 4.3 Content Autopilot

**Trigger:** Owner wants their next batch of posts (or, in a fuller version, a weekly schedule).
**What it does:** Generates social captions using the business's actual season, location, tour types, and **real quotes from recent positive reviews**.
**Automation rule:** Batch generation — 5 captions at a time, each scheduled out across the coming days.

**Why it matters:** It closes the loop. Good reviews become marketing content automatically. The guest experience feeds the marketing.

### What's automated vs. what isn't (be honest about this)

| Automated | Still human |
| --- | --- |
| Writing every reply, message, and caption | Final approval before sending |
| Judging review sentiment | Handling a genuinely upset customer |
| Finding which guests are due for follow-up | Setting the brand voice, once, at setup |
| Pulling testimonials into content | Deciding what to actually publish |

---

## 5. Tools and why we're using each

| Tool | What it does for us | Why this one |
| --- | --- | --- |
| **Stripe Projects** | Provisions our infrastructure from the CLI — Auth0, Neon — and syncs credentials into `.env` automatically | It's the thing the hackathon is about. Also genuinely faster than three signup flows. |
| **Auth0** | Login, and multiple staff on one business account | Provisioned via Stripe Projects in one command |
| **Neon** | Postgres database (guests, reviews, content, subscriptions) | Serverless, provisioned via Stripe Projects, no local DB setup |
| **Stripe Billing** | The actual monetization — subscription tiers, checkout, webhooks | Separate from Stripe Projects. This is the in-app revenue model. |
| **Claude (Anthropic API)** | Powers all three autopilots — every reply, message, and caption | Strong at tone-matching and short-form brand voice |
| **Next.js 14 + Prisma + Tailwind** | App framework, database access, styling | Fast to build, one codebase for frontend and API |

### One distinction to keep straight (judges will ask)

**Stripe Projects** and **Stripe Billing** are two different things in this project:

- **Stripe Projects** = how we *set up* the app. CLI commands that provision Auth0 and Neon and write the credentials to `.env`. Setup-time only.
- **Stripe Billing** = how the app *makes money*. Subscription tiers our customers pay for. Runtime, in-product.

We use both, for different reasons. Saying this clearly in the demo is worth points.

---

## 6. Architecture in plain language

### The core idea: one guest, one timeline

Everything is organized around the **guest**, not around the feature.

A guest record holds their booking, their review, the AI's drafted reply, the AI's drafted follow-up message, and the status of each. Review Autopilot and Re-engagement Autopilot aren't separate systems — they're two things that happen on the same guest's record.

This is why the UI shows one card per guest instead of a "Reviews" tab and a "Messages" tab. It reflects how the owner actually thinks: *"How did it go with Priya, and have we followed up?"*

Content Autopilot is the one exception — posts belong to the business, not to a single guest — so it gets its own page.

### Data model

```
Business ─┬─ User      (staff who can log in, via Auth0)
          ├─ Guest     (booking + review + AI drafts + statuses)
          └─ ContentItem (AI-generated social posts)
```

**Business** holds the profile that shapes every AI output: name, description, brand voice, location, tour types — plus the Stripe subscription tier.

**Guest** is the core entity. Booking info, review text and sentiment, the drafted review reply and its status, the drafted re-engagement message and its status.

**ContentItem** is a generated social post: caption, theme, scheduled date, status.

### How a request flows

**Running an autopilot:**
1. Owner clicks "Run review autopilot" (or it runs on a schedule in a fuller version)
2. App checks who's logged in via Auth0
3. Finds guests with reviews that don't have replies yet
4. Sends each to Claude with the business's brand voice as context
5. Saves the draft, sets status to `drafted` or `flagged` based on sentiment
6. Page refreshes, drafts appear

**Approving something:**
1. Owner clicks Approve, Send, or Edit on a card
2. App updates that guest's status
3. Card updates instantly

**Upgrading a plan:**
1. Owner picks a tier on the Billing page
2. App creates a Stripe Checkout session
3. Owner pays in Stripe's hosted checkout
4. Stripe fires a webhook back to our app
5. App upgrades the business's tier in the database

### Pricing model

| Tier | Autopilot actions / month |
| --- | --- |
| Free | 10 |
| Starter | 100 |
| Pro | Unlimited |

Usage-based on the thing that costs us money (AI calls) and that scales with their business size. Easy to explain in one line.

---

## 7. What's already built

The full application is written and type-checks clean. That includes:

- Database schema and demo seed data (a fictional kayak tour company with realistic guests and reviews)
- All three autopilot API routes with live Claude integration
- Approve / send / edit actions on every draft
- Auth0 login and route protection
- Stripe checkout and webhook routes
- Full UI: landing page, guest timeline, content calendar, billing page

**What's left is setup and integration, not writing features.** That's what the task split below covers.

**Known simplification:** every new Auth0 login joins the same demo business as staff. Real multi-tenancy (create-a-business vs. join-with-invite-code) is a post-hackathon change. Say this if a judge asks rather than letting them find it.

---

## 8. Task split — 2 people

The rough principle: one person owns everything that touches **money and infrastructure**, the other owns everything that touches **the product and the demo**. Minimal overlap, so nobody's blocked.

### Person A — Infrastructure & Monetization

**Stripe Projects provisioning**
- `stripe projects add neon/postgres` — provision the database, confirm `DATABASE_URL` syncs
- Register the Anthropic key as a project variable so it's tracked the same way
- `stripe projects env` to verify everything landed
- Be able to *explain the provisioning workflow on stage* — this is a judged criterion, so whoever runs these commands should narrate them in the demo

**Stripe Billing (the bigger half of this role)**
- Create Starter and Pro products with recurring prices
- Wire the price IDs into the environment
- Run `stripe listen` and get the webhook secret
- **Test the full upgrade path end to end** — click upgrade → pay with a test card → confirm the tier actually changes in the database

> Budget real time for webhook testing. It's the single most likely thing to be broken at demo time, and it fails quietly.

**If there's time left:** deploy to Vercel so the demo isn't running on localhost.

### Person B — Product & Demo

**Get it running**
- Install, push the schema, seed the demo data
- Confirm Auth0 login works end to end

**Autopilot quality**
- Add the Anthropic API key, confirm all three autopilots generate live output
- **Read the actual output and tune the prompts.** This is the highest-leverage work in the whole build. Judges are reading the AI's writing. Generic captions lose; captions that sound like a real kayak company win.
- Make sure the flagged-negative-review case works — it's the strongest moment in the demo

**Demo prep**
- Tune the seed data so the demo tells a story
- Write and rehearse the 3-minute pitch
- Have a backup plan if live generation fails on stage (screenshots, or pre-generated drafts)

### Both, together (last 45 minutes)

- Full run-through on one machine
- Rehearse the demo twice, out loud, timed
- Decide who says what

### Suggested timeline

| Time | Person A | Person B |
| --- | --- | --- |
| 1:00–2:00 | Provision Neon, verify env sync | Install, seed, get login working |
| 2:00–3:30 | Stripe products, checkout, webhook testing | Anthropic key in, tune all three autopilots |
| 3:30–4:30 | Test upgrade path end to end; deploy if time | Demo data, UI polish, write the pitch |
| 4:30–5:15 | Joint integration test — everything on one machine | |
| 5:15–5:30 | Rehearse twice, timed | |

---

## 9. Demo script (3 minutes)

**Open with the person, not the product.** *"Meet a kayak tour operator. She's on the water six hours a day. She has 40 unanswered reviews."*

1. **Guest timeline** — this is her whole guest list. Point out that replies are *already drafted*. She didn't do anything.
2. **The flagged review** — Derek had a bad experience. The AI wrote a reply but deliberately held it for a human. Show the judgment.
3. **Run re-engagement autopilot live** — a guest crossed the 7-day mark, gets a personal follow-up drafted on the spot.
4. **Content tab** — generate posts live. Point out the captions are pulling from real guest reviews. Guest experience becomes marketing.
5. **Billing** — upgrade a tier. Real Stripe checkout.
6. **Close on the build story** — Auth0 and Neon were provisioned with two CLI commands via Stripe Projects. No dashboards, no copy-pasted keys.

**Land it:** *"Every other tool waits for her to sit down and do the work. This one does the work and waits for her to say yes."*

---

## 10. Risks

| Risk | Mitigation |
| --- | --- |
| Stripe webhook doesn't fire at demo time | Test it early, keep `stripe listen` running, have a screenshot fallback |
| Live AI generation is slow or fails on stage | Pre-generate drafts before demoing; the seeded data already looks complete |
| Auth0 login breaks on a different machine | Whoever demos should log in successfully at least 30 min before |
| Wifi dies | Screen recording of the full flow as backup |
| We over-explain and run out of time | Rehearse timed. Two minutes of demo, one minute of story. |

---

## 11. Open decisions

- Deploy to Vercel, or demo from localhost? (Deployed looks more finished; localhost is one less thing to break.)
- Who presents? Suggestion: Person B tells the story, Person A does the 20-second provisioning explanation.
- Do we show the code at all, or stay in the product? (Recommend staying in the product unless a judge asks.)
