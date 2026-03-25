"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { IdeaForm } from "@/components/ideas/idea-form";
import { createIdeaAction } from "../actions";

export default function NewIdeaPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="New Idea" description="Capture a new content idea" />
      <IdeaForm action={createIdeaAction} submitLabel="Save Idea" defaultProjectId={projectId} />
    </div>
  );
}
