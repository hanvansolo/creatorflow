"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  Lightbulb,
  StickyNote,
  FileText,
  FolderKanban,
  MessageSquare,
  Search,
  Keyboard,
  Link2,
  Slash,
  Image,
  MonitorPlay,
  Library,
  Sun,
} from "lucide-react";

const sections = [
  {
    title: "Core Features",
    items: [
      { icon: Lightbulb, label: "Ideas", description: "Capture content ideas with tags and status tracking" },
      { icon: StickyNote, label: "Notes", description: "Rich text notes with images, links, and code blocks" },
      { icon: FileText, label: "Scripts", description: "Write scripts with status workflow and word count" },
      { icon: FolderKanban, label: "Projects", description: "Group related ideas, notes, and scripts together" },
      { icon: Library, label: "Library", description: "Upload and manage files, PDFs, and images" },
      { icon: MessageSquare, label: "AI Chat", description: "Ask questions — AI searches your content for answers" },
    ],
  },
  {
    title: "Editor Shortcuts",
    items: [
      { icon: Slash, label: "Slash Commands", description: "Type / to insert headings, lists, images, and more" },
      { icon: Link2, label: "Internal Links", description: "Type [[ to search and link to other content" },
      { icon: Image, label: "Images", description: "Insert images via URL from the toolbar or slash menu" },
      { icon: MonitorPlay, label: "YouTube", description: "Embed YouTube videos directly in your notes" },
    ],
  },
  {
    title: "Keyboard Shortcuts",
    items: [
      { icon: Keyboard, label: "Cmd + K", description: "Open command palette — search, navigate, create" },
      { icon: Search, label: "Cmd + K then type", description: "Search across all your content instantly" },
      { icon: Sun, label: "Theme Toggle", description: "Switch between dark and light mode from the topbar" },
    ],
  },
];

export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8"
        title="Help & Features"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>JottrPad Features</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="grid gap-2">
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
