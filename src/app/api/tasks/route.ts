import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { createTask } from "@/lib/services/boards";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  if (!data.projectId || !data.columnId || !data.title) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const task = await createTask(userId, data.projectId, data.columnId, data);
  return Response.json(task);
}
