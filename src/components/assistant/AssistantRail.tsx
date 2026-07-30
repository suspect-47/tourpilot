"use client";

import { AssistantRuntimeProvider, useAuiState } from "@assistant-ui/react";
import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { PanelRightClose } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Thread } from "./Thread";

const TABS = {
  "/dashboard/content": {
    label: "Content Management",
    suggestions: [
      "Generate this week's posts",
      "Which posts are still waiting on me?",
      "Rewrite the seasonal caption, shorter and less salesy",
    ],
  },
  "/dashboard/analytics": {
    label: "Analytics",
    suggestions: [
      "Summarize how the autopilot is doing",
      "Which tour brings in the most bookings?",
      "What should I fix first?",
    ],
  },
  "/dashboard/settings": {
    label: "Billing",
    suggestions: [
      "What does my current plan actually include?",
      "How much autopilot have I used this month?",
    ],
  },
  "/dashboard": {
    label: "Reputation",
    suggestions: [
      "What needs my attention right now?",
      "Draft replies for every review that doesn't have one",
      "Which reviews did you hold back, and why?",
    ],
  },
} as const;

export function tabFor(pathname: string) {
  if (pathname.startsWith("/dashboard/content")) return TABS["/dashboard/content"];
  if (pathname.startsWith("/dashboard/analytics")) return TABS["/dashboard/analytics"];
  if (pathname.startsWith("/dashboard/settings")) return TABS["/dashboard/settings"];
  return TABS["/dashboard"];
}

/**
 * The assistant's tools write to the same rows the dashboard is rendering.
 * When a turn finishes, refresh the server components so an autopilot run
 * or an approval shows up on the cards without a manual reload.
 */
function RefreshOnComplete() {
  const router = useRouter();
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const wasRunning = useRef(false);

  useEffect(() => {
    if (wasRunning.current && !isRunning) router.refresh();
    wasRunning.current = isRunning;
  }, [isRunning, router]);

  return null;
}

/**
 * One runtime for the whole shell. The desktop rail and the mobile sheet are
 * two mount points on the same conversation, so opening the sheet after using
 * the rail continues the same thread rather than starting a second one.
 */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // The transport is created once so the conversation survives tab changes.
  // The route is read from a ref at send time instead of being baked into
  // the transport, so every message still carries the tab the owner is on.
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const [transport] = useState(
    () =>
      new AssistantChatTransport({
        api: "/api/assistant",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { ...body, messages, pathname: pathRef.current },
        }),
      })
  );

  const runtime = useChatRuntime({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <RefreshOnComplete />
      {children}
    </AssistantRuntimeProvider>
  );
}

/** The rail's contents. Width and collapse are the shell's business. */
export function AssistantPanel({ onCollapse }: { onCollapse?: () => void }) {
  const pathname = usePathname();
  const tab = tabFor(pathname);

  return (
    <div className="glass-card flex h-full flex-col overflow-hidden rounded-panel">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[14px] font-bold leading-tight text-ink">Copilot</p>
          <p className="truncate text-[11px] leading-tight text-ink-soft">Reading: {tab.label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full border border-moss/30 bg-moss/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-moss">
            Live
          </span>
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Collapse copilot"
              className="rounded-control p-1.5 text-ink-soft transition hover:bg-white/[0.06] hover:text-ink"
            >
              <PanelRightClose className="h-[17px] w-[17px]" strokeWidth={2.1} />
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Thread suggestions={[...tab.suggestions]} />
      </div>
    </div>
  );
}
