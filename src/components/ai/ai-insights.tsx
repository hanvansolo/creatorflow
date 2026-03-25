"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Check if user has any content
  useEffect(() => {
    Promise.all([
      fetch("/api/ideas").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([ideas, projects]) => {
      if ((ideas?.length || 0) + (projects?.length || 0) > 0) {
        setHasContent(true);
      }
    }).catch(() => {});
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      // Build context from user's content
      const [ideas, projects] = await Promise.all([
        fetch("/api/ideas").then((r) => r.json()),
        fetch("/api/projects").then((r) => r.json()),
      ]);

      const context = [
        `Ideas (${ideas.length}):`,
        ...ideas.slice(0, 10).map((i: any) => `- ${i.title} (${i.status}${i.pinned ? ", pinned" : ""})`),
        `\nProjects (${projects.length}):`,
        ...projects.slice(0, 10).map((p: any) => `- ${p.title} (${p.status})`),
      ].join("\n");

      const res = await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dashboard-insights", context }),
      });

      if (res.ok) {
        const data = await res.json();
        setInsights(data.result);
      }
    } catch {}
    setLoading(false);
  };

  if (!hasContent) return null;

  return (
    <Card className="border-[#F72585]/20 bg-gradient-to-br from-[#F72585]/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#F72585]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={fetchInsights}
            disabled={loading}
            className="text-[#F72585] hover:text-[#F72585] hover:bg-[#F72585]/10"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights && !loading && (
          <button
            onClick={fetchInsights}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#F72585]/20 py-4 text-xs text-muted-foreground hover:text-[#F72585] hover:border-[#F72585]/40 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Get AI insights on your workspace
          </button>
        )}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F72585]" />
            Analyzing your workspace...
          </div>
        )}
        {insights && (
          <div className="text-[12px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {insights}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
