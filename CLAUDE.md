# TourPilot

Marketing autopilot for small tour & activity operators. Drafts review replies, guest follow-ups, and social posts automatically; the owner approves or sends with one click.

Built for the Auth0 × Stripe Projects hackathon. **Hard deadline: demos at 5:30pm today.**

## Stack

Next.js 14 (App Router) · Prisma · Neon Postgres · Auth0 · Stripe Billing · Anthropic API · Tailwind

## Commands

```bash
npm run dev          # dev server
npm run db:push      # push schema to Neon
npm run db:seed      # load demo business + guests
npx tsc --noEmit     # type check
```

## Architecture

**Guest is the core entity.** A guest record holds the booking, the review, the AI-drafted review reply, the AI-drafted re-engagement message, and the status of each. Review Autopilot and Re-engagement Autopilot are two actions on the same record, not separate subsystems. Content Autopilot is business-level (posts aren't tied to one guest) and lives on its own page.

Status flow: `none` → `drafted` → `approved` → `sent`, plus `flagged` for negative reviews the AI deliberately holds for a human.

```
src/lib/anthropic.ts        all three AI generators live here
src/app/api/autopilot/*     the three autopilot routes
src/app/dashboard/          guest timeline, content, settings
src/components/             GuestTicketCard is the main UI unit
prisma/seed.ts              demo data
```

## Ownership boundary — important

This is a 2-person team. **A teammate owns all Stripe billing and infrastructure provisioning.** Do not modify:

- `src/lib/stripe.ts`
- `src/app/api/stripe/**`
- `src/app/dashboard/settings/page.tsx`
- `src/components/UpgradeButton.tsx`
- `.env` (managed by the Stripe Projects CLI — don't hand-edit)

If something in those files looks broken, say so rather than fixing it. Silent edits there create merge conflicts.

## Working constraints

- **The app is already built and type-checks clean.** The remaining work is getting it running, tuning AI output quality, and demo prep. It is not a greenfield build.
- **Make surgical changes.** Change the minimum needed. Don't refactor adjacent code, don't restructure files, don't add abstractions for hypothetical future needs.
- **Don't add dependencies** without asking first.
- **Ask before large changes.** Under time pressure, a wrong big change is much more expensive than a question.
- Run `npx tsc --noEmit` after edits.

## Where quality actually matters

Judges will read the AI's output directly. Generic captions and replies lose. The single highest-leverage work in this repo is the prompts in `src/lib/anthropic.ts` — they should produce copy that sounds like a real small kayak company wrote it, not like a marketing tool.

The `flagged` negative-review path is the strongest moment in the demo. It must work.
