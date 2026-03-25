import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { ScriptEditorPage } from "@/components/scripts/script-editor-page";
import { getScriptById } from "@/lib/services/scripts";
import { getItemTags } from "@/lib/services/tags";
import { createScriptAction, updateScriptAction, deleteScriptAction } from "../actions";

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return null;

  const script = await getScriptById(userId, id);
  if (!script) notFound();

  const tags = await getItemTags(id, "script");

  return (
    <ScriptEditorPage
      script={script}
      tags={tags.map((t) => t.name)}
      createAction={createScriptAction}
      updateAction={updateScriptAction}
      deleteAction={deleteScriptAction}
    />
  );
}
