"use server";

import { auth } from "@clerk/nextjs/server";
import { globalSearch } from "@/lib/services/search";

export async function searchAction(query: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return globalSearch(userId, query);
}
