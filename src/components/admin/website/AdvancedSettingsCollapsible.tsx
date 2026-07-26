import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Palette,
  Layers,
  Search,
  MessageSquare,
  Type,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdvancedSettingsCollapsibleProps {
  onNavigateTab: (tabId: string) => void;
}

export function AdvancedSettingsCollapsible({ onNavigateTab }: AdvancedSettingsCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const advancedCards = [
    {
      title: "Design Control Center",
      desc: "Advanced CSS theme presets, spacing scales & typography controls",
      icon: Palette,
      tab: "theme",
    },
    {
      title: "Montserrat Font Hierarchy",
      desc: "Custom font stack, Google Fonts weights & typography presets",
      icon: Type,
      tab: "theme",
    },
    {
      title: "Footer Grid & Legal Links",
      desc: "HQ office address, copyright notice, social links & policy menus",
      icon: Layers,
      tab: "footer",
    },
    {
      title: "SEO Snippets & Schema",
      desc: "Global meta tags, OpenGraph preview, robots.txt & JSON-LD schema",
      icon: Search,
      tab: "seo",
    },
    {
      title: "Inquiry Engine & Popup",
      desc: "12s delay trigger options, lead form fields & WhatsApp auto-connect",
      icon: MessageSquare,
      tab: "inquiry",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-bold text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronUp className="w-4 h-4 text-[#D4541A]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          <span className="text-[#0B1528] font-extrabold text-sm">Advanced Settings & Engine Controls</span>
        </div>
        <span className="text-slate-400 font-mono text-[11px] font-medium">
          {isOpen ? "Click to collapse" : "5 Configuration Modules Hidden"}
        </span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          {advancedCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#D4541A]" />
                    <h4 className="text-xs font-extrabold text-[#0B1528]">{card.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => onNavigateTab(card.tab)}
                    variant="outline"
                    className="w-full h-8 text-xs font-bold text-slate-700 hover:bg-slate-100 border-slate-200 rounded-lg cursor-pointer"
                  >
                    <span>Open Module</span>
                    <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
