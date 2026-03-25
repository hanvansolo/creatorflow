import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ideas, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Get the idea
  const idea = await db.query.ideas.findFirst({
    where: and(eq(ideas.id, id), eq(ideas.userId, userId)),
  });

  if (!idea) return Response.json({ error: "Idea not found" }, { status: 404 });

  // Create a project from the idea
  const [project] = await db
    .insert(projects)
    .values({
      userId,
      title: idea.title,
      description: idea.body || undefined,
      status: "active",
    })
    .returning();

  // Link the idea to the project
  await db
    .update(ideas)
    .set({ projectId: project.id, status: "in_progress", updatedAt: new Date() })
    .where(eq(ideas.id, id));

  return Response.json(project);
}
