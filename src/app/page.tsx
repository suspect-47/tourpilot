import { getSessionOrDemo as getSession } from "@/lib/demoSession";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-display text-lg font-semibold text-ink">Inlet</p>
        <a
          href="/api/auth/login"
          className="app-header-glass rounded-control px-4 py-2 text-sm font-medium text-ink transition hover:bg-white/10"
        >
          Log in
        </a>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-widest text-rust">
          For tour &amp; activity operators
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
          You&apos;re out running the tour. Your marketing shouldn&apos;t wait for you to get back.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
          Inlet drafts your review replies, follows up with past guests, and writes your next
          week of social posts, automatically. You approve or send with one click, or let it run.
        </p>
        <div className="mt-8">
          <a
            href="/api/auth/login"
            className="inline-block rounded-control bg-sunset px-6 py-3 text-sm font-semibold text-paper shadow-[0_8px_24px_-12px_rgba(246,134,74,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:bg-sunset-strong"
          >
            Get started
          </a>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="ticket glass-lift !grid-cols-1 p-5">
            <p className="text-xs font-semibold tracking-wide text-ink-soft">01 · Reviews</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">Never leave a review unanswered</p>
            <p className="mt-1 text-sm text-ink-soft">
              Positive reviews get an on-brand reply drafted and ready. Negative ones get flagged for you first.
            </p>
          </div>
          <div className="ticket glass-lift !grid-cols-1 p-5">
            <p className="text-xs font-semibold tracking-wide text-ink-soft">02 · Re-engagement</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">Past guests hear from you again</p>
            <p className="mt-1 text-sm text-ink-soft">
              A week after a booking, a warm follow-up goes out asking for a review or a referral.
            </p>
          </div>
          <div className="ticket glass-lift !grid-cols-1 p-5">
            <p className="text-xs font-semibold tracking-wide text-ink-soft">03 · Content</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">A week of posts, written for you</p>
            <p className="mt-1 text-sm text-ink-soft">
              Seasonal captions and testimonial highlights, generated and queued for your approval.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
