export async function GET() {
  const errors: string[] = [];

  // Test 1: DB connection
  try {
    const { db } = await import("@/lib/db");
    const result = await db.execute(/*sql*/`SELECT 1 as test`);
    errors.push("DB: OK");
  } catch (e: any) {
    errors.push(`DB: ${e.message}`);
  }

  // Test 2: Schema import
  try {
    const schema = await import("@/lib/db/schema");
    errors.push(`Schema: OK (${Object.keys(schema).length} exports)`);
  } catch (e: any) {
    errors.push(`Schema: ${e.message}`);
  }

  // Test 3: Notes service
  try {
    const { getNotes } = await import("@/lib/services/notes");
    errors.push("Notes service: OK");
  } catch (e: any) {
    errors.push(`Notes service: ${e.message}`);
  }

  // Test 4: Auth
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    errors.push(`Auth: ${userId ? "authenticated" : "not authenticated"}`);
  } catch (e: any) {
    errors.push(`Auth: ${e.message}`);
  }

  return Response.json({ diagnostics: errors }, { status: 200 });
}
