"use client";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function ScriptsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Scripts"
        description="Write and manage your content scripts"
        actionLabel="New Script"
        actionHref="/scripts/new"
      />
      <EmptyState
        icon={FileText}
        title="No scripts yet"
        description="Write scripts for your videos, podcasts, or any content. Track them from draft to published."
        actionLabel="Start your first script"
        actionHref="/scripts/new"
      />
    </div>
  );
}
