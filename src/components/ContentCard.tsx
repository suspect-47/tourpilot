"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

type ContentItem = {
  id: string;
  caption: string;
  theme: string;
  status: string;
  scheduledFor: string;
};

export function ContentCard({ item: initial }: { item: ContentItem }) {
  const [item, setItem] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.caption);

  const patch = async (action: string, text?: string) => {
    const res = await fetch(`/api/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, text }),
    });
    const updated = await res.json();
    setItem((i) => ({ ...i, ...updated }));
  };

  const date = new Date(item.scheduledFor).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="glass-card glass-lift rounded-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {item.theme} · {date}
        </span>
        <StatusBadge status={item.status} />
      </div>
      {editing ? (
        <div className="mt-3">
          <textarea
            className="glass-inset w-full rounded-control p-2.5 text-sm text-ink outline-none focus:border-rust/50"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button
              className="rounded-control bg-sunset px-2.5 py-1 text-xs font-semibold text-paper transition hover:bg-sunset-strong"
              onClick={() => {
                patch("edit", draft);
                setEditing(false);
              }}
            >
              Save
            </button>
            <button
              className="rounded-control border border-white/12 px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:bg-white/[0.06]"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-ink">{item.caption}</p>
      )}
      {!editing && (
        <div className="mt-4 flex gap-2">
          {item.status !== "approved" && (
            <button
              className="rounded-control border border-moss/40 bg-moss/10 px-2.5 py-1 text-xs font-medium text-moss transition hover:bg-moss/20"
              onClick={() => patch("approve")}
            >
              Approve
            </button>
          )}
          <button
            className="rounded-control border border-white/12 px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:bg-white/[0.06] hover:text-ink"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
