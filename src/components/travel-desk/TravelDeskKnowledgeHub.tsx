import React, { useEffect, useState } from 'react';
import { Trip } from '@/types';
import { TravelDeskWorkspace, travelDeskService } from '@/services/travelDesk.service';
import { 
  BookOpen, Briefcase, HelpCircle, ClipboardCheck, 
  Ticket, Globe, MapPin, Luggage, 
  ChevronRight, Info, Settings, Share2,
  Calendar, Users, Activity, Sun
} from 'lucide-react';
import api from '@/services/api';
import { CategoryArticlesView } from './CategoryArticlesView';

interface TravelDeskKnowledgeHubProps {
  trip: Trip;
  workspace: TravelDeskWorkspace;
}

interface Notice {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  requiresAcknowledgement: boolean;
  publishedAt: string;
}

export const TravelDeskKnowledgeHub: React.FC<TravelDeskKnowledgeHubProps> = ({ trip, workspace }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activeCategory, setActiveCategory] = useState<any | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<TravelDeskWorkspace>(workspace);

  // Sync workspace if it changes on parent selection
  useEffect(() => {
    setCurrentWorkspace(workspace);
    setActiveCategory(null); // Reset detail view on trip change
  }, [workspace, trip.id]);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await api.get(`/travel-desk/${trip.id}/notices`);
        if (res.data.success) {
          setNotices(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch notices", err);
      }
    };
    fetchNotices();
  }, [trip.id]);

  const refreshWorkspace = async () => {
    try {
      const [ws, docRes] = await Promise.all([
        travelDeskService.getWorkspace(trip.id),
        travelDeskService.getDocuments(trip.id)
      ]);
      if (ws) {
        setCurrentWorkspace(ws);
      }
      if (docRes && docRes.data) {
        const salesDocs = docRes.data.filter(
          (d: any) => d.category === 'Sales Guide' && d.status !== 'ARCHIVED'
        );
        setSalesPdfCount(salesDocs.length);
      }
    } catch (err) {
      console.error("Failed to refresh workspace category counts", err);
    }
  };

  const [salesPdfCount, setSalesPdfCount] = useState(0);

  useEffect(() => {
    const fetchSalesPdfs = async () => {
      try {
        const docRes = await travelDeskService.getDocuments(trip.id);
        if (docRes && docRes.data) {
          const salesDocs = docRes.data.filter(
            (d: any) => d.category === 'Sales Guide' && d.status !== 'ARCHIVED'
          );
          setSalesPdfCount(salesDocs.length);
        }
      } catch (err) {
        console.error("Failed to load PDF count", err);
      }
    };
    fetchSalesPdfs();
  }, [trip.id]);

  // Category Configuration
  const categoryConfig: Record<string, { icon: any, colorClass: string, bgClass: string, desc: string }> = {
    'trip-overview': { icon: BookOpen, colorClass: 'text-[#F97316]', bgClass: 'bg-[#FFF7ED] border border-[#FED7AA]', desc: 'Highlights, route, best time, difficulty, key details' },
    'sales-guide': { icon: Briefcase, colorClass: 'text-[#F97316]', bgClass: 'bg-[#FFF7ED] border border-[#FED7AA]', desc: 'How to sell, USPs, objections & answers' },
    'customer-faqs': { icon: HelpCircle, colorClass: 'text-[#10B981]', bgClass: 'bg-emerald-50 border border-emerald-100', desc: 'All customer questions & answers' },
    'inclusions-&-exclusions': { icon: ClipboardCheck, colorClass: 'text-[#0A192F]', bgClass: 'bg-slate-100 border border-slate-200', desc: "What's included / not included" },
    'ticketing-info': { icon: Ticket, colorClass: 'text-[#F97316]', bgClass: 'bg-[#FFF7ED] border border-[#FED7AA]', desc: 'Train, flight, bus, cab details & rules' },
    'visa-&-entry': { icon: Globe, colorClass: 'text-[#0A192F]', bgClass: 'bg-slate-100 border border-slate-200', desc: 'Permit, documents, requirements' },
    'destination-guide': { icon: MapPin, colorClass: 'text-[#0A192F]', bgClass: 'bg-slate-100 border border-slate-200', desc: 'Weather, food, culture, places, local tips' },
    'packing-guide': { icon: Luggage, colorClass: 'text-[#F97316]', bgClass: 'bg-[#FFF7ED] border border-[#FED7AA]', desc: 'What to carry, checklist & tips' }
  };

  const getCategoryConfig = (slug: string) => {
    return categoryConfig[slug] || { icon: BookOpen, colorClass: 'text-[#0A192F]', bgClass: 'bg-[#F8FAFC] border border-[#E2E8F0]', desc: 'Trip documentation' };
  };

  const displayCategories = currentWorkspace.categories || [];

  if (activeCategory) {
    return (
      <CategoryArticlesView 
        tripId={trip.id}
        category={activeCategory}
        onBack={() => setActiveCategory(null)}
        onRefreshCount={refreshWorkspace}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-[#F8FAFC] font-sans">
      
      {/* 1. LIGHT ORANGE INFO BANNER (Bg: Light orange #FFF7ED, Text: Navy #0A192F) */}
      <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 text-xs font-medium text-[#0A192F]">
          <Info className="w-4 h-4 text-[#F97316] shrink-0" />
          <span>This is your single source of truth for everything about this trip. Keep content updated for the entire team.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] text-white border border-[#233554] rounded-lg text-xs font-semibold hover:bg-[#112240] transition-all">
            <Settings className="w-3.5 h-3.5 text-white" />
            <span>Trip Settings</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] text-white border border-[#233554] rounded-lg text-xs font-semibold hover:bg-[#112240] transition-all">
            <Share2 className="w-3.5 h-3.5 text-white" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* 2. HEADING & PROGRESS ROW (Content Completeness bar: Orange #F97316) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-0.5">
        <div>
          <h2 className="text-base font-bold text-[#0A192F] tracking-tight">Knowledge Hub</h2>
          <p className="text-[11px] text-[#64748B] font-medium mt-0.5">All important information, FAQs and guides at one place.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] font-semibold text-[#64748B] tracking-wide uppercase">Content Completeness</span>
          <div className="w-28 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div className="h-full bg-[#F97316] rounded-full" style={{ width: '85%' }} />
          </div>
          <span className="text-xs font-bold text-[#0A192F]">85%</span>
        </div>
      </div>

      {/* 3. CATEGORIES GRID (12px padding, 12px gap, "1 Item" / "0 Items" in Navy #0A192F, Card arrow in Navy #0A192F) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
        {displayCategories.map((cat: any) => {
          const config = getCategoryConfig(cat.slug);
          const Icon = config.icon;
          const isSales = cat.slug === 'sales-guide';
          const count = (cat._count?.articles || 0) + (isSales ? salesPdfCount : 0);
          
          return (
            <div 
              key={cat.id}
              onClick={() => setActiveCategory(cat)}
              className="bg-white border border-[#E2E8F0] rounded-xl p-3 hover:border-[#0A192F] hover:shadow-xs transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${config.bgClass} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.colorClass}`} />
                </div>
                <h3 className="text-xs font-bold text-[#0A192F] group-hover:text-[#F97316] transition-colors leading-snug truncate" title={cat.name}>
                  {cat.name}
                </h3>
              </div>
              <p className="text-[11px] font-normal text-[#64748B] flex-1 leading-relaxed mb-3">
                {config.desc}
              </p>
              <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-[#E2E8F0]">
                {/* "1 Item" / "0 Items" text: Navy #0A192F */}
                <span className="text-[11px] font-semibold text-[#0A192F] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-0.5 rounded-md group-hover:bg-[#FFF7ED] group-hover:text-[#F97316] transition-colors">
                  {count} {count === 1 ? 'Item' : 'Items'}
                </span>
                {/* Card Arrow -> Navy #0A192F */}
                <ChevronRight className="w-4 h-4 text-[#0A192F] group-hover:text-[#F97316] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. TRIP AT A GLANCE CARDS (White bg, 1px #E2E8F0 border, equal height min-h-[80px]) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-[#0A192F] uppercase tracking-wider">Trip At a Glance</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 min-h-[80px] h-full flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-[10px] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Duration</span>
            </div>
            <span className="text-xs font-bold text-[#0A192F]">{trip.duration || '9D / 8N'}</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 min-h-[80px] h-full flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-[10px] uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Group Size</span>
            </div>
            <span className="text-xs font-bold text-[#0A192F]">{trip.maxGroupSize ? `${trip.maxGroupSize} Pax` : '15 - 45 Pax'}</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 min-h-[80px] h-full flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-[10px] uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Difficulty</span>
            </div>
            <span className="text-xs font-bold text-[#0A192F] capitalize">{trip.difficulty || 'Easy to Moderate'}</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 min-h-[80px] h-full flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-[10px] uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Best Season</span>
            </div>
            <span className="text-xs font-bold text-[#0A192F]">{trip.startEnd || 'Mar - Jun'}</span>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 min-h-[80px] h-full flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-[10px] uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Region</span>
            </div>
            <span className="text-xs font-bold text-[#0A192F] truncate">{trip.location || 'Himachal Pradesh & Punjab'}</span>
          </div>
        </div>
      </div>

      {/* 5. WARNING / ADVISORY BANNER AT BOTTOM (Navy #0A192F bg, White text) */}
      <div className="bg-[#0A192F] border border-[#233554] rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-xs">
        <Info className="w-4 h-4 text-[#F97316] shrink-0" />
        <span className="text-xs font-medium text-white">
          Keep this information updated to ensure smooth operations and better customer experience.
        </span>
      </div>

    </div>
  );
};
