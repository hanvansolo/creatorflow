"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createScriptSchema, updateScriptSchema } from "@/lib/validations/scripts";
import * as scriptsService from "@/lib/services/scripts";
import { syncItemTags } from "@/lib/services/tags";

async function tryIndex(userId: string, itemId: string, text: string, title: string) {
  try {
    const { indexContent } = await import("@/lib/ai/embeddings");
    await indexContent(userId, itemId, "script", text, title);
  } catch {}
}

export async function createScriptAction(data: {
  title: string;
  content?: string;
  contentPlain?: string;
  status?: string;
  projectId?: string | null;
  ideaId?: string | null;
  tags?: string[];
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = createScriptSchema.parse(data);
  const script = await scriptsService.createScript(userId, validated);

  if (data.tags && data.tags.length > 0) {
    await syncItemTags(userId, script.id, "script", data.tags);
  }

  tryIndex(userId, script.id, validated.contentPlain || "", validated.title).catch(() => {});

  revalidatePath("/scripts");
  revalidatePath("/dashboard");
  return script;
}

export async function updateScriptAction(
  id: string,
  data: {
    title?: string;
    content?: string;
    contentPlain?: string;
    status?: string;
    projectId?: string | null;
    ideaId?: string | null;
    tags?: string[];
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const validated = updateScriptSchema.parse(data);
  await scriptsService.updateScript(userId, id, validated);

  if (data.tags) {
    await syncItemTags(userId, id, "script", data.tags);
  }

  tryIndex(userId, id, data.contentPlain || "", data.title || "").catch(() => {});

  revalidatePath("/scripts");
  revalidatePath(`/scripts/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteScriptAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await scriptsService.deleteScript(userId, id);

  try {
    const { removeContentEmbeddings } = await import("@/lib/ai/embeddings");
    await removeContentEmbeddings(id, "script");
  } catch {}

  revalidatePath("/scripts");
  revalidatePath("/dashboard");
  redirect("/scripts");
}
