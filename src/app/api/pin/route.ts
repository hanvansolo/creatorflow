import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ideas, notes, scripts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, itemType, pinned } = await req.json();

  if (!itemId || !itemType) {
    return Response.json({ error: "Missing itemId or itemType" }, { status: 400 });
  }

  const newPinned = !pinned;

  try {
    if (itemType === "idea") {
      await db.update(ideas).set({ pinned: newPinned, updatedAt: new Date() })
        .where(and(eq(ideas.id, itemId), eq(ideas.userId, userId)));
    } else if (itemType === "note") {
      await db.update(notes).set({ pinned: newPinned, updatedAt: new Date() })
        .where(and(eq(notes.id, itemId), eq(notes.userId, userId)));
    } else if (itemType === "script") {
      await db.update(scripts).set({ pinned: newPinned, updatedAt: new Date() })
        .where(and(eq(scripts.id, itemId), eq(scripts.userId, userId)));
    }

    return Response.json({ pinned: newPinned });
  } catch {
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }
}
