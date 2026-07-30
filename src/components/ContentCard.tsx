"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PostArt } from "./PostArt";
import { captionQuality } from "@/lib/insights";

type ContentItem = {
  id: string;
  caption: string;
  theme: string;
  status: string;
  scheduledFor: string;
};

type BrandProfile = { name: string; location: string; tourTypes: string };

export function ContentCard({
  item: initial,
  business,
}: {
  item: ContentItem;
  business: BrandProfile;
}) {
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

  const date = new Date(item.scheduledFor).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Recomputed from the live caption, so editing a post updates its own audit
  // immediately rather than showing a stale verdict from the server render.
  const quality = captionQuality(item.caption, business);
  const clean = quality.passed === quality.total;

  return (
    <article className="glass-card glass-lift flex flex-col overflow-hidden rounded-panel">
      <div className="relative">
        <PostArt id={item.id} theme={item.theme} className="h-32" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="rounded-full border border-white/20 bg-black/35 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-glass-sm">
            {item.theme}
          </span>
          <StatusBadge status={item.status} />
        </div>
        <p className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-white/90">
          {date}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {editing ? (
          <div>
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
                onClick={() => {
                  setDraft(item.caption);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-ink">{item.caption}</p>
        )}

        {/* The audit. These are the rules the generator was given, checked
            against what it actually produced, so a weak caption is visible
            before it goes out rather than after. */}
        <div className="mt-3.5 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              On brief
            </span>
            <span
              className={`text-[11px] font-bold ${clean ? "text-moss" : "text-ochre"}`}
            >
              {quality.passed}/{quality.total}
            </span>
          </div>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {quality.checks.map((c) => (
              <li
                key={c.label}
                title={`${c.label}: ${c.detail}`}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  c.pass
                    ? "border-moss/25 bg-moss/10 text-moss"
                    : "border-ochre/35 bg-ochre/10 text-ochre"
                }`}
              >
                {c.pass ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                ) : (
                  <X className="h-2.5 w-2.5" strokeWidth={3} />
                )}
                {c.label}
              </li>
            ))}
          </ul>
        </div>

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
    </article>
  );
}
