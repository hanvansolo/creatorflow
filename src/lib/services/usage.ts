import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const FREE_AI_LIMIT = 50; // queries per month
const PRO_AI_LIMIT = 1000;

export async function checkAndIncrementUsage(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { allowed: false, used: 0, limit: 0 };
  }

  const limit = user.subscriptionPlan === "pro" ? PRO_AI_LIMIT : FREE_AI_LIMIT;

  // Reset counter if past the reset date
  const now = new Date();
  const resetAt = user.aiUsageResetAt;
  let currentCount = user.aiUsageCount;

  if (!resetAt || now > resetAt) {
    // Reset: set count to 0 and next reset to start of next month
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await db
      .update(users)
      .set({
        aiUsageCount: 1,
        aiUsageResetAt: nextReset,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    return { allowed: true, used: 1, limit };
  }

  if (currentCount >= limit) {
    return { allowed: false, used: currentCount, limit };
  }

  // Increment
  await db
    .update(users)
    .set({
      aiUsageCount: sql`${users.aiUsageCount} + 1`,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  return { allowed: true, used: currentCount + 1, limit };
}

export async function getUsage(userId: string): Promise<{
  used: number;
  limit: number;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return { used: 0, limit: FREE_AI_LIMIT };

  const limit = user.subscriptionPlan === "pro" ? PRO_AI_LIMIT : FREE_AI_LIMIT;
  const now = new Date();

  // If past reset, count is effectively 0
  if (!user.aiUsageResetAt || now > user.aiUsageResetAt) {
    return { used: 0, limit };
  }

  return { used: user.aiUsageCount, limit };
}
