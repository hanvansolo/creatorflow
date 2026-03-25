"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
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
  Plus,
  Loader2,
} from "lucide-react";
import { searchAction } from "@/app/(app)/search/actions";

const pages = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
  { label: "Notes", href: "/notes", icon: StickyNote },
  { label: "Scripts", href: "/scripts", icon: FileText },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Library", href: "/library", icon: Library },
  { label: "AI Chat", href: "/chat", icon: MessageSquare },
  { label: "Search", href: "/search", icon: Search },
  { label: "Settings", href: "/settings", icon: Settings },
];

const quickActions = [
  { label: "New Idea", href: "/ideas/new", icon: Plus },
  { label: "New Note", href: "/notes/new", icon: Plus },
  { label: "New Script", href: "/scripts/new", icon: Plus },
  { label: "New Project", href: "/projects/new", icon: Plus },
  { label: "New Chat", href: "/chat", icon: Plus },
];

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  idea: Lightbulb,
  note: StickyNote,
  script: FileText,
  file: Library,
};

const typeHrefs: Record<string, (id: string) => string> = {
  idea: (id) => `/ideas/${id}`,
  note: (id) => `/notes/${id}`,
  script: (id) => `/scripts/${id}`,
  file: () => `/library`,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; type: string; title: string }[]
  >([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Cmd+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search when query changes
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const data = await searchAction(query);
        setResults(data.map((r) => ({ id: r.id, type: r.type, title: r.title })));
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search or jump to..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isPending ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : (
            "No results found."
          )}
        </CommandEmpty>

        {/* Search results */}
        {results.length > 0 && (
          <CommandGroup heading="Content">
            {results.map((result) => {
              const Icon = typeIcons[result.type] || FileText;
              const href = typeHrefs[result.type]?.(result.id) || "/";
              return (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => navigate(href)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {result.title}
                  <span className="ml-auto text-xs text-muted-foreground capitalize">
                    {result.type}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Quick actions */}
        {query.length < 2 && (
          <>
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.href}
                  onSelect={() => navigate(action.href)}
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Navigate">
              {pages.map((page) => (
                <CommandItem
                  key={page.href}
                  onSelect={() => navigate(page.href)}
                >
                  <page.icon className="mr-2 h-4 w-4" />
                  {page.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
