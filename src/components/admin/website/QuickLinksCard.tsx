import React from "react";
import { Link2, ArrowRight, MessageSquare, BookOpen, Compass, ImageIcon, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickLinksCard() {
  const navigate = useNavigate();

  const links = [
    {
      label: "What Travelers Say (Reviews)",
      icon: MessageSquare,
      sectionId: "reviews",
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Stories From The Road",
      icon: BookOpen,
      sectionId: "stories",
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Popular Destinations (Highlights)",
      icon: Compass,
      sectionId: "destinations",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Recent Photos From Our Trips",
      icon: ImageIcon,
      sectionId: "recent_photos",
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Media & Vibe Banner Slider",
      icon: Sparkles,
      sectionId: "vibe",
      color: "text-[#D4541A] bg-orange-50",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 font-sans">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#D4541A] flex items-center justify-center font-bold">
          <Link2 className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-[#0B1528]">Quick Section Builder</h3>
          <p className="text-xs text-slate-500 font-medium">Direct links to edit specific page sections</p>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {links.map((link, i) => {
          const Icon = link.icon;
          return (
            <button
              key={i}
              onClick={() => navigate(`/admin/page-builder?section=${link.sectionId}`)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100/80 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg ${link.color} flex items-center justify-center font-bold`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#0B1528] group-hover:text-[#D4541A] transition-colors">
                  {link.label}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#D4541A] group-hover:translate-x-1 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
