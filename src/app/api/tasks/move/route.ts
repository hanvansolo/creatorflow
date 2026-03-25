import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { moveTask } from "@/lib/services/boards";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId, targetColumnId, targetPosition } = await req.json();
  if (!taskId || !targetColumnId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  await moveTask(userId, taskId, targetColumnId, targetPosition || 0);
  return Response.json({ ok: true });
}
