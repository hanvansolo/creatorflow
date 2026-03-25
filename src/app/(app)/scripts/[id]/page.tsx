import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ScriptEditorPage } from "@/components/scripts/script-editor-page";
import { BacklinksPanel } from "@/components/shared/backlinks-panel";
import { getScriptById } from "@/lib/services/scripts";
import { getItemTags } from "@/lib/services/tags";
import { getBacklinks } from "@/lib/services/links";
import { createScriptAction, updateScriptAction, deleteScriptAction } from "../actions";

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const [script, tags, backlinks] = await Promise.all([
    getScriptById(userId, id),
    getItemTags(id, "script"),
    getBacklinks(userId, id, "script"),
  ]);

  if (!script) notFound();

  return (
    <div className="space-y-6">
      <ScriptEditorPage
        script={script}
        tags={tags.map((t) => t.name)}
        createAction={createScriptAction}
        updateAction={updateScriptAction}
        deleteAction={deleteScriptAction}
      />
      <BacklinksPanel backlinks={backlinks} />
    </div>
  );
}
