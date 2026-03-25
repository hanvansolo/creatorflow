"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Plate,
  PlateContent,
  usePlateEditor,
  ParagraphPlugin,
} from "@udecode/plate/react";
import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin, CodePlugin } from "@udecode/plate-basic-marks/react";
import { HeadingPlugin } from "@udecode/plate-heading/react";
import { ListPlugin, BulletedListPlugin, NumberedListPlugin } from "@udecode/plate-list/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { CodeBlockPlugin } from "@udecode/plate-code-block/react";
import { LinkPlugin } from "@udecode/plate-link/react";
import { ImagePlugin } from "@udecode/plate-media/react";
import { HighlightPlugin } from "@udecode/plate-highlight/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { BaseTextAlignPlugin } from "@udecode/plate-alignment";
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
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ContentLinkDialog } from "./content-link-dialog";

interface PlateEditorProps {
  content?: string;
  onChange?: (html: string, plainText: string) => void;
  placeholder?: string;
  className?: string;
}

function toPlainText(value: any[]): string {
  return value
    .map((node: any) => {
      if (node.text !== undefined) return node.text;
      if (node.children) return toPlainText(node.children);
      return "";
    })
    .join("\n")
    .trim();
}

function toHtml(value: any[]): string {
  return value
    .map((node: any) => {
      if (node.text !== undefined) {
        let text = node.text;
        if (!text) return "";
        if (node.bold) text = `<strong>${text}</strong>`;
        if (node.italic) text = `<em>${text}</em>`;
        if (node.underline) text = `<u>${text}</u>`;
        if (node.strikethrough) text = `<s>${text}</s>`;
        if (node.code) text = `<code>${text}</code>`;
        if (node.highlight) text = `<mark>${text}</mark>`;
        return text;
      }
      const children = node.children ? toHtml(node.children) : "";
      switch (node.type) {
        case "h1": return `<h1>${children}</h1>`;
        case "h2": return `<h2>${children}</h2>`;
        case "h3": return `<h3>${children}</h3>`;
        case "p": return `<p>${children}</p>`;
        case "blockquote": return `<blockquote>${children}</blockquote>`;
        case "code_block": return `<pre><code>${children}</code></pre>`;
        case "code_line": return children;
        case "ul": return `<ul>${children}</ul>`;
        case "ol": return `<ol>${children}</ol>`;
        case "li": return `<li>${children}</li>`;
        case "lic": return children;
        case "a": return `<a href="${node.url || ""}">${children}</a>`;
        case "img": return `<img src="${node.url || ""}" alt="${node.caption || ""}" />`;
        case "hr": return "<hr />";
        default: return `<p>${children}</p>`;
      }
    })
    .join("");
}

function fromHtml(html: string): any[] {
  if (!html || html.trim() === "") {
    return [{ type: "p", children: [{ text: "" }] }];
  }
  const text = html.replace(/<[^>]*>/g, "");
  if (!text.trim()) return [{ type: "p", children: [{ text: "" }] }];
  return [{ type: "p", children: [{ text }] }];
}

export function PlateEditor({
  content = "",
  onChange,
  placeholder = "Start writing...",
  className,
}: PlateEditorProps) {
  const initialValue = useMemo(() => {
    if (!content) return [{ type: "p", children: [{ text: "" }] }];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return fromHtml(content);
    }
    return [{ type: "p", children: [{ text: "" }] }];
  }, []);

  const editor = usePlateEditor({
    plugins: [
      ParagraphPlugin,
      HeadingPlugin,
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin,
      HighlightPlugin,
      BlockquotePlugin,
      CodeBlockPlugin,
      ListPlugin,
      BulletedListPlugin,
      NumberedListPlugin,
      LinkPlugin.configure({ options: { forceSubmit: true } }),
      ImagePlugin,
      HorizontalRulePlugin,
      BaseTextAlignPlugin,
    ],
    value: initialValue,
  });

  const handleChange = useCallback(
    ({ value }: { value: any[] }) => {
      if (!onChange) return;
      onChange(toHtml(value), toPlainText(value));
    },
    [onChange]
  );

  // Dialogs
  const [contentLinkOpen, setContentLinkOpen] = useState(false);

  const handleContentLink = (title: string, href: string) => {
    // Insert as a link node directly in the Plate document
    editor.tf.insertNodes(
      {
        type: "a",
        url: href,
        children: [{ text: title }],
      },
      { at: editor.selection || undefined }
    );
  };

  const addImage = () => {
    const url = window.prompt("Image URL:");
    if (!url) return;
    editor.tf.insertNodes({ type: "img", url, children: [{ text: "" }] });
  };

  const addLink = () => {
    const url = window.prompt("URL:");
    if (!url) return;
    const text = window.prompt("Link text:", url) || url;
    editor.tf.insertNodes({ type: "a", url, children: [{ text }] });
  };

  // Slash commands
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);

  const slashCommands = [
    { label: "Heading 1", icon: Heading1, action: () => editor.tf.toggleBlock("h1") },
    { label: "Heading 2", icon: Heading2, action: () => editor.tf.toggleBlock("h2") },
    { label: "Heading 3", icon: Heading3, action: () => editor.tf.toggleBlock("h3") },
    { label: "Bullet List", icon: List, action: () => editor.tf.toggleBlock("ul") },
    { label: "Numbered List", icon: ListOrdered, action: () => editor.tf.toggleBlock("ol") },
    { label: "Quote", icon: Quote, action: () => editor.tf.toggleBlock("blockquote") },
    { label: "Code Block", icon: Code2, action: () => editor.tf.toggleBlock("code_block") },
    { label: "Divider", icon: Minus, action: () => editor.tf.insertNodes({ type: "hr", children: [{ text: "" }] }) },
    { label: "Image", icon: ImageIcon, action: addImage },
    { label: "Link to Content", icon: Link2, action: () => setContentLinkOpen(true) },
  ];

  const filteredCommands = slashCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (slashOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && filteredCommands[slashIndex]) {
          e.preventDefault();
          e.stopPropagation();
          editor.tf.deleteBackward("character");
          for (let i = 0; i < slashFilter.length; i++) {
            editor.tf.deleteBackward("character");
          }
          filteredCommands[slashIndex].action();
          setSlashOpen(false);
          setSlashFilter("");
          setSlashIndex(0);
        } else if (e.key === "Escape") {
          setSlashOpen(false);
          setSlashFilter("");
          setSlashIndex(0);
        } else if (e.key === "Backspace") {
          if (slashFilter.length === 0) setSlashOpen(false);
          else { setSlashFilter((prev) => prev.slice(0, -1)); setSlashIndex(0); }
        } else if (e.key === " ") {
          setSlashOpen(false);
          setSlashFilter("");
        } else if (e.key.length === 1) {
          setSlashFilter((prev) => prev + e.key);
          setSlashIndex(0);
        }
        return;
      }

      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        setSlashOpen(true);
        setSlashFilter("");
        setSlashIndex(0);
      }
    },
    [slashOpen, slashFilter, slashIndex, filteredCommands, editor]
  );

  return (
    <div className={cn("relative rounded-xl border border-border/50 bg-background shadow-sm", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/40 px-3 py-1.5 bg-muted/20">
        <ToolbarButton onClick={() => editor.tf.toggleMark("bold")} icon={Bold} tooltip="Bold" />
        <ToolbarButton onClick={() => editor.tf.toggleMark("italic")} icon={Italic} tooltip="Italic" />
        <ToolbarButton onClick={() => editor.tf.toggleMark("underline")} icon={UnderlineIcon} tooltip="Underline" />
        <ToolbarButton onClick={() => editor.tf.toggleMark("strikethrough")} icon={Strikethrough} tooltip="Strikethrough" />
        <ToolbarButton onClick={() => editor.tf.toggleMark("highlight")} icon={Highlighter} tooltip="Highlight" />
        <ToolbarButton onClick={() => editor.tf.toggleMark("code")} icon={Code} tooltip="Inline code" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton onClick={() => editor.tf.toggleBlock("h1")} icon={Heading1} tooltip="Heading 1" />
        <ToolbarButton onClick={() => editor.tf.toggleBlock("h2")} icon={Heading2} tooltip="Heading 2" />
        <ToolbarButton onClick={() => editor.tf.toggleBlock("h3")} icon={Heading3} tooltip="Heading 3" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton onClick={() => editor.tf.toggleBlock("ul")} icon={List} tooltip="Bullet list" />
        <ToolbarButton onClick={() => editor.tf.toggleBlock("ol")} icon={ListOrdered} tooltip="Numbered list" />
        <ToolbarButton onClick={() => editor.tf.toggleBlock("blockquote")} icon={Quote} tooltip="Quote" />
        <ToolbarButton onClick={() => editor.tf.toggleBlock("code_block")} icon={Code2} tooltip="Code block" />
        <ToolbarButton onClick={() => editor.tf.insertNodes({ type: "hr", children: [{ text: "" }] })} icon={Minus} tooltip="Divider" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton onClick={addImage} icon={ImageIcon} tooltip="Insert image" />
        <ToolbarButton onClick={addLink} icon={LinkIcon} tooltip="Insert URL link" />
        <ToolbarButton onClick={() => setContentLinkOpen(true)} icon={Link2} tooltip="Link to content" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton onClick={() => editor.undo()} icon={Undo} tooltip="Undo" />
        <ToolbarButton onClick={() => editor.redo()} icon={Redo} tooltip="Redo" />
      </div>

      {/* Editor */}
      <div className="relative" onKeyDownCapture={handleKeyDown}>
        <Plate editor={editor} onValueChange={handleChange}>
          <PlateContent
            placeholder={placeholder}
            className="prose prose-base dark:prose-invert max-w-none min-h-[500px] px-8 py-6 focus:outline-none [&_img]:my-4 [&_img]:rounded-lg [&_img]:max-w-full [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_p]:leading-relaxed [&_blockquote]:border-l-primary/30 [&_pre]:bg-muted/50 [&_pre]:rounded-lg [&_code]:text-[13px] [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2"
          />
        </Plate>

        {/* Slash command menu */}
        {slashOpen && filteredCommands.length > 0 && (
          <div className="absolute left-8 top-12 z-50 max-h-64 w-56 overflow-y-auto rounded-lg border bg-popover p-1 shadow-xl animate-in fade-in-0 zoom-in-95">
            {filteredCommands.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor.tf.deleteBackward("character");
                    for (let j = 0; j < slashFilter.length; j++) {
                      editor.tf.deleteBackward("character");
                    }
                    cmd.action();
                    setSlashOpen(false);
                    setSlashFilter("");
                    setSlashIndex(0);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors",
                    i === slashIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[13px]">{cmd.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content link dialog */}
      <ContentLinkDialog
        open={contentLinkOpen}
        onOpenChange={setContentLinkOpen}
        onSelect={handleContentLink}
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  icon: Icon,
  tooltip,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/70 transition-all hover:bg-background hover:text-foreground hover:shadow-sm"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
