import Link from "next/link";
import { Link2, Lightbulb, StickyNote, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LinkableItem } from "@/lib/services/links";

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

export function BacklinksPanel({ backlinks }: { backlinks: LinkableItem[] }) {
  if (backlinks.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4" />
          Backlinks ({backlinks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {backlinks.map((item) => {
          const Icon = typeIcons[item.type] || FileText;
          const href = typeHrefs[item.type]?.(item.id) || "#";
          return (
            <Link
              key={`${item.type}-${item.id}`}
              href={href}
              className="flex items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-accent"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate font-medium">{item.title}</span>
              <Badge variant="secondary" className="ml-auto text-xs capitalize shrink-0">
                {item.type}
              </Badge>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
