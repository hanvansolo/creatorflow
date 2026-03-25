"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Trash2, Calendar, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { AIActionMenu, taskActions } from "@/components/ai/ai-action-menu";

const priorityColors: Record<string, string> = {
  urgent: "#ef4444", high: "#FF6B35", medium: "#FFD60A", low: "#2EC4B6",
};
const priorityLabels: Record<string, string> = {
  urgent: "Urgent", high: "High", medium: "Medium", low: "Low",
};

interface KanbanBoardProps { projectId: string; }

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBoard = async () => {
    const res = await fetch(`/api/boards/${projectId}`);
    if (res.ok) setColumns(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchBoard(); }, [projectId]);

  const addTask = async (columnId: string) => {
    const title = newTaskTitle[columnId]?.trim();
    if (!title) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, columnId, title }),
    });
    setNewTaskTitle((prev) => ({ ...prev, [columnId]: "" }));
    setAddingTo(null);
    fetchBoard();
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    fetchBoard();
    setEditingTask(null);
  };

  const moveTask = async (taskId: string, targetColumnId: string) => {
    await fetch("/api/tasks/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, targetColumnId, targetPosition: 0 }),
    });
    fetchBoard();
  };

  const saveTask = async () => {
    if (!editingTask) return;
    setSaving(true);
    await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate || null,
      }),
    });
    setSaving(false);
    toast.success("Task updated");
    fetchBoard();
    setEditingTask(null);
  };

  if (loading) return null;

  return (
    <>
      <div className="flex gap-3 h-[calc(100vh-11rem)] overflow-x-auto pb-2">
        {columns.map((column: any) => (
          <div key={column.id} className="flex w-64 shrink-0 flex-col rounded-xl glass-card overflow-hidden">
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/20">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color || "#666" }} />
                <span className="text-[12px] font-semibold">{column.title}</span>
                <span className="text-[10px] text-muted-foreground">{column.tasks?.length || 0}</span>
              </div>
              <button onClick={() => setAddingTo(addingTo === column.id ? null : column.id)}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Tasks */}
            <ScrollArea className="flex-1 px-2 py-2">
              <div className="space-y-1.5">
                {addingTo === column.id && (
                  <div className="rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/5 p-2">
                    <Input value={newTaskTitle[column.id] || ""}
                      onChange={(e) => setNewTaskTitle((prev) => ({ ...prev, [column.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") addTask(column.id); if (e.key === "Escape") setAddingTo(null); }}
                      placeholder="Task title..."
                      className="h-6 text-[11px] border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                      autoFocus />
                    <div className="flex justify-end gap-1 mt-1">
                      <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={() => setAddingTo(null)}>Cancel</Button>
                      <Button size="sm" className="h-5 text-[10px] px-2" onClick={() => addTask(column.id)}>Add</Button>
                    </div>
                  </div>
                )}

                {column.tasks?.map((task: any) => (
                  <div key={task.id}
                    onClick={() => setEditingTask(task)}
                    className="group relative rounded-lg border border-border/30 bg-[#111b2e]/80 p-2 cursor-pointer transition-all hover:border-border/60 hover:bg-[#111b2e]">
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full" style={{ backgroundColor: priorityColors[task.priority] || "#666" }} />
                    <div className="pl-2">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[11px] font-medium leading-snug">{task.title}</p>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                          <AIActionMenu actions={taskActions} context={`Task: ${task.title}\n${task.description || ""}`} buttonSize="sm" />
                        </div>
                      </div>
                      {task.description && <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5"
                          style={{ color: priorityColors[task.priority], borderColor: `${priorityColors[task.priority]}30` }}>
                          {priorityLabels[task.priority] || task.priority}
                        </Badge>
                        {task.dueDate && (
                          <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground">
                            <Calendar className="h-2 w-2" />
                            {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>

      {/* Task detail dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="sm:max-w-md glass-card-glow-purple">
            <DialogHeader>
              <DialogTitle className="text-sm">Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Title</Label>
                <Input value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Description</Label>
                <Textarea value={editingTask.description || ""} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={4} className="text-sm" placeholder="Add details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Priority</Label>
                  <Select value={editingTask.priority} onValueChange={(v) => v && setEditingTask({ ...editingTask, priority: v })}>
                    <SelectTrigger className="text-sm h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Move to</Label>
                  <Select onValueChange={(v: string | null) => { if (v) { moveTask(editingTask.id, v); setEditingTask(null); } }}>
                    <SelectTrigger className="text-sm h-8"><SelectValue placeholder="Column..." /></SelectTrigger>
                    <SelectContent>
                      {columns.map((col: any) => (
                        <SelectItem key={col.id} value={col.id}>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                            {col.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => deleteTask(editingTask.id)} className="text-red-400 hover:text-red-400 hover:bg-red-500/10 text-[11px]">
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
                <Button size="sm" onClick={saveTask} disabled={saving} className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white border-0 text-[11px]">
                  {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />} Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
