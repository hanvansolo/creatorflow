"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDistanceToNow } from "@/lib/utils";

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/ideas")
      .then((r) => r.json())
      .then((data) => { setIdeas(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideas"
        description="Capture and organize your content ideas"
        actionLabel="New Idea"
        actionHref="/ideas/new"
      />

      {!loading && ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="Start capturing your content ideas. They can grow into notes, scripts, and full projects."
          actionLabel="Capture your first idea"
          actionHref="/ideas/new"
        />
      ) : (
        <div className="grid gap-3">
          {ideas.map((idea: any) => (
            <Card
              key={idea.id}
              className="group cursor-pointer transition-colors hover:bg-accent"
              onClick={() => router.push(`/ideas/${idea.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{idea.title}</h3>
                    {idea.body && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{idea.body}</p>
                    )}
                    <div className="mt-3">
                      <StatusBadge status={idea.status} />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(idea.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
