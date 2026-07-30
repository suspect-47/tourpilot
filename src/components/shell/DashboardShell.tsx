"use client";

import { MessageCircle, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AssistantPanel, AssistantProvider } from "@/components/assistant/AssistantRail";
import ShellNav from "./ShellNav";
import TopBar from "./TopBar";

const NAV_KEY = "inlet.navCollapsed";
const RAIL_KEY = "inlet.railOpen";

// Wide enough for "Reputation Management" on one line. The bucket_AI original
// is 222, but its longest label is "Experiences".
const NAV_W_OPEN = 254;
const NAV_W_COLLAPSED = 68;
const RAIL_W = 360;
const RAIL_W_COLLAPSED = 52;

/**
 * Three-panel shell: nav rail, content, copilot rail, each its own glass panel
 * floating on the shared mesh with a gutter between them.
 *
 * The page itself never scrolls. The shell is exactly viewport-height and the
 * content panel scrolls internally, so the top bar and both rails stay put and
 * the rounded panel corners stay visible at the bottom of the screen.
 */
export default function DashboardShell({
  businessName,
  tier,
  children,
}: {
  businessName: string;
  tier: string;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const [navCollapsed, setNavCollapsed] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [navSheet, setNavSheet] = useState(false);
  const [assistantSheet, setAssistantSheet] = useState(false);

  // Read persisted layout after mount so the server render and the first paint
  // agree, then snap to the saved widths.
  useEffect(() => {
    setNavCollapsed(window.localStorage.getItem(NAV_KEY) === "1");
    setRailOpen(window.localStorage.getItem(RAIL_KEY) !== "0");
    setMounted(true);
  }, []);

  // A sheet left open while the viewport grows would be hidden by its
  // `lg:hidden` class but still mounted, trapping focus behind the desktop
  // layout. Close both on the way up.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) {
        setNavSheet(false);
        setAssistantSheet(false);
      }
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Close the mobile sheets on navigation.
  useEffect(() => {
    setNavSheet(false);
  }, [pathname]);

  const toggleNav = () =>
    setNavCollapsed((v) => {
      const next = !v;
      window.localStorage.setItem(NAV_KEY, next ? "1" : "0");
      return next;
    });

  const toggleRail = () =>
    setRailOpen((v) => {
      const next = !v;
      window.localStorage.setItem(RAIL_KEY, next ? "1" : "0");
      return next;
    });

  // Only animate once mounted, so the storage-driven starting layout does not
  // slide into place on every page load.
  const anim = mounted ? "transition-[width] duration-300 ease-out" : "";

  return (
    <AssistantProvider>
      <div className="relative flex h-screen flex-col overflow-hidden">
        <div className="relative z-30 shrink-0">
          <TopBar
            businessName={businessName}
            tier={tier}
            onOpenNav={() => setNavSheet(true)}
            onOpenAssistant={() => setAssistantSheet(true)}
          />
        </div>

        <div className="relative z-[1] flex min-h-0 flex-1 gap-3.5 p-3.5">
          {/* LEFT: navigation, collapses to an icon rail. */}
          <aside
            style={{ width: navCollapsed ? NAV_W_COLLAPSED : NAV_W_OPEN }}
            className={`relative hidden shrink-0 flex-col overflow-hidden rounded-panel border border-glass-border bg-glass-surface-strong px-3.5 py-[18px] shadow-glass backdrop-blur-glass lg:flex ${anim}`}
          >
            <div
              className={`flex items-center pb-3.5 ${
                navCollapsed ? "justify-center" : "justify-start"
              }`}
            >
              <button
                type="button"
                onClick={toggleNav}
                aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
                className="flex items-center gap-2.5 text-ink-soft transition hover:text-ink"
              >
                {navCollapsed ? (
                  <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={2.1} />
                ) : (
                  <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={2.1} />
                )}
                {!navCollapsed && (
                  <span className="text-[13px] font-bold text-ink">Workspace</span>
                )}
              </button>
            </div>

            <ShellNav collapsed={navCollapsed} isActive={isActive} />
          </aside>

          {/* CENTRE: the only scrolling region.
              Glass FILL but deliberately no backdrop-blur. The cards inside
              carry the blur; blurring this panel too stacked two blur layers
              over the same pixels, which reads soft and costs a second
              backdrop snapshot for no visible gain. */}
          <main className="relative min-w-0 flex-1 overflow-y-auto rounded-panel border border-glass-border bg-glass-surface-subtle shadow-glass rail-scroll">
            <div key={pathname} className="animate-page-in p-5 md:p-6">
              {children}
            </div>
          </main>

          {/* RIGHT: copilot. Stays mounted when collapsed, hidden with CSS, so
              an in-flight answer and the conversation survive the toggle. */}
          <div
            style={{ width: railOpen ? RAIL_W : RAIL_W_COLLAPSED }}
            className={`relative hidden shrink-0 overflow-hidden rounded-panel lg:block ${anim}`}
          >
            <div className={railOpen ? "h-full" : "hidden"}>
              <AssistantPanel onCollapse={toggleRail} />
            </div>
            {!railOpen && (
              <button
                type="button"
                onClick={toggleRail}
                aria-label="Open copilot"
                className="flex h-full w-full items-start justify-center rounded-panel border border-glass-border bg-glass-surface pt-4 text-sunset shadow-glass backdrop-blur-glass transition-colors hover:bg-white/[0.08]"
              >
                <MessageCircle className="h-6 w-6" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* MOBILE: navigation drawer from the left edge. */}
        {navSheet && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setNavSheet(false)}
              className="absolute inset-0 bg-black/55"
            />
            <aside className="glass-card glass-card--strong absolute inset-y-0 left-0 flex w-[266px] flex-col rounded-r-panel px-3.5 py-[18px]">
              <div className="flex items-center justify-between pb-3.5">
                <span className="text-[13px] font-bold text-ink">Workspace</span>
                <button
                  type="button"
                  onClick={() => setNavSheet(false)}
                  aria-label="Close navigation"
                  className="rounded-control p-1.5 text-ink-soft transition hover:bg-white/[0.06] hover:text-ink"
                >
                  <X className="h-[17px] w-[17px]" strokeWidth={2.1} />
                </button>
              </div>
              <ShellNav
                collapsed={false}
                isActive={isActive}
                onNavigate={() => setNavSheet(false)}
              />
              <a
                href="/api/auth/logout"
                className="mt-3 rounded-control px-2.5 py-2 text-[14px] font-semibold text-ink-soft transition hover:bg-white/[0.06] hover:text-ink"
              >
                Log out
              </a>
            </aside>
          </div>
        )}

        {/* MOBILE: copilot as a bottom sheet. */}
        {assistantSheet && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
            <button
              type="button"
              aria-label="Close copilot"
              onClick={() => setAssistantSheet(false)}
              className="absolute inset-0 bg-black/55"
            />
            <div className="relative h-[82vh]">
              <AssistantPanel onCollapse={() => setAssistantSheet(false)} />
            </div>
          </div>
        )}

        {/* MOBILE: the orb that opens the sheet. */}
        <button
          type="button"
          onClick={() => setAssistantSheet(true)}
          aria-label="Open copilot"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sunset text-paper shadow-[0_10px_30px_-10px_rgba(246,134,74,0.9),inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:bg-sunset-strong lg:hidden"
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>
    </AssistantProvider>
  );
}
