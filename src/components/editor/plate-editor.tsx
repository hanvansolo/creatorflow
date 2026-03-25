"use client";

import { useCallback, useMemo, useRef } from "react";
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
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PlateEditorProps {
  content?: string;
  onChange?: (html: string, plainText: string) => void;
  placeholder?: string;
  className?: string;
}

// Serialize Plate value to plain text
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

// Serialize Plate value to simple HTML
function toHtml(value: any[]): string {
  return value
    .map((node: any) => {
      if (node.text !== undefined) {
        let text = node.text;
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

// Parse HTML back to Plate value (basic)
function fromHtml(html: string): any[] {
  if (!html || html.trim() === "") {
    return [{ type: "p", children: [{ text: "" }] }];
  }
  // For now, treat stored HTML as a paragraph with text
  // Full HTML parsing would require a DOM parser
  const text = html.replace(/<[^>]*>/g, "");
  if (!text.trim()) {
    return [{ type: "p", children: [{ text: "" }] }];
  }
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
      // Try parsing as JSON (Plate native format)
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fall back to HTML conversion
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
      const html = toHtml(value);
      const plain = toPlainText(value);
      onChange(html, plain);
    },
    [onChange]
  );

  const addImage = () => {
    const url = window.prompt("Image URL:");
    if (!url) return;
    editor.tf.insertNodes({
      type: "img",
      url,
      children: [{ text: "" }],
    });
  };

  const addLink = () => {
    const url = window.prompt("Link URL:");
    if (!url) return;
    editor.tf.insertNodes({
      type: "a",
      url,
      children: [{ text: url }],
    });
  };

  return (
    <div className={cn("rounded-xl border border-border/50 bg-background shadow-sm", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/40 px-3 py-1.5 bg-muted/20">
        <ToolbarButton
          onClick={() => editor.tf.toggleMark("bold")}
          icon={Bold}
          tooltip="Bold"
        />
        <ToolbarButton
          onClick={() => editor.tf.toggleMark("italic")}
          icon={Italic}
          tooltip="Italic"
        />
        <ToolbarButton
          onClick={() => editor.tf.toggleMark("underline")}
          icon={UnderlineIcon}
          tooltip="Underline"
        />
        <ToolbarButton
          onClick={() => editor.tf.toggleMark("strikethrough")}
          icon={Strikethrough}
          tooltip="Strikethrough"
        />
        <ToolbarButton
          onClick={() => editor.tf.toggleMark("highlight")}
          icon={Highlighter}
          tooltip="Highlight"
        />
        <ToolbarButton
          onClick={() => editor.tf.toggleMark("code")}
          icon={Code}
          tooltip="Inline code"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          onClick={() => editor.tf.toggleBlock("h1")}
          icon={Heading1}
          tooltip="Heading 1"
        />
        <ToolbarButton
          onClick={() => editor.tf.toggleBlock("h2")}
          icon={Heading2}
          tooltip="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.tf.toggleBlock("h3")}
          icon={Heading3}
          tooltip="Heading 3"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          onClick={() => editor.tf.toggleBlock("ul")}
          icon={List}
          tooltip="Bullet list"
        />
        <ToolbarButton
          onClick={() => editor.tf.toggleBlock("ol")}
          icon={ListOrdered}
          tooltip="Numbered list"
        />
        <ToolbarButton
          onClick={() => editor.tf.toggleBlock("blockquote")}
          icon={Quote}
          tooltip="Quote"
        />
        <ToolbarButton
          onClick={() => editor.tf.toggleBlock("code_block")}
          icon={Code2}
          tooltip="Code block"
        />
        <ToolbarButton
          onClick={() =>
            editor.tf.insertNodes({
              type: "hr",
              children: [{ text: "" }],
            })
          }
          icon={Minus}
          tooltip="Divider"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton onClick={addImage} icon={ImageIcon} tooltip="Insert image" />
        <ToolbarButton onClick={addLink} icon={LinkIcon} tooltip="Insert link" />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          onClick={() => editor.undo()}
          icon={Undo}
          tooltip="Undo"
        />
        <ToolbarButton
          onClick={() => editor.redo()}
          icon={Redo}
          tooltip="Redo"
        />
      </div>

      {/* Editor */}
      <Plate editor={editor} onValueChange={handleChange}>
        <PlateContent
          placeholder={placeholder}
          className="prose prose-base dark:prose-invert max-w-none min-h-[500px] px-8 py-6 focus:outline-none [&_img]:my-4 [&_img]:rounded-lg [&_img]:max-w-full [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_p]:leading-relaxed [&_blockquote]:border-l-primary/30 [&_pre]:bg-muted/50 [&_pre]:rounded-lg [&_code]:text-[13px]"
        />
      </Plate>
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
