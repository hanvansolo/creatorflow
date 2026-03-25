import { auth } from "@clerk/nextjs/server";
import { getProjects } from "@/lib/services/projects";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json([], { status: 401 });
  const projects = await getProjects(userId);
  return Response.json(projects);
}
