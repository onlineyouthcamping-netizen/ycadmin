import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { settingsService } from "@/services/settings.service";
import { seoService } from "@/services/seo.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Globe,
  Settings,
  Palette,
  Layout,
  MessageSquare,
  Train,
  Search,
  Plus,
  Trash2,
  Save,
  Undo,
  Eye,
  Share2,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Link2,
  Shield,
  ArrowUpRight,
  Code,
  Smartphone,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
  BookOpen,
  MapPin,
  Star,
  Compass,
  Trees,
  Sun,
  CloudSun,
  Activity,
  ArrowRight,
  Layers,
  Clock,
  Zap,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Check
} from "lucide-react";
import api from "@/services/api";
import BlogsPage from "./BlogsPage";
import AttractionsPage from "./AttractionsPage";
import ReviewsPage from "./ReviewsPage";
import DesignControlCenterPage from "./DesignControlCenterPage";

type TabId =
  | "overview"
  | "general"
  | "homepage"
  | "pages"
  | "blogs"
  | "attractions"
  | "reviews"
  | "navigation"
  | "footer"
  | "theme"
  | "inquiry"
  | "booking"
  | "seo"
  | "advanced";

export default function WebsiteControlCenterPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<any>({
    siteName: "",
    favicon: "",
    logo: { url: "", alt: "" },
    socialLinks: { instagram: "", facebook: "", youtube: "", linkedin: "", whatsapp: "" },
    navbarLinks: [],
    headerCtaText: "",
    headerStyle: "sticky",
    bookingForm: { submitButtonText: "", successMessage: "", checkoutNotes: "", gstOption: "full", roomSharingOptions: [], trainOptions: [] },
    inquiryPopup: { enabled: true, delay: 12, title: "", description: "" },
    googleAnalyticsId: "",
    facebookPixelId: ""
  });

  // Keep a copy to detect changes and reset
  const [originalSettings, setOriginalSettings] = useState<any>(null);

  // SEO details summary
  const [homepageSeo, setHomepageSeo] = useState<any>({
    metaTitle: "",
    metaDescription: ""
  });

  const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://youthcamping.online";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await settingsService.get();
      const formatted = {
        ...data,
        navbarLinks: data.navbarLinks || [],
        socialLinks: {
          instagram: data.socialLinks?.instagram || "",
          facebook: data.socialLinks?.facebook || "",
          youtube: data.socialLinks?.youtube || "",
          linkedin: data.socialLinks?.linkedin || "",
          whatsapp: data.socialLinks?.whatsapp || "",
          tripadvisor: data.socialLinks?.tripadvisor || "",
          twitter: data.socialLinks?.twitter || "",
          pinterest: data.socialLinks?.pinterest || "",
          blog: data.socialLinks?.blog || "",
          googleBusiness: data.socialLinks?.googleBusiness || ""
        },
        footer: data.footer || { brandName: "", address: "", phone: "", email: "", copyright: "", showSocial: true, columns: [] },
        bookingForm: data.bookingForm || {
          submitButtonText: "Confirm Booking",
          successMessage: "Your booking has been received!",
          checkoutNotes: "",
          gstOption: "full",
          roomSharingOptions: [],
          trainOptions: []
        },
        inquiryPopup: data.inquiryPopup || {
          enabled: true,
          delay: 12,
          title: "Plan Your Next Trip",
          description: "Connect with our destination experts"
        },
        googleAnalyticsId: data.googleAnalyticsId || "",
        facebookPixelId: data.facebookPixelId || ""
      };
      setSettings(formatted);
      setOriginalSettings(JSON.parse(JSON.stringify(formatted)));

      try {
        const seo = await seoService.get("home");
        if (seo) {
          setHomepageSeo({
            metaTitle: seo.metaTitle || "",
            metaDescription: seo.metaDescription || ""
          });
        }
      } catch (e) {
        // Safe fail
      }
    } catch (err) {
      toast.error("Failed to load website configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await settingsService.update(settings);
      toast.success("Website Control Center settings saved");
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      api.post('/revalidate', { path: '/' }).catch(() => {});
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      toast.info("Unsaved local changes discarded");
    }
  };

  const isChanged = originalSettings ? JSON.stringify(settings) !== JSON.stringify(originalSettings) : false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] w-full gap-4">
        <Loader2 className="w-9 h-9 animate-spin text-[#E76F51]" />
        <p className="text-xs font-extrabold uppercase tracking-widest text-[#1B4332]">
          Loading Basecamp Control Center...
        </p>
      </div>
    );
  }

  // Visual grouping of sidebar menu items
  const menuGroups = [
    {
      group: "Core Portal",
      items: [
        { id: "overview", label: "Overview Basecamp", icon: Globe },
        { id: "general", label: "General Settings", icon: Settings },
        { id: "homepage", label: "Homepage Layout", icon: Layout },
        { id: "pages", label: "Public Pages", icon: Link2 }
      ]
    },
    {
      group: "Content & Media",
      items: [
        { id: "blogs", label: "Watch & Read", icon: BookOpen },
        { id: "attractions", label: "Attractions", icon: MapPin },
        { id: "reviews", label: "Review Center", icon: Star }
      ]
    },
    {
      group: "Design & Layout",
      items: [
        { id: "navigation", label: "Header & Menu", icon: Sparkles },
        { id: "footer", label: "Footer Layout", icon: Layers },
        { id: "theme", label: "Design Control Center", icon: Palette }
      ]
    },
    {
      group: "Engine & SEO",
      items: [
        { id: "inquiry", label: "Inquiry Popup", icon: MessageSquare },
        { id: "booking", label: "Booking Engine", icon: Train },
        { id: "seo", label: "SEO & Search", icon: Search },
        { id: "advanced", label: "Advanced Dev Config", icon: Shield }
      ]
    }
  ];

  return (
    <div className="space-y-6 font-sans">

      {/* ─── 🌲 1. HEADER AREA WITH PREVIEW & LIVE BUTTON ─── */}
      <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 md:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle Ambient Background Decor */}
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-emerald-50/50 via-orange-50/20 to-transparent pointer-events-none" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 min-w-0 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold text-[#E76F51] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200 flex items-center gap-1">
                <Trees className="w-3.5 h-3.5 text-[#1B4332]" /> Basecamp Expedition Portal
              </span>
              <span className="text-xs text-slate-400 font-medium">•</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE & SYNCED
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#17233C] tracking-tight leading-tight flex items-center gap-2">
              🌲 Website Basecamp
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Manage your digital storefront. Preview changes, configure sections, and publish with confidence.
            </p>
          </div>

          {/* Action & Miniature Browser Mockup Thumbnail */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
            {/* Miniature Browser Mockup Card */}
            <div className="hidden sm:flex items-center gap-3 bg-slate-900 text-slate-200 p-2.5 rounded-xl border border-slate-800 shadow-md">
              <div className="w-16 h-10 bg-slate-800 rounded-md overflow-hidden relative flex flex-col justify-between p-1 border border-slate-700 shrink-0">
                <div className="h-1 bg-slate-700 w-full rounded-xs flex items-center gap-0.5 px-0.5">
                  <div className="w-0.5 h-0.5 rounded-full bg-red-400" />
                  <div className="w-0.5 h-0.5 rounded-full bg-amber-400" />
                  <div className="w-0.5 h-0.5 rounded-full bg-emerald-400" />
                </div>
                <div className="h-4 bg-[#1B4332] rounded-xs flex items-center justify-center">
                  <span className="text-[6px] font-bold text-white tracking-widest uppercase">Basecamp</span>
                </div>
                <div className="h-1 bg-[#E76F51] w-2/3 rounded-xs" />
              </div>
              <div className="text-left text-[11px] pr-2">
                <p className="font-extrabold text-white leading-none">youthcamping.online</p>
                <p className="text-[9.5px] text-slate-400 font-mono mt-1">v2.4 Production</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              {activeTab !== "overview" && isChanged && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                    className="h-9 px-4 text-xs font-semibold border-slate-200 rounded-full hover:bg-slate-50"
                  >
                    <Undo className="w-3.5 h-3.5 mr-1.5" /> Discard
                  </Button>

                  <Button
                    onClick={handleSave}
                    disabled={saving || !isChanged}
                    className="h-9 px-5 bg-[#E76F51] hover:bg-[#D65D3F] text-white text-xs font-semibold rounded-full shadow-md shadow-[#E76F51]/30 hover:scale-[1.02] transition-all"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                    Save Changes
                  </Button>
                </>
              )}

              <a
                href={baseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-white hover:bg-slate-50 text-[#1B4332] border border-slate-200/90 text-xs font-bold shadow-xs hover:-translate-y-0.5 transition-all group"
              >
                Live Site <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-[#E76F51] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 📊 2. QUICK STATS BAR & WEATHER WIDGET ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-white rounded-[16px] border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Bookings</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#17233C]">28</span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +14%
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#E76F51] flex items-center justify-center shrink-0">
            <Train className="w-4.5 h-4.5" />
          </div>
        </Card>

        <Card className="bg-white rounded-[16px] border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Inquiries</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#17233C]">14 Leads</span>
              <span className="text-[10px] font-bold text-blue-600">Pending</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4.5 h-4.5" />
          </div>
        </Card>

        <Card className="bg-white rounded-[16px] border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Site Uptime</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-600">99.98%</span>
              <span className="text-[10px] font-bold text-slate-400">Operational</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
        </Card>

        <Card className="bg-white rounded-[16px] border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destination Weather</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-extrabold text-[#1B4332]">Manali: 14°C</span>
              <span className="text-[10px] font-semibold text-slate-500">Sunny 🏔️</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CloudSun className="w-4.5 h-4.5" />
          </div>
        </Card>
      </div>

      {/* ─── 🧭 3. MAIN WORKSPACE LAYOUT (EXPEDITION SIDEBAR + CONTENT PANEL) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* 🌲 Left Sidebar Navigation (Dark Forest #1B4332 Gradient) */}
        <div className="lg:col-span-3 bg-gradient-to-b from-[#0F2027] to-[#1B4332] text-slate-200 p-2.5 rounded-[20px] shadow-lg border border-slate-800 lg:sticky lg:top-4 overflow-x-auto lg:overflow-x-visible no-scrollbar">
          <div className="px-3 py-2.5 mb-2 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#F4A261]" />
              <span className="text-xs font-black uppercase tracking-wider text-white">Basecamp Menu</span>
            </div>
            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/70">v2.4</span>
          </div>

          <div className="space-y-4">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <p className="px-3 text-[9px] font-extrabold uppercase tracking-widest text-slate-400/90 pt-1">
                  {group.group}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id as TabId)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left group ${
                        isActive
                          ? "bg-white/15 text-white border-l-4 border-[#E76F51] shadow-inner"
                          : "text-slate-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-[#F4A261]" : "text-slate-400"}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Quick CTA to Page Builder inside sidebar */}
          <div className="mt-4 pt-3 border-t border-white/10 px-1">
            <Button
              type="button"
              onClick={() => navigate("/admin/page-builder")}
              className="w-full h-10 rounded-xl font-bold text-xs bg-gradient-to-r from-[#E76F51] to-[#F4A261] hover:from-[#D65D3F] hover:to-[#E59250] text-white shadow-md shadow-[#E76F51]/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              OPEN PAGE BUILDER
            </Button>
          </div>
        </div>

        {/* 🏔️ Right Side: Main Content Panel */}
        <div className="lg:col-span-9 space-y-6">

          {/* ─── 1. OVERVIEW BASECAMP TAB ─── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Header Action Banner */}
              <div className="bg-white border border-slate-200/80 rounded-[16px] p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-[#17233C] uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#E76F51]" /> Basecamp Live Status Overview
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Real-time overview of your website modules and their current state.
                  </p>
                </div>

                <Button
                  onClick={() => navigate("/admin/page-builder")}
                  className="h-9 rounded-xl px-5 text-xs font-bold bg-gradient-to-r from-[#E76F51] to-[#F4A261] hover:from-[#D65D3F] hover:to-[#E59250] text-white shadow-md shadow-[#E76F51]/30 hover:scale-[1.02] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> OPEN BUILDER
                </Button>
              </div>

              {/* Status Grid (6+ Grid Cards with 16px Radius, Micro-interactions, & Pulsing Status) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                {/* Card 1: Homepage Status */}
                <Card className="bg-white rounded-[16px] border border-slate-200/80 p-5 space-y-4 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4 text-[#1B4332]" />
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Homepage</span>
                    </div>
                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 uppercase">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      LIVE
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#17233C]">Dynamic Hero Video</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      {settings.heroVideoEnabled ? "Hero video playback actively streaming" : "Static hero image slideshow active"}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      variant="link"
                      onClick={() => setActiveTab("homepage")}
                      className="text-[#E76F51] hover:text-[#D65D3F] text-xs font-bold p-0 h-6 justify-start flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Customize Homepage <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                </Card>

                {/* Card 2: Design Control Center */}
                <Card className="bg-white rounded-[16px] border border-slate-200/80 p-5 space-y-4 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-purple-600" />
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Visual Design</span>
                    </div>
                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                      ENABLED
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#17233C]">Design Control Center</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      Advanced CSS theme presets, spacing scales & typography controls.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      variant="link"
                      onClick={() => navigate("/admin/design-control-center")}
                      className="text-[#E76F51] hover:text-[#D65D3F] text-xs font-bold p-0 h-6 justify-start flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Go to Design Control Center <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                </Card>

                {/* Card 3: Appearance & Typography */}
                <Card className="bg-white rounded-[16px] border border-slate-200/80 p-5 space-y-4 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-600" />
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Appearance</span>
                    </div>
                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 uppercase">
                      ACTIVE
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#17233C]">Montserrat Font Stack</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      Nature Orange theme preset with custom Google Fonts hierarchy.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      variant="link"
                      onClick={() => navigate("/admin/theme")}
                      className="text-[#E76F51] hover:text-[#D65D3F] text-xs font-bold p-0 h-6 justify-start flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Open Theme Settings <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                </Card>

                {/* Card 4: Footer Setup */}
                <Card className="bg-white rounded-[16px] border border-slate-200/80 p-5 space-y-4 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Footer Grid</span>
                    </div>
                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                      CONFIGURED
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#17233C] truncate">{settings.footer?.brandName || "YouthCamping OS"}</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed truncate">
                      {settings.footer?.address || "HQ address configured"}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      variant="link"
                      onClick={() => navigate("/admin/footer-management")}
                      className="text-[#E76F51] hover:text-[#D65D3F] text-xs font-bold p-0 h-6 justify-start flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Edit Footer Layout <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                </Card>

                {/* Card 5: SEO Presets */}
                <Card className="bg-white rounded-[16px] border border-slate-200/80 p-5 space-y-4 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">SEO Snippets</span>
                    </div>
                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      ACTIVE
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#17233C]">Meta Tags & Schema</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed truncate">
                      {homepageSeo.metaTitle || "YouthCamping - Adventure Travel"}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      variant="link"
                      onClick={() => navigate("/admin/seo")}
                      className="text-[#E76F51] hover:text-[#D65D3F] text-xs font-bold p-0 h-6 justify-start flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Open SEO Optimizer <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                </Card>

                {/* Card 6: Inquiry System */}
                <Card className="bg-white rounded-[16px] border border-slate-200/80 p-5 space-y-4 shadow-xs hover:shadow-md transition-all hover:-translate-y-1 group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Inquiry Engine</span>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      settings.inquiryPopup?.enabled ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-slate-100 text-slate-400"
                    }`}>
                      {settings.inquiryPopup?.enabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#17233C]">Automated Popup</h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                      {settings.inquiryPopup?.delay || 12}s delay trigger on trip pages
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      variant="link"
                      onClick={() => setActiveTab("inquiry")}
                      className="text-[#E76F51] hover:text-[#D65D3F] text-xs font-bold p-0 h-6 justify-start flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
                      Configure Inquiry Options <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                </Card>

              </div>

              {/* Recent Activity Feed Widget */}
              <Card className="bg-white rounded-[16px] border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1B4332]" />
                    <h3 className="text-xs font-extrabold text-[#17233C] uppercase tracking-wider">Recent Portal Activity</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Live Audit Stream</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-[#17233C]">Homepage Hero Video updated</span>
                      <span className="text-slate-400 text-[10px]">by Hemal</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">2 hours ago</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-[#17233C]">Published Manali Trek Journal Article</span>
                      <span className="text-slate-400 text-[10px]">by Hetvi</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">5 hours ago</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="font-bold text-[#17233C]">Auto-invalidated frontend CDN cache</span>
                      <span className="text-slate-400 text-[10px]">by System</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">8 hours ago</span>
                  </div>
                </div>
              </Card>

            </div>
          )}

          {/* ─── 2. GENERAL SETTINGS ─── */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-[#17233C]">Brand Identity</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Edit public site name, logos, and favicon image paths.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Company Name *</Label>
                    <Input
                      value={settings.siteName || ""}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      placeholder="YouthCamping"
                      className="h-10 text-xs border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Favicon URL Path</Label>
                    <Input
                      value={settings.favicon || ""}
                      onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                      placeholder="/favicon.ico"
                      className="h-10 text-xs border-slate-200 font-mono rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Logo Image URL Path</Label>
                    <Input
                      value={settings.logo?.url || ""}
                      onChange={(e) => setSettings({ ...settings, logo: { ...settings.logo, url: e.target.value } })}
                      placeholder="/brand/logo.png"
                      className="h-10 text-xs border-slate-200 font-mono rounded-lg"
                    />
                    {settings.logo?.url && (
                      <div className="mt-2 h-16 rounded-xl border p-2 bg-slate-50 flex items-center justify-center max-w-xs overflow-hidden">
                        <img src={settings.logo.url} className="max-h-full object-contain" alt="Header Logo Preview" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Logo Alt Description</Label>
                    <Input
                      value={settings.logo?.alt || ""}
                      onChange={(e) => setSettings({ ...settings, logo: { ...settings.logo, alt: e.target.value } })}
                      placeholder="YouthCamping Logo"
                      className="h-10 text-xs border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </Card>

              {/* Public Contact Details */}
              <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-[#17233C]">Public Contact & Support</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Specify support email and hotline shown to travelers.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Support Email</Label>
                    <Input
                      value={settings.footer?.email || ""}
                      onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, email: e.target.value } })}
                      placeholder="info@youthcamping.online"
                      className="h-10 text-xs border-slate-200 font-mono rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Support Phone</Label>
                    <Input
                      value={settings.footer?.phone || ""}
                      onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, phone: e.target.value } })}
                      placeholder="+91 99242 46267"
                      className="h-10 text-xs border-slate-200 font-mono rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">HQ Office Physical Address</Label>
                  <Textarea
                    value={settings.footer?.address || ""}
                    onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, address: e.target.value } })}
                    placeholder="Physical address details"
                    className="rounded-xl min-h-[80px] text-xs border-slate-200"
                  />
                </div>
              </Card>

              {/* Social Channels */}
              <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-extrabold text-[#17233C]">Social Media Links</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Integrate brand links for social profiles.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5 text-pink-600" /> Instagram</Label>
                    <Input
                      value={settings.socialLinks?.instagram || ""}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })}
                      placeholder="https://instagram.com/youthcamping"
                      className="h-10 text-xs border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Facebook className="w-3.5 h-3.5 text-blue-600" /> Facebook</Label>
                    <Input
                      value={settings.socialLinks?.facebook || ""}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                      placeholder="https://facebook.com/youthcamping"
                      className="h-10 text-xs border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 text-red-600" /> YouTube</Label>
                    <Input
                      value={settings.socialLinks?.youtube || ""}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, youtube: e.target.value } })}
                      placeholder="https://youtube.com/@youthcamping"
                      className="h-10 text-xs border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Support</Label>
                    <Input
                      value={settings.socialLinks?.whatsapp || ""}
                      onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, whatsapp: e.target.value } })}
                      placeholder="https://wa.me/919924246267"
                      className="h-10 text-xs border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ─── 3. HOMEPAGE TAB ─── */}
          {activeTab === "homepage" && (
            <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-[#17233C]">Homepage Content Sections</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Control individual layout blocks and features on the public portal.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <Button onClick={() => navigate("/admin/page-builder")} className="h-14 rounded-xl justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Layout className="w-4 h-4 text-[#E76F51]" />
                  <div className="text-left flex flex-col">
                    <span>Page Builder Editor</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Edit Grid Layouts</span>
                  </div>
                </Button>
                
                <Button onClick={() => navigate("/admin/theme")} className="h-14 rounded-xl justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Palette className="w-4 h-4 text-[#E76F51]" />
                  <div className="text-left flex flex-col">
                    <span>Appearance & Theme</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Color Presets</span>
                  </div>
                </Button>

                <Button onClick={() => setActiveTab("attractions")} className="h-14 rounded-xl justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <MapPin className="w-4 h-4 text-[#E76F51]" />
                  <div className="text-left flex flex-col">
                    <span>Attractions Grid</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Destinations</span>
                  </div>
                </Button>

                <Button onClick={() => navigate("/admin/reviews")} className="h-14 rounded-xl justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <Star className="w-4 h-4 text-[#E76F51]" />
                  <div className="text-left flex flex-col">
                    <span>Customer Reviews</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Testimonial Feed</span>
                  </div>
                </Button>

                <Button onClick={() => navigate("/admin/blogs")} className="h-14 rounded-xl justify-start px-4 font-bold text-xs gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-none">
                  <BookOpen className="w-4 h-4 text-[#E76F51]" />
                  <div className="text-left flex flex-col">
                    <span>Watch & Read Blogs</span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Journals & Articles</span>
                  </div>
                </Button>
              </div>
            </Card>
          )}

          {/* ─── 4. PUBLIC PAGES TAB ─── */}
          {activeTab === "pages" && (
            <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-[#17233C]">Public Portal Pages</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Lists active page templates mapped in the system.</p>
                </div>
                <Button onClick={() => navigate("/admin/pages")} size="sm" className="bg-[#E76F51] hover:bg-[#D65D3F] text-white rounded-lg h-9 font-semibold text-xs shadow-xs">
                  Manage Custom Pages
                </Button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {[
                  { name: "Homepage Template", path: "/", type: "Core Page" },
                  { name: "Trips Grid List", path: "/trips", type: "Core Page" },
                  { name: "Customer FAQ / Help", path: "/questions", type: "Custom Form Page" },
                  { name: "Watch & Read Blogs", path: "/blogs", type: "Resource Page" },
                  { name: "Privacy Policy", path: "/privacy", type: "Legal Agreement" },
                  { name: "Terms & Conditions", path: "/terms", type: "Legal Agreement" }
                ].map((item, index) => (
                  <div key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="font-extrabold text-xs text-[#17233C]">{item.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{item.path}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border">
                        {item.type}
                      </span>
                      <a
                        href={`${baseUrl}${item.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border hover:bg-slate-100 text-slate-500"
                        title="View Public page"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ─── EMBEDDED MODULE TABS ─── */}
          {activeTab === "blogs" && <BlogsPage />}
          {activeTab === "attractions" && <AttractionsPage />}
          {activeTab === "reviews" && <ReviewsPage />}
          {activeTab === "theme" && <DesignControlCenterPage />}

          {/* ─── 5. NAVIGATION & HEADER TAB ─── */}
          {activeTab === "navigation" && (
            <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-[#17233C]">Navigation Links</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Manage header menu links array on the public site.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings({
                    ...settings,
                    navbarLinks: [...settings.navbarLinks, { label: "", href: "", order: settings.navbarLinks.length }]
                  })}
                  className="rounded-lg h-8.5 font-bold text-xs text-slate-700 border-slate-200"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Menu Item
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Desktop Header CTA Button Text</Label>
                  <Input
                    value={settings.headerCtaText || ""}
                    onChange={(e) => setSettings({ ...settings, headerCtaText: e.target.value })}
                    placeholder="Book Now"
                    className="h-10 text-xs border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Header Sticky Behavior</Label>
                  <select
                    value={settings.headerStyle || "sticky"}
                    onChange={(e) => setSettings({ ...settings, headerStyle: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 px-3 bg-white focus:outline-none"
                  >
                    <option value="sticky">Sticky Header (Default)</option>
                    <option value="normal">Normal Scroll Layout</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-700">Header Menu Items</Label>
                {settings.navbarLinks.map((link: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        value={link.label}
                        onChange={(e) => {
                          const updated = [...settings.navbarLinks];
                          updated[idx].label = e.target.value;
                          setSettings({ ...settings, navbarLinks: updated });
                        }}
                        placeholder="Link Label (e.g. Trips)"
                        className="h-9 text-xs border-slate-200 rounded-lg"
                      />
                      <Input
                        value={link.href}
                        onChange={(e) => {
                          const updated = [...settings.navbarLinks];
                          updated[idx].href = e.target.value;
                          setSettings({ ...settings, navbarLinks: updated });
                        }}
                        placeholder="Relative Path (e.g. /trips)"
                        className="h-9 text-xs border-slate-200 font-mono rounded-lg"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSettings({
                          ...settings,
                          navbarLinks: settings.navbarLinks.filter((_: any, i: number) => i !== idx)
                        });
                      }}
                      className="text-rose-600 hover:bg-rose-50 h-9 w-9 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ─── 6. FOOTER TAB ─── */}
          {activeTab === "footer" && (
            <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-[#17233C]">Footer Details</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Configuration details for the website bottom columns.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl space-y-3 text-xs text-slate-700">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Copyright Tag</span>
                  <span className="font-semibold text-[#17233C]">{settings.footer?.copyright || "All Rights Reserved."}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">HQ Address</span>
                  <span className="font-semibold text-[#17233C] truncate max-w-xs">{settings.footer?.address || "HQ Address"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Brand Name</span>
                  <span className="font-semibold text-[#17233C]">{settings.footer?.brandName || settings.siteName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Support Email</span>
                  <span className="font-semibold text-[#17233C]">{settings.footer?.email || "N/A"}</span>
                </div>
              </div>

              <Button onClick={() => navigate("/admin/footer-management")} className="w-full h-10 rounded-xl font-bold text-xs bg-[#E76F51] hover:bg-[#D65D3F] text-white shadow-xs gap-2">
                <Layout className="w-4 h-4" /> Open Footer Management Editor
              </Button>
            </Card>
          )}

          {/* ─── 8. INQUIRY POPUP TAB ─── */}
          {activeTab === "inquiry" && (
            <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-[#17233C]">Trip Inquiry Popup</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Control settings for the automated lead popup on detail pages.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <Label className="text-xs font-extrabold text-[#17233C] block">Enable Automatic Popup</Label>
                    <span className="text-xs text-slate-500 font-medium">Auto-trigger lead capture modal.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({
                      ...settings,
                      inquiryPopup: { ...settings.inquiryPopup, enabled: !settings.inquiryPopup.enabled }
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.inquiryPopup?.enabled ? 'bg-[#E76F51]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.inquiryPopup?.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Popup Trigger Delay (Seconds)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={settings.inquiryPopup?.delay || 12}
                      onChange={(e) => setSettings({
                        ...settings,
                        inquiryPopup: { ...settings.inquiryPopup, delay: parseInt(e.target.value) || 12 }
                      })}
                      className="h-10 text-xs border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Popup Header Title</Label>
                  <Input
                    value={settings.inquiryPopup?.title || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      inquiryPopup: { ...settings.inquiryPopup, title: e.target.value }
                    })}
                    placeholder="Plan Your Next Trip"
                    className="h-10 text-xs border-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Popup Description Text</Label>
                  <Input
                    value={settings.inquiryPopup?.description || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      inquiryPopup: { ...settings.inquiryPopup, description: e.target.value }
                    })}
                    placeholder="Connect with our destination experts"
                    className="h-10 text-xs border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* ─── 9. BOOKING ENGINE TAB ─── */}
          {activeTab === "booking" && (
            <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-[#17233C]">Booking Checkout Engine</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Control GST, submit button labels, and consent copy.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Submit Button Text</Label>
                  <Input
                    value={settings.bookingForm?.submitButtonText || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      bookingForm: { ...settings.bookingForm, submitButtonText: e.target.value }
                    })}
                    placeholder="Confirm Booking"
                    className="h-10 text-xs border-slate-200 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Success Message Text</Label>
                  <Input
                    value={settings.bookingForm?.successMessage || ""}
                    onChange={(e) => setSettings({
                      ...settings,
                      bookingForm: { ...settings.bookingForm, successMessage: e.target.value }
                    })}
                    placeholder="Your booking has been received!"
                    className="h-10 text-xs border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">GST Calculation Rule</Label>
                <select
                  value={settings.bookingForm?.gstOption || "full"}
                  onChange={(e) => setSettings({
                    ...settings,
                    bookingForm: { ...settings.bookingForm, gstOption: e.target.value }
                  })}
                  className="h-10 w-full rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 px-3 bg-white focus:outline-none"
                >
                  <option value="full">Calculate GST on Full Package Amount (Option A)</option>
                  <option value="advance">Calculate GST only on Advance Booking Amount (Option B)</option>
                </select>
              </div>
            </Card>
          )}

          {/* ─── 10. SEO & SEARCH TAB ─── */}
          {activeTab === "seo" && (
            <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-[#17233C]">Search Engine Optimization</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Configuration overview for Google snippets and search metadata.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Homepage Meta Title</span>
                  <span className="font-extrabold text-[#17233C] text-xs">{homepageSeo.metaTitle || "YouthCamping - Adventure Travel & Expeditions"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Homepage Meta Description</span>
                  <span className="font-medium text-slate-600 leading-relaxed">{homepageSeo.metaDescription || "Official YouthCamping website for expedition packages, treks, and group travel."}</span>
                </div>
              </div>

              <Button onClick={() => navigate("/admin/seo")} className="w-full h-10 rounded-xl font-bold text-xs bg-[#E76F51] hover:bg-[#D65D3F] text-white shadow-xs gap-2">
                <Search className="w-4 h-4" /> Open Full SEO Optimizer Center
              </Button>
            </Card>
          )}

          {/* ─── 12. ADVANCED SETTINGS TAB ─── */}
          {activeTab === "advanced" && (
            <Card className="bg-white rounded-[16px] border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-[#17233C]">Raw Settings JSON</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Developer view of global settings state.</p>
              </div>

              <div className="bg-slate-950 text-slate-100 p-5 rounded-xl font-mono text-xs overflow-auto max-h-[350px]">
                <pre>{JSON.stringify(settings, null, 2)}</pre>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
