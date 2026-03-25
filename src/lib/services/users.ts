import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function ensureUser(clerkUser: {
  id: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
}) {
  const existing = await db.query.users.findFirst({
    where: eq(users.id, clerkUser.id),
  });

  if (existing) return existing;

  const [user] = await db
    .insert(users)
    .values({
      id: clerkUser.id,
      email: clerkUser.email,
      name: clerkUser.name || null,
      imageUrl: clerkUser.imageUrl || null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: clerkUser.email,
        name: clerkUser.name || null,
        imageUrl: clerkUser.imageUrl || null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return user;
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}
