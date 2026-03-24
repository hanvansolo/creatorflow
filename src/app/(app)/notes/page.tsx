"use client";

import { StickyNote } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Write and organize your research and thoughts"
        actionLabel="New Note"
        actionHref="/notes/new"
      />
      <EmptyState
        icon={StickyNote}
        title="No notes yet"
        description="Create notes to capture research, thoughts, and reference material for your content."
        actionLabel="Write your first note"
        actionHref="/notes/new"
      />
    </div>
  );
}
