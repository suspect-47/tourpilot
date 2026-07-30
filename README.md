# TourPilot

Autonomous marketing co-pilot for tour & activity operators. Every guest
booking lives on a timeline; review replies, re-engagement messages, and
social content are drafted automatically and just need a human approval
(or send instantly, if you trust the draft).

Built for the Auth0 × Stripe Projects hackathon — Auth0 for multi-user
auth, Stripe Projects to provision it, Stripe Billing to monetize, Neon
for the database, Claude for every autopilot generation.

## 1. Provision services with Stripe Projects (do this first)

These need your own Stripe/Auth0 accounts, so run them yourself:

```bash
npm install -g stripe-cli   # or brew install stripe/stripe-cli/stripe
stripe login

cd tourpilot
stripe projects init tourpilot

# Provisions an Auth0 application + tenant, writes creds to .env
stripe projects add auth0/client

# Provisions a Neon Postgres database, writes DATABASE_URL to .env
stripe projects add neon/database
```

If `neon/database` isn't available in your Stripe Projects catalog yet,
create a free database at neon.tech directly and paste the connection
string into `DATABASE_URL` in `.env`.

## 2. Add the remaining keys

Copy `.env.example` to `.env` (Stripe Projects may have already created
and partially filled this — just fill in what's missing):

- `ANTHROPIC_API_KEY` — powers all three autopilots. Without it, the
  app still runs and shows realistic placeholder drafts, but the
  generation isn't live.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — your Stripe test keys,
  separate from the Stripe Projects CLI itself. Create two Products in
  Stripe (Starter, Pro), each with a recurring Price, and drop the
  price IDs into `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO`.
- `AUTH0_BASE_URL` — leave as `http://localhost:3000` for local dev.

## 3. Install, seed, run

```bash
npm install
npx prisma generate
npm run db:push      # creates tables from prisma/schema.prisma
npm run db:seed       # loads a demo business with sample guests/reviews
npm run dev
```

Visit `http://localhost:3000`, log in via Auth0, and you'll land on the
seeded "Blue Cove Kayak Tours" guest timeline.

## Demo script (for judges)

1. **Guest timeline** — point out Derek Holm's flagged negative review
   (autopilot drafted a reply but held it for a human) vs. Priya's
   positive one (drafted and ready to send with one click).
2. Click **Run review autopilot** — watch replies get drafted live.
3. Click **Run re-engagement autopilot** — Lena Voss's booking is 11
   days old, crosses the 7-day threshold, and gets a follow-up drafted
   in front of you.
4. **Content** tab — click **Generate this week's posts** to show
   Claude writing on-brand captions from real guest testimonials.
5. **Settings** tab — show the Stripe-powered tier upgrade flow.

## Architecture notes

- **Guest is the core entity.** Review Autopilot and Re-engagement
  Autopilot both operate on fields of the same `Guest` record — they
  aren't separate features bolted together, they're two autonomous
  actions on one guest experience timeline. Content Autopilot is the
  one business-level exception, since posts aren't tied to one guest.
- **Hackathon simplification:** every new Auth0 login joins the single
  seeded business as staff (see `src/lib/getCurrentBusiness.ts`) so
  multi-user login works without a separate invite/onboarding flow. A
  real multi-tenant version would let a new user choose "create a
  business" vs. "join with an invite code."
- **Demo-mode fallback:** `src/lib/anthropic.ts` returns realistic
  canned text if `ANTHROPIC_API_KEY` is unset, so the UI is always
  demoable even if a key isn't configured yet.
