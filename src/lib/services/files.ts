import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getFiles(userId: string) {
  return db.query.files.findMany({
    where: eq(files.userId, userId),
    orderBy: [desc(files.createdAt)],
    with: {
      project: true,
    },
  });
}

export async function getFileById(userId: string, id: string) {
  return db.query.files.findFirst({
    where: and(eq(files.id, id), eq(files.userId, userId)),
  });
}

export async function createFile(
  userId: string,
  data: {
    name: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
    storageUrl: string;
    projectId?: string | null;
  }
) {
  const [file] = await db
    .insert(files)
    .values({
      userId,
      name: data.name,
      originalName: data.originalName,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      storagePath: data.storagePath,
      storageUrl: data.storageUrl,
      projectId: data.projectId || null,
    })
    .returning();

  return file;
}

export async function deleteFileRecord(userId: string, id: string) {
  const file = await getFileById(userId, id);
  if (!file) return null;

  await db
    .delete(files)
    .where(and(eq(files.id, id), eq(files.userId, userId)));

  return file;
}
