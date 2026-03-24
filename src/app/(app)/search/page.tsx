"use client";

import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Search"
        description="Search across all your content"
      />
      <div className="mx-auto max-w-xl">
        <Input
          placeholder="Search ideas, notes, scripts, files..."
          className="h-12 text-base"
        />
      </div>
      <EmptyState
        icon={Search}
        title="Search your workspace"
        description="Find anything across your ideas, notes, scripts, projects, and uploaded files."
      />
    </div>
  );
}
