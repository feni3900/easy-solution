"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";

interface PageSection {
  section_id: number;
  page_name: string;
  section_number: number;
  hero_title: string;
  hero_subtitle: string;
  banner_image_url: string;
  col1_title: string;
  col1_desc: string;
  col2_title: string;
  col2_desc: string;
  col3_title: string;
  col3_desc: string;
}

const PAGE_COLORS: Record<string, string> = {
  home: "bg-blue-100 text-blue-800",
  about: "bg-green-100 text-green-800",
  contact: "bg-purple-100 text-purple-800",
};

export default function WebStorePagesPage() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PageSection | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryField, setGalleryField] = useState("");
  const [galleryImages, setGalleryImages] = useState<{ id: number; url: string; filename: string }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("page_sections")
      .select("*")
      .order("page_name")
      .order("section_number")
      .then(({ data }) => {
        setSections(data ?? []);
        setLoading(false);
      });
  }, []);

  const openGalleryPicker = async (field: string) => {
    setGalleryField(field);
    const supabase = createClient();
    const { data } = await supabase
      .from("gallery")
      .select("id, url, filename")
      .order("created_at", { ascending: false });
    setGalleryImages(data ?? []);
    setGalleryOpen(true);
  };

  const pickImage = (url: string) => {
    setEditing((s) => (s ? { ...s, [galleryField]: url } : null));
    setGalleryOpen(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await fetch("/api/page-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const result = await res.json();
    if (!res.ok) {
      alert("Error: " + result.error);
      setSaving(false);
      return;
    }
    setSections((prev) =>
      prev.map((s) => (s.section_id === editing.section_id ? editing : s))
    );
    setEditing(null);
    setSaving(false);
    alert("Section saved!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Page Sections"
        description="Edit home, about and contact page content"
      />

      {["home", "about", "contact"].map((pageName) => (
        <div key={pageName} className="rounded-lg border bg-card">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-base font-medium capitalize flex items-center gap-2">
              {pageName} Page
              <Badge className={PAGE_COLORS[pageName] ?? "bg-gray-100"} variant="secondary">
                {sections.filter((s) => s.page_name === pageName).length} sections
              </Badge>
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {sections.filter((s) => s.page_name === pageName).length === 0 ? (
              <p className="text-sm text-muted-foreground">No sections found.</p>
            ) : (
              sections
                .filter((s) => s.page_name === pageName)
                .map((section) => (
                  <div
                    key={section.section_id}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {section.banner_image_url ? (
                        <img
                          src={section.banner_image_url}
                          alt=""
                          className="h-10 w-16 rounded object-cover border"
                        />
                      ) : (
                        <div className="h-10 w-16 rounded border bg-muted flex items-center justify-center">
                          <ImageIcon className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          Section {section.section_number}: {section.hero_title || "No title"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {section.hero_subtitle || "No subtitle"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(section)}
                    >
                      Edit
                    </Button>
                  </div>
                ))
            )}
          </div>
        </div>
      ))}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Edit {editing.page_name} - Section {editing.section_number}
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="size-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Hero Title</Label>
                <Input
                  value={editing.hero_title ?? ""}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, hero_title: e.target.value } : null))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Hero Subtitle</Label>
                <textarea
                  value={editing.hero_subtitle ?? ""}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, hero_subtitle: e.target.value } : null))
                  }
                  rows={2}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label>Banner Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={editing.banner_image_url ?? ""}
                    onChange={(e) =>
                      setEditing((s) => (s ? { ...s, banner_image_url: e.target.value } : null))
                    }
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => openGalleryPicker("banner_image_url")}
                    type="button"
                  >
                    <ImageIcon className="size-4 mr-1" /> Browse
                  </Button>
                </div>
                {editing.banner_image_url && (
                  <img
                    src={editing.banner_image_url}
                    alt="Preview"
                    className="mt-2 h-20 rounded border object-cover"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Feature 1 Title</Label>
                  <Input
                    value={editing.col1_title ?? ""}
                    onChange={(e) =>
                      setEditing((s) => (s ? { ...s, col1_title: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Feature 1 Description</Label>
                  <Input
                    value={editing.col1_desc ?? ""}
                    onChange={(e) =>
                      setEditing((s) => (s ? { ...s, col1_desc: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Feature 2 Title</Label>
                  <Input
                    value={editing.col2_title ?? ""}
                    onChange={(e) =>
                      setEditing((s) => (s ? { ...s, col2_title: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Feature 2 Description</Label>
                  <Input
                    value={editing.col2_desc ?? ""}
                    onChange={(e) =>
                      setEditing((s) => (s ? { ...s, col2_desc: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Feature 3 Title</Label>
                  <Input
                    value={editing.col3_title ?? ""}
                    onChange={(e) =>
                      setEditing((s) => (s ? { ...s, col3_title: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Feature 3 Description</Label>
                  <Input
                    value={editing.col3_desc ?? ""}
                    onChange={(e) =>
                      setEditing((s) => (s ? { ...s, col3_desc: e.target.value } : null))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-lg bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Select Image</h2>
              <Button variant="ghost" size="sm" onClick={() => setGalleryOpen(false)}>
                Close
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[65vh]">
              {galleryImages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No images in gallery. Upload some first.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {galleryImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => pickImage(img.url)}
                      className="group relative aspect-square rounded-lg border overflow-hidden hover:ring-2 hover:ring-primary cursor-pointer"
                    >
                      <img
                        src={img.url}
                        alt={img.filename}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                        <p className="w-full bg-black/60 text-white text-[10px] p-1 truncate">
                          {img.filename}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
