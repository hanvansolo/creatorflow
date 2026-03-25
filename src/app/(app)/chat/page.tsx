import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getChatSessions } from "@/lib/services/chat";
import { formatDistanceToNow } from "@/lib/utils";
import { newChatAction } from "./actions";

export default async function ChatPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const sessions = await getChatSessions(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="AI Chat"
          description="Ask questions about your content"
        />
        <form action={newChatAction}>
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </form>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Start a conversation"
          description="Ask AI anything about your ideas, notes, scripts, and uploaded documents. Answers are grounded in your content."
        />
      ) : (
        <div className="grid gap-2 max-w-2xl">
          {sessions.map((session) => (
            <Link key={session.id} href={`/chat/${session.id}`}>
              <Card className="cursor-pointer transition-colors hover:bg-accent">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      {session.title || "New Chat"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(session.updatedAt)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
