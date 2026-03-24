"use client";

import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Chat"
        description="Ask questions about your content and get AI-powered answers"
      />
      <EmptyState
        icon={MessageSquare}
        title="Start a conversation"
        description="Ask AI anything about your ideas, notes, scripts, and uploaded documents. Answers are grounded in your content."
      />
    </div>
  );
}
