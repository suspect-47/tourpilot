"use client";

import {
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  type ToolCallMessagePartProps,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import { memo, useState, type FC } from "react";

/**
 * The rail's thread, built directly on assistant-ui primitives rather than
 * from the shadcn registry component. The registry version targets Tailwind
 * v4 (@container, var(--color-*)), which this project is not on, and it is
 * laid out for a full-width chat page rather than a 380px rail. Building on
 * the primitives keeps the real streaming, tool-call, and cancel behaviour
 * while letting the glass material go in at the first line instead of
 * being retrofitted over a light theme.
 */

const MarkdownText = memo(() => (
  <MarkdownTextPrimitive remarkPlugins={[remarkGfm]} className="aui-md" defer />
));
MarkdownText.displayName = "MarkdownText";

// Human labels for the tool chips. The owner should read "Drafted replies",
// not "runReviewAutopilot".
const TOOL_LABELS: Record<string, { running: string; done: string }> = {
  listGuests: { running: "Reading the timeline", done: "Read the timeline" },
  explainFlag: { running: "Checking why it was flagged", done: "Checked the flag" },
  weekSummary: { running: "Adding up the week", done: "Summarized the week" },
  runReviewAutopilot: { running: "Drafting review replies", done: "Ran review autopilot" },
  runReengagementAutopilot: {
    running: "Drafting follow-ups",
    done: "Ran re-engagement autopilot",
  },
  generateContentBatch: { running: "Writing this week's posts", done: "Generated posts" },
  approveDraft: { running: "Approving", done: "Approved a draft" },
  sendDraft: { running: "Sending", done: "Sent" },
  approveContent: { running: "Approving post", done: "Approved a post" },
};

const ToolChip: FC<ToolCallMessagePartProps> = ({ toolName, status, result }) => {
  const [open, setOpen] = useState(false);
  const running = status?.type === "running";
  const labels = TOOL_LABELS[toolName] ?? { running: toolName, done: toolName };
  // The refusal path deserves its own colour: this is the assistant
  // declining to send a flagged reply, which is a feature worth seeing.
  const refused =
    !!result && typeof result === "object" && "refused" in (result as Record<string, unknown>);

  return (
    <div
      className={`glass-inset my-1.5 rounded-control px-2.5 py-1.5 text-xs ${
        refused ? "border-brick/40" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left font-semibold uppercase tracking-wide text-ink-soft"
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            refused ? "bg-brick" : running ? "bg-ochre animate-rail-pulse" : "bg-moss"
          }`}
        />
        <span className="flex-1 truncate">
          {refused ? "Refused" : running ? labels.running : labels.done}
        </span>
        {!running && result !== undefined && (
          <span className="text-ink-soft/60">{open ? "hide" : "details"}</span>
        )}
      </button>
      {open && result !== undefined && (
        <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words rounded-[6px] bg-black/30 p-2 font-mono text-[0.68rem] leading-relaxed text-ink-soft">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

const UserMessage: FC = () => (
  <MessagePrimitive.Root className="flex justify-end">
    <div className="glass-inset max-w-[85%] rounded-tile rounded-br-[6px] px-3 py-2 text-sm leading-relaxed text-ink">
      <MessagePrimitive.Parts />
    </div>
  </MessagePrimitive.Root>
);

const AssistantMessage: FC = () => (
  <MessagePrimitive.Root className="w-full">
    <div className="text-sm leading-relaxed text-ink">
      <MessagePrimitive.Parts
        components={{ Text: MarkdownText, tools: { Fallback: ToolChip } }}
      />
    </div>
    <MessagePrimitive.Error>
      <div className="mt-2 rounded-control border border-brick/40 bg-brick/10 px-2.5 py-2 text-xs text-brick">
        Something went wrong reaching the assistant.
      </div>
    </MessagePrimitive.Error>
  </MessagePrimitive.Root>
);

function Suggestions({ suggestions }: { suggestions: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {suggestions.map((s) => (
        <ThreadPrimitive.Suggestion
          key={s}
          prompt={s}
          method="replace"
          autoSend
          className="glass-inset rounded-control px-3 py-2 text-left text-xs leading-snug text-ink-soft transition hover:border-rust/40 hover:text-ink"
        >
          {s}
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
}

export function Thread({ suggestions }: { suggestions: string[] }) {
  const isEmpty = useAuiState((s) => s.thread.messages.length === 0);

  return (
    <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col">
      <ThreadPrimitive.Viewport className="rail-scroll flex-1 overflow-y-auto px-4 py-4">
        {isEmpty ? (
          <div className="animate-fade-in">
            <p className="font-display text-base font-semibold text-ink">
              Ask about what you&apos;re looking at.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              I can read this tab, draft copy, run the autopilots, and approve or send drafts for
              you.
            </p>
            <div className="mt-3.5">
              <Suggestions suggestions={suggestions} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <ThreadPrimitive.Messages
              components={{ UserMessage, AssistantMessage }}
            />
          </div>
        )}
      </ThreadPrimitive.Viewport>

      <div className="shrink-0 border-t border-white/10 p-3">
        <ComposerPrimitive.Root className="glass-inset flex items-end gap-2 rounded-tile p-2">
          <ComposerPrimitive.Input
            rows={1}
            autoFocus={false}
            placeholder="Ask, or tell me to run something"
            className="max-h-32 flex-1 resize-none bg-transparent px-1 py-1 text-sm text-ink outline-none placeholder:text-ink-soft/60"
          />
          <AuiIf condition={(s) => !s.thread.isRunning}>
            <ComposerPrimitive.Send className="shrink-0 rounded-control bg-sunset px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-sunset-strong disabled:opacity-40">
              Send
            </ComposerPrimitive.Send>
          </AuiIf>
          <AuiIf condition={(s) => s.thread.isRunning}>
            <ComposerPrimitive.Cancel className="shrink-0 rounded-control border border-white/12 px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-white/[0.06]">
              Stop
            </ComposerPrimitive.Cancel>
          </AuiIf>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}
