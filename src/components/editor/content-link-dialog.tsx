"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Lightbulb, StickyNote, FileText, Search, Loader2 } from "lucide-react";
import { contentColors } from "@/lib/colors";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  idea: Lightbulb,
  note: StickyNote,
  script: FileText,
};

const typeHrefs: Record<string, (id: string) => string> = {
  idea: (id) => `/ideas/${id}`,
  note: (id) => `/notes/${id}`,
  script: (id) => `/scripts/${id}`,
};

interface ContentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (title: string, href: string) => void;
}

export function ContentLinkDialog({ open, onOpenChange, onSelect }: ContentLinkDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; title: string; type: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/links?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } catch {}
      setLoading(false);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (item: { id: string; title: string; type: string }) => {
    const href = typeHrefs[item.type]?.(item.id) || "#";
    onSelect(item.title, href);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="text-sm">Link to Content</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ideas, notes, scripts..."
              className="pl-8 h-9 text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && query.length > 0 && results.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No results found
            </p>
          )}

          {results.map((item) => {
            const Icon = typeIcons[item.type] || FileText;
            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Icon className={`h-4 w-4 shrink-0 ${contentColors[item.type as keyof typeof contentColors]?.icon || "text-muted-foreground"}`} />
                <span className="truncate font-medium">{item.title}</span>
                <span className={`ml-auto text-[10px] capitalize shrink-0 ${contentColors[item.type as keyof typeof contentColors]?.text || "text-muted-foreground"}`}>
                  {item.type}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
