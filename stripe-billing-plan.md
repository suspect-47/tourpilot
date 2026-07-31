# Stripe Billing & Infrastructure Plan
## TourPilot Hackathon — Person A: Infrastructure & Monetization

### Overview

The goal is to make the Stripe billing flow fully functional and demo-ready end-to-end:
1. Provision infrastructure (Neon/Postgres + Anthropic key) via Stripe Projects CLI so the provisioning story can be narrated on stage.
2. Create real Stripe products/prices and wire the price IDs into the environment.
3. Run `stripe listen` to generate the webhook secret and validate webhook delivery.
4. Execute and verify the complete upgrade path: click upgrade → Stripe Checkout → test card → webhook fires → `subscriptionTier` changes in DB.
5. Also fix one silent bug in the webhook handler: `stripeCustomerId` is never populated, which means repeat customers always create a new Stripe customer. Fix this so the demo tells a clean story.

**Non-goals for this session:** usage enforcement, cancellation flows, Stripe Customer Portal, billing history, invoice failure handling, Vercel deploy (only if time permits and is treated as a separate stretch task).

---

## Sub-Task 1 — Stripe Projects: Provision Neon/Postgres and Register Anthropic Key

**Intent**
Use the Stripe Projects CLI to provision the Neon Postgres database and register the Anthropic API key as a tracked project variable. This is a judged demo criterion — whoever runs these commands must be able to narrate them on stage.

**Expected Outcomes**
- `DATABASE_URL` is synced and visible via `stripe projects env`.
- `ANTHROPIC_API_KEY` is registered as a project variable.
- Both variables are populated in the local `.env` file (or pulled with `stripe projects env pull`).
- The provisioning workflow can be narrated step-by-step on stage.

**Todo List**
1. Run `stripe projects add neon/postgres` and confirm the `DATABASE_URL` variable syncs.
2. Run `stripe projects add anthropic/key` (or manually register via `stripe projects env set ANTHROPIC_API_KEY=<key>`) to track the Anthropic key.
3. Run `stripe projects env` to verify both variables appear.
4. Pull all variables into the local `.env` with `stripe projects env pull` (or copy manually).
5. Run `npx prisma db push` to ensure the schema is applied to the provisioned database and the connection works.
6. Rehearse a 60-second verbal walk-through of what `stripe projects add` does and why it matters (one-command infra provisioning vs. manual copy-paste).

**Relevant Context**
- `.env.example` already has placeholder comments: `# Run: stripe projects add neon/database`
- `prisma/schema.prisma` uses `env("DATABASE_URL")` — just needs the URL populated.
- No code changes required for this sub-task — it is purely CLI + environment setup.

**Status:** [ ] pending

---

## Sub-Task 2 — Create Stripe Products & Prices, Wire Price IDs

**Intent**
Create the two real Stripe products (Starter, Pro) with monthly recurring prices in the Stripe Dashboard (or via CLI). Copy the generated price IDs into the environment so the checkout flow can use them.

**Expected Outcomes**
- Two products exist in Stripe: "TourPilot Starter" and "TourPilot Pro".
- Each product has one monthly recurring price.
- `STRIPE_PRICE_STARTER` and `STRIPE_PRICE_PRO` are set in the local `.env` file with real `price_xxx` values.
- `STRIPE_SECRET_KEY` is also set in `.env`.
- The app boots and `TIERS.starter.priceId` / `TIERS.pro.priceId` resolve to non-null values (can verify with a quick `console.log` or just check settings page renders upgrade buttons).

**Todo List**
1. In the Stripe Dashboard (or CLI: `stripe products create` + `stripe prices create`), create:
   - Product: "TourPilot Starter", Price: $X/month recurring → copy `price_xxx`
   - Product: "TourPilot Pro", Price: $Y/month recurring → copy `price_yyy`
2. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_STARTER=price_xxx
   STRIPE_PRICE_PRO=price_yyy
   ```
3. Restart the dev server and navigate to `/dashboard/settings` — confirm the upgrade buttons appear for both Starter and Pro.

**Relevant Context**
- `src/lib/stripe.ts` — `TIERS.starter.priceId` reads `process.env.STRIPE_PRICE_STARTER`. If env var is empty, checkout returns a 400 "Invalid tier" error — so this is a blocker for all upgrade testing.
- `src/app/api/stripe/checkout/route.ts:12` — `const priceId = TIERS[tier]?.priceId` — this is the line that fails without real price IDs.

**Status:** [ ] pending

---

## Sub-Task 3 — Run `stripe listen` and Configure Webhook Secret

**Intent**
Start the Stripe CLI webhook listener so local webhook events are forwarded to the running dev server. Capture the webhook signing secret it prints and add it to `.env`.

**Expected Outcomes**
- `stripe listen --forward-to localhost:3000/api/stripe/webhook` is running.
- The printed `whsec_...` secret is added to `.env` as `STRIPE_WEBHOOK_SECRET`.
- The webhook handler can successfully verify the signature — i.e., a test event via `stripe trigger checkout.session.completed` returns `{ received: true }` from the handler (not a 400).

**Todo List**
1. Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Copy the `whsec_...` secret printed at startup into `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. In a second terminal, trigger a test event: `stripe trigger checkout.session.completed`
4. Confirm the handler logs `received: true` and does NOT return `Invalid signature`.
5. Keep the listener running for all subsequent end-to-end testing.

**Relevant Context**
- `src/app/api/stripe/webhook/route.ts:14` — `stripe.webhooks.constructEvent(body, signature, webhookSecret)` — this throws if the secret is wrong or missing, causing a silent 400 failure.
- This is the most likely failure point at demo time. The webhook failing quietly means the tier never updates, and it looks like the whole billing system is broken.

**Status:** [ ] pending

---

## Sub-Task 4 — Fix: Populate `stripeCustomerId` on Checkout and Webhook

**Intent**
The `Business` model has a `stripeCustomerId String?` field that is never populated. The checkout creates a session with `customer_email` only, meaning every purchase creates a brand-new Stripe customer. Fix this so the first checkout creates-or-retrieves the Stripe customer and stores the ID. This cleans up the demo story and prevents duplicate customer records.

**Expected Outcomes**
- On first upgrade, a Stripe Customer is created and `business.stripeCustomerId` is saved in the DB.
- On subsequent upgrades, the existing customer ID is passed to `checkout.sessions.create` instead of `customer_email`.
- The webhook handler also saves the `stripeCustomerId` from the completed session.

**Todo List**
1. In `src/app/api/stripe/checkout/route.ts`:
   - After loading `user.business`, check if `user.business.stripeCustomerId` exists.
   - If not, call `stripe.customers.create({ email: user.email, name: user.business.name, metadata: { businessId: user.business.id } })` and save the returned `id` to `business.stripeCustomerId`.
   - Pass `customer: stripeCustomerId` to `stripe.checkout.sessions.create` instead of `customer_email`.
2. In `src/app/api/stripe/webhook/route.ts`, inside the `checkout.session.completed` handler:
   - Extract `session.customer` (the Stripe customer ID).
   - Alongside updating `subscriptionTier`, also save `stripeCustomerId` to the business record if it's not already set.

**Relevant Context**
- `src/app/api/stripe/checkout/route.ts:21` — currently: `customer_email: user.email`
- `prisma/schema.prisma:22` — `stripeCustomerId String?` exists on `Business`, just never written.
- `src/lib/getCurrentBusiness.ts` — `getOrCreateUserAndBusiness` returns `user.business` which includes `stripeCustomerId`.

**Status:** [ ] pending

---

## Sub-Task 5 — End-to-End Upgrade Path Test

**Intent**
Manually walk through the complete upgrade path using a Stripe test card and confirm that every layer works: UI → API → Stripe Checkout → webhook → database.

**Expected Outcomes**
- Clicking "Upgrade to Starter" redirects to Stripe Checkout.
- Entering test card `4242 4242 4242 4242` completes the payment.
- Stripe fires `checkout.session.completed` to the webhook listener.
- The webhook handler processes it and updates `business.subscriptionTier` to `"starter"` in the database.
- The Settings page refreshes and shows "Current plan" on Starter.
- The nav tier badge updates to "starter".
- `business.stripeCustomerId` is now populated in the database.

**Todo List**
1. Confirm `stripe listen` is running (Sub-Task 3 complete).
2. Navigate to `/dashboard/settings` and click "Upgrade to Starter".
3. On the Stripe Checkout page, use:
   - Card: `4242 4242 4242 4242`
   - Expiry: any future date
   - CVC: any 3 digits
4. After redirect to `/dashboard/settings?upgraded=1`, check:
   - Starter shows "Current plan"
   - Nav badge shows "starter"
5. Verify in the database (via Prisma Studio `npx prisma studio` or direct DB query):
   - `business.subscriptionTier = "starter"`
   - `business.stripeCustomerId` is now set
6. Repeat for Pro tier upgrade to confirm the same flow works.
7. In the `stripe listen` terminal, confirm the event appeared and the handler returned 200.

**Relevant Context**
- `src/app/dashboard/settings/page.tsx:11` — reads `user.business.subscriptionTier` to render "Current plan"
- `src/components/Nav.tsx` — reads tier and renders badge
- Stripe test cards: https://stripe.com/docs/testing

**Status:** [ ] pending

---

## Sub-Task 6 — (Stretch) Deploy to Vercel

**Intent**
Deploy the app to Vercel so the demo runs on a public URL rather than localhost. This removes the need for `stripe listen` and replaces it with a Stripe-registered webhook endpoint.

**Expected Outcomes**
- App is live on a Vercel URL.
- All environment variables are set in the Vercel project dashboard.
- A Stripe webhook endpoint is registered in the Stripe Dashboard pointing to `https://<vercel-url>/api/stripe/webhook`.
- The live upgrade path works end-to-end on the Vercel deployment.

**Todo List**
1. Run `vercel` (or `vercel deploy --prod`) from the project root.
2. In Vercel project settings → Environment Variables, add all values from `.env`:
   - `AUTH0_SECRET`, `AUTH0_BASE_URL` (set to Vercel URL), `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`
   - `DATABASE_URL`
   - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_BASE_URL` (set to the Vercel URL)
3. In Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://<vercel-url>/api/stripe/webhook`
   - Events: `checkout.session.completed`
   - Copy the new signing secret and update `STRIPE_WEBHOOK_SECRET` in Vercel env vars.
4. Re-deploy after updating env vars.
5. Run the full upgrade path test (Sub-Task 5) on the live Vercel URL.

**Relevant Context**
- Auth0 also needs the Vercel callback URL registered in the Auth0 application settings (`Allowed Callback URLs`, `Allowed Logout URLs`, `Allowed Web Origins`).
- `NEXT_PUBLIC_BASE_URL` must be updated from `http://localhost:3000` to the real Vercel URL or checkout success/cancel redirects will 404.

**Status:** [ ] pending
