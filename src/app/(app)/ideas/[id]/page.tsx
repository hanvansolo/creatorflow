import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { IdeaForm } from "@/components/ideas/idea-form";
import { DeleteIdeaButton } from "@/components/ideas/delete-idea-button";
import { getIdeaById } from "@/lib/services/ideas";
import { getItemTags } from "@/lib/services/tags";
import { updateIdeaAction } from "../actions";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const idea = await getIdeaById(userId, id);
  if (!idea) notFound();

  const tags = await getItemTags(id, "idea");

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
    </div>
  );
}
