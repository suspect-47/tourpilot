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
    <div className="rounded-xl border border-ink/10 bg-paper-raised p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {item.theme} · {date}
        </span>
        <StatusBadge status={item.status} />
      </div>
      {editing ? (
        <div className="mt-2">
          <textarea
            className="w-full rounded-md border border-ink/15 bg-paper p-2 text-sm text-ink"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="mt-1.5 flex gap-2">
            <button
              className="rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-paper-raised"
              onClick={() => {
                patch("edit", draft);
                setEditing(false);
              }}
            >
              Save
            </button>
            <button
              className="rounded-md border border-ink/20 px-2.5 py-1 text-xs font-medium text-ink-soft"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm leading-snug text-ink">{item.caption}</p>
      )}
      {!editing && (
        <div className="mt-3 flex gap-2">
          {item.status !== "approved" && (
            <button
              className="rounded-md border border-moss/40 px-2.5 py-1 text-xs font-medium text-moss hover:bg-moss/10"
              onClick={() => patch("approve")}
            >
              Approve
            </button>
          )}
          <button
            className="rounded-md border border-ink/15 px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-ink/5"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
