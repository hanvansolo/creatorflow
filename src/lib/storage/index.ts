import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

/**
 * Ensure the upload directory exists.
 */
async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Save an uploaded file to disk. Returns the storage path and a served URL.
 */
export async function saveFile(
  userId: string,
  file: File
): Promise<{ storagePath: string; storageUrl: string }> {
  const userDir = path.join(UPLOAD_DIR, userId);
  await ensureDir(userDir);

  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;
  const storagePath = path.join(userId, filename);
  const fullPath = path.join(UPLOAD_DIR, storagePath);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);

  return {
    storagePath,
    storageUrl: `/api/files/${storagePath}`,
  };
}

/**
 * Read a file from disk. Returns the buffer and inferred content type.
 */
export async function readFile(
  storagePath: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const fullPath = path.join(UPLOAD_DIR, storagePath);
  const buffer = await fs.readFile(fullPath);

  const ext = path.extname(storagePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
  };

  return {
    buffer,
    contentType: contentTypes[ext] || "application/octet-stream",
  };
}

/**
 * Delete a file from disk.
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, storagePath);
  try {
    await fs.unlink(fullPath);
  } catch {
    // File may already be gone
  }
}

/**
 * Format bytes to human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
