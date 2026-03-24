import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  // Idea statuses
  new: { label: "New", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  exploring: { label: "Exploring", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  in_progress: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  done: { label: "Done", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground border-muted" },
  // Script statuses
  draft: { label: "Draft", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  editing: { label: "Editing", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  ready: { label: "Ready", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  published: { label: "Published", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  // Project statuses
  active: { label: "Active", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  completed: { label: "Completed", className: "bg-green-500/10 text-green-500 border-green-500/20" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
