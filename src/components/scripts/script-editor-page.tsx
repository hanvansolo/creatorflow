"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamic from "next/dynamic";
const TiptapEditor = dynamic(
  () => import("@/components/editor/tiptap-editor").then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <div className="h-[400px] rounded-lg border border-input bg-background animate-pulse" /> }
);
import { Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { wordCount } from "@/lib/utils";
import type { Script } from "@/types";

const statuses = [
  { value: "draft", label: "Draft" },
  { value: "editing", label: "Editing" },
  { value: "ready", label: "Ready" },
  { value: "published", label: "Published" },
];

interface ScriptEditorPageProps {
  script?: Script;
  tags?: string[];
  createAction: (data: {
    title: string;
    content?: string;
    contentPlain?: string;
    status?: string;
    tags?: string[];
  }) => Promise<{ id: string }>;
  updateAction?: (
    id: string,
    data: {
      title?: string;
      content?: string;
      contentPlain?: string;
      status?: string;
      tags?: string[];
    }
  ) => Promise<void>;
  deleteAction?: (id: string) => Promise<void>;
}

export function ScriptEditorPage({
  script,
  tags = [],
  createAction,
  updateAction,
  deleteAction,
}: ScriptEditorPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(script?.title || "");
  const [content, setContent] = useState(script?.content || "");
  const [contentPlain, setContentPlain] = useState(script?.contentPlain || "");
  const [status, setStatus] = useState(script?.status || "draft");
  const [tagInput, setTagInput] = useState(tags.join(", "));

  const wc = contentPlain ? wordCount(contentPlain) : 0;

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const tagList = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      if (script && updateAction) {
        await updateAction(script.id, {
          title,
          content,
          contentPlain,
          status,
          tags: tagList,
        });
        toast.success("Script saved");
      } else {
        const created = await createAction({
          title,
          content,
          contentPlain,
          status,
          tags: tagList,
        });
        toast.success("Script created");
        router.push(`/scripts/${created.id}`);
      }
    });
  };

  const handleDelete = () => {
    if (!script || !deleteAction) return;
    if (!confirm("Delete this script? This cannot be undone.")) return;

    startTransition(async () => {
      await deleteAction(script.id);
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Script title..."
          className="border-none bg-transparent text-2xl font-bold shadow-none focus-visible:ring-0 px-0 h-auto"
        />
        <div className="flex items-center gap-2 shrink-0">
          {script && deleteAction && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4">
        <Select value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Tags (comma separated)"
          className="max-w-xs text-sm"
        />

        <Badge variant="secondary" className="shrink-0">
          {wc} words
        </Badge>
      </div>

      {/* Editor */}
      <TiptapEditor
        content={content}
        onChange={(html, plain) => {
          setContent(html);
          setContentPlain(plain);
        }}
        placeholder="Start writing your script..."
      />
    </div>
  );
}
