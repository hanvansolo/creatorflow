import { currentUser } from "@clerk/nextjs/server";
import {
  Lightbulb,
  StickyNote,
  FileText,
  FolderKanban,
  Library,
  MessageSquare,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

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
  const firstName = user?.firstName || "Creator";

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
          <StatsCard title="Ideas" value="0" icon={Lightbulb} href="/ideas" />
          <StatsCard title="Notes" value="0" icon={StickyNote} href="/notes" />
          <StatsCard title="Scripts" value="0" icon={FileText} href="/scripts" />
          <StatsCard title="Projects" value="0" icon={FolderKanban} href="/projects" />
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Get Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <GettingStartedItem
            label="Capture your first idea"
            href="/ideas/new"
            done={false}
          />
          <GettingStartedItem
            label="Write a note"
            href="/notes/new"
            done={false}
          />
          <GettingStartedItem
            label="Create a project to organize your work"
            href="/projects/new"
            done={false}
          />
          <GettingStartedItem
            label="Ask AI a question about your content"
            href="/chat"
            done={false}
          />
        </CardContent>
      </Card>
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
  value: string;
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

function GettingStartedItem({
  label,
  href,
  done,
}: {
  label: string;
  href: string;
  done: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
            done ? "border-green-500 bg-green-500" : "border-muted-foreground/30"
          }`}
        >
          {done && <span className="text-xs text-white">✓</span>}
        </div>
        <span className={done ? "text-muted-foreground line-through" : ""}>
          {label}
        </span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
