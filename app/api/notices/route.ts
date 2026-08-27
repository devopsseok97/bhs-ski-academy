import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const notices = await prisma.notice.findMany({
    where: { active: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: {
      id: true,
      title: true,
      body: true,
      pinned: true,
      createdAt: true,
    },
  });
  return NextResponse.json(notices);
}
