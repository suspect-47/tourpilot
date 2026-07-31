import { NextResponse } from "next/server";
import { getSessionOrDemo as getSession } from "@/lib/demoSession";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";

// Handles the human-in-the-loop actions on a guest's timeline:
// approving/sending a review reply or re-engagement draft, or
// editing the drafted text before it goes out.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUserAndBusiness(session.user.sub, session.user.email, session.user.name);

  const body = await req.json();
  const { action } = body as { action: string };

  const data: Record<string, string> = {};
  if (action === "approve_review") data.reviewStatus = "approved";
  else if (action === "send_review") data.reviewStatus = "sent";
  else if (action === "edit_review") data.reviewReply = body.text;
  else if (action === "approve_reengagement") data.reengagementStatus = "approved";
  else if (action === "send_reengagement") data.reengagementStatus = "sent";
  else if (action === "edit_reengagement") data.reengagementDraft = body.text;
  else return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  // Scope the write to the caller's own business, so a guest id belonging
  // to another tenant can't be approved, edited, or sent.
  const result = await prisma.guest.updateMany({
    where: { id: params.id, businessId: user.businessId },
    data,
  });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const guest = await prisma.guest.findUnique({ where: { id: params.id } });
  return NextResponse.json(guest);
}
