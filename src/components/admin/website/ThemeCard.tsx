import React from "react";
import { Palette, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeCardProps {
  currentThemeName?: string;
  primaryColor?: string;
  fontFamily?: string;
  onCustomize: () => void;
}

export function ThemeCard({
  currentThemeName = "Nature Orange (Default)",
  primaryColor = "#D4541A",
  fontFamily = "Montserrat (Google Fonts)",
  onCustomize,
}: ThemeCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0B1528]">Theme & Appearance</h3>
            <p className="text-xs text-slate-500 font-medium">Design tokens & brand colors</p>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
          <Check className="w-3 h-3 text-purple-600" /> Active
        </span>
      </div>

      {/* Theme Info Box */}
      <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="text-xs font-bold text-[#0B1528]">{currentThemeName}</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">{fontFamily}</p>
        </div>

        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 text-[11px] font-bold text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0B1528]" /> Navy
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4541A] ml-1" /> Orange
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] ml-1" /> Green
        </div>
      </div>

      {/* Action: 1 Button */}
      <div className="flex items-center justify-end">
        <Button
          onClick={onCustomize}
          className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F4A261]" />
          <span>Customize Appearance</span>
        </Button>
      </div>
    </div>
  );
}
