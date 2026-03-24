"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Code,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string, plainText: string) => void;
  placeholder?: string;
  className?: string;
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "Start writing...",
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[300px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML(), editor.getText());
    },
  });

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-input bg-background",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          icon={Bold}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          icon={Italic}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          icon={Code}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          icon={Heading1}
        />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          icon={Heading2}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          icon={List}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          icon={ListOrdered}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          icon={Quote}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false}
          icon={Minus}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          icon={Undo}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          icon={Redo}
        />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  icon: Icon,
}: {
  onClick: () => void;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      className={cn(active && "bg-muted")}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
