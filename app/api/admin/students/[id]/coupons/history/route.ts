import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guard";
import { couponHistory, StudentNotFoundError } from "@/lib/coupons";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  try {
    const history = await couponHistory(id);
    return NextResponse.json(history);
  } catch (error) {
    if (error instanceof StudentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
