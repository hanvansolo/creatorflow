"use client";

import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";
import { createRoot } from "react-dom/client";
import { Lightbulb, StickyNote, FileText } from "lucide-react";

interface LinkItem {
  id: string;
  title: string;
  type: string;
}

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

interface LinkListProps {
  items: LinkItem[];
  command: (item: LinkItem) => void;
}

export interface LinkListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const LinkList = forwardRef<LinkListRef, LinkListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="z-50 w-64 rounded-lg border bg-popover p-2 shadow-lg">
          <p className="text-xs text-muted-foreground px-2 py-1">No results found</p>
        </div>
      );
    }

    return (
      <div className="z-50 max-h-52 w-64 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
        {items.map((item, index) => {
          const Icon = typeIcons[item.type] || FileText;
          return (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => selectItem(index)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                index === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{item.title}</span>
              <span className="ml-auto text-xs text-muted-foreground capitalize shrink-0">
                {item.type}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

LinkList.displayName = "LinkList";

export const InternalLinkExtension = Extension.create({
  name: "internalLink",

  addOptions() {
    return {
      suggestion: {
        char: "[[",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: any;
          range: any;
          props: LinkItem;
        }) => {
          const href = typeHrefs[props.type]?.(props.id) || "#";
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "text",
              marks: [
                {
                  type: "link",
                  attrs: { href },
                },
              ],
              text: props.title,
            })
            .run();
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: async ({ query }: { query: string }) => {
          if (query.length < 1) return [];
          try {
            const res = await fetch(
              `/api/links?q=${encodeURIComponent(query)}`
            );
            if (!res.ok) return [];
            return await res.json();
          } catch {
            return [];
          }
        },
        render: () => {
          let popup: HTMLDivElement | null = null;
          let root: any = null;
          let ref: LinkListRef | null = null;

          return {
            onStart: (props: any) => {
              popup = document.createElement("div");
              popup.style.position = "absolute";
              popup.style.zIndex = "50";
              document.body.appendChild(popup);

              root = createRoot(popup);

              if (props.clientRect) {
                const rect = props.clientRect();
                if (rect) {
                  popup.style.left = `${rect.left}px`;
                  popup.style.top = `${rect.bottom + 4}px`;
                }
              }

              root.render(
                <LinkList
                  ref={(r: LinkListRef | null) => {
                    ref = r;
                  }}
                  items={props.items}
                  command={props.command}
                />
              );
            },
            onUpdate: (props: any) => {
              if (!popup || !root) return;

              if (props.clientRect) {
                const rect = props.clientRect();
                if (rect) {
                  popup.style.left = `${rect.left}px`;
                  popup.style.top = `${rect.bottom + 4}px`;
                }
              }

              root.render(
                <LinkList
                  ref={(r: LinkListRef | null) => {
                    ref = r;
                  }}
                  items={props.items}
                  command={props.command}
                />
              );
            },
            onKeyDown: (props: any) => {
              if (props.event.key === "Escape") {
                if (popup) {
                  root?.unmount();
                  popup.remove();
                  popup = null;
                  root = null;
                }
                return true;
              }
              return ref?.onKeyDown(props) || false;
            },
            onExit: () => {
              if (popup) {
                root?.unmount();
                popup.remove();
                popup = null;
                root = null;
              }
            },
          };
        },
      }),
    ];
  },
});
