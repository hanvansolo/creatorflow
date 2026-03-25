import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canvases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json(null, { status: 401 });

  const { projectId } = await params;

  let canvas = await db.query.canvases.findFirst({
    where: and(eq(canvases.projectId, projectId), eq(canvases.userId, userId)),
  });

  // Auto-create canvas if it doesn't exist
  if (!canvas) {
    const [created] = await db
      .insert(canvases)
      .values({ projectId, userId, nodes: [], edges: [] })
      .returning();
    canvas = created;
  }

  return Response.json(canvas);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json(null, { status: 401 });

  const { projectId } = await params;
  const { nodes, edges } = await req.json();

  const [canvas] = await db
    .update(canvases)
    .set({ nodes, edges, updatedAt: new Date() })
    .where(and(eq(canvases.projectId, projectId), eq(canvases.userId, userId)))
    .returning();

  if (!canvas) {
    const [created] = await db
      .insert(canvases)
      .values({ projectId, userId, nodes, edges })
      .returning();
    return Response.json(created);
  }

  return Response.json(canvas);
}
