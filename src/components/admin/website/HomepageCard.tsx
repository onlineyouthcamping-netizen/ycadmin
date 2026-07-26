import React from "react";
import { ExternalLink, Edit3, Layout, MessageSquare, BookOpen, Compass, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface HomepageCardProps {
  published?: boolean;
  lastEdited?: string;
  previewUrl?: string;
  onEdit: () => void;
}

export function HomepageCard({
  published = true,
  lastEdited = "Today at 12:15 PM",
  previewUrl = "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80",
  onEdit,
}: HomepageCardProps) {
  const navigate = useNavigate();
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || "http://localhost:3000";

  const quickSections = [
    { label: "Reviews", icon: MessageSquare, id: "reviews" },
    { label: "Stories From The Road", icon: BookOpen, id: "stories" },
    { label: "Destinations", icon: Compass, id: "destinations" },
    { label: "Recent Photos", icon: ImageIcon, id: "recent_photos" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#D4541A] flex items-center justify-center font-bold">
            <Layout className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0B1528]">Homepage Layout</h3>
            <p className="text-xs text-slate-500 font-medium">
              {published ? "Published" : "Draft"} • Edited {lastEdited}
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Active Storefront
        </span>
      </div>

      {/* Preview Thumbnail */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200/90 group bg-slate-900">
        <img
          src={previewUrl}
          alt="Homepage layout preview"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
          <p className="text-xs font-bold text-white tracking-wide font-montserrat">
            YouthCamping — Flagship Group Expeditions
          </p>
        </div>
      </div>

      {/* Quick Section Chips */}
      <div className="pt-1">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Direct Section Editors:
        </p>
        <div className="flex flex-wrap gap-2">
          {quickSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => navigate(`/admin/page-builder?section=${sec.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-[#D4541A] border border-slate-200/80 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer: Max 2 Actions */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
        <a
          href={frontendUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all gap-1.5"
        >
          <span>Preview Live</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        <Button
          onClick={onEdit}
          className="h-9 px-4 bg-[#0B1528] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#D4541A]" />
          <span>Open Full Page Builder</span>
        </Button>
      </div>
    </div>
  );
}
