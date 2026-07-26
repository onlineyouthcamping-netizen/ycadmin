import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw, Plus, X, GripVertical, Image as ImageIcon } from "lucide-react";

interface GalleryImageItem {
  id: string;
  src: string;
  caption?: string;
}

interface ImageGalleryEditorProps {
  draft: Record<string, any>;
  onChange: (updatedDraft: Record<string, any>) => void;
  onReset: () => void;
}

export function ImageGalleryEditor({
  draft,
  onChange,
  onReset,
}: ImageGalleryEditorProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");

  const images: GalleryImageItem[] = draft.images || [
    { id: "img-1", src: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80", caption: "Snow Peak Camp" },
    { id: "img-2", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", caption: "Valley Pass Trail" },
    { id: "img-3", src: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80", caption: "Spiti Monastery" },
  ];

  const updateField = (field: string, value: any) => {
    onChange({ ...draft, [field]: value });
  };

  const addImage = () => {
    if (!newUrl.trim()) return;
    const updated = [
      ...images,
      { id: `img-${Date.now()}`, src: newUrl.trim(), caption: newCaption.trim() },
    ];
    updateField("images", updated);
    setNewUrl("");
    setNewCaption("");
  };

  const removeImage = (id: string) => {
    const updated = images.filter((img) => img.id !== id);
    updateField("images", updated);
  };

  const updateCaption = (id: string, caption: string) => {
    const updated = images.map((img) =>
      img.id === id ? { ...img, caption } : img
    );
    updateField("images", updated);
  };

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0B1528]">Section Title</Label>
        <Input
          type="text"
          value={draft.title || ""}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="e.g. Photo Gallery"
          className="h-10 text-xs font-semibold rounded-xl"
        />
      </div>

      {/* Gallery Layout */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0B1528]">Gallery Layout</Label>
        <Select
          value={draft.layout || "masonry"}
          onValueChange={(val) => updateField("layout", val)}
        >
          <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
            <SelectValue placeholder="Layout" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="masonry">Masonry</SelectItem>
            <SelectItem value="grid">Grid (Equal Tiles)</SelectItem>
            <SelectItem value="carousel">Carousel (Horizontal)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add New Image Input Box */}
      <div className="space-y-2 pt-1">
        <Label className="text-xs font-bold text-[#0B1528]">Add Image to Gallery</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Image URL (https://...)"
            className="h-9 text-xs font-mono rounded-xl flex-1"
          />
          <Input
            type="text"
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="h-9 text-xs font-medium rounded-xl flex-1"
          />
          <Button
            type="button"
            onClick={addImage}
            disabled={!newUrl.trim()}
            className="h-9 px-3 bg-[#0B1528] hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-[#D4541A]" /> Add
          </Button>
        </div>
      </div>

      {/* Uploaded Images List with Captions */}
      <div className="space-y-2 pt-1">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Gallery Photos ({images.length})
        </Label>
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
          {images.map((img) => (
            <div
              key={img.id}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all"
            >
              <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
              <img
                src={img.src}
                alt={img.caption || "Gallery"}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <Input
                type="text"
                value={img.caption || ""}
                onChange={(e) => updateCaption(img.id, e.target.value)}
                placeholder="Caption (optional)"
                className="h-8 text-xs font-medium rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="p-1 rounded text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reset button */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="h-8 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-400" /> Reset to Default
        </Button>
      </div>
    </div>
  );
}
