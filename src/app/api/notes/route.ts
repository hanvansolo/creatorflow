import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getNotes, createNote } from "@/lib/services/notes";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json([], { status: 401 });
  const notes = await getNotes(userId);
  return Response.json(notes);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  if (!data.title) return Response.json({ error: "Title required" }, { status: 400 });

  const note = await createNote(userId, {
    title: data.title,
    content: data.content,
    contentPlain: data.contentPlain,
    projectId: data.projectId || null,
  });

  return Response.json(note);
}
