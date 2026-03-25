import { auth } from "@clerk/nextjs/server";
import { getNotes } from "@/lib/services/notes";

export default async function NotesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  let noteCount = 0;
  let error = "";

  try {
    const allNotes = await getNotes(userId);
    noteCount = allNotes.length;
  } catch (e: any) {
    error = e.message || "Unknown error";
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Notes Debug</h1>
      <p>User: {userId}</p>
      <p>Notes: {noteCount}</p>
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  );
}
