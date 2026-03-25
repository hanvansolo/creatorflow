import { auth } from "@clerk/nextjs/server";
import { getFiles } from "@/lib/services/files";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json([], { status: 401 });
  }

  const files = await getFiles(userId);
  return Response.json(files);
}
