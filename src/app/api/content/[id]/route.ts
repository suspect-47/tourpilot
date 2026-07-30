import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body as { action: string };

  const data: Record<string, string> = {};
  if (action === "approve") data.status = "approved";
  else if (action === "edit") data.caption = body.text;
  else return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const item = await prisma.contentItem.update({ where: { id: params.id }, data });
  return NextResponse.json(item);
}
