"use client";

import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function IdeasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideas"
        description="Capture and organize your content ideas"
        actionLabel="New Idea"
        actionHref="/ideas/new"
      />
      <EmptyState
        icon={Lightbulb}
        title="No ideas yet"
        description="Start capturing your content ideas. They can grow into notes, scripts, and full projects."
        actionLabel="Capture your first idea"
        actionHref="/ideas/new"
      />
    </div>
  );
}
