import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { settingsService } from "@/services/settings.service";
import { toast } from "sonner";
import {
  Loader2,
  Layout,
  Megaphone,
  Compass,
  ImageIcon,
  MessageSquare,
  BookOpen,
  Sparkles,
  ExternalLink,
  Edit3,
  Globe,
  Palette,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Layers,
  FileText,
  HelpCircle,
} from "lucide-react";
import api from "@/services/api";
import { pageBuilderApi, PageSectionConfig } from "@/lib/admin/page-builder-api";
import { tripsService } from "@/services/trips.service";

import { WebsiteHeader } from "@/components/admin/website/WebsiteHeader";
import { FocusedSectionModal } from "@/components/admin/website/FocusedSectionModal";

interface SectionShortcut {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SECTION_SHORTCUTS: SectionShortcut[] = [
  {
    id: "hero",
    name: "Hero Section",
    badge: "HERO",
    description: "Main hero banner, tagline, rotating headline & month filter bar.",
    icon: Layout,
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    id: "featured_trips",
    name: "Upcoming Group Trips",
    badge: "TRIPS",
    description: "Featured trip cards carousel with duration, price & View Trip CTA.",
    icon: Megaphone,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    id: "destinations",
    name: "Popular Destinations",
    badge: "DESTINATIONS",
    description: "Portrait photo cards & inquiry popup modal for top locations.",
    icon: Compass,
    color: "bg-orange-50 text-[#D4541A] border-orange-100",
  },
  {
    id: "cta_slider",
    name: "Media Banner Slider",
    badge: "CTA SLIDER",
    description: "Auto-playing video clips and photo slideshow banner.",
    icon: Sparkles,
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    id: "reviews",
    name: "What Travelers Say",
    badge: "REVIEWS",
    description: "Customer review cards with 5-star ratings & trip links.",
    icon: MessageSquare,
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    id: "stories",
    name: "Stories From The Road",
    badge: "JOURNAL",
    description: "Blog & travel journal story cards with author avatars & read time.",
    icon: BookOpen,
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
  },
  {
    id: "recent_photos",
    name: "Recent Photos From Our Trips",
    badge: "PHOTOS",
    description: "Infinite marquee photo gallery with lightbox modal preview.",
    icon: ImageIcon,
    color: "bg-pink-50 text-pink-600 border-pink-100",
  },
];

interface WebsiteSubPage {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "Live" | "Draft";
  lastEdited: string;
  builderSectionId?: string;
}

const WEBSITE_SUB_PAGES: WebsiteSubPage[] = [
  {
    id: "p1",
    title: "Homepage Storefront",
    slug: "",
    description: "Main landing page with all 7 dynamic sections",
    status: "Live",
    lastEdited: "Today at 12:15 PM",
    builderSectionId: "hero",
  },
  {
    id: "p2",
    title: "Trips Catalog",
    slug: "trips",
    description: "All upcoming group departures & search filter grid",
    status: "Live",
    lastEdited: "2 days ago",
  },
  {
    id: "p3",
    title: "About Us",
    slug: "about-us",
    description: "Company story, team captains & brand mission",
    status: "Live",
    lastEdited: "1 week ago",
  },
  {
    id: "p4",
    title: "Contact Us",
    slug: "contact",
    description: "Inquiry submission form, office address & WhatsApp",
    status: "Live",
    lastEdited: "3 days ago",
  },
  {
    id: "p5",
    title: "Terms & Conditions",
    slug: "terms-and-conditions",
    description: "Booking rules, traveler responsibilities & guidelines",
    status: "Live",
    lastEdited: "1 month ago",
  },
  {
    id: "p6",
    title: "Cancellation Policy",
    slug: "cancellation-policy",
    description: "Refund timelines & trip cancellation policies",
    status: "Live",
    lastEdited: "1 month ago",
  },
];

export default function WebsiteControlCenterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [websiteStatus, setWebsiteStatus] = useState<"live" | "draft" | "review_needed">("live");
  const [lastPublished, setLastPublished] = useState("July 26, 2:30 PM");

  const [sections, setSections] = useState<PageSectionConfig[]>([]);
  const [dbTrips, setDbTrips] = useState<any[]>([]);
  const [focusedSectionType, setFocusedSectionType] = useState<string | null>(null);

  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || "http://localhost:3000";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [layout, trips] = await Promise.all([
        pageBuilderApi.getPageLayout("home").catch(() => []),
        tripsService.getAll().catch(() => []),
      ]);
      setSections(layout || []);
      setDbTrips(trips || []);
      setWebsiteStatus("live");
    } catch (err) {
      console.warn("Website settings load notice:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await pageBuilderApi.publishPage("home", sections);
      const nowFormatted = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      setLastPublished(nowFormatted);
      toast.success("Website changes published successfully to live site!");
    } catch (err) {
      toast.error("Failed to publish website changes");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveFocusedSection = async (sectionId: string, updatedDraft: Record<string, any>) => {
    let updated = sections.map((s) => (s.id === sectionId ? { ...s, draft: updatedDraft } : s));
    if (!sections.some((s) => s.id === sectionId)) {
      const targetType = focusedSectionType || "section";
      updated.push({
        id: sectionId,
        type: targetType,
        name: targetType.replace(/_/g, " ").toUpperCase(),
        visible: true,
        draft: updatedDraft,
      });
    }
    setSections(updated);
    await pageBuilderApi.publishPage("home", updated);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-3 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4541A]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#0B1528]">
          Loading Website Control Center...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-[1440px] mx-auto pb-16">
      {/* ─── 1. TOP HEADER & PUBLISH BAR ─── */}
      <WebsiteHeader
        status={websiteStatus}
        lastPublished={lastPublished}
        onPublish={handlePublish}
        isPublishing={publishing}
      />

      {/* ─── 2. SECTION 1: HOMEPAGE SECTIONS CONTROL TOWER ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black text-[#0B1528] tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#D4541A]" />
              <span>Homepage Section Editors</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Click any section to edit it directly in place without losing your spot
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/page-builder")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1528] hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#D4541A]" />
            <span>Open Full Page Builder</span>
          </button>
        </div>

        {/* 7 Section Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SECTION_SHORTCUTS.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.id}
                onClick={() => setFocusedSectionType(sec.id)}
                className="group relative bg-white rounded-2xl border border-slate-200/90 p-4 hover:border-[#D4541A] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-xl ${sec.color} flex items-center justify-center border font-bold shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                      {sec.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-[#0B1528] group-hover:text-[#D4541A] transition-colors leading-tight">
                      {sec.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2">
                      {sec.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#D4541A] group-hover:underline">
                  <span>Edit Section</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 3. SECTION 2: ALL WEBSITE SUB-PAGES & LANDING PAGES ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#0B1528] tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Website Pages & Sub-Pages ({WEBSITE_SUB_PAGES.length})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Manage public website routes, landing pages, policy documents and live URLs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {WEBSITE_SUB_PAGES.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-400">
                    {page.slug === "" ? "/" : `/${page.slug}`}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{page.status}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#0B1528]">{page.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                    {page.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={`${frontendUrl}/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#D4541A] transition-colors"
                >
                  <span>Preview Live</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <button
                  onClick={() => {
                    if (page.slug === "" || page.slug === "homepage") {
                      navigate("/admin/page-builder");
                    } else {
                      navigate(`/admin/page-builder?page=${page.slug}`);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#0B1528] hover:text-white text-[#0B1528] text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Content</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 4. SECTION 3: UTILITY & BRAND SETTINGS QUICK DOCK ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* SEO & Search Meta Tags */}
        <div
          onClick={() => navigate("/admin/seo")}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-500 transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#0B1528] group-hover:text-blue-600 transition-colors">
              SEO & Meta Tags
            </h4>
            <p className="text-xs text-slate-500 font-medium">Search titles, meta descriptions & OG tags</p>
          </div>
        </div>

        {/* System Revalidation & Status */}
        <div
          onClick={handlePublish}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-emerald-500 transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#0B1528] group-hover:text-emerald-600 transition-colors">
              Flush & Sync Cache
            </h4>
            <p className="text-xs text-slate-500 font-medium">Instant edge revalidation to live site</p>
          </div>
        </div>
      </div>

      {/* ─── 5. FOCUSED SECTION EDITING MODAL ─── */}
      <FocusedSectionModal
        isOpen={Boolean(focusedSectionType)}
        onClose={() => setFocusedSectionType(null)}
        sectionType={focusedSectionType}
        sections={sections}
        dbTrips={dbTrips}
        onSaveSection={handleSaveFocusedSection}
      />
    </div>
  );
}
