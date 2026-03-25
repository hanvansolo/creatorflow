"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDistanceToNow } from "@/lib/utils";

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/scripts")
      .then((r) => r.json())
      .then((data) => { setScripts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scripts"
        description="Write and manage your content scripts"
        actionLabel="New Script"
        actionHref="/scripts/new"
      />

      {!loading && scripts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No scripts yet"
          description="Write scripts for your videos, podcasts, or any content. Track them from draft to published."
          actionLabel="Start your first script"
          actionHref="/scripts/new"
        />
      ) : (
        <div className="grid gap-3">
          {scripts.map((script: any) => (
            <Card
              key={script.id}
              className="group cursor-pointer transition-colors hover:bg-accent"
              onClick={() => router.push(`/scripts/${script.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{script.title}</h3>
                    {script.contentPlain && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {script.contentPlain.slice(0, 120)}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <StatusBadge status={script.status} />
                      <Badge variant="secondary" className="text-xs">{script.wordCount} words</Badge>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(script.updatedAt)}
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
