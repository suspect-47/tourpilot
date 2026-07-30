import Link from "next/link";

export function Nav({ businessName, tier }: { businessName: string; tier: string }) {
  return (
    <header className="border-b border-ink/10 bg-paper-raised">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <p className="font-display text-lg font-semibold text-ink">TourPilot</p>
          <p className="text-xs text-ink-soft">{businessName}</p>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-ink-soft">
          <Link href="/dashboard" className="hover:text-ink">
            Guest timeline
          </Link>
          <Link href="/dashboard/content" className="hover:text-ink">
            Content
          </Link>
          <Link href="/dashboard/settings" className="hover:text-ink">
            Settings
          </Link>
          <span className="rounded-full bg-ink/10 px-2.5 py-1 font-mono text-xs uppercase tracking-wide text-ink">
            {tier}
          </span>
          <a href="/api/auth/logout" className="hover:text-ink">
            Log out
          </a>
        </nav>
      </div>
    </header>
  );
}
