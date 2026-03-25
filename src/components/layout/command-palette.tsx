"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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

type ResultItem = {
  id: string;
  type: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

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
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search when query changes
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const data = await searchAction(query);
        setResults(
          data.map((r) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            href: typeHrefs[r.type]?.(r.id) || "/",
            icon: typeIcons[r.type] || FileText,
          }))
        );
        setSelectedIndex(0);
      });
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  // Build the visible list
  const visibleItems: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; section: string }[] = [];

  if (query.length >= 2) {
    results.forEach((r) =>
      visibleItems.push({ label: r.title, href: r.href, icon: r.icon, section: "Results" })
    );
  } else {
    quickActions.forEach((a) =>
      visibleItems.push({ label: a.label, href: a.href, icon: a.icon, section: "Quick Actions" })
    );
    pages.forEach((p) =>
      visibleItems.push({ label: p.label, href: p.href, icon: p.icon, section: "Navigate" })
    );
  }

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, visibleItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && visibleItems[selectedIndex]) {
      e.preventDefault();
      navigate(visibleItems[selectedIndex].href);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[20%] translate-y-0 sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
          <DialogDescription>Search or jump to...</DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or jump to..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Results */}
        <ScrollArea className="max-h-72">
          <div className="p-1">
            {visibleItems.length === 0 && query.length >= 2 && !isPending && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </p>
            )}

            {(() => {
              let lastSection = "";
              return visibleItems.map((item, index) => {
                const showSection = item.section !== lastSection;
                lastSection = item.section;
                const Icon = item.icon;

                return (
                  <div key={`${item.section}-${item.href}-${index}`}>
                    {showSection && (
                      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {item.section}
                      </p>
                    )}
                    <button
                      onClick={() => navigate(item.href)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        index === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/50"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {item.label}
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
