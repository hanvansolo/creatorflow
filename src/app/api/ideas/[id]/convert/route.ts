import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ideas, notes, scripts, projects } from "@/lib/db/schema";
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

  // Move any notes that were linked to this idea's old project (if any)
  // Also move notes that reference this idea in their content
  if (idea.projectId) {
    // Move notes from the old project
    await db
      .update(notes)
      .set({ projectId: project.id, updatedAt: new Date() })
      .where(and(eq(notes.projectId, idea.projectId), eq(notes.userId, userId)));

    // Move scripts from the old project
    await db
      .update(scripts)
      .set({ projectId: project.id, updatedAt: new Date() })
      .where(and(eq(scripts.projectId, idea.projectId), eq(scripts.userId, userId)));
  }

  // Move any scripts that are directly linked to this idea
  await db
    .update(scripts)
    .set({ projectId: project.id, updatedAt: new Date() })
    .where(and(eq(scripts.ideaId, id), eq(scripts.userId, userId)));

  // Find notes/scripts that contain links to this idea in their content
  // and assign them to the new project if they don't already belong to one
  const linkedNotes = await db.query.notes.findMany({
    where: and(eq(notes.userId, userId)),
  });

  for (const note of linkedNotes) {
    if (note.projectId) continue; // already belongs to a project
    const hasLink = note.content?.includes(`/ideas/${id}`) || false;
    if (hasLink) {
      await db
        .update(notes)
        .set({ projectId: project.id, updatedAt: new Date() })
        .where(eq(notes.id, note.id));
    }
  }

  const linkedScripts = await db.query.scripts.findMany({
    where: and(eq(scripts.userId, userId)),
  });

  for (const script of linkedScripts) {
    if (script.projectId) continue;
    const hasLink = script.content?.includes(`/ideas/${id}`) || false;
    if (hasLink) {
      await db
        .update(scripts)
        .set({ projectId: project.id, updatedAt: new Date() })
        .where(eq(scripts.id, script.id));
    }
  }

  return Response.json(project);
}
