import { auth } from "@clerk/nextjs/server";
import { getIdeas } from "@/lib/services/ideas";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json([], { status: 401 });
  const ideas = await getIdeas(userId);
  return Response.json(ideas);
}
