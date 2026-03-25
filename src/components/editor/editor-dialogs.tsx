"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// ============================================
// Image Dialog
// ============================================
interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string, alt?: string) => void;
}

export function ImageDialog({ open, onOpenChange, onSubmit }: ImageDialogProps) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim(), alt.trim() || undefined);
    setUrl("");
    setAlt("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-alt">Alt text (optional)</Label>
            <Input
              id="image-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim()}>
              Insert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Link Dialog
// ============================================
interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
  onRemove: () => void;
  initialUrl?: string;
  hasLink: boolean;
}

export function LinkDialog({
  open,
  onOpenChange,
  onSubmit,
  onRemove,
  initialUrl = "",
  hasLink,
}: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);

  // Reset when dialog opens with new initialUrl
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) setUrl(initialUrl);
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim());
    setUrl("");
    onOpenChange(false);
  };

  const handleRemove = () => {
    onRemove();
    setUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasLink ? "Edit Link" : "Insert Link"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              autoFocus
            />
          </div>
          <DialogFooter>
            {hasLink && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                className="mr-auto"
              >
                Remove Link
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim()}>
              {hasLink ? "Update" : "Insert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// YouTube Dialog
// ============================================
interface YoutubeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (url: string) => void;
}

export function YoutubeDialog({ open, onOpenChange, onSubmit }: YoutubeDialogProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim());
    setUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Embed YouTube Video</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <Input
              id="youtube-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Paste a YouTube video URL or share link
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim()}>
              Embed
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
