"use client";

import { useState } from "react";
import {
  Sparkles, Loader2, Lightbulb, Search, ListChecks,
  Zap, FileText, GitBranch, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface AIAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface AIActionMenuProps {
  actions: AIAction[];
  context: string;
  projectId?: string;
  onResult?: (action: string, result: string) => void;
  onTasksGenerated?: (tasks: { title: string; priority?: string; description?: string }[]) => void;
  buttonSize?: "sm" | "default";
  buttonVariant?: "ghost" | "outline" | "default";
}

export function AIActionMenu({
  actions,
  context,
  projectId,
  onResult,
  onTasksGenerated,
  buttonSize = "sm",
  buttonVariant = "ghost",
}: AIActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<string>("");

  const runAction = async (actionId: string) => {
    setLoading(true);
    setCurrentAction(actionId);
    setResult(null);

    try {
      const res = await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionId, context }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI request failed");
      }

      const data = await res.json();
      setResult(data.result);

      // Handle task generation
      if ((actionId === "break-into-tasks" || actionId === "break-into-subtasks" || actionId === "suggest-ideas") && onTasksGenerated) {
        try {
          const parsed = JSON.parse(data.result);
          if (Array.isArray(parsed)) {
            onTasksGenerated(parsed);
          }
        } catch {
          // Result wasn't valid JSON, show as text
        }
      }

      onResult?.(actionId, data.result);
    } catch (err: any) {
      toast.error(err.message || "AI action failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize === "sm" ? "icon-xs" : "icon-sm"}
        onClick={() => setOpen(true)}
        title="AI Actions"
        className="text-[#F72585] hover:text-[#F72585] hover:bg-[#F72585]/10"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-[#F72585]" />
              AI Co-pilot
            </DialogTitle>
          </DialogHeader>

          {!result ? (
            <div className="px-3 pb-3">
              {/* Action buttons */}
              <div className="grid gap-1.5">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => runAction(action.id)}
                    disabled={loading}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3 text-left transition-all hover:bg-accent hover:shadow-sm disabled:opacity-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F72585]/10">
                      {loading && currentAction === action.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#F72585]" />
                      ) : (
                        <action.icon className="h-4 w-4 text-[#F72585]" />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium">{action.label}</p>
                      <p className="text-[11px] text-muted-foreground">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <ScrollArea className="max-h-[60vh] px-4 pb-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-[13px] leading-relaxed">
                    {result}
                  </div>
                </div>
              </ScrollArea>
              <div className="flex items-center justify-between border-t px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setResult(null)}
                  className="text-xs"
                >
                  ← Back
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        const actionLabel = actions.find((a) => a.id === currentAction)?.label || "AI Research";
                        const res = await fetch("/api/notes", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            title: `${actionLabel}: ${context.split("\n")[0]?.replace(/^(Idea|Task): /, "").slice(0, 50)}`,
                            content: result,
                            contentPlain: result,
                            projectId: projectId || null,
                          }),
                        });
                        if (res.ok) {
                          toast.success("Saved as note!");
                        } else {
                          toast.error("Failed to save");
                        }
                      } catch {
                        toast.error("Failed to save");
                      }
                    }}
                    className="text-xs text-[#30BCED] hover:text-[#30BCED]"
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    Save as Note
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                      toast.success("Copied");
                    }}
                    className="text-xs"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Pre-built action sets for different contexts
export const ideaActions: AIAction[] = [
  { id: "expand-idea", label: "Expand This Idea", icon: Lightbulb, description: "Flesh out the concept with pitch, audience, and features" },
  { id: "research-topic", label: "Research This Topic", icon: Search, description: "Get market context, competitors, and insights" },
  { id: "break-into-tasks", label: "Break Into Tasks", icon: ListChecks, description: "Generate actionable tasks from this idea" },
  { id: "suggest-improvements", label: "Suggest Improvements", icon: Zap, description: "Get feedback on what's missing or could be better" },
];

export const taskActions: AIAction[] = [
  { id: "write-description", label: "Write Description", icon: FileText, description: "AI writes a clear task description" },
  { id: "break-into-subtasks", label: "Break Into Subtasks", icon: GitBranch, description: "Split this into smaller pieces" },
  { id: "research-for-task", label: "Research This", icon: Search, description: "Get help on how to approach this task" },
];

export const projectActions: AIAction[] = [
  { id: "suggest-improvements", label: "Review Project", icon: Zap, description: "Get feedback on the project scope and approach" },
  { id: "break-into-tasks", label: "Generate Tasks", icon: ListChecks, description: "AI creates a task list for this project" },
  { id: "research-topic", label: "Research Market", icon: Search, description: "Research competitors and market landscape" },
];
