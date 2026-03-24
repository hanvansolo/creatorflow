import { auth } from "@clerk/nextjs/server";
import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectCard } from "@/components/projects/project-card";
import { getProjects } from "@/lib/services/projects";

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const allProjects = await getProjects(userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Group your ideas, notes, scripts, and files together"
        actionLabel="New Project"
        actionHref="/projects/new"
      />

      {allProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Projects help you organize related ideas, notes, scripts, and files in one place."
          actionLabel="Create your first project"
          actionHref="/projects/new"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {allProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
