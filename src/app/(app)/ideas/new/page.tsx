import { PageHeader } from "@/components/shared/page-header";
import { IdeaForm } from "@/components/ideas/idea-form";
import { createIdeaAction } from "../actions";

export default function NewIdeaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Idea" description="Capture a new content idea" />
      <IdeaForm action={createIdeaAction} submitLabel="Save Idea" />
    </div>
  );
}
