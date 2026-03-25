"use client";

import { useRef } from "react";
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
import type { Idea } from "@/types";

const statuses = [
  { value: "new", label: "New" },
  { value: "exploring", label: "Exploring" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" },
];

interface IdeaFormProps {
  idea?: Idea & { tags?: string[] };
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  defaultProjectId?: string;
}

export function IdeaForm({ idea, action, submitLabel, defaultProjectId }: IdeaFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="What's the idea?"
          defaultValue={idea?.title}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Description</Label>
        <Textarea
          id="body"
          name="body"
          placeholder="Describe your idea... What's the concept? Why is it interesting?"
          defaultValue={idea?.body || ""}
          rows={6}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={idea?.status || "new"}>
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
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="comma, separated, tags"
            defaultValue={idea?.tags?.join(", ") || ""}
          />
        </div>
      </div>

      <input type="hidden" name="projectId" value={idea?.projectId || defaultProjectId || ""} />

      <div className="flex gap-3">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
