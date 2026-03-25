"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Lightbulb, StickyNote, FileText, File } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDistanceToNow } from "@/lib/utils";
import { searchAction } from "./actions";
import type { SearchResult } from "@/lib/services/search";

const typeConfig = {
  idea: { icon: Lightbulb, label: "Idea", href: (id: string) => `/ideas/${id}` },
  note: { icon: StickyNote, label: "Note", href: (id: string) => `/notes/${id}` },
  script: { icon: FileText, label: "Script", href: (id: string) => `/scripts/${id}` },
  file: { icon: File, label: "File", href: (id: string) => `/library` },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value);

    if (value.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    startTransition(async () => {
      const data = await searchAction(value);
      setResults(data);
      setHasSearched(true);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Search" description="Search across all your content" />

      <div className="mx-auto max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search ideas, notes, scripts, files..."
            className="h-12 pl-10 text-base"
            autoFocus
          />
        </div>
      </div>

      {hasSearched && results.length === 0 && (
        <EmptyState
          icon={Search}
          title="No results"
          description={`Nothing found for "${query}". Try a different search term.`}
        />
      )}

      {results.length > 0 && (
        <div className="grid gap-2 max-w-2xl mx-auto">
          {results.map((result) => {
            const config = typeConfig[result.type];
            const Icon = config.icon;

            return (
              <Link key={`${result.type}-${result.id}`} href={config.href(result.id)}>
                <Card className="cursor-pointer transition-colors hover:bg-accent">
                  <CardContent className="flex items-start gap-3 p-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{result.title}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {config.label}
                        </Badge>
                        {result.status && <StatusBadge status={result.status} />}
                      </div>
                      {result.preview && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {result.preview}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(result.updatedAt)}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {!hasSearched && (
        <EmptyState
          icon={Search}
          title="Search your workspace"
          description="Find anything across your ideas, notes, scripts, projects, and uploaded files."
        />
      )}
    </div>
  );
}
