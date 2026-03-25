import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { searchLinkableItems } from "@/lib/services/links";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json([], { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q") || "";
  const items = await searchLinkableItems(userId, query);
  return Response.json(items);
}
