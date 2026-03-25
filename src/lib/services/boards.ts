import { db } from "@/lib/db";
import { boardColumns, tasks, projects } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

const DEFAULT_COLUMNS = [
  { title: "Backlog", position: 0, color: "#666" },
  { title: "To Do", position: 1, color: "#30BCED" },
  { title: "In Progress", position: 2, color: "#FFD60A" },
  { title: "Review", position: 3, color: "#9B5DE5" },
  { title: "Done", position: 4, color: "#2EC4B6" },
];

export async function getOrCreateBoard(projectId: string) {
  let columns = await db.query.boardColumns.findMany({
    where: eq(boardColumns.projectId, projectId),
    orderBy: [asc(boardColumns.position)],
    with: {
      tasks: {
        orderBy: [asc(tasks.position)],
      },
    },
  });

  // Auto-create default columns if none exist
  if (columns.length === 0) {
    await db.insert(boardColumns).values(
      DEFAULT_COLUMNS.map((col) => ({
        projectId,
        title: col.title,
        position: col.position,
        color: col.color,
      }))
    );

    columns = await db.query.boardColumns.findMany({
      where: eq(boardColumns.projectId, projectId),
      orderBy: [asc(boardColumns.position)],
      with: {
        tasks: {
          orderBy: [asc(tasks.position)],
        },
      },
    });
  }

  return columns;
}

export async function createTask(
  userId: string,
  projectId: string,
  columnId: string,
  data: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    labels?: string[];
  }
) {
  // Get next position
  const existingTasks = await db.query.tasks.findMany({
    where: eq(tasks.columnId, columnId),
  });

  const [task] = await db
    .insert(tasks)
    .values({
      userId,
      projectId,
      columnId,
      title: data.title,
      description: data.description,
      priority: data.priority || "medium",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      labels: data.labels || [],
      position: existingTasks.length,
    })
    .returning();

  return task;
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: string;
    dueDate?: string | null;
    labels?: string[];
    columnId?: string;
    position?: number;
  }
) {
  const updateData: any = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.labels !== undefined) updateData.labels = data.labels;
  if (data.columnId !== undefined) updateData.columnId = data.columnId;
  if (data.position !== undefined) updateData.position = data.position;

  const [task] = await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning();

  return task;
}

export async function deleteTask(userId: string, taskId: string) {
  await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}

export async function moveTask(
  userId: string,
  taskId: string,
  targetColumnId: string,
  targetPosition: number
) {
  await db
    .update(tasks)
    .set({ columnId: targetColumnId, position: targetPosition, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}
