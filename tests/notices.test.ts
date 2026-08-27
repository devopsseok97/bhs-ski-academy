import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/notices/route";
import { prisma } from "@/lib/db";
import { resetDb } from "./helpers/db";

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe("public notices", () => {
  it("shows at most three active notices with pinned notices first", async () => {
    await prisma.notice.createMany({
      data: [
        { title: "old", body: "old", createdAt: new Date("2026-08-20T00:00:00Z") },
        { title: "new", body: "new", createdAt: new Date("2026-08-23T00:00:00Z") },
        { title: "middle", body: "middle", createdAt: new Date("2026-08-22T00:00:00Z") },
        {
          title: "important",
          body: "important",
          pinned: true,
          createdAt: new Date("2026-08-21T00:00:00Z"),
        },
        {
          title: "hidden",
          body: "hidden",
          active: false,
          pinned: true,
          createdAt: new Date("2026-08-24T00:00:00Z"),
        },
      ],
    });

    const response = await GET();
    const notices = (await response.json()) as Array<{ title: string }>;

    expect(notices.map((notice) => notice.title)).toEqual(["important", "new", "middle"]);
  });
});
