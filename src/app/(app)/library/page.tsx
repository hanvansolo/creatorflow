"use client";

import { Library } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Upload and manage your files and documents"
      />
      <EmptyState
        icon={Library}
        title="Your library is empty"
        description="Upload PDFs, images, documents, and other files. They'll be searchable by AI across your workspace."
      />
    </div>
  );
}
