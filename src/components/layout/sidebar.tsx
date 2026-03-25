"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Lightbulb,
  StickyNote,
  FileText,
  FolderKanban,
  Library,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "" },
  { label: "Ideas", href: "/ideas", icon: Lightbulb, color: "text-yellow-400" },
  { label: "Notes", href: "/notes", icon: StickyNote, color: "text-cyan-400" },
  { label: "Scripts", href: "/scripts", icon: FileText, color: "text-green-400" },
  { label: "Projects", href: "/projects", icon: FolderKanban, color: "text-violet-400" },
  { label: "Library", href: "/library", icon: Library, color: "text-orange-400" },
];

const secondaryNavigation = [
  { label: "AI Chat", href: "/chat", icon: MessageSquare, color: "text-rose-400" },
  { label: "Search", href: "/search", icon: Search, color: "" },
  { label: "Settings", href: "/settings", icon: Settings, color: "" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex h-full w-60 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-purple-600">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight">JottrPad</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 pt-2">
        <div className="mb-2 px-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
            Workspace
          </span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    item.color || (isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70")
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mb-2 mt-6 px-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
            Tools
          </span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {secondaryNavigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    item.color || (isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70")
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3">
        <Link
          href="/settings/billing"
          className="flex items-center gap-2.5 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs transition-colors hover:bg-muted/60"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-blue-500/20 to-purple-600/20">
            <CreditCard className="h-3 w-3 text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">Free Plan</span>
            <span className="text-[10px] text-muted-foreground">Upgrade for more</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
