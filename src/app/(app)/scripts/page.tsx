import { auth } from "@clerk/nextjs/server";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ScriptCard } from "@/components/scripts/script-card";
import { getScripts } from "@/lib/services/scripts";
import { getItemTags } from "@/lib/services/tags";

export default async function ScriptsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const allScripts = await getScripts(userId);

  const scriptsWithTags = await Promise.all(
    allScripts.map(async (script) => ({
      script,
      tags: await getItemTags(script.id, "script"),
    }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scripts"
        description="Write and manage your content scripts"
        actionLabel="New Script"
        actionHref="/scripts/new"
      />

      {allScripts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No scripts yet"
          description="Write scripts for your videos, podcasts, or any content. Track them from draft to published."
          actionLabel="Start your first script"
          actionHref="/scripts/new"
        />
      ) : (
        <div className="grid gap-3">
          {scriptsWithTags.map(({ script, tags }) => (
            <ScriptCard key={script.id} script={script} tags={tags} />
          ))}
        </div>
      )}
    </div>
  );
}
