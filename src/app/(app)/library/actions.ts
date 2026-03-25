"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { deleteFileRecord } from "@/lib/services/files";
import { deleteFile } from "@/lib/storage";
import { removeContentEmbeddings } from "@/lib/ai/embeddings";

export async function deleteFileAction(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const file = await deleteFileRecord(userId, id);
  if (file) {
    deleteFile(file.storagePath).catch(console.error);
    removeContentEmbeddings(id, "file").catch(console.error);
  }

  revalidatePath("/library");
  revalidatePath("/dashboard");
}
