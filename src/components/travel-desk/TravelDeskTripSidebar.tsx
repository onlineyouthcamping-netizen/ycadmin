import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Compass, AlertTriangle, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TravelDeskTripSidebarProps {
  trips: any[];
  activeTripId?: string;
  isLoading: boolean;
  onFeedClick: () => void;
}

export const TravelDeskTripSidebar: React.FC<TravelDeskTripSidebarProps> = ({ trips, activeTripId, isLoading, onFeedClick }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'knowledge';
  
  const [tripTypeFilter, setTripTypeFilter] = useState<"domestic" | "international">("domestic");
  const [search, setSearch] = useState("");

  const filteredTrips = trips.filter(t => {
    const type = t.tripType?.toLowerCase() || t.category?.toLowerCase() || "";
    const isInternational = type.includes("international") || 
                            t.location?.toLowerCase().includes("vietnam") || 
                            t.location?.toLowerCase().includes("thailand") || 
                            t.location?.toLowerCase().includes("dubai") || 
                            t.location?.toLowerCase().includes("bali");
    const isMatchedType = tripTypeFilter === "international" ? isInternational : !isInternational;
    
    const isMatchedSearch = t.title?.toLowerCase().includes(search.toLowerCase()) || 
                            t.location?.toLowerCase().includes(search.toLowerCase()) ||
                            (t.shortName && t.shortName.toLowerCase().includes(search.toLowerCase()));
    return isMatchedType && isMatchedSearch;
  });

  return (
    <div className="w-80 bg-white border-r border-[#E2E8F0] flex flex-col h-full overflow-hidden shrink-0 font-sans">
      <div className="p-4 border-b border-[#E2E8F0] space-y-3 shrink-0">
        <h3 className="text-sm font-bold text-[#0A192F] uppercase tracking-wider">My Trips</h3>
        
        {/* TAB FILTER (DOMESTIC: Orange #F97316, INTERNATIONAL: Navy #0A192F) */}
        <div className="flex gap-4 border-b border-[#E2E8F0]">
          <button
            onClick={() => setTripTypeFilter("domestic")}
            className={cn(
              "pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              tripTypeFilter === "domestic" ? "text-[#F97316] border-[#F97316]" : "text-[#0A192F] border-transparent hover:text-[#F97316]"
            )}
          >
            Domestic
          </button>
          <button
            onClick={() => setTripTypeFilter("international")}
            className={cn(
              "pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              tripTypeFilter === "international" ? "text-[#F97316] border-[#F97316]" : "text-[#0A192F] border-transparent hover:text-[#F97316]"
            )}
          >
            International
          </button>
        </div>

        {/* SEARCH */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search active trips..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-3 pr-8 py-2 text-xs font-medium placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#F97316] text-[#0A192F]"
          />
          <Search className="absolute right-3 top-2.5 text-[#64748B] w-3.5 h-3.5" />
        </div>

        {/* ACTIVATE BUTTON (Navy #0A192F bg) */}
        <button
          onClick={onFeedClick}
          className="w-full flex items-center justify-center gap-1.5 bg-[#0A192F] text-white py-2 rounded-lg font-bold text-xs hover:bg-[#112240] transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Activate Master Trip
        </button>
      </div>

      {/* 8px Spacing Between Trip List Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#F97316] rounded-full animate-spin" />
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center p-4 text-[#64748B] text-xs font-semibold">
            No matching trips.
          </div>
        ) : (
          filteredTrips.map(trip => {
            const isActive = trip.id === activeTripId;
            const score = trip.travelDeskWorkspace?.readinessScore || 0;
            
            return (
              <div
                key={trip.id}
                onClick={() => setSearchParams({ tripId: trip.id, tab: currentTab })}
                className={cn(
                  "block p-2.5 rounded-xl border transition-all cursor-pointer",
                  isActive 
                    ? "bg-[#FFF7ED] border-[#F97316]/40 shadow-xs" 
                    : "bg-white border-[#E2E8F0] hover:border-slate-300 hover:bg-[#F8FAFC]"
                )}
              >
                <div className="flex gap-2.5 items-center">
                  {/* Thumbnail Image */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                    {trip.heroImage ? (
                      <img src={trip.heroImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                        <Compass className="w-4.5 h-4.5" />
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={cn(
                        "text-[12px] font-bold truncate pr-1.5",
                        isActive ? "text-[#F97316]" : "text-[#0A192F]"
                      )}>
                        {trip.shortName || trip.title}
                      </h4>
                      {score < 50 && (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {/* Trip Code MKA-1: Muted #64748B */}
                      <p className="text-[10px] font-semibold text-[#64748B] truncate">
                        {trip.code || trip.id}
                      </p>

                      {/* Progress Badge: Orange #F97316 if warning, Green #10B981 if good */}
                      <div className={cn(
                        "px-1.5 py-0.5 rounded text-[8.5px] font-bold shrink-0",
                        score >= 80 ? "bg-emerald-100 text-emerald-800" :
                        score >= 50 ? "bg-[#FFF7ED] text-[#F97316] border border-[#F97316]/30" : "bg-rose-100 text-rose-800"
                      )}>
                        {score}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* FOOTER LINK */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0 text-center">
        <Link 
          to="/admin/trips" 
          className="text-xs font-bold text-[#0A192F] hover:text-[#F97316] inline-flex items-center gap-0.5 transition-colors"
        >
          View all trips <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
