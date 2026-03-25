"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Lightbulb, StickyNote, FileText, Plus, Trash2,
  Settings2, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";
import { toast } from "sonner";
import { deleteProjectAction } from "../actions";
import { createNoteAction } from "../../notes/actions";
import { createScriptAction } from "../../scripts/actions";

const NoteEditorPage = dynamic(
  () => import("@/components/notes/note-editor-page").then((m) => m.NoteEditorPage),
  { ssr: false }
);
const ScriptEditorPage = dynamic(
  () => import("@/components/scripts/script-editor-page").then((m) => m.ScriptEditorPage),
  { ssr: false }
);

type Tab = "overview" | "notes" | "scripts" | "new-note" | "new-script";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  const fetchProject = () => {
    fetch(`/api/projects/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => { setProject(data); setLoading(false); })
      .catch(() => { setLoading(false); router.push("/projects"); });
  };

  useEffect(() => { fetchProject(); }, [id]);

  if (loading || !project) return null;

  const handleDelete = async () => {
    if (!confirm("Delete this project? Notes and scripts inside will also be deleted.")) return;
    await deleteProjectAction(id);
  };

  const tabs = [
    { key: "overview" as Tab, label: "Overview" },
    { key: "notes" as Tab, label: `Notes (${project.notes?.length || 0})`, icon: StickyNote, color: "text-[#30BCED]" },
    { key: "scripts" as Tab, label: `Scripts (${project.scripts?.length || 0})`, icon: FileText, color: "text-[#2EC4B6]" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
            <ChevronRight className="h-3 w-3" />
          </div>
          <h1 className="text-xl font-semibold">{project.title}</h1>
          {project.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon-sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/50">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-colors ${
              tab === t.key || (t.key === "notes" && tab === "new-note") || (t.key === "scripts" && tab === "new-script")
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon && <t.icon className={`h-3.5 w-3.5 ${t.color || ""}`} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Lightbulb className="h-4 w-4 text-[#FFD60A]" />
                Source Ideas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {!project.ideas?.length ? (
                <p className="py-3 text-center text-xs text-muted-foreground">Ideas that spawned this project will appear here</p>
              ) : (
                project.ideas.map((idea: any) => (
                  <Link key={idea.id} href={`/ideas/${idea.id}`}
                    className="flex items-center justify-between rounded-md border border-border/50 p-2.5 text-sm transition-all hover:bg-accent">
                    <span className="font-medium text-[13px]">{idea.title}</span>
                    <StatusBadge status={idea.status} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Project Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Notes</span>
                <span className="font-medium">{project.notes?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Scripts</span>
                <span className="font-medium">{project.scripts?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Files</span>
                <span className="font-medium">{project.files?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={project.status} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button onClick={() => setTab("new-note")}
                className="flex w-full items-center gap-2.5 rounded-md border border-border/50 p-2.5 text-sm transition-all hover:bg-accent">
                <StickyNote className="h-4 w-4 text-[#30BCED]" />
                <span className="font-medium text-[13px]">Write a Note</span>
              </button>
              <button onClick={() => setTab("new-script")}
                className="flex w-full items-center gap-2.5 rounded-md border border-border/50 p-2.5 text-sm transition-all hover:bg-accent">
                <FileText className="h-4 w-4 text-[#2EC4B6]" />
                <span className="font-medium text-[13px]">Write a Script</span>
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notes tab */}
      {tab === "notes" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setTab("new-note")}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Note
            </Button>
          </div>
          {!project.notes?.length ? (
            <div className="py-12 text-center">
              <StickyNote className="mx-auto h-8 w-8 text-[#30BCED]/30" />
              <p className="mt-3 text-sm text-muted-foreground">No notes yet</p>
              <Button size="sm" className="mt-3" onClick={() => setTab("new-note")}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Write First Note
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              {project.notes.map((note: any) => (
                <Link key={note.id} href={`/notes/${note.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-all hover:bg-accent hover:shadow-sm">
                  <div>
                    <h3 className="font-medium text-[13px]">{note.title}</h3>
                    {note.contentPlain && (
                      <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-1">{note.contentPlain.slice(0, 100)}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 ml-3">{formatDistanceToNow(note.updatedAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scripts tab */}
      {tab === "scripts" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setTab("new-script")}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Script
            </Button>
          </div>
          {!project.scripts?.length ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-[#2EC4B6]/30" />
              <p className="mt-3 text-sm text-muted-foreground">No scripts yet</p>
              <Button size="sm" className="mt-3" onClick={() => setTab("new-script")}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Write First Script
              </Button>
            </div>
          ) : (
            <div className="grid gap-2">
              {project.scripts.map((script: any) => (
                <Link key={script.id} href={`/scripts/${script.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-all hover:bg-accent hover:shadow-sm">
                  <div>
                    <h3 className="font-medium text-[13px]">{script.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <StatusBadge status={script.status} />
                    <Badge variant="secondary" className="text-[10px]">{script.wordCount} words</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New note inline */}
      {tab === "new-note" && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => { setTab("notes"); fetchProject(); }} className="mb-4">
            &larr; Back to Notes
          </Button>
          <NoteEditorPage createAction={createNoteAction} defaultProjectId={id} />
        </div>
      )}

      {/* New script inline */}
      {tab === "new-script" && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => { setTab("scripts"); fetchProject(); }} className="mb-4">
            &larr; Back to Scripts
          </Button>
          <ScriptEditorPage createAction={createScriptAction} defaultProjectId={id} />
        </div>
      )}
    </div>
  );
}
