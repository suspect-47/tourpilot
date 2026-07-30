"use client";

import Link from "next/link";
import { NAV_GROUPS, NAV_ITEMS } from "./nav-items";

/**
 * Nav body, shared by the desktop rail and the mobile drawer.
 *
 * The active item gets a glass pill drawn as an absolutely positioned sibling
 * behind the label. bucket_AI animates this between items with framer-motion's
 * shared layout; that would be a new dependency for one transition, so this
 * settles for a crossfade the pill does on its own.
 */
export default function ShellNav({
  collapsed,
  isActive,
  onNavigate,
}: {
  collapsed: boolean;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  const renderLink = (item: (typeof NAV_ITEMS)[number]) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.key}
        href={item.href}
        title={collapsed ? item.label : undefined}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center rounded-[11px] px-2.5 py-2 text-[14px] font-semibold transition-all duration-150 active:scale-[0.98] ${
          collapsed ? "justify-center" : "gap-2.5"
        } ${
          active
            ? "text-sunset-strong"
            : "text-ink-soft hover:bg-white/[0.06] hover:text-ink"
        }`}
      >
        {active && (
          <span
            aria-hidden
            className="absolute inset-0 z-0 rounded-[11px] border border-glass-border bg-glass-surface-strong shadow-glass backdrop-blur-glass-sm"
          />
        )}
        <span className="relative z-[1] shrink-0 transition-transform duration-150 group-hover:scale-110 group-active:scale-95">
          <Icon className="h-[17px] w-[17px]" strokeWidth={2.1} />
        </span>
        <span
          className={`relative z-[1] overflow-hidden whitespace-nowrap transition-all duration-200 ${
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {NAV_GROUPS.map((group) => {
        const items = NAV_ITEMS.filter((n) => n.group === group.id);
        if (items.length === 0) return null;
        // The account group is pushed to the bottom, the way Settings sits
        // alone under the fold in the reference shell.
        const pinBottom = group.id === "account";
        return (
          <div key={group.id} className={pinBottom ? "mt-auto" : collapsed ? "mt-2" : ""}>
            {group.id !== "workspace" && (
              <div
                className={`px-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft/60 transition-all duration-200 ${
                  collapsed ? "h-0 overflow-hidden pb-0 pt-0 opacity-0" : "pb-1.5 pt-3.5 opacity-100"
                }`}
              >
                {group.label}
              </div>
            )}
            <nav className="flex flex-col gap-px">{items.map(renderLink)}</nav>
          </div>
        );
      })}
    </>
  );
}
