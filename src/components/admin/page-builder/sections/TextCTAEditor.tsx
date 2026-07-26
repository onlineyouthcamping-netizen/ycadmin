import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface TextCTAEditorProps {
  draft: Record<string, any>;
  onChange: (updatedDraft: Record<string, any>) => void;
  onReset: () => void;
}

export function TextCTAEditor({
  draft,
  onChange,
  onReset,
}: TextCTAEditorProps) {
  const updateField = (field: string, value: any) => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Section Title / Heading */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0B1528]">Heading Title</Label>
        <Input
          type="text"
          value={draft.title || ""}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="e.g. Why Travel With YouthCamping?"
          className="h-10 text-xs font-semibold rounded-xl"
        />
      </div>

      {/* Body Content */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0B1528]">Body Content</Label>
        <Textarea
          value={draft.body || ""}
          onChange={(e) => updateField("body", e.target.value)}
          placeholder="Enter descriptive text or features list..."
          className="text-xs font-medium rounded-xl min-h-[90px]"
        />
      </div>

      {/* Optional Image URL & Image Position */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">Image URL (Optional)</Label>
          <Input
            type="url"
            value={draft.imageUrl || ""}
            onChange={(e) => updateField("imageUrl", e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="h-10 text-xs font-mono rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">Image Position</Label>
          <Select
            value={draft.imagePosition || "right"}
            onValueChange={(val) => updateField("imagePosition", val)}
          >
            <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CTA Button Text & Link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">CTA Button Text</Label>
          <Input
            type="text"
            value={draft.buttonText || ""}
            onChange={(e) => updateField("buttonText", e.target.value)}
            placeholder="e.g. Learn More"
            className="h-10 text-xs font-semibold rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">CTA Button Link</Label>
          <Input
            type="text"
            value={draft.buttonLink || ""}
            onChange={(e) => updateField("buttonLink", e.target.value)}
            placeholder="/about-us"
            className="h-10 text-xs font-mono rounded-xl"
          />
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
