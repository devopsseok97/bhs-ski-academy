import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const events = await prisma.calendarEvent.findMany({
    orderBy: { date: "asc" },
    select: { id: true, date: true, label: true, tone: true },
  });
  return NextResponse.json(events);
}
