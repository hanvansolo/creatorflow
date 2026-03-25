import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { saveFile } from "@/lib/storage";
import { createFile } from "@/lib/services/files";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  try {
    const { storagePath, storageUrl } = await saveFile(userId, file);

    const record = await createFile(userId, {
      name: file.name,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storagePath,
      storageUrl,
    });

    return Response.json(record);
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
