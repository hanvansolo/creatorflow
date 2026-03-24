import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Lightbulb, StickyNote, FileText, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProjectForm } from "@/components/projects/project-form";
import { getProjectById } from "@/lib/services/projects";
import { updateProjectAction, deleteProjectAction } from "../actions";
import { formatDistanceToNow } from "@/lib/utils";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";

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
          <h1 className="text-2xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="mt-1 text-muted-foreground">{project.description}</p>
          )}
        </div>
        <DeleteProjectButton id={id} />
      </div>

      {/* Linked content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ideas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4" />
              Ideas ({project.ideas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.ideas.length === 0 ? (
              <p className="text-xs text-muted-foreground">No ideas linked</p>
            ) : (
              project.ideas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/ideas/${idea.id}`}
                  className="block rounded-md border p-2 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{idea.title}</span>
                  <div className="mt-1">
                    <StatusBadge status={idea.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <StickyNote className="h-4 w-4" />
              Notes ({project.notes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.notes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No notes linked</p>
            ) : (
              project.notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block rounded-md border p-2 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{note.title}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistanceToNow(note.updatedAt)}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Scripts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Scripts ({project.scripts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.scripts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No scripts linked</p>
            ) : (
              project.scripts.map((script) => (
                <Link
                  key={script.id}
                  href={`/scripts/${script.id}`}
                  className="block rounded-md border p-2 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{script.title}</span>
                  <div className="mt-1">
                    <StatusBadge status={script.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit form */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Edit Project</h2>
        <ProjectForm
          project={project}
          action={updateAction}
          submitLabel="Update Project"
        />
      </div>
    </div>
  );
}
