import { NextResponse } from "next/server";
import { getSessionOrDemo as getSession } from "@/lib/demoSession";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getOrCreateUserAndBusiness(session.user.sub, session.user.email, session.user.name);

  const body = await req.json();
  const { action } = body as { action: string };

  const data: Record<string, string> = {};
  if (action === "approve") data.status = "approved";
  else if (action === "edit") data.caption = body.text;
  else return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  // Scope the write to the caller's own business, so a content id belonging
  // to another tenant can't be approved or rewritten.
  const result = await prisma.contentItem.updateMany({
    where: { id: params.id, businessId: user.businessId },
    data,
  });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const item = await prisma.contentItem.findUnique({ where: { id: params.id } });
  return NextResponse.json(item);
}
