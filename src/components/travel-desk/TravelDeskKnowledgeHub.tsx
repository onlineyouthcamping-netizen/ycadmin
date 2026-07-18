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

  // Frontend Icon and Color mapping based on slug
  const categoryConfig: Record<string, { icon: any, colorClass: string, bgClass: string, desc: string }> = {
    'trip-overview': { icon: BookOpen, colorClass: 'text-blue-600', bgClass: 'bg-blue-50 border border-blue-100/50', desc: 'Highlights, route, best time, difficulty, key details' },
    'sales-guide': { icon: Briefcase, colorClass: 'text-amber-600', bgClass: 'bg-amber-50 border border-amber-100/50', desc: 'How to sell, USPs, objections & answers' },
    'customer-faqs': { icon: HelpCircle, colorClass: 'text-green-600', bgClass: 'bg-green-50 border border-green-100/50', desc: 'All customer questions & answers' },
    'inclusions-&-exclusions': { icon: ClipboardCheck, colorClass: 'text-purple-600', bgClass: 'bg-purple-50 border border-purple-100/50', desc: "What's included / not included" },
    'ticketing-info': { icon: Ticket, colorClass: 'text-rose-500', bgClass: 'bg-rose-50 border border-rose-100/50', desc: 'Train, flight, bus, cab details & rules' },
    'visa-&-entry': { icon: Globe, colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50 border border-indigo-100/50', desc: 'Permit, documents, requirements' },
    'destination-guide': { icon: MapPin, colorClass: 'text-cyan-600', bgClass: 'bg-cyan-50 border border-cyan-100/50', desc: 'Weather, food, culture, places, local tips' },
    'packing-guide': { icon: Luggage, colorClass: 'text-yellow-600', bgClass: 'bg-yellow-50 border border-yellow-100/50', desc: 'What to carry, checklist & tips' }
  };

  const getCategoryConfig = (slug: string) => {
    return categoryConfig[slug] || { icon: BookOpen, colorClass: 'text-slate-500', bgClass: 'bg-slate-100 border border-slate-200/50', desc: 'Trip documentation' };
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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
      
      {/* 1. BLUE SINGLE SOURCE OF TRUTH BANNER */}
      <div className="bg-[#EBF5FF] border border-[#BFDBFE] rounded-xl px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1E40AF]">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>This is your single source of truth for everything about this trip. Keep content updated for the entire team.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs">
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Trip Settings</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs">
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* 2. HEADING & PROGRESS ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Knowledge Hub</h2>
          <p className="text-[11px] text-slate-450 mt-0.5 font-bold">All important information, FAQs and guides at one place.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-extrabold text-slate-500 tracking-wide uppercase">Content Completeness</span>
          <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }} />
          </div>
          <span className="text-xs font-black text-slate-800">85%</span>
        </div>
      </div>

      {/* 3. CATEGORIES GRID */}
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
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#FF6B00] hover:shadow-md transition-all cursor-pointer group flex flex-col h-full shadow-2xs"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className={`p-2 rounded-lg ${config.bgClass} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.colorClass}`} />
                </div>
                <h3 className="text-xs md:text-[12.5px] font-black text-slate-800 group-hover:text-[#FF6B00] transition-colors leading-snug pr-1" title={cat.name}>{cat.name}</h3>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 flex-1 leading-relaxed mb-4">
                {config.desc}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <span className="text-[11px] font-extrabold text-slate-400 bg-slate-50 px-3 py-1 rounded-full group-hover:bg-[#FFF0E6] group-hover:text-[#FF6B00] transition-colors">
                  {count} {count === 1 ? 'Item' : 'Items'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-450 group-hover:text-[#FF6B00] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. TRIP AT A GLANCE */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Trip At a Glance</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-450 font-bold text-[10px] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Duration</span>
            </div>
            <span className="text-xs font-black text-slate-750">{trip.duration || '9D / 8N'}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-450 font-bold text-[10px] uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Group Size</span>
            </div>
            <span className="text-xs font-black text-slate-750">{trip.maxGroupSize ? `${trip.maxGroupSize} Pax` : '15 - 45 Pax'}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-450 font-bold text-[10px] uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Difficulty</span>
            </div>
            <span className="text-xs font-black text-slate-750 capitalize">{trip.difficulty || 'Easy to Moderate'}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-450 font-bold text-[10px] uppercase tracking-wider">
              <Sun className="w-3.5 h-3.5 text-slate-400" />
              <span>Best Season</span>
            </div>
            <span className="text-xs font-black text-slate-750">{trip.startEnd || 'Mar - Jun'}</span>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-450 font-bold text-[10px] uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Region</span>
            </div>
            <span className="text-xs font-black text-slate-750 truncate">{trip.location || 'Himachal Pradesh & Punjab'}</span>
          </div>
        </div>
      </div>

      {/* 5. YELLOW ADVISORY BANNER */}
      <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl px-4 py-3.5 flex items-center gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-[#D97706] shrink-0" />
        <span className="text-xs font-black text-[#92400E]">
          Keep this information updated to ensure smooth operations and better customer experience.
        </span>
      </div>

    </div>
  );
};
