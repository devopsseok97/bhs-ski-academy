import { prisma } from "@/lib/db";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "ClassStudent","CouponEvent","CalendarEvent","Notice","Class","Student","Teacher" CASCADE`
  );
}
