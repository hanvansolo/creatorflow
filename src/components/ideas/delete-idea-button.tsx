"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteIdeaAction } from "@/app/(app)/ideas/actions";

export function DeleteIdeaButton({ id }: { id: string }) {
  const handleDelete = async () => {
    if (!confirm("Delete this idea? This cannot be undone.")) return;
    await deleteIdeaAction(id);
  };

  return (
    <form action={handleDelete}>
      <Button type="submit" variant="ghost" size="icon" className="text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
