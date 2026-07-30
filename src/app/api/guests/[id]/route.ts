import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/prisma";

// Handles the human-in-the-loop actions on a guest's timeline:
// approving/sending a review reply or re-engagement draft, or
// editing the drafted text before it goes out.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const guest = await prisma.guest.update({ where: { id: params.id }, data });
  return NextResponse.json(guest);
}
