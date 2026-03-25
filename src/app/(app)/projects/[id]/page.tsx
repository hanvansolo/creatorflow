import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Lightbulb, StickyNote, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProjectForm } from "@/components/projects/project-form";
import { getProjectById } from "@/lib/services/projects";
import { updateProjectAction, deleteProjectAction } from "../actions";
import { formatDistanceToNow } from "@/lib/utils";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { buttonVariants } from "@/components/ui/button";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const project = await getProjectById(userId, id);
  if (!project) notFound();

  const updateAction = updateProjectAction.bind(null, id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.title}</h1>
          {project.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <DeleteProjectButton id={id} />
      </div>

      {/* Linked content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Ideas */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4 text-[#FFD60A]" />
                Ideas ({project.ideas.length})
              </CardTitle>
              <Link
                href={`/ideas/new?projectId=${id}`}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Add idea"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {project.ideas.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">No ideas yet</p>
                <Link
                  href={`/ideas/new?projectId=${id}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  <Plus className="mr-1.5 h-3 w-3" />
                  Add Idea
                </Link>
              </div>
            ) : (
              project.ideas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/ideas/${idea.id}`}
                  className="flex items-center justify-between rounded-md border border-border/50 p-2.5 text-sm transition-all hover:bg-accent hover:shadow-sm"
                >
                  <span className="font-medium text-[13px]">{idea.title}</span>
                  <StatusBadge status={idea.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <StickyNote className="h-4 w-4 text-[#30BCED]" />
                Notes ({project.notes.length})
              </CardTitle>
              <Link
                href={`/notes/new?projectId=${id}`}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Add note"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {project.notes.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">No notes yet</p>
                <Link
                  href={`/notes/new?projectId=${id}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  <Plus className="mr-1.5 h-3 w-3" />
                  Add Note
                </Link>
              </div>
            ) : (
              project.notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="flex items-center justify-between rounded-md border border-border/50 p-2.5 text-sm transition-all hover:bg-accent hover:shadow-sm"
                >
                  <span className="font-medium text-[13px]">{note.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(note.updatedAt)}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Scripts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-[#2EC4B6]" />
                Scripts ({project.scripts.length})
              </CardTitle>
              <Link
                href={`/scripts/new?projectId=${id}`}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Add script"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {project.scripts.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">No scripts yet</p>
                <Link
                  href={`/scripts/new?projectId=${id}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  <Plus className="mr-1.5 h-3 w-3" />
                  Add Script
                </Link>
              </div>
            ) : (
              project.scripts.map((script) => (
                <Link
                  key={script.id}
                  href={`/scripts/${script.id}`}
                  className="flex items-center justify-between rounded-md border border-border/50 p-2.5 text-sm transition-all hover:bg-accent hover:shadow-sm"
                >
                  <span className="font-medium text-[13px]">{script.title}</span>
                  <StatusBadge status={script.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit form */}
      <div>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Edit Project</h2>
        <ProjectForm
          project={project}
          action={updateAction}
          submitLabel="Update Project"
        />
      </div>
    </div>
  );
}
