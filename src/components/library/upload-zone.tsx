"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadZoneProps {
  onUploadComplete: () => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      setIsUploading(true);

      try {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Upload failed");
          }
        }

        toast.success(
          files.length === 1
            ? "File uploaded"
            : `${files.length} files uploaded`
        );
        onUploadComplete();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Upload failed"
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        className="hidden"
      />

      {isUploading ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Uploading...</p>
        </>
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">
            Drop files here or click to upload
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDFs, images, documents — up to 50MB each
          </p>
        </>
      )}
    </div>
  );
}
