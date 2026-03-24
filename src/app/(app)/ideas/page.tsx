import { auth } from "@clerk/nextjs/server";
import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { IdeaCard } from "@/components/ideas/idea-card";
import { getIdeas } from "@/lib/services/ideas";
import { getItemTags } from "@/lib/services/tags";

export default async function IdeasPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const allIdeas = await getIdeas(userId);

  // Fetch tags for each idea
  const ideasWithTags = await Promise.all(
    allIdeas.map(async (idea) => ({
      idea,
      tags: await getItemTags(idea.id, "idea"),
    }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideas"
        description="Capture and organize your content ideas"
        actionLabel="New Idea"
        actionHref="/ideas/new"
      />

      {allIdeas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="Start capturing your content ideas. They can grow into notes, scripts, and full projects."
          actionLabel="Capture your first idea"
          actionHref="/ideas/new"
        />
      ) : (
        <div className="grid gap-3">
          {ideasWithTags.map(({ idea, tags }) => (
            <IdeaCard key={idea.id} idea={idea} tags={tags} />
          ))}
        </div>
      )}
    </div>
  );
}
