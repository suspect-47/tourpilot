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
      <div className="text-sm text-ink-soft">
        <span className="font-mono text-xs uppercase tracking-wide">{label}</span>
        <p className="mt-1">Nothing drafted yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-ink-soft">{label}</span>
        <StatusBadge status={status} />
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
                onEdit(draft);
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
        <p className="mt-1 text-sm leading-snug text-ink">{text}</p>
      )}
      {!editing && status !== "sent" && (
        <div className="mt-2 flex flex-wrap gap-2">
          {status !== "approved" && (
            <button
              className="rounded-md border border-moss/40 px-2.5 py-1 text-xs font-medium text-moss hover:bg-moss/10"
              onClick={onApprove}
            >
              Approve
            </button>
          )}
          <button
            className="rounded-md bg-moss px-2.5 py-1 text-xs font-medium text-paper-raised hover:bg-moss/90"
            onClick={onSend}
          >
            Send now
          </button>
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

export function GuestTicketCard({ guest: initial }: { guest: Guest }) {
  const [guest, setGuest] = useState(initial);
  const bookingDate = new Date(guest.bookingDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const run = async (action: string, text?: string) => {
    const updated = await patchGuest(guest.id, action, text);
    setGuest((g) => ({ ...g, ...updated }));
  };

  return (
    <div className="ticket">
      <div className="ticket-perforation" />
      <div className="p-4 md:p-5">
        <p className="font-mono text-xs text-ink-soft">{guest.ticketNo}</p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-tight text-ink">{guest.name}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">{guest.tourType}</p>
        <p className="mt-2 font-mono text-xs text-ink-soft">Booked {bookingDate}</p>
        {guest.reviewText && (
          <p className="mt-3 border-l-2 border-ink/10 pl-2 text-xs italic leading-snug text-ink-soft">
            &ldquo;{guest.reviewText}&rdquo;
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4 border-t border-ink/10 p-4 md:border-l md:border-t-0 md:p-5">
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
