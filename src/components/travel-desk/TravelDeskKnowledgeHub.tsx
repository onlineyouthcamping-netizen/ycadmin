import React, { useEffect, useState } from 'react';
import { Trip } from '@/types';
import { TravelDeskWorkspace } from '@/services/travelDesk.service';
import { 
  BookOpen, Briefcase, HelpCircle, ClipboardCheck, 
  Ticket, Globe, MapPin, Luggage, 
  Layers, LifeBuoy, IndianRupee, Lightbulb,
  ChevronRight, AlertTriangle
} from 'lucide-react';
import api from '@/services/api';

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

  // Frontend Icon and Color mapping based on slug
  const categoryConfig: Record<string, { icon: any, colorClass: string, bgClass: string, desc: string }> = {
    'trip-overview': { icon: BookOpen, colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50', desc: 'Key highlights, route, best time, difficulty & more' },
    'sales-guide': { icon: Briefcase, colorClass: 'text-orange-500', bgClass: 'bg-orange-50', desc: 'How to sell, USPs, objections & answers' },
    'customer-faqs': { icon: HelpCircle, colorClass: 'text-green-600', bgClass: 'bg-green-50', desc: 'All customer questions & answers' },
    'inclusions-&-exclusions': { icon: ClipboardCheck, colorClass: 'text-purple-600', bgClass: 'bg-purple-50', desc: "What's included / not included" },
    'ticketing-info': { icon: Ticket, colorClass: 'text-rose-500', bgClass: 'bg-rose-50', desc: 'Train, flight, bus, cab SOPs & rules' },
    'visa-&-entry': { icon: Globe, colorClass: 'text-blue-600', bgClass: 'bg-blue-50', desc: 'Visa process, docs, requirements' },
    'destination-guide': { icon: MapPin, colorClass: 'text-teal-600', bgClass: 'bg-teal-50', desc: 'Weather, food, culture, local info' },
    'packing-guide': { icon: Luggage, colorClass: 'text-yellow-600', bgClass: 'bg-yellow-50', desc: 'What to carry, checklist, tips' },
    'sops-&-processes': { icon: Layers, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50', desc: 'Operational SOPs & workflows' },
    'emergency-center': { icon: LifeBuoy, colorClass: 'text-red-600', bgClass: 'bg-red-50', desc: 'What to do in emergencies' },
    'pricing-&-policy': { icon: IndianRupee, colorClass: 'text-violet-600', bgClass: 'bg-violet-50', desc: 'Price sheet, cancellation, refund' },
    'past-learnings': { icon: Lightbulb, colorClass: 'text-blue-500', bgClass: 'bg-blue-50', desc: 'Lessons, feedback & improvements' }
  };

  const getCategoryConfig = (slug: string) => {
    return categoryConfig[slug] || { icon: BookOpen, colorClass: 'text-slate-500', bgClass: 'bg-slate-100', desc: 'Trip documentation' };
  };

  const activeNotices = notices.filter(n => n.requiresAcknowledgement || n.priority === 'HIGH' || n.type === 'WARNING');

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      
      {/* HEADER / ACTIONS ROW */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-wider">KNOWLEDGE HUB</h2>
          <p className="text-xs text-slate-500 mt-0.5">Everything you need to know about this trip</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            Edit Trip Content
          </button>
          <button className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            Trip Settings
          </button>
        </div>
      </div>

      {/* MUST READ NOTICES */}
      {activeNotices.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-orange-800">MUST READ UPDATES</h3>
          </div>
          <div className="space-y-2">
            {activeNotices.map(notice => (
              <div key={notice.id} className="bg-white rounded-lg p-3 border border-orange-100 flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{notice.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{notice.message}</p>
                </div>
                {notice.requiresAcknowledgement && (
                  <button className="shrink-0 ml-4 px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-md hover:bg-orange-200 transition-colors">
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {workspace.categories?.map((cat: any) => {
          const config = getCategoryConfig(cat.slug);
          const Icon = config.icon;
          const count = cat._count?.articles || 0;
          
          return (
            <div 
              key={cat.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-[#FF6B00] hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-lg ${config.bgClass}`}>
                  <Icon className={`w-5 h-5 ${config.colorClass}`} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#FF6B00] transition-colors">{cat.name}</h3>
              </div>
              <p className="text-xs text-slate-500 flex-1 leading-relaxed mb-4">
                {config.desc}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full group-hover:bg-[#FFF0E6] group-hover:text-[#FF6B00] transition-colors">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#FF6B00] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
