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

interface HeroSectionEditorProps {
  draft: Record<string, any>;
  onChange: (updatedDraft: Record<string, any>) => void;
  onReset: () => void;
}

export function HeroSectionEditor({
  draft,
  onChange,
  onReset,
}: HeroSectionEditorProps) {
  const updateField = (field: string, value: any) => {
    onChange({ ...draft, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0B1528]">Heading</Label>
        <Input
          type="text"
          value={draft.headline || ""}
          onChange={(e) => updateField("headline", e.target.value)}
          placeholder="e.g. Explore India's Hidden Gems"
          className="h-10 text-xs font-semibold rounded-xl"
        />
      </div>

      {/* Subheading */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0B1528]">Subheading</Label>
        <Textarea
          value={draft.subheadline || ""}
          onChange={(e) => updateField("subheadline", e.target.value)}
          placeholder="Optional subtitle describing the hero banner"
          className="text-xs font-medium rounded-xl min-h-[70px]"
        />
      </div>

      {/* Background Image URL */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0B1528]">
          Background Image URL
        </Label>
        <Input
          type="url"
          value={draft.backgroundImage || ""}
          onChange={(e) => updateField("backgroundImage", e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="h-10 text-xs font-mono rounded-xl"
        />
      </div>

      {/* Button Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">
            Button Text
          </Label>
          <Input
            type="text"
            value={draft.buttonText || ""}
            onChange={(e) => updateField("buttonText", e.target.value)}
            placeholder="e.g. Browse Trips"
            className="h-10 text-xs font-semibold rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">
            Button Link
          </Label>
          <Input
            type="text"
            value={draft.buttonLink || ""}
            onChange={(e) => updateField("buttonLink", e.target.value)}
            placeholder="/trips or https://..."
            className="h-10 text-xs font-mono rounded-xl"
          />
        </div>
      </div>

      {/* Button Style & Text Alignment Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">
            Button Style
          </Label>
          <Select
            value={draft.buttonStyle || "primary"}
            onValueChange={(val) => updateField("buttonStyle", val)}
          >
            <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="primary">Primary (Dark)</SelectItem>
              <SelectItem value="secondary">Secondary (Light)</SelectItem>
              <SelectItem value="tertiary">Text Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">
            Text Alignment
          </Label>
          <Select
            value={draft.alignment || "center"}
            onValueChange={(val) => updateField("alignment", val)}
          >
            <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
              <SelectValue placeholder="Alignment" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0B1528]">Spacing</Label>
          <Select
            value={draft.spacing || "standard"}
            onValueChange={(val) => updateField("spacing", val)}
          >
            <SelectTrigger className="h-10 text-xs font-semibold rounded-xl">
              <SelectValue placeholder="Spacing" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="compact">Compact (60vh)</SelectItem>
              <SelectItem value="standard">Standard (100vh)</SelectItem>
              <SelectItem value="spacious">Spacious (120vh)</SelectItem>
            </SelectContent>
          </Select>
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
          <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-400" /> Reset to
          Default
        </Button>
      </div>
    </div>
  );
}
