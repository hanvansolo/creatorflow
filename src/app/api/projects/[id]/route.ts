import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getProjectById } from "@/lib/services/projects";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json(null, { status: 401 });

  const { id } = await params;
  const project = await getProjectById(userId, id);
  if (!project) return Response.json(null, { status: 404 });

  return Response.json(project);
}
