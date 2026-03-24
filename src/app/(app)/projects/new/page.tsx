import { PageHeader } from "@/components/shared/page-header";
import { ProjectForm } from "@/components/projects/project-form";
import { createProjectAction } from "../actions";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Project"
        description="Create a project to group related content"
      />
      <ProjectForm action={createProjectAction} submitLabel="Create Project" />
    </div>
  );
}
