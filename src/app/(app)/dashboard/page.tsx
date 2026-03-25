import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import {
  Lightbulb,
  StickyNote,
  FileText,
  FolderKanban,
  Library,
  MessageSquare,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getDashboardStats, getRecentItems } from "@/lib/services/dashboard";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDistanceToNow } from "@/lib/utils";

const quickActions = [
  { label: "Idea", href: "/ideas/new", icon: Lightbulb, gradient: "from-amber-500/10 to-orange-500/10", iconColor: "text-amber-500" },
  { label: "Note", href: "/notes/new", icon: StickyNote, gradient: "from-blue-500/10 to-cyan-500/10", iconColor: "text-blue-500" },
  { label: "Script", href: "/scripts/new", icon: FileText, gradient: "from-emerald-500/10 to-green-500/10", iconColor: "text-emerald-500" },
  { label: "Project", href: "/projects/new", icon: FolderKanban, gradient: "from-purple-500/10 to-violet-500/10", iconColor: "text-purple-500" },
  { label: "Upload", href: "/library", icon: Library, gradient: "from-orange-500/10 to-red-500/10", iconColor: "text-orange-500" },
  { label: "AI Chat", href: "/chat", icon: MessageSquare, gradient: "from-pink-500/10 to-rose-500/10", iconColor: "text-pink-500" },
];

export default async function DashboardPage() {
  const user = await currentUser();
  const { userId } = await auth();
  if (!userId) return null;

  const firstName = user?.firstName || "Creator";
  const stats = await getDashboardStats(userId);
  const { recentIdeas, recentNotes, recentScripts } = await getRecentItems(userId);

  const hasContent = stats.ideas + stats.notes + stats.scripts + stats.projects > 0;

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          What will you create today?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <div className={`group flex flex-col items-center gap-2 rounded-xl bg-gradient-to-br ${action.gradient} border border-border/30 p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-border/60`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/80 shadow-sm">
                <action.icon className={`h-4 w-4 ${action.iconColor}`} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Ideas" value={stats.ideas} icon={Lightbulb} href="/ideas" color="text-amber-500" />
        <StatsCard title="Notes" value={stats.notes} icon={StickyNote} href="/notes" color="text-blue-500" />
        <StatsCard title="Scripts" value={stats.scripts} icon={FileText} href="/scripts" color="text-emerald-500" />
        <StatsCard title="Projects" value={stats.projects} icon={FolderKanban} href="/projects" color="text-purple-500" />
      </div>

      {/* Recent Activity or Getting Started */}
      {hasContent ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {recentIdeas.length > 0 && (
            <RecentCard title="Recent Ideas" items={recentIdeas.map((i) => ({
              id: i.id, title: i.title, href: `/ideas/${i.id}`,
              badge: <StatusBadge status={i.status} />,
            }))} />
          )}
          {recentNotes.length > 0 && (
            <RecentCard title="Recent Notes" items={recentNotes.map((n) => ({
              id: n.id, title: n.title, href: `/notes/${n.id}`,
              badge: <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(n.updatedAt)}</span>,
            }))} />
          )}
          {recentScripts.length > 0 && (
            <RecentCard title="Recent Scripts" items={recentScripts.map((s) => ({
              id: s.id, title: s.title, href: `/scripts/${s.id}`,
              badge: <StatusBadge status={s.status} />,
            }))} />
          )}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Get Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <GettingStartedItem label="Capture your first idea" href="/ideas/new" icon={Lightbulb} />
            <GettingStartedItem label="Write a note" href="/notes/new" icon={StickyNote} />
            <GettingStartedItem label="Create a project" href="/projects/new" icon={FolderKanban} />
            <GettingStartedItem label="Ask AI about your content" href="/chat" icon={MessageSquare} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatsCard({
  title, value, icon: Icon, href, color,
}: {
  title: string; value: number; icon: React.ComponentType<{ className?: string }>; href: string; color: string;
}) {
  return (
    <Link href={href}>
      <Card className="group transition-all duration-200 hover:shadow-md hover:border-border/80">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 transition-colors group-hover:bg-muted">
            <Icon className={`h-5 w-5 ${color} opacity-60`} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RecentCard({ title, items }: {
  title: string;
  items: { id: string; title: string; href: string; badge: React.ReactNode }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60"
          >
            <span className="truncate font-medium text-[13px]">{item.title}</span>
            {item.badge}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function GettingStartedItem({ label, href, icon: Icon }: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-lg border border-border/50 p-3 text-sm transition-all hover:bg-muted/40 hover:border-border"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/50">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-[13px]">{label}</span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
