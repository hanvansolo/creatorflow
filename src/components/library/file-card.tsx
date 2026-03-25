"use client";

import {
  FileText,
  Image as ImageIcon,
  Film,
  FileSpreadsheet,
  File,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, formatFileSize } from "@/lib/utils";
import type { File as FileType, Project } from "@/types";

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv"))
    return FileSpreadsheet;
  return File;
}

interface FileCardProps {
  file: FileType & { project?: Project | null };
  onDelete: (id: string) => void;
}

export function FileCard({ file, onDelete }: FileCardProps) {
  const Icon = getFileIcon(file.mimeType);
  const isImage = file.mimeType.startsWith("image/");

  return (
    <Card className="group overflow-hidden">
      {/* Preview area */}
      <div className="relative flex h-32 items-center justify-center bg-muted/50">
        {isImage && file.storageUrl ? (
          <img
            src={file.storageUrl}
            alt={file.originalName}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon className="h-10 w-10 text-muted-foreground/40" />
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
          {file.storageUrl && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => window.open(file.storageUrl!, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(file.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <CardContent className="p-3">
        <p className="truncate text-sm font-medium" title={file.originalName}>
          {file.originalName}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {formatFileSize(file.sizeBytes)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(file.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
