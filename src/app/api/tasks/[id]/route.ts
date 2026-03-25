import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { updateTask, deleteTask } from "@/lib/services/boards";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();
  const task = await updateTask(userId, id, data);
  return Response.json(task);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteTask(userId, id);
  return Response.json({ ok: true });
}
