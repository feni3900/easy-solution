"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Copy, Check } from "lucide-react";
import { getClientLocale, t, fmtInt, translateWithVars } from "@/lib/i18n";

interface GalleryImage {
  id: string;
  url: string;
  file_name: string | null;
  created_at: string;
}

export function GalleryClient({ initialImages }: { initialImages: GalleryImage[] }) {
  const locale = getClientLocale();
  const router = useRouter();
  const supabase = createClient();
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    const { data } = await supabase
      .from("image_gallery")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setImages(data);
  };

  const uploadOne = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upError } = await supabase.storage
      .from("gallery")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upError) throw upError;
    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(path);
    const { error: insertError } = await supabase
      .from("image_gallery")
      .insert({ url: urlData.publicUrl, file_name: file.name, mime_type: file.type, size: file.size });
    if (insertError) throw insertError;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (files.some((f) => !f.type.startsWith("image/"))) {
      setError(t("gallery.imageOnly", locale));
      return;
    }
    setUploading(true);
    setError("");
    setUploadedCount(0);
    let ok = 0;
    let failed = 0;
    for (const file of files) {
      try {
        await uploadOne(file);
        ok += 1;
        setUploadedCount(ok);
      } catch (err) {
        console.error(err);
        failed += 1;
      }
    }
    if (failed > 0) {
      setError(translateWithVars(t("gallery.uploadResult", locale), { ok: fmtInt(ok, locale), failed: fmtInt(failed, locale) }));
    }
    await reload();
    router.refresh();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async (img: GalleryImage) => {
    const fileName = img.url.split("/").pop();
    const { error: delError } = await supabase.storage.from("gallery").remove([fileName ?? ""]);
    if (delError) console.error(delError);
    await supabase.from("image_gallery").delete().eq("id", img.id);
    await reload();
    router.refresh();
  };

  const handleCopy = async (img: GalleryImage) => {
    try {
      await navigator.clipboard.writeText(img.url);
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError(t("gallery.copyError", locale));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {uploading ? translateWithVars(t("gallery.uploadProgress", locale), { n: fmtInt(uploadedCount, locale) }) : t("gallery.uploadImages", locale)}
        </Button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {t("gallery.noImagesYet", locale)}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.file_name ?? t("gallery.altImage", locale)}
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-white hover:bg-white/20 hover:text-white"
                  title={t("gallery.copyUrl", locale)}
                  onClick={() => handleCopy(img)}
                >
                  {copiedId === img.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-white hover:bg-white/20 hover:text-white"
                  title={t("app.delete", locale)}
                  onClick={() => handleDelete(img)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
