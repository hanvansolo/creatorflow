"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createIdeaSchema, updateIdeaSchema } from "@/lib/validations/ideas";
import * as ideasService from "@/lib/services/ideas";
import { syncItemTags } from "@/lib/services/tags";

async function tryIndex(userId: string, itemId: string, text: string, title: string) {
  try {
    const { indexContent } = await import("@/lib/ai/embeddings");
    await indexContent(userId, itemId, "idea", text, title);
  } catch {}
}

export async function createIdeaAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const raw = {
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    status: (formData.get("status") as string) || "new",
    projectId: (formData.get("projectId") as string) || null,
    tags: formData.get("tags")
      ? (formData.get("tags") as string).split(",").filter(Boolean)
      : [],
  };

  const validated = createIdeaSchema.parse(raw);
  const idea = await ideasService.createIdea(userId, validated);

  if (validated.tags && validated.tags.length > 0) {
    await syncItemTags(userId, idea.id, "idea", validated.tags);
  }

  tryIndex(userId, idea.id, validated.body || "", validated.title).catch(() => {});

  revalidatePath("/ideas");
  revalidatePath("/dashboard");
  redirect(`/ideas`);
}

export async function updateIdeaAction(id: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const raw = {
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    status: (formData.get("status") as string) || undefined,
    projectId: (formData.get("projectId") as string) || null,
    tags: formData.get("tags")
      ? (formData.get("tags") as string).split(",").filter(Boolean)
      : [],
  };

  const validated = updateIdeaSchema.parse(raw);
  await ideasService.updateIdea(userId, id, validated);

  if (validated.tags) {
    await syncItemTags(userId, id, "idea", validated.tags);
  }

  tryIndex(userId, id, validated.body || "", validated.title || "").catch(() => {});

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${id}`);
  revalidatePath("/dashboard");
  redirect(`/ideas`);
}

export async function deleteIdeaAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await ideasService.deleteIdea(userId, id);

  try {
    const { removeContentEmbeddings } = await import("@/lib/ai/embeddings");
    await removeContentEmbeddings(id, "idea");
  } catch {}

  revalidatePath("/ideas");
  revalidatePath("/dashboard");
  redirect("/ideas");
}
