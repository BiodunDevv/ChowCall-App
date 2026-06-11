"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Download, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImagePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string | null;
  alt?: string;
};

export function ImagePreviewDialog({ open, onOpenChange, src, alt = "Image preview" }: ImagePreviewDialogProps) {
  if (!src) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl w-full gap-0 overflow-hidden border border-white/10 bg-black/90 p-0 shadow-2xl backdrop-blur-2xl"
        style={{ borderRadius: "1.25rem" }}
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-white/10">
              <ZoomIn className="size-3.5 text-white/70" />
            </div>
            <p className="max-w-xs truncate text-sm font-medium text-white/80">{alt}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            >
              <a href={src} download target="_blank" rel="noopener noreferrer">
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Image area */}
        <div className="flex max-h-[80vh] items-center justify-center p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-[72vh] w-auto max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
          />
        </div>

        {/* Footer hint */}
        <div className="border-t border-white/10 px-5 py-3 text-center">
          <p className="text-[11px] text-white/30">Click outside or press Esc to close</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
