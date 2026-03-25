"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Code,
  Code2,
  Minus,
  Image as ImageIcon,
  Link as LinkIcon,
  MonitorPlay,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCallback, useState } from "react";
import { ImageDialog, LinkDialog, YoutubeDialog } from "./editor-dialogs";

const lowlight = createLowlight(common);

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
      StarterKit.configure({
        codeBlock: false, // replaced by CodeBlockLowlight
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full" },
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 cursor-pointer",
        },
      }),
      Youtube.configure({
        HTMLAttributes: { class: "rounded-lg w-full aspect-video" },
        width: 0,
        height: 0,
      }),
      Highlight.configure({ multicolor: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Typography,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[400px] px-4 py-3 focus:outline-none [&_img]:my-4 [&_iframe]:my-4",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML(), editor.getText());
    },
  });

  const [imageOpen, setImageOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);

  const handleImageSubmit = useCallback(
    (url: string, alt?: string) => {
      if (!editor) return;
      editor.chain().focus().setImage({ src: url, alt }).run();
    },
    [editor]
  );

  const handleLinkSubmit = useCallback(
    (url: string) => {
      if (!editor) return;
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    },
    [editor]
  );

  const handleLinkRemove = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
  }, [editor]);

  const handleYoutubeSubmit = useCallback(
    (url: string) => {
      if (!editor) return;
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    },
    [editor]
  );

  if (!editor) return null;

  const currentLinkUrl = editor.getAttributes("link").href || "";

  return (
    <div
      className={cn(
        "rounded-lg border border-input bg-background",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          icon={Bold}
          tooltip="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          icon={Italic}
          tooltip="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          icon={UnderlineIcon}
          tooltip="Underline"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          icon={Strikethrough}
          tooltip="Strikethrough"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          icon={Highlighter}
          tooltip="Highlight"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          icon={Code}
          tooltip="Inline code"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          icon={Heading1}
          tooltip="Heading 1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          icon={Heading2}
          tooltip="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          icon={Heading3}
          tooltip="Heading 3"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          icon={AlignLeft}
          tooltip="Align left"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          icon={AlignCenter}
          tooltip="Align center"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          icon={AlignRight}
          tooltip="Align right"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Lists & blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          icon={List}
          tooltip="Bullet list"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          icon={ListOrdered}
          tooltip="Numbered list"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          icon={Quote}
          tooltip="Quote"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          icon={Code2}
          tooltip="Code block"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          active={false}
          icon={Minus}
          tooltip="Divider"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Media */}
        <ToolbarButton
          onClick={() => setImageOpen(true)}
          active={false}
          icon={ImageIcon}
          tooltip="Insert image"
        />
        <ToolbarButton
          onClick={() => setLinkOpen(true)}
          active={editor.isActive("link")}
          icon={LinkIcon}
          tooltip="Insert link"
        />
        {editor.isActive("link") && (
          <ToolbarButton
            onClick={handleLinkRemove}
            active={false}
            icon={Unlink}
            tooltip="Remove link"
          />
        )}
        <ToolbarButton
          onClick={() => setYoutubeOpen(true)}
          active={false}
          icon={MonitorPlay}
          tooltip="Embed YouTube"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          icon={Undo}
          tooltip="Undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          icon={Redo}
          tooltip="Redo"
        />
      </div>

      {/* Bubble menu for inline formatting */}
      <BubbleMenu
        editor={editor}
        className="flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-lg"
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          icon={Bold}
          tooltip="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          icon={Italic}
          tooltip="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          icon={UnderlineIcon}
          tooltip="Underline"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          icon={Highlighter}
          tooltip="Highlight"
        />
        <ToolbarButton
          onClick={() => setLinkOpen(true)}
          active={editor.isActive("link")}
          icon={LinkIcon}
          tooltip="Link"
        />
      </BubbleMenu>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Dialogs */}
      <ImageDialog
        open={imageOpen}
        onOpenChange={setImageOpen}
        onSubmit={handleImageSubmit}
      />
      <LinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        onSubmit={handleLinkSubmit}
        onRemove={handleLinkRemove}
        initialUrl={currentLinkUrl}
        hasLink={editor.isActive("link")}
      />
      <YoutubeDialog
        open={youtubeOpen}
        onOpenChange={setYoutubeOpen}
        onSubmit={handleYoutubeSubmit}
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  icon: Icon,
  tooltip,
}: {
  onClick: () => void;
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      className={cn(active && "bg-muted")}
      title={tooltip}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
