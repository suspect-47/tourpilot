import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  generateReviewReply,
  generateReengagementMessage,
  generateContentIdeas,
} from "@/lib/ai";

/**
 * The assistant's hands.
 *
 * Every tool is built as a closure over the business resolved from the
 * session, so the model never supplies a businessId and cannot reach
 * another tenant's rows. The autopilot tools intentionally re-implement
 * what the /api/autopilot routes do rather than calling them over HTTP:
 * the routes stay untouched, there is no cookie forwarding to get wrong,
 * and nothing that already works can break.
 */

const REENGAGE_AFTER_DAYS = 7;

type BusinessLike = {
  id: string;
  name: string;
  description: string;
  brandVoice: string;
  location: string;
  tourTypes: string;
};

export function buildAssistantTools(business: BusinessLike) {
  /** Accepts a guest id or a name fragment, so the model can act on
   *  "send Marcus his reply" without a round trip to look up the id. */
  async function resolveGuest(ref: string) {
    const byId = await prisma.guest.findFirst({
      where: { id: ref, businessId: business.id },
    });
    if (byId) return byId;
    return prisma.guest.findFirst({
      where: {
        businessId: business.id,
        name: { contains: ref, mode: "insensitive" },
      },
    });
  }

  return {
    listGuests: tool({
      description:
        "List guests on this business's timeline, optionally narrowed to a subset. Use this before acting on a specific guest.",
      inputSchema: z.object({
        filter: z
          .enum(["all", "flagged", "needs_reply", "awaiting_approval", "sent"])
          .describe(
            "flagged = negative review held for a human. needs_reply = has a review with nothing drafted. awaiting_approval = a draft is waiting on the owner."
          ),
      }),
      execute: async ({ filter }) => {
        const guests = await prisma.guest.findMany({
          where: { businessId: business.id },
          orderBy: { bookingDate: "desc" },
        });
        const matches = guests.filter((g) => {
          if (filter === "flagged") return g.reviewStatus === "flagged";
          if (filter === "needs_reply") return !!g.reviewText && g.reviewStatus === "none";
          if (filter === "awaiting_approval")
            return g.reviewStatus === "drafted" || g.reengagementStatus === "drafted";
          if (filter === "sent")
            return g.reviewStatus === "sent" || g.reengagementStatus === "sent";
          return true;
        });
        return {
          count: matches.length,
          guests: matches.map((g) => ({
            id: g.id,
            ticketNo: g.ticketNo,
            name: g.name,
            tourType: g.tourType,
            bookingDate: g.bookingDate.toISOString().slice(0, 10),
            reviewSentiment: g.reviewSentiment,
            reviewStatus: g.reviewStatus,
            reengagementStatus: g.reengagementStatus,
            reviewText: g.reviewText,
          })),
        };
      },
    }),

    explainFlag: tool({
      description:
        "Explain why a specific guest's review was flagged and held back from auto-reply. Returns the guest's own words and the drafted reply.",
      inputSchema: z.object({
        guest: z.string().describe("Guest id, or part of the guest's name."),
      }),
      execute: async ({ guest }) => {
        const g = await resolveGuest(guest);
        if (!g) return { error: `No guest matching "${guest}".` };
        if (g.reviewStatus !== "flagged") {
          return {
            flagged: false,
            name: g.name,
            reviewStatus: g.reviewStatus,
            note: "This guest is not flagged.",
          };
        }
        return {
          flagged: true,
          name: g.name,
          tourType: g.tourType,
          sentiment: g.reviewSentiment,
          reviewText: g.reviewText,
          draftedReply: g.reviewReply,
          reason:
            "The review autopilot classified this review as negative. Negative reviews are never auto-approved: a reply is drafted, then held for a human to read and send.",
        };
      },
    }),

    weekSummary: tool({
      description:
        "Summarize the current state of the whole account: guests, reviews, follow-ups, and queued content.",
      inputSchema: z.object({}),
      execute: async () => {
        const [guests, content] = await Promise.all([
          prisma.guest.findMany({ where: { businessId: business.id } }),
          prisma.contentItem.findMany({ where: { businessId: business.id } }),
        ]);
        return {
          guests: guests.length,
          reviewsWithNoDraft: guests.filter((g) => g.reviewText && g.reviewStatus === "none")
            .length,
          flagged: guests.filter((g) => g.reviewStatus === "flagged").length,
          repliesAwaitingApproval: guests.filter((g) => g.reviewStatus === "drafted").length,
          followUpsAwaitingApproval: guests.filter((g) => g.reengagementStatus === "drafted")
            .length,
          sent: guests.filter((g) => g.reviewStatus === "sent" || g.reengagementStatus === "sent")
            .length,
          contentQueued: content.length,
          contentAwaitingApproval: content.filter((c) => c.status === "drafted").length,
        };
      },
    }),

    runReviewAutopilot: tool({
      description:
        "Draft an AI reply for every review that does not have one yet. Positive reviews come back as drafts ready to send; negative reviews are flagged for a human instead.",
      inputSchema: z.object({}),
      execute: async () => {
        const guests = await prisma.guest.findMany({
          where: { businessId: business.id, reviewText: { not: null }, reviewStatus: "none" },
        });
        let drafted = 0;
        let flagged = 0;
        for (const guest of guests) {
          const sentiment = (guest.reviewSentiment ?? "neutral") as
            | "positive"
            | "negative"
            | "neutral";
          const reply = await generateReviewReply(
            business,
            guest.name,
            guest.reviewText!,
            sentiment
          );
          const status = sentiment === "negative" ? "flagged" : "drafted";
          await prisma.guest.update({
            where: { id: guest.id },
            data: { reviewReply: reply, reviewStatus: status },
          });
          if (status === "flagged") flagged++;
          else drafted++;
        }
        return {
          processed: guests.length,
          drafted,
          flagged,
          note:
            flagged > 0
              ? `${flagged} negative review(s) were held for the owner to read rather than auto-approved.`
              : undefined,
        };
      },
    }),

    runReengagementAutopilot: tool({
      description:
        "Draft a follow-up message for every past guest whose booking is at least a week old and who has not been followed up with yet.",
      inputSchema: z.object({}),
      execute: async () => {
        const cutoff = new Date(Date.now() - REENGAGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
        const guests = await prisma.guest.findMany({
          where: {
            businessId: business.id,
            bookingDate: { lte: cutoff },
            reengagementStatus: "not_due",
          },
        });
        for (const guest of guests) {
          const draft = await generateReengagementMessage(business, guest.name, guest.tourType);
          await prisma.guest.update({
            where: { id: guest.id },
            data: { reengagementDraft: draft, reengagementStatus: "drafted" },
          });
        }
        return { drafted: guests.length };
      },
    }),

    generateContentBatch: tool({
      description:
        "Generate a fresh batch of social post captions from the business profile and recent positive guest reviews, and queue them on the content calendar.",
      inputSchema: z.object({}),
      execute: async () => {
        const testimonials = await prisma.guest.findMany({
          where: { businessId: business.id, reviewSentiment: "positive" },
          select: { reviewText: true },
          take: 3,
        });
        const month = new Date().toLocaleString("default", { month: "long" });
        const captions = await generateContentIdeas(
          business,
          `${month}, peak season`,
          testimonials.map((t) => t.reviewText!).filter(Boolean)
        );
        const created = await prisma.$transaction(
          captions.map((caption, i) =>
            prisma.contentItem.create({
              data: {
                businessId: business.id,
                caption,
                theme: i === 0 ? "seasonal" : "testimonial",
                scheduledFor: new Date(Date.now() + (i + 1) * 2 * 24 * 60 * 60 * 1000),
              },
            })
          )
        );
        return { created: created.length, captions };
      },
    }),

    approveDraft: tool({
      description:
        "Mark a guest's drafted review reply or follow-up message as approved. Approving does not send it.",
      inputSchema: z.object({
        guest: z.string().describe("Guest id, or part of the guest's name."),
        kind: z.enum(["review", "reengagement"]),
      }),
      execute: async ({ guest, kind }) => {
        const g = await resolveGuest(guest);
        if (!g) return { error: `No guest matching "${guest}".` };
        const updated = await prisma.guest.update({
          where: { id: g.id },
          data:
            kind === "review" ? { reviewStatus: "approved" } : { reengagementStatus: "approved" },
        });
        return {
          ok: true,
          name: updated.name,
          kind,
          status: kind === "review" ? updated.reviewStatus : updated.reengagementStatus,
        };
      },
    }),

    sendDraft: tool({
      description:
        "Send a guest's drafted review reply or follow-up message. Refuses on flagged reviews, which a human must read first.",
      inputSchema: z.object({
        guest: z.string().describe("Guest id, or part of the guest's name."),
        kind: z.enum(["review", "reengagement"]),
      }),
      execute: async ({ guest, kind }) => {
        const g = await resolveGuest(guest);
        if (!g) return { error: `No guest matching "${guest}".` };

        // The one hard stop in the product. A flagged review is a negative
        // one the autopilot held back on purpose; the assistant does not get
        // to undo that decision on the owner's behalf.
        if (kind === "review" && g.reviewStatus === "flagged") {
          return {
            refused: true,
            name: g.name,
            reason:
              "This review is flagged. It is a negative review the autopilot deliberately held for a human. Read the draft and send it yourself from the guest's card.",
          };
        }
        if (kind === "review" && !g.reviewReply) {
          return { error: `No reply drafted for ${g.name} yet. Run the review autopilot first.` };
        }
        if (kind === "reengagement" && !g.reengagementDraft) {
          return {
            error: `No follow-up drafted for ${g.name} yet. Run the re-engagement autopilot first.`,
          };
        }

        const updated = await prisma.guest.update({
          where: { id: g.id },
          data: kind === "review" ? { reviewStatus: "sent" } : { reengagementStatus: "sent" },
        });
        return {
          ok: true,
          name: updated.name,
          kind,
          sentText: kind === "review" ? updated.reviewReply : updated.reengagementDraft,
        };
      },
    }),

    approveContent: tool({
      description: "Approve a queued social post on the content calendar.",
      inputSchema: z.object({
        contentId: z.string().describe("Content item id from the content queue."),
      }),
      execute: async ({ contentId }) => {
        const item = await prisma.contentItem.findFirst({
          where: { id: contentId, businessId: business.id },
        });
        if (!item) return { error: `No content item ${contentId}.` };
        const updated = await prisma.contentItem.update({
          where: { id: item.id },
          data: { status: "approved" },
        });
        return { ok: true, status: updated.status, caption: updated.caption };
      },
    }),
  };
}
