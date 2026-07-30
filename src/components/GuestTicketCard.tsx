"use client";

import { useState } from "react";
import { StatusBadge } from "./StatusBadge";

type Guest = {
  id: string;
  ticketNo: string;
  name: string;
  email: string;
  tourType: string;
  bookingDate: string;
  reviewText: string | null;
  reviewSentiment: string | null;
  reviewReply: string | null;
  reviewStatus: string;
  reengagementDraft: string | null;
  reengagementStatus: string;
};

async function patchGuest(id: string, action: string, text?: string) {
  const res = await fetch(`/api/guests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, text }),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

function DraftBlock({
  label,
  text,
  status,
  onApprove,
  onSend,
  onEdit,
}: {
  label: string;
  text: string | null;
  status: string;
  onApprove: () => void;
  onSend: () => void;
  onEdit: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text ?? "");

  if (!text) {
    return (
      <div className="rounded-tile border border-dashed border-white/10 p-3 text-sm text-ink-soft">
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        <p className="mt-1 text-ink-soft/70">Nothing drafted yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-inset rounded-tile p-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
        <StatusBadge status={status} />
      </div>
      {editing ? (
        <div className="mt-2.5">
          <textarea
            className="w-full rounded-control border border-white/12 bg-black/25 p-2.5 text-sm text-ink outline-none focus:border-rust/50"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button
              className="rounded-control bg-sunset px-2.5 py-1 text-xs font-semibold text-paper transition hover:bg-sunset-strong"
              onClick={() => {
                onEdit(draft);
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
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{text}</p>
      )}
      {!editing && status !== "sent" && (
        <div className="mt-3 flex flex-wrap gap-2">
          {status !== "approved" && (
            <button
              className="rounded-control border border-moss/40 bg-moss/10 px-2.5 py-1 text-xs font-medium text-moss transition hover:bg-moss/20"
              onClick={onApprove}
            >
              Approve
            </button>
          )}
          <button
            className="rounded-control bg-moss px-2.5 py-1 text-xs font-semibold text-paper transition hover:bg-moss/85"
            onClick={onSend}
          >
            Send now
          </button>
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

export function GuestTicketCard({ guest: initial }: { guest: Guest }) {
  const [guest, setGuest] = useState(initial);
  const bookingDate = new Date(guest.bookingDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // A flagged review is one the autopilot deliberately held back for a
  // human. It gets the loudest surface in the product.
  const flagged = guest.reviewStatus === "flagged";

  const run = async (action: string, text?: string) => {
    const updated = await patchGuest(guest.id, action, text);
    setGuest((g) => ({ ...g, ...updated }));
  };

  return (
    <div className={`ticket glass-lift ${flagged ? "ticket--flagged" : ""}`}>
      <div className="ticket-perforation" />
      <div className="p-5">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold tracking-wide text-ink-soft">{guest.ticketNo}</p>
          {flagged && (
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-brick">
              Held for you
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-tight text-ink">
          {guest.name}
        </h3>
        <p className="mt-0.5 text-sm text-ink-soft">{guest.tourType}</p>
        <p className="mt-2 text-xs font-semibold tracking-wide text-ink-soft/80">Booked {bookingDate}</p>
        {guest.reviewText && (
          <p
            className={`mt-3 border-l-2 pl-2.5 text-xs italic leading-relaxed text-ink-soft ${
              flagged ? "border-brick/60" : "border-white/15"
            }`}
          >
            &ldquo;{guest.reviewText}&rdquo;
          </p>
        )}
      </div>
      {/* No md:border-l here: the perforation is the divider on wide layouts,
          and drawing both put two parallel lines a few pixels apart. */}
      <div className="flex flex-col gap-3 border-t border-white/10 p-5 md:border-t-0">
        <DraftBlock
          label="Review reply"
          text={guest.reviewReply}
          status={guest.reviewStatus}
          onApprove={() => run("approve_review")}
          onSend={() => run("send_review")}
          onEdit={(text) => run("edit_review", text)}
        />
        <DraftBlock
          label="Re-engagement message"
          text={guest.reengagementDraft}
          status={guest.reengagementStatus}
          onApprove={() => run("approve_reengagement")}
          onSend={() => run("send_reengagement")}
          onEdit={(text) => run("edit_reengagement", text)}
        />
      </div>
    </div>
  );
}
