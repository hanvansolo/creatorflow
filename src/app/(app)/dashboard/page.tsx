import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import {
  Lightbulb,
  FolderKanban,
  Sparkles,
  Rocket,
  ArrowRight,
  Zap,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";
import { AIInsightsPanel } from "@/components/ai/ai-insights";
import { db } from "@/lib/db";
import { tasks, projects, ideas } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export default async function DashboardPage() {
  const user = await currentUser();
  const { userId } = await auth();
  if (!userId) return null;

  const firstName = user?.firstName || "Builder";

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
    <div className="space-y-8">
      {/* Command Center Header */}
      <div className="relative overflow-hidden rounded-2xl glass-card-glow-purple p-6">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[#a855f7] text-xs font-medium uppercase tracking-widest mb-2">
            <Activity className="h-3 w-3 animate-pulse-glow" />
            Command Center
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">{firstName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How will your thoughts become things today?
          </p>
        </div>
        {/* Subtle scan line effect */}
        <div className="absolute inset-0 scan-line opacity-50" />
      </div>

      {/* Stats Grid — floating glass panels */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/ideas">
          <div className="glass-card-glow-yellow p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FFD60A]/5 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-[#FFD60A]/70">Think</p>
                <p className="text-3xl font-bold tracking-tight mt-1">{ideasCount.count}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">ideas captured</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFD60A]/5 border border-[#FFD60A]/10">
                <Lightbulb className="h-6 w-6 text-[#FFD60A]" />
              </div>
            </div>
          </div>
        </Link>

        <Link href="/projects">
          <div className="glass-card-glow-purple p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#a855f7]/5 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-[#a855f7]/70">Build</p>
                <p className="text-3xl font-bold tracking-tight mt-1">{projectsCount.count}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">active projects</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#a855f7]/5 border border-[#a855f7]/10">
                <FolderKanban className="h-6 w-6 text-[#a855f7]" />
              </div>
            </div>
          </div>
        </Link>

        <div className="glass-card-glow-green p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[#22c55e]/70">Ship</p>
              <p className="text-3xl font-bold tracking-tight mt-1">{tasksCount.count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">total tasks</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22c55e]/5 border border-[#22c55e]/10">
              <Rocket className="h-6 w-6 text-[#22c55e]" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions — glowing buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/ideas/new">
          <div className="glass-card p-4 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:border-[#FFD60A]/20 cursor-pointer group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFD60A]/5 border border-[#FFD60A]/10 group-hover:border-[#FFD60A]/30 transition-colors">
              <Lightbulb className="h-5 w-5 text-[#FFD60A]" />
            </div>
            <div>
              <p className="text-[13px] font-medium">Capture Thought</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Think</p>
            </div>
          </div>
        </Link>
        <Link href="/chat">
          <div className="glass-card p-4 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:border-[#ec4899]/20 cursor-pointer group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ec4899]/5 border border-[#ec4899]/10 group-hover:border-[#ec4899]/30 transition-colors">
              <Sparkles className="h-5 w-5 text-[#ec4899]" />
            </div>
            <div>
              <p className="text-[13px] font-medium">AI Co-pilot</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Shape</p>
            </div>
          </div>
        </Link>
        <Link href="/projects/new">
          <div className="glass-card p-4 flex items-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:border-[#a855f7]/20 cursor-pointer group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#a855f7]/5 border border-[#a855f7]/10 group-hover:border-[#a855f7]/30 transition-colors">
              <FolderKanban className="h-5 w-5 text-[#a855f7]" />
            </div>
            <div>
              <p className="text-[13px] font-medium">New Project</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Build</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Two columns: Pinned Thoughts + Active Projects */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pinned Thoughts */}
        <div className="glass-card-glow-yellow p-5 relative overflow-hidden">
          <div className="absolute inset-0 scan-line opacity-30" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-[#FFD60A]" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-[#FFD60A]/70">Pinned Thoughts</span>
              </div>
              <Link href="/ideas" className="text-[10px] text-muted-foreground hover:text-[#FFD60A] transition-colors uppercase tracking-wider">
                View all →
              </Link>
            </div>
            {pinnedIdeas.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground/60">Pin your best ideas to see them here</p>
            ) : (
              <div className="space-y-1.5">
                {pinnedIdeas.map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/ideas/${idea.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition-all hover:bg-white/5"
                  >
                    <span className="text-[13px] font-medium truncate">{idea.title}</span>
                    <span className="text-[10px] text-muted-foreground/50 shrink-0 ml-2">{formatDistanceToNow(idea.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="glass-card-glow-purple p-5 relative overflow-hidden">
          <div className="absolute inset-0 scan-line opacity-30" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-3.5 w-3.5 text-[#a855f7]" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-[#a855f7]/70">Active Projects</span>
              </div>
              <Link href="/projects" className="text-[10px] text-muted-foreground hover:text-[#a855f7] transition-colors uppercase tracking-wider">
                View all →
              </Link>
            </div>
            {recentProjects.length === 0 ? (
              <Link href="/projects/new" className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground/60 hover:text-[#a855f7] transition-colors">
                Create your first project →
              </Link>
            ) : (
              <div className="space-y-1.5">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition-all hover:bg-white/5"
                  >
                    <span className="text-[13px] font-medium truncate">{project.title}</span>
                    <span className="text-[10px] text-muted-foreground/50 shrink-0 ml-2">{formatDistanceToNow(project.updatedAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights — the live pulse */}
      <AIInsightsPanel />
    </div>
  );
}
