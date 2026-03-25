import { auth } from "@clerk/nextjs/server";
import { getScripts } from "@/lib/services/scripts";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json([], { status: 401 });
  const scripts = await getScripts(userId);
  return Response.json(scripts);
}
