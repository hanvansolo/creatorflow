"use client";

import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Group your ideas, notes, scripts, and files together"
        actionLabel="New Project"
        actionHref="/projects/new"
      />
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Projects help you organize related ideas, notes, scripts, and files in one place."
        actionLabel="Create your first project"
        actionHref="/projects/new"
      />
    </div>
  );
}
