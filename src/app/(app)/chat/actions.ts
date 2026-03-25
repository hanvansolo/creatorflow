"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createChatSession } from "@/lib/services/chat";

export async function newChatAction() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const session = await createChatSession(userId);
  redirect(`/chat/${session.id}`);
}
