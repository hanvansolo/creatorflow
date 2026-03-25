import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { IdeaForm } from "@/components/ideas/idea-form";
import { DeleteIdeaButton } from "@/components/ideas/delete-idea-button";
import { BacklinksPanel } from "@/components/shared/backlinks-panel";
import { getIdeaById } from "@/lib/services/ideas";
import { getItemTags } from "@/lib/services/tags";
import { getBacklinks } from "@/lib/services/links";
import { updateIdeaAction } from "../actions";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const [idea, tags, backlinks] = await Promise.all([
    getIdeaById(userId, id),
    getItemTags(id, "idea"),
    getBacklinks(userId, id, "idea"),
  ]);

  if (!idea) notFound();

  const updateAction = updateIdeaAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Edit Idea" />
        <DeleteIdeaButton id={id} />
      </div>
      <IdeaForm
        idea={{ ...idea, tags: tags.map((t) => t.name) }}
        action={updateAction}
        submitLabel="Update Idea"
      />
      <BacklinksPanel backlinks={backlinks} />
    </div>
  );
}
