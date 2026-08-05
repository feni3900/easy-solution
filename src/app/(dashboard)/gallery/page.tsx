"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Trash2, Copy, Loader2, Image, Grid, List, Search, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface GalleryImage {
  id: number;
  filename: string;
  url: string;
  size: number | null;
  mime_type: string | null;
  alt_text: string | null;
  folder: string;
  created_at: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/gallery");
    const json = await res.json();
    setImages(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/gallery", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        alert(`Upload failed: ${json.error}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm(`Delete "${image.filename}"?`)) return;

    const res = await fetch(`/api/gallery/${image.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      alert(`Delete failed: ${json.error}`);
    }
    if (selectedImage?.id === image.id) setSelectedImage(null);
    load();
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = images.filter((img) =>
    img.filename.toLowerCase().includes(search.toLowerCase()) ||
    (img.alt_text ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gallery</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Link href="/gallery/edit">
            <Button variant="outline">
              <Scissors className="size-4 mr-2" />
              Image Editor
            </Button>
          </Link>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Upload className="size-4 mr-2" />}
            {uploading ? "Uploading..." : "Upload Images"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search images..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant={view === "grid" ? "default" : "outline"} size="icon" onClick={() => setView("grid")}>
          <Grid className="size-4" />
        </Button>
        <Button variant={view === "list" ? "default" : "outline"} size="icon" onClick={() => setView("list")}>
          <List className="size-4" />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} images</p>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Image className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No images uploaded yet.</p>
          <Button className="mt-4" onClick={() => fileInputRef.current?.click()}>Upload your first image</Button>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((img) => (
            <div
              key={img.id}
              className={`group relative rounded-lg border bg-card overflow-hidden cursor-pointer transition-all ${selectedImage?.id === img.id ? "ring-2 ring-primary" : "hover:shadow-md"}`}
              onClick={() => setSelectedImage(img)}
            >
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                <img src={img.url} alt={img.alt_text ?? img.filename} className="h-full w-full object-cover" />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{img.filename}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(img.size)}</p>
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); copyUrl(img.url); }}
                  className="rounded bg-black/60 p-1 text-white hover:bg-black/80"
                  title="Copy URL"
                >
                  <Copy className="size-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
                  className="rounded bg-red-600/80 p-1 text-white hover:bg-red-600"
                  title="Delete"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
              {copied === img.url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-xs font-medium">
                  Copied!
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium w-16">Preview</th>
                <th className="p-3 text-left font-medium">Filename</th>
                <th className="p-3 text-left font-medium">Size</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium">Date</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((img) => (
                <tr key={img.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedImage(img)}>
                  <td className="p-2">
                    <img src={img.url} alt="" className="w-10 h-10 rounded object-cover" />
                  </td>
                  <td className="p-3 font-medium">{img.filename}</td>
                  <td className="p-3 text-muted-foreground">{formatSize(img.size)}</td>
                  <td className="p-3 text-muted-foreground">{img.mime_type ?? "-"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(img.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); copyUrl(img.url); }}>
                      <Copy className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(img); }}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full bg-card rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <p className="font-medium">{selectedImage.filename}</p>
                <p className="text-sm text-muted-foreground">{formatSize(selectedImage.size)} · {selectedImage.mime_type}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copyUrl(selectedImage.url)}>
                  <Copy className="size-4 mr-1" /> Copy URL
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedImage)}>
                  <Trash2 className="size-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-muted/50" style={{ maxHeight: "70vh" }}>
              <img src={selectedImage.url} alt={selectedImage.alt_text ?? ""} className="max-w-full max-h-[65vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
