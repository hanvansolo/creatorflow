"use client";

import { useState, useEffect, useTransition } from "react";
import { Library } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { UploadZone } from "@/components/library/upload-zone";
import { FileCard } from "@/components/library/file-card";
import { deleteFileAction } from "./actions";
import { toast } from "sonner";
import type { File as FileType, Project } from "@/types";

export default function LibraryPage() {
  const [files, setFiles] = useState<(FileType & { project?: Project | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchFiles = async () => {
    const res = await fetch("/api/library");
    if (res.ok) {
      const data = await res.json();
      setFiles(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm("Delete this file? This cannot be undone.")) return;

    startTransition(async () => {
      await deleteFileAction(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success("File deleted");
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Upload and manage your files and documents"
      />

      <UploadZone onUploadComplete={fetchFiles} />

      {loading ? null : files.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Your library is empty"
          description="Upload PDFs, images, documents, and other files. They'll be searchable by AI across your workspace."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => (
            <FileCard key={file.id} file={file} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
