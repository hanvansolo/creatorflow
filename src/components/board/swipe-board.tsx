"use client";

import { useState, useRef } from "react";
import {
  Check, X, Sparkles, Lightbulb, ListChecks,
  ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SwipeCard {
  id: string;
  title: string;
  description?: string;
  priority?: string;
  type: "task" | "idea" | "suggestion";
}

interface SwipeBoardProps {
  cards: SwipeCard[];
  onKeep: (card: SwipeCard) => void;
  onDiscard: (card: SwipeCard) => void;
  onDone?: () => void;
  title?: string;
}

const priorityColors: Record<string, string> = {
  high: "#FF6B35",
  medium: "#FFD60A",
  low: "#2EC4B6",
  urgent: "#ef4444",
};

export function SwipeBoard({ cards, onKeep, onDiscard, onDone, title = "Review Suggestions" }: SwipeBoardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [kept, setKept] = useState<SwipeCard[]>([]);
  const [discarded, setDiscarded] = useState<SwipeCard[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const current = cards[currentIndex];
  const isComplete = currentIndex >= cards.length;

  const handleKeep = () => {
    if (!current) return;
    setDirection("right");
    setTimeout(() => {
      setKept((prev) => [...prev, current]);
      onKeep(current);
      setCurrentIndex((i) => i + 1);
      setDirection(null);
    }, 300);
  };

  const handleDiscard = () => {
    if (!current) return;
    setDirection("left");
    setTimeout(() => {
      setDiscarded((prev) => [...prev, current]);
      onDiscard(current);
      setCurrentIndex((i) => i + 1);
      setDirection(null);
    }, 300);
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2EC4B6]/10 mb-4">
          <Check className="h-6 w-6 text-[#2EC4B6]" />
        </div>
        <h3 className="text-lg font-semibold">All reviewed!</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Kept {kept.length} · Discarded {discarded.length}
        </p>
        {onDone && (
          <Button onClick={onDone} className="mt-4 bg-gradient-to-r from-[#9B5DE5] to-[#F72585] text-white border-0">
            Done
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#F72585]" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md h-1 rounded-full bg-muted mb-6 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#9B5DE5] to-[#F72585] transition-all duration-300"
          style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card stack */}
      <div className="relative w-full max-w-md h-64 mb-6">
        {/* Background cards */}
        {cards[currentIndex + 2] && (
          <div className="absolute inset-x-4 top-4 h-full rounded-2xl border border-border/30 bg-card/50 scale-[0.92]" />
        )}
        {cards[currentIndex + 1] && (
          <div className="absolute inset-x-2 top-2 h-full rounded-2xl border border-border/30 bg-card/70 scale-[0.96]" />
        )}

        {/* Current card */}
        <div
          ref={cardRef}
          className={`absolute inset-0 transition-all duration-300 ${
            direction === "right"
              ? "translate-x-[120%] rotate-12 opacity-0"
              : direction === "left"
              ? "-translate-x-[120%] -rotate-12 opacity-0"
              : ""
          }`}
        >
          <Card className="h-full rounded-2xl border-border/50 bg-card shadow-xl overflow-hidden">
            {/* Priority stripe */}
            <div
              className="h-1 w-full"
              style={{ backgroundColor: priorityColors[current.priority || "medium"] || "#666" }}
            />
            <CardContent className="flex flex-col justify-between h-full p-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {current.type === "task" ? (
                    <ListChecks className="h-4 w-4 text-[#9B5DE5]" />
                  ) : (
                    <Lightbulb className="h-4 w-4 text-[#FFD60A]" />
                  )}
                  <Badge
                    variant="outline"
                    className="text-[10px] capitalize"
                    style={{
                      color: priorityColors[current.priority || "medium"],
                      borderColor: `${priorityColors[current.priority || "medium"]}40`,
                    }}
                  >
                    {current.priority || "medium"}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold leading-tight">{current.title}</h3>
                {current.description && (
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {current.description}
                  </p>
                )}
              </div>

              {/* Swipe hint */}
              <div className="flex items-center justify-center gap-6 mt-4 text-[11px] text-muted-foreground/50">
                <span className="flex items-center gap-1"><X className="h-3 w-3 text-red-400" /> Discard</span>
                <span className="flex items-center gap-1"><Check className="h-3 w-3 text-[#2EC4B6]" /> Keep</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleDiscard}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/5 text-red-400 transition-all hover:scale-110 hover:bg-red-500/10 hover:border-red-500/50 active:scale-95"
        >
          <X className="h-6 w-6" />
        </button>

        <button
          onClick={handleKeep}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#2EC4B6]/30 bg-[#2EC4B6]/5 text-[#2EC4B6] transition-all hover:scale-110 hover:bg-[#2EC4B6]/10 hover:border-[#2EC4B6]/50 active:scale-95"
        >
          <Check className="h-6 w-6" />
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-3 text-[10px] text-muted-foreground/40">
        ← Discard · → Keep
      </p>
    </div>
  );
}

// Wrapper that generates suggestions and shows the swipe board
interface AISwipeBoardProps {
  projectId: string;
  projectTitle: string;
  onComplete: () => void;
}

export function AISwipeBoard({ projectId, projectTitle, onComplete }: AISwipeBoardProps) {
  const [cards, setCards] = useState<SwipeCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "break-into-tasks",
          context: `Project: ${projectTitle}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        try {
          const parsed = JSON.parse(data.result);
          if (Array.isArray(parsed)) {
            setCards(parsed.map((t: any, i: number) => ({
              id: `suggestion-${i}`,
              title: t.title,
              description: t.description,
              priority: t.priority || "medium",
              type: "task" as const,
            })));
            setStarted(true);
          }
        } catch {}
      }
    } catch {}
    setLoading(false);
  };

  const handleKeep = async (card: SwipeCard) => {
    // Get the board and find Backlog column
    const boardRes = await fetch(`/api/boards/${projectId}`);
    if (!boardRes.ok) return;
    const columns = await boardRes.json();
    const backlog = columns.find((c: any) => c.title === "Backlog") || columns[0];
    if (!backlog) return;

    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        columnId: backlog.id,
        title: card.title,
        description: card.description,
        priority: card.priority,
      }),
    });
  };

  const handleDiscard = () => {
    // Do nothing — just skip
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9B5DE5]/10 to-[#F72585]/10 mb-4">
          <Sparkles className="h-6 w-6 text-[#F72585]" />
        </div>
        <h3 className="text-lg font-semibold">AI Task Suggestions</h3>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
          AI will suggest tasks for this project. Swipe right to keep, left to discard.
        </p>
        <Button
          onClick={generate}
          disabled={loading}
          className="mt-4 bg-gradient-to-r from-[#9B5DE5] to-[#F72585] text-white border-0"
        >
          {loading ? (
            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate Suggestions</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <SwipeBoard
      cards={cards}
      onKeep={handleKeep}
      onDiscard={handleDiscard}
      onDone={onComplete}
      title="Review AI Suggestions"
    />
  );
}
