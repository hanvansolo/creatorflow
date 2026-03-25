import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { readFile } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { path } = await params;
  const storagePath = path.join("/");

  // Ensure user can only access their own files
  if (!storagePath.startsWith(userId)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const { buffer, contentType } = await readFile(storagePath);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
