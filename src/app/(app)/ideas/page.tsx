"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Star, FolderKanban, Pin, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";
import { toast } from "sonner";
import { AIActionMenu, ideaActions } from "@/components/ai/ai-action-menu";

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

  const togglePin = async (e: React.MouseEvent, id: string, pinned: boolean) => {
    e.stopPropagation();
    const res = await fetch("/api/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id, itemType: "idea", pinned }),
    });
    if (res.ok) {
      const { pinned: newPinned } = await res.json();
      setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, pinned: newPinned } : i)));
      toast.success(newPinned ? "Idea pinned" : "Idea unpinned");
    }
  };

  const [converting, setConverting] = useState<string | null>(null);

  const convertToProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConverting(id);
    toast.info("Converting idea to project... AI is generating tasks");
    const res = await fetch(`/api/ideas/${id}/convert`, { method: "POST" });
    if (res.ok) {
      const project = await res.json();
      toast.success("Project created with AI-suggested tasks!");
      router.push(`/projects/${project.id}`);
    } else {
      toast.error("Failed to convert");
    }
    setConverting(null);
  };

  const sorted = [...ideas].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pinnedIdeas = sorted.filter((i) => i.pinned);
  const unpinnedIdeas = sorted.filter((i) => !i.pinned);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideas"
        description="Capture ideas, pin your favorites, convert the best ones into projects"
        actionLabel="New Idea"
        actionHref="/ideas/new"
      />

      {!loading && ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="Start capturing your content ideas. Pin the ones you love and convert them into full projects."
          actionLabel="Capture your first idea"
          actionHref="/ideas/new"
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned */}
          {pinnedIdeas.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2 px-1">
                <Pin className="h-3.5 w-3.5 text-[#FFD60A]" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Pinned Ideas</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedIdeas.map((idea: any) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onPin={togglePin}
                    onConvert={convertToProject}
                    converting={converting}
                    onClick={() => router.push(`/ideas/${idea.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All */}
          {unpinnedIdeas.length > 0 && (
            <div>
              {pinnedIdeas.length > 0 && (
                <div className="mb-3 flex items-center gap-2 px-1">
                  <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">All Ideas</span>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {unpinnedIdeas.map((idea: any) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    onPin={togglePin}
                    onConvert={convertToProject}
                    converting={converting}
                    onClick={() => router.push(`/ideas/${idea.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IdeaCard({
  idea,
  onPin,
  onConvert,
  converting,
  onClick,
}: {
  idea: any;
  onPin: (e: React.MouseEvent, id: string, pinned: boolean) => void;
  onConvert: (e: React.MouseEvent, id: string) => void;
  converting: string | null;
  onClick: () => void;
}) {
  const hasProject = !!idea.projectId || !!idea.project;

  return (
    <Card
      className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        idea.pinned ? "ring-2 ring-[#FFD60A]/30" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <StatusBadge status={idea.status} />
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <AIActionMenu
              actions={ideaActions}
              context={`Idea: ${idea.title}\n${idea.body || ""}`}
            />
            <button
              onClick={(e) => onPin(e, idea.id, idea.pinned)}
              title={idea.pinned ? "Unpin" : "Pin"}
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent transition-colors"
            >
              <Star className={`h-3.5 w-3.5 ${idea.pinned ? "text-[#FFD60A] fill-[#FFD60A]" : "text-muted-foreground"}`} />
            </button>
            {!hasProject && (
              <button
                onClick={(e) => onConvert(e, idea.id)}
                disabled={converting === idea.id}
                title="Convert to Project"
                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-accent transition-colors disabled:opacity-50"
              >
                {converting === idea.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#9B5DE5]" />
                ) : (
                  <FolderKanban className="h-3.5 w-3.5 text-[#9B5DE5]" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[14px] leading-snug">{idea.title}</h3>

        {/* Body */}
        {idea.body && (
          <p className="mt-1.5 text-[12px] text-muted-foreground line-clamp-3">{idea.body}</p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasProject && (
              <Badge variant="outline" className="text-[10px] text-[#9B5DE5] border-[#9B5DE5]/30">
                <FolderKanban className="mr-1 h-2.5 w-2.5" />
                Project
              </Badge>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground/50">
            {formatDistanceToNow(idea.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
