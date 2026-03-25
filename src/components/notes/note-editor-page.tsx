"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const TiptapEditor = dynamic(
  () => import("@/components/editor/tiptap-editor").then((m) => m.TiptapEditor),
  { ssr: false, loading: () => <div className="h-[400px] rounded-lg border border-input bg-background animate-pulse" /> }
);
import { Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Note } from "@/types";

interface NoteEditorPageProps {
  note?: Note;
  tags?: string[];
  createAction: (data: {
    title: string;
    content?: string;
    contentPlain?: string;
    tags?: string[];
  }) => Promise<{ id: string }>;
  updateAction?: (
    id: string,
    data: {
      title?: string;
      content?: string;
      contentPlain?: string;
      tags?: string[];
    }
  ) => Promise<void>;
  deleteAction?: (id: string) => Promise<void>;
}

export function NoteEditorPage({
  note,
  tags = [],
  createAction,
  updateAction,
  deleteAction,
}: NoteEditorPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [contentPlain, setContentPlain] = useState(note?.contentPlain || "");
  const [tagInput, setTagInput] = useState(tags.join(", "));

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
      if (note && updateAction) {
        await updateAction(note.id, {
          title,
          content,
          contentPlain,
          tags: tagList,
        });
        toast.success("Note saved");
      } else {
        const created = await createAction({
          title,
          content,
          contentPlain,
          tags: tagList,
        });
        toast.success("Note created");
        router.push(`/notes/${created.id}`);
      }
    });
  };

  const handleDelete = () => {
    if (!note || !deleteAction) return;
    if (!confirm("Delete this note? This cannot be undone.")) return;

    startTransition(async () => {
      await deleteAction(note.id);
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="border-none bg-transparent text-2xl font-bold shadow-none focus-visible:ring-0 px-0 h-auto"
        />
        <div className="flex items-center gap-2 shrink-0">
          {note && deleteAction && (
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

      {/* Tags */}
      <Input
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        placeholder="Tags (comma separated)"
        className="max-w-md text-sm"
      />

      {/* Editor */}
      <TiptapEditor
        content={content}
        onChange={(html, plain) => {
          setContent(html);
          setContentPlain(plain);
        }}
        placeholder="Start writing your note..."
      />
    </div>
  );
}
