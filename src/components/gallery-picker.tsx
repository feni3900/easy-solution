"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, ImageIcon } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  file_name: string | null;
}

interface GalleryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  title?: string;
}

export function GalleryPicker({ open, onOpenChange, onSelect, title = "Image Gallery" }: GalleryPickerProps) {
  const supabase = createClient();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("image_gallery")
        .select("id, url, file_name")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        console.error(error);
        setError("Failed to load gallery.");
      } else {
        setImages(data ?? []);
      }
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [open, loaded, supabase]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setUploading(true);
    setError("");
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upError } = await supabase.storage
      .from("gallery")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upError) {
      console.error(upError);
      setError("Upload failed.");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(path);
    const { error: insertError } = await supabase
      .from("image_gallery")
      .insert({ url: urlData.publicUrl, file_name: file.name, mime_type: file.type, size: file.size });
    if (insertError) {
      console.error(insertError);
      setError("Upload succeeded but could not be saved to gallery.");
    } else {
      await load();
    }
    setUploading(false);
  };

  const load = async () => {
    const { data, error } = await supabase
      .from("image_gallery")
      .select("id, url, file_name")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setError("Failed to load gallery.");
    } else {
      setImages(data ?? []);
    }
  };

  const handleDelete = async (img: GalleryImage) => {
    const fileName = img.url.split("/").pop();
    const { error: delError } = await supabase.storage.from("gallery").remove([fileName ?? ""]);
    if (delError) console.error(delError);
    await supabase.from("image_gallery").delete().eq("id", img.id);
    await load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Upload an image or pick one from the gallery.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>

        <div className="max-h-96 overflow-y-auto rounded-lg border p-2">
          {!loaded ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading gallery...
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-sm text-muted-foreground">
              <ImageIcon className="size-8 opacity-40" />
              No images yet. Upload one above.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((img) => (
                <div key={img.id} className="group relative">
                  <button
                    className="block w-full overflow-hidden rounded-md border transition-opacity hover:opacity-80"
                    onClick={() => {
                      onSelect(img.url);
                      onOpenChange(false);
                    }}
                    title={img.file_name ?? ""}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.file_name ?? "Gallery image"} className="aspect-square w-full object-cover" />
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(img)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
