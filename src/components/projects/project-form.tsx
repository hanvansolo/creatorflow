"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/types";

const statuses = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const colors = [
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "pink", label: "Pink" },
  { value: "yellow", label: "Yellow" },
];

interface ProjectFormProps {
  project?: Project;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}

export function ProjectForm({ project, action, submitLabel }: ProjectFormProps) {
  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Project Name</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. YouTube Channel Relaunch"
          defaultValue={project?.title}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What is this project about?"
          defaultValue={project?.description || ""}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={project?.status || "active"}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Select name="color" defaultValue={project?.color || "blue"}>
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {colors.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
