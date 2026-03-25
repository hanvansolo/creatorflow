import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ensureUser } from "@/lib/services/users";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Sync Clerk user to our database on first visit
  await ensureUser({
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || "",
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    imageUrl: user.imageUrl || null,
  });

  return <AppShell>{children}</AppShell>;
}
