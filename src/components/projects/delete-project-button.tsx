"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "@/app/(app)/projects/actions";

export function DeleteProjectButton({ id }: { id: string }) {
  const handleDelete = async () => {
    if (!confirm("Delete this project? Ideas, notes, and scripts will be unlinked but not deleted.")) return;
    await deleteProjectAction(id);
  };

  return (
    <form action={handleDelete}>
      <Button type="submit" variant="ghost" size="icon" className="text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
