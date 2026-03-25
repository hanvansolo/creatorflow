import { db } from "@/lib/db";
import { chatSessions, chatMessages } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getChatSessions(userId: string) {
  return db.query.chatSessions.findMany({
    where: eq(chatSessions.userId, userId),
    orderBy: [desc(chatSessions.updatedAt)],
  });
}

export async function getChatSession(userId: string, id: string) {
  return db.query.chatSessions.findFirst({
    where: and(eq(chatSessions.id, id), eq(chatSessions.userId, userId)),
    with: {
      messages: {
        orderBy: [chatMessages.createdAt],
      },
    },
  });
}

export async function createChatSession(userId: string, title?: string) {
  const [session] = await db
    .insert(chatSessions)
    .values({
      userId,
      title: title || "New Chat",
    })
    .returning();

  return session;
}

export async function addChatMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  citations?: unknown[]
) {
  const [message] = await db
    .insert(chatMessages)
    .values({
      sessionId,
      role,
      content,
      citations: citations || null,
    })
    .returning();

  // Update session timestamp
  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId));

  return message;
}

export async function updateSessionTitle(id: string, title: string) {
  await db
    .update(chatSessions)
    .set({ title, updatedAt: new Date() })
    .where(eq(chatSessions.id, id));
}
