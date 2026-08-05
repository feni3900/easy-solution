"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Upload, Maximize2, Printer, Save, Loader2, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface GalleryImage {
  id: number;
  url: string;
  filename: string;
}

export default function ImageEditorPage() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(300);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgRemoved, setBgRemoved] = useState(false);
  const [printRows, setPrintRows] = useState(2);
  const [copiesPerRow, setCopiesPerRow] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("gallery").select("id, url, filename").order("created_at", { ascending: false });
      setGalleryImages(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const drawImage = useCallback((img: HTMLImageElement, w: number, h: number, removeBg: boolean, bg: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Draw image
    ctx.drawImage(img, 0, 0, w, h);

    // Simple background removal (green screen / white threshold)
    if (removeBg) {
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Remove near-white pixels
        if (r > 230 && g > 230 && b > 230) {
          data[i + 3] = 0; // Make transparent
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // Redraw background behind non-transparent pixels
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.fillStyle = bg;
      tempCtx.fillRect(0, 0, w, h);
      tempCtx.drawImage(canvas, 0, 0);

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }, []);

  const loadImage = useCallback((src: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      originalImageRef.current = img;
      setBgRemoved(false);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      drawImage(img, img.naturalWidth, img.naturalHeight, false, "#ffffff");
    };
    img.src = src;
    setSelectedImage(src);
  }, [drawImage]);

  const handleRemoveBg = () => {
    if (!originalImageRef.current) return;
    setBgRemoved(true);
    drawImage(originalImageRef.current, width, height, true, bgColor);
  };

  const handleResize = () => {
    if (!originalImageRef.current) return;
    drawImage(originalImageRef.current, width, height, bgRemoved, bgColor);
  };

  const handleBgColorChange = (color: string) => {
    setBgColor(color);
    if (originalImageRef.current) {
      drawImage(originalImageRef.current, width, height, bgRemoved, color);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result as string);
      setProcessing(false);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveToGallery = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setProcessing(true);

    canvas.toBlob(async (blob) => {
      if (!blob) { setProcessing(false); return; }
      const formData = new FormData();
      formData.append("file", blob, `edited-${Date.now()}.png`);
      await fetch("/api/gallery", { method: "POST", body: formData });
      setProcessing(false);
      alert("Saved to gallery!");
      // Reload gallery
      const supabase = createClient();
      const { data } = await supabase.from("gallery").select("id, url, filename").order("created_at", { ascending: false });
      setGalleryImages(data ?? []);
    }, "image/png");
  };

  const generatePrintLayout = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printCanvas = printCanvasRef.current;
    if (!printCanvas) return;

    const padding = 10;
    const cellW = canvas.width;
    const cellH = canvas.height;
    const totalW = (cellW + padding) * copiesPerRow + padding;
    const totalH = (cellH + padding) * printRows + padding;

    printCanvas.width = totalW;
    printCanvas.height = totalH;
    const ctx = printCanvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalW, totalH);

    for (let row = 0; row < printRows; row++) {
      for (let col = 0; col < copiesPerRow; col++) {
        const x = padding + col * (cellW + padding);
        const y = padding + row * (cellH + padding);
        ctx.drawImage(canvas, x, y, cellW, cellH);
      }
    }
  }, [printRows, copiesPerRow]);

  const handlePrint = () => {
    generatePrintLayout();
    setTimeout(() => {
      const printCanvas = printCanvasRef.current;
      if (!printCanvas) return;
      const dataUrl = printCanvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`
        <html>
          <head><title>Print</title>
          <style>
            @media print { body { margin: 0; } img { width: 100%; } }
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
            img { max-width: 100%; max-height: 100vh; }
          </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      win.document.close();
    }, 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/gallery">
          <Button variant="ghost" size="icon"><ArrowLeft className="size-5" /></Button>
        </Link>
        <h1 className="text-2xl font-semibold">Image Editor</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Image Selection */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-medium mb-3">Select Image</h3>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <Button variant="outline" className="w-full mb-3" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4 mr-2" /> Upload New
            </Button>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {galleryImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => loadImage(img.url)}
                    className={`aspect-square rounded border overflow-hidden ${selectedImage === img.url ? "ring-2 ring-primary" : "hover:ring-1"}`}
                  >
                    <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h3 className="text-sm font-medium">Edit Controls</h3>

            <div className="space-y-2">
              <Label>Size (px)</Label>
              <div className="flex gap-2">
                <Input type="number" value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 100)} className="flex-1" />
                <span className="flex items-center text-muted-foreground">×</span>
                <Input type="number" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 100)} className="flex-1" />
              </div>
              <Button variant="outline" size="sm" onClick={handleResize} className="w-full">
                <Maximize2 className="size-3 mr-1" /> Apply Size
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Background</Label>
              <div className="flex gap-2">
                <input type="color" value={bgColor} onChange={(e) => handleBgColorChange(e.target.value)} className="size-9 rounded border cursor-pointer" />
                <Input value={bgColor} onChange={(e) => handleBgColorChange(e.target.value)} className="flex-1" />
              </div>
            </div>

            <Button variant="outline" onClick={handleRemoveBg} className="w-full">
              <Scissors className="size-3 mr-1" /> Remove White Background
            </Button>

            <div className="border-t pt-4 space-y-2">
              <Label>Print Layout</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground">Rows</p>
                  <Input type="number" value={printRows} onChange={(e) => setPrintRows(parseInt(e.target.value) || 1)} min={1} max={10} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted-foreground">Per Row</p>
                  <Input type="number" value={copiesPerRow} onChange={(e) => setCopiesPerRow(parseInt(e.target.value) || 1)} min={1} max={10} />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{printRows * copiesPerRow} copies total</p>
            </div>
          </div>
        </div>

        {/* Right: Canvas Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-medium mb-3">Preview ({width} × {height})</h3>
            {selectedImage ? (
              <div className="flex justify-center bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] rounded">
                <canvas ref={canvasRef} className="max-w-full max-h-[50vh] object-contain" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Select or upload an image to start editing
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveToGallery} disabled={!selectedImage || processing} className="flex-1">
              {processing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
              Save to Gallery
            </Button>
            <Button onClick={handlePrint} disabled={!selectedImage} variant="outline" className="flex-1">
              <Printer className="size-4 mr-2" />
              Print ({printRows * copiesPerRow} copies)
            </Button>
          </div>

          {/* Print Preview (hidden) */}
          <canvas ref={printCanvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}
