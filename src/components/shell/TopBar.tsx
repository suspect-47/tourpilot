"use client";

import Link from "next/link";
import { Menu, MessageCircle } from "lucide-react";

/**
 * Full-width chrome above the panels. It sits on the same ambient mesh as the
 * panels below it rather than on its own ground, so there is no seam between
 * the header strip and the content region.
 */
export default function TopBar({
  businessName,
  tier,
  onOpenNav,
  onOpenAssistant,
}: {
  businessName: string;
  tier: string;
  onOpenNav: () => void;
  onOpenAssistant: () => void;
}) {
  const initial = businessName.trim().charAt(0).toUpperCase() || "T";

  return (
    <header className="app-header-glass m-3.5 mb-0 flex items-center gap-3 rounded-panel px-4 py-2.5">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="-ml-1 rounded-control p-2 text-ink-soft transition hover:bg-white/[0.06] hover:text-ink lg:hidden"
      >
        <Menu className="h-[18px] w-[18px]" strokeWidth={2.1} />
      </button>

      <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-sunset text-[15px] font-bold text-paper shadow-[0_6px_16px_-8px_rgba(246,134,74,0.9),inset_0_1px_0_rgba(255,255,255,0.35)]"
        >
          T
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-bold leading-tight tracking-tight text-ink">
            TourPilot
          </span>
          <span className="block truncate text-[11px] leading-tight text-ink-soft">
            {businessName}
          </span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenAssistant}
          aria-label="Open copilot"
          className="rounded-control p-2 text-ink-soft transition hover:bg-white/[0.06] hover:text-ink lg:hidden"
        >
          <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2.1} />
        </button>

        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
          {tier}
        </span>
        <a
          href="/api/auth/logout"
          className="hidden rounded-control px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition hover:bg-white/[0.06] hover:text-ink sm:block"
        >
          Log out
        </a>
        <span
          aria-hidden
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-[13px] font-bold text-ink-soft"
        >
          {initial}
        </span>
      </div>
    </header>
  );
}
