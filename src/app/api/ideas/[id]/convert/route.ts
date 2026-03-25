import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ideas, notes, scripts, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateBoard, createTask } from "@/lib/services/boards";

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

  // AI: Auto-generate tasks from the idea
  try {
    if (process.env.OPENAI_API_KEY) {
      const { getOpenAI } = await import("@/lib/ai/provider");
      const openai = getOpenAI();

      const columns = await getOrCreateBoard(project.id);
      const backlogColumn = columns.find((c) => c.title === "Backlog") || columns[0];

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: 'You are a project manager. Suggest tasks to explore and validate this idea. These are suggestions for the backlog, not commitments. Return a JSON array: [{"title": "task title", "priority": "high|medium|low", "description": "brief context"}]. Include 5-8 tasks. Return ONLY the JSON array.',
          },
          {
            role: "user",
            content: `Idea: ${idea.title}\n${idea.body || ""}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const tasksJson = aiResponse.choices[0]?.message?.content || "[]";
      try {
        const generatedTasks = JSON.parse(tasksJson);
        if (Array.isArray(generatedTasks) && backlogColumn) {
          for (const t of generatedTasks) {
            await createTask(userId, project.id, backlogColumn.id, {
              title: t.title,
              priority: t.priority || "medium",
              description: t.description,
            });
          }
        }
      } catch {}
    }
  } catch {}

  return Response.json(project);
}
