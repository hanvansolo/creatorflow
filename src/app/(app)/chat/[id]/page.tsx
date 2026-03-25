import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getChatSession } from "@/lib/services/chat";
import { ChatInterface } from "@/components/chat/chat-interface";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const session = await getChatSession(userId, id);
  if (!session) notFound();

  const initialMessages = session.messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    citations: m.citations as
      | { itemId: string; itemType: string; title: string; chunkText: string }[]
      | undefined,
  }));

  return <ChatInterface sessionId={id} initialMessages={initialMessages} />;
}
