"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Trash2, Calendar, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { AIActionMenu, taskActions } from "@/components/ai/ai-action-menu";

const priorityColors: Record<string, string> = {
  urgent: "#FF3B30",
  high: "#FF6B35",
  medium: "#FFD60A",
  low: "#2EC4B6",
};

const priorityLabels: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

interface KanbanBoardProps {
  projectId: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const fetchBoard = async () => {
    const res = await fetch(`/api/boards/${projectId}`);
    if (res.ok) {
      const data = await res.json();
      setColumns(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBoard(); }, [projectId]);

  const addTask = async (columnId: string) => {
    const title = newTaskTitle[columnId]?.trim();
    if (!title) return;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, columnId, title }),
    });

    if (res.ok) {
      setNewTaskTitle((prev) => ({ ...prev, [columnId]: "" }));
      setAddingTo(null);
      fetchBoard();
    }
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    fetchBoard();
  };

  const moveTaskToColumn = async (taskId: string, targetColumnId: string) => {
    await fetch("/api/tasks/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, targetColumnId, targetPosition: 0 }),
    });
    fetchBoard();
  };

  if (loading) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column: any) => (
        <div
          key={column.id}
          className="flex w-72 shrink-0 flex-col rounded-xl border border-border/50 bg-muted/20"
        >
          {/* Column header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: column.color || "#666" }}
              />
              <span className="text-[13px] font-semibold">{column.title}</span>
              <span className="text-[11px] text-muted-foreground">
                {column.tasks?.length || 0}
              </span>
            </div>
            <button
              onClick={() => setAddingTo(addingTo === column.id ? null : column.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Tasks */}
          <ScrollArea className="flex-1 px-2 py-2">
            <div className="space-y-2">
              {/* Add task input */}
              {addingTo === column.id && (
                <div className="rounded-lg border border-[#9B5DE5]/50 bg-background p-2 shadow-sm">
                  <Input
                    value={newTaskTitle[column.id] || ""}
                    onChange={(e) =>
                      setNewTaskTitle((prev) => ({
                        ...prev,
                        [column.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask(column.id);
                      if (e.key === "Escape") setAddingTo(null);
                    }}
                    placeholder="Task title..."
                    className="h-7 text-[12px] border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1 mt-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px]"
                      onClick={() => setAddingTo(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 text-[11px]"
                      onClick={() => addTask(column.id)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Task cards */}
              {column.tasks?.map((task: any) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  columns={columns}
                  currentColumnId={column.id}
                  onDelete={() => deleteTask(task.id)}
                  onMove={(targetColId) => moveTaskToColumn(task.id, targetColId)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}

function TaskCard({
  task,
  columns,
  currentColumnId,
  onDelete,
  onMove,
}: {
  task: any;
  columns: any[];
  currentColumnId: string;
  onDelete: () => void;
  onMove: (columnId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative rounded-lg border border-border/50 bg-background p-2.5 shadow-sm transition-all hover:shadow-md hover:border-border">
      {/* Priority indicator */}
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{ backgroundColor: priorityColors[task.priority] || "#666" }}
      />

      {/* Content */}
      <div className="pl-2">
        <div className="flex items-start justify-between gap-1">
          <p className="text-[12px] font-medium leading-snug">{task.title}</p>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
            <AIActionMenu
              actions={taskActions}
              context={`Task: ${task.title}\n${task.description || ""}`}
              buttonSize="sm"
            />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 hover:bg-accent hover:text-foreground transition-all"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 h-4"
            style={{ color: priorityColors[task.priority], borderColor: `${priorityColors[task.priority]}40` }}
          >
            {priorityLabels[task.priority] || task.priority}
          </Badge>

          {task.dueDate && (
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          )}

          {(task.labels as string[])?.map((label: string) => (
            <Badge key={label} variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div className="absolute right-0 top-6 z-50 rounded-lg border bg-popover p-1 shadow-xl min-w-[140px]">
          {columns
            .filter((c) => c.id !== currentColumnId)
            .map((col) => (
              <button
                key={col.id}
                onClick={() => { onMove(col.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] hover:bg-accent transition-colors"
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                Move to {col.title}
              </button>
            ))}
          <div className="my-1 border-t border-border/50" />
          <button
            onClick={() => { onDelete(); setMenuOpen(false); }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
