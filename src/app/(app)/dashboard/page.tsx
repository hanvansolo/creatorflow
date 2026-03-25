import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import {
  Lightbulb,
  FolderKanban,
  Sparkles,
  Rocket,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";
import { AIInsightsPanel } from "@/components/ai/ai-insights";
import { db } from "@/lib/db";
import { tasks, projects, ideas } from "@/lib/db/schema";
import { eq, and, desc, count, isNotNull } from "drizzle-orm";

export default async function DashboardPage() {
  const user = await currentUser();
  const { userId } = await auth();
  if (!userId) return null;

  const firstName = user?.firstName || "Builder";

  // Get counts
  const [ideasCount] = await db.select({ count: count() }).from(ideas).where(eq(ideas.userId, userId));
  const [projectsCount] = await db.select({ count: count() }).from(projects).where(eq(projects.userId, userId));
  const [tasksCount] = await db.select({ count: count() }).from(tasks).where(eq(tasks.userId, userId));
  const pinnedIdeas = await db.query.ideas.findMany({
    where: and(eq(ideas.userId, userId), eq(ideas.pinned, true)),
    limit: 5,
    orderBy: [desc(ideas.createdAt)],
  });
  const recentProjects = await db.query.projects.findMany({
    where: eq(projects.userId, userId),
    limit: 5,
    orderBy: [desc(projects.updatedAt)],
  });

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          How will your thoughts become things today?
        </p>
      </div>

      {/* Journey stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/ideas">
          <Card className="group transition-all duration-200 hover:shadow-md hover:border-border/80">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Think</p>
                <p className="text-2xl font-semibold tracking-tight">{ideasCount.count}</p>
                <p className="text-[11px] text-muted-foreground">ideas captured</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD60A]/10">
                <Lightbulb className="h-5 w-5 text-[#FFD60A]" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/projects">
          <Card className="group transition-all duration-200 hover:shadow-md hover:border-border/80">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Build</p>
                <p className="text-2xl font-semibold tracking-tight">{projectsCount.count}</p>
                <p className="text-[11px] text-muted-foreground">projects in progress</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9B5DE5]/10">
                <FolderKanban className="h-5 w-5 text-[#9B5DE5]" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Ship</p>
              <p className="text-2xl font-semibold tracking-tight">{tasksCount.count}</p>
              <p className="text-[11px] text-muted-foreground">tasks total</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2EC4B6]/10">
              <Rocket className="h-5 w-5 text-[#2EC4B6]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <Link href="/ideas/new">
          <div className="group flex items-center gap-3 rounded-xl border border-border/30 bg-gradient-to-br from-[#FFD60A]/5 to-transparent p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-border/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/80 shadow-sm">
              <Lightbulb className="h-4 w-4 text-[#FFD60A]" />
            </div>
            <div>
              <p className="text-[13px] font-medium">Capture Thought</p>
              <p className="text-[11px] text-muted-foreground">Think</p>
            </div>
          </div>
        </Link>
        <Link href="/chat">
          <div className="group flex items-center gap-3 rounded-xl border border-border/30 bg-gradient-to-br from-[#F72585]/5 to-transparent p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-border/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/80 shadow-sm">
              <Sparkles className="h-4 w-4 text-[#F72585]" />
            </div>
            <div>
              <p className="text-[13px] font-medium">AI Co-pilot</p>
              <p className="text-[11px] text-muted-foreground">Shape</p>
            </div>
          </div>
        </Link>
        <Link href="/projects/new">
          <div className="group flex items-center gap-3 rounded-xl border border-border/30 bg-gradient-to-br from-[#9B5DE5]/5 to-transparent p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-border/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/80 shadow-sm">
              <FolderKanban className="h-4 w-4 text-[#9B5DE5]" />
            </div>
            <div>
              <p className="text-[13px] font-medium">New Project</p>
              <p className="text-[11px] text-muted-foreground">Build</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Two columns: pinned ideas + recent projects */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pinned ideas */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pinned Thoughts
              </CardTitle>
              <Link href="/ideas" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {pinnedIdeas.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Pin your best ideas to see them here</p>
            ) : (
              pinnedIdeas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/ideas/${idea.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-3.5 w-3.5 text-[#FFD60A]" />
                    <span className="text-[13px] font-medium truncate">{idea.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(idea.createdAt)}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent projects */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Projects
              </CardTitle>
              <Link href="/projects" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentProjects.length === 0 ? (
              <Link href="/projects/new" className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <FolderKanban className="h-3.5 w-3.5" />
                Create your first project
              </Link>
            ) : (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
                >
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-3.5 w-3.5 text-[#9B5DE5]" />
                    <span className="text-[13px] font-medium truncate">{project.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(project.updatedAt)}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <AIInsightsPanel />
    </div>
  );
}
