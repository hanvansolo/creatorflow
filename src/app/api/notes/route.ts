import { auth } from "@clerk/nextjs/server";
import { getNotes } from "@/lib/services/notes";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json([], { status: 401 });
  const notes = await getNotes(userId);
  return Response.json(notes);
}
