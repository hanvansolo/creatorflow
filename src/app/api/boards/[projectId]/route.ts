import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getOrCreateBoard } from "@/lib/services/boards";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json([], { status: 401 });

  const { projectId } = await params;
  const columns = await getOrCreateBoard(projectId);
  return Response.json(columns);
}
