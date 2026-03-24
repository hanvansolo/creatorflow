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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getDashboardStats, getRecentItems } from "@/lib/services/dashboard";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDistanceToNow } from "@/lib/utils";

const quickActions = [
  { label: "New Idea", href: "/ideas/new", icon: Lightbulb, color: "text-yellow-500" },
  { label: "New Note", href: "/notes/new", icon: StickyNote, color: "text-blue-500" },
  { label: "New Script", href: "/scripts/new", icon: FileText, color: "text-emerald-500" },
  { label: "New Project", href: "/projects/new", icon: FolderKanban, color: "text-purple-500" },
  { label: "Upload File", href: "/library", icon: Library, color: "text-orange-500" },
  { label: "AI Chat", href: "/chat", icon: MessageSquare, color: "text-pink-500" },
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
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your creator workspace is ready. What will you build today?
        </p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group cursor-pointer transition-colors hover:bg-accent">
                <CardContent className="flex flex-col items-center gap-2 p-4">
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                  <span className="text-xs font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Ideas" value={stats.ideas} icon={Lightbulb} href="/ideas" />
          <StatsCard title="Notes" value={stats.notes} icon={StickyNote} href="/notes" />
          <StatsCard title="Scripts" value={stats.scripts} icon={FileText} href="/scripts" />
          <StatsCard title="Projects" value={stats.projects} icon={FolderKanban} href="/projects" />
        </div>
      </div>

      {/* Recent Activity or Getting Started */}
      {hasContent ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {recentIdeas.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Ideas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentIdeas.map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/ideas/${idea.id}`}
                    className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-accent transition-colors"
                  >
                    <span className="truncate font-medium">{idea.title}</span>
                    <StatusBadge status={idea.status} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {recentNotes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-accent transition-colors"
                  >
                    <span className="truncate font-medium">{note.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatDistanceToNow(note.updatedAt)}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {recentScripts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Scripts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentScripts.map((script) => (
                  <Link
                    key={script.id}
                    href={`/scripts/${script.id}`}
                    className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-accent transition-colors"
                  >
                    <span className="truncate font-medium">{script.title}</span>
                    <StatusBadge status={script.status} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Get Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <GettingStartedItem label="Capture your first idea" href="/ideas/new" />
            <GettingStartedItem label="Write a note" href="/notes/new" />
            <GettingStartedItem label="Create a project to organize your work" href="/projects/new" />
            <GettingStartedItem label="Ask AI a question about your content" href="/chat" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-colors hover:bg-accent">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground/30" />
        </CardContent>
      </Card>
    </Link>
  );
}

function GettingStartedItem({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/30" />
        <span>{label}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
