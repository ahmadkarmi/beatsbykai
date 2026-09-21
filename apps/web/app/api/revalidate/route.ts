import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { safeEqual } from "@/lib/safe-equal";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  const expected = process.env.REVALIDATE_SECRET;

  if (!expected || typeof secret !== "string" || !(await safeEqual(secret, expected))) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  revalidatePath("/");
  revalidatePath("/songs/[slug]", "page");

  return NextResponse.json({ revalidated: true });
}
