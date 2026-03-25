import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getOpenAI } from "@/lib/ai/provider";
import { checkAndIncrementUsage } from "@/lib/services/usage";
import { createNote } from "@/lib/services/notes";
import { getOrCreateBoard, createTask } from "@/lib/services/boards";
import { db } from "@/lib/db";
import { canvases } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "AI not configured" }, { status: 500 });
  }

  const usage = await checkAndIncrementUsage(userId);
  if (!usage.allowed) {
    return Response.json({ error: `AI limit reached (${usage.used}/${usage.limit})` }, { status: 429 });
  }

  const { topic, projectId } = await req.json();
  if (!topic || !projectId) {
    return Response.json({ error: "Missing topic or projectId" }, { status: 400 });
  }

  const openai = getOpenAI();

  // Step 1: Deep research
  const researchResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a research analyst. Do thorough research on the given topic. Provide:

## Key Findings
- 3-5 major insights with context

## Market Landscape
- Current state, major players, trends

## Opportunities
- 2-3 specific opportunities to act on

## Risks & Challenges
- Potential pitfalls to watch for

## Recommended Next Steps
- 3-5 concrete actions to take

Be specific, data-informed, and actionable. Format in markdown.`,
      },
      { role: "user", content: topic },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const researchText = researchResponse.choices[0]?.message?.content || "";

  // Step 2: Save as note
  const note = await createNote(userId, {
    title: `Research: ${topic.slice(0, 80)}`,
    content: researchText,
    contentPlain: researchText,
    projectId,
  });

  // Step 3: Generate tasks from the research
  const tasksResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: 'Based on this research, suggest 3-6 actionable tasks. Return a JSON array: [{"title": "task", "priority": "high|medium|low", "description": "why"}]. Return ONLY the JSON array.',
      },
      { role: "user", content: researchText },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  let generatedTasks: any[] = [];
  try {
    const tasksJson = tasksResponse.choices[0]?.message?.content || "[]";
    generatedTasks = JSON.parse(tasksJson);
  } catch {}

  // Add tasks to backlog
  if (Array.isArray(generatedTasks) && generatedTasks.length > 0) {
    const columns = await getOrCreateBoard(projectId);
    const backlog = columns.find((c) => c.title === "Backlog") || columns[0];
    if (backlog) {
      for (const t of generatedTasks) {
        await createTask(userId, projectId, backlog.id, {
          title: t.title,
          priority: t.priority || "medium",
          description: t.description,
        });
      }
    }
  }

  // Step 4: Add to canvas
  try {
    let canvas = await db.query.canvases.findFirst({
      where: and(eq(canvases.projectId, projectId), eq(canvases.userId, userId)),
    });

    const newNode = {
      id: `research-${Date.now()}`,
      type: "note",
      position: {
        x: 100 + Math.random() * 300,
        y: 100 + Math.random() * 200,
      },
      data: {
        contentId: note.id,
        title: `Research: ${topic.slice(0, 40)}`,
        description: researchText.slice(0, 150) + "...",
      },
    };

    if (canvas) {
      const existingNodes = (canvas.nodes as any[]) || [];
      await db
        .update(canvases)
        .set({
          nodes: [...existingNodes, newNode],
          updatedAt: new Date(),
        })
        .where(eq(canvases.id, canvas.id));
    } else {
      await db.insert(canvases).values({
        projectId,
        userId,
        nodes: [newNode],
        edges: [],
      });
    }
  } catch {}

  return Response.json({
    note,
    tasksCreated: generatedTasks.length,
    research: researchText,
  });
}
