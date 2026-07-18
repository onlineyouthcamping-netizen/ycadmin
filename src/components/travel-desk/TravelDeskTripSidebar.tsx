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
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0">
      <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">My Trips</h3>
        
        {/* TAB FILTER */}
        <div className="flex gap-4 border-b border-slate-200">
          <button
            onClick={() => setTripTypeFilter("domestic")}
            className={cn(
              "pb-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              tripTypeFilter === "domestic" ? "text-[#FF6B00] border-[#FF6B00]" : "text-slate-400 border-transparent hover:text-slate-600"
            )}
          >
            Domestic
          </button>
          <button
            onClick={() => setTripTypeFilter("international")}
            className={cn(
              "pb-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer",
              tripTypeFilter === "international" ? "text-[#FF6B00] border-[#FF6B00]" : "text-slate-400 border-transparent hover:text-slate-600"
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
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
          />
          <Search className="absolute right-3 top-2.5 text-slate-400 w-3.5 h-3.5" />
        </div>

        {/* ACTIVATE BUTTON */}
        <button
          onClick={onFeedClick}
          className="w-full flex items-center justify-center gap-1.5 bg-[#0F172A] text-white py-2 rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Activate Master Trip
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#FF6B00] rounded-full animate-spin" />
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center p-4 text-slate-400 text-xs font-semibold">
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
                    ? "bg-[#FFF9F5] border-[#FF6B00]/40 shadow-xs" 
                    : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                )}
              >
                <div className="flex gap-2.5 items-center">
                  {/* Thumbnail Image */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200/50">
                    {trip.heroImage ? (
                      <img src={trip.heroImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-405">
                        <Compass className="w-4.5 h-4.5" />
                      </div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={cn(
                        "text-[12px] font-black truncate pr-1.5",
                        isActive ? "text-[#FF6B00]" : "text-slate-800"
                      )}>
                        {trip.shortName || trip.title}
                      </h4>
                      {score < 50 && (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-400 truncate">
                        {trip.id}
                      </p>
                      <div className={cn(
                        "px-1.5 py-0.5 rounded text-[8.5px] font-black shrink-0",
                        score >= 80 ? "bg-green-100 text-green-700" :
                        score >= 50 ? "bg-yellow-100 text-yellow-750" : "bg-red-100 text-red-700"
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
      <div className="p-3 border-t border-slate-150 bg-slate-50/30 shrink-0 text-center">
        <Link 
          to="/admin/trips" 
          className="text-xs font-black text-slate-450 hover:text-[#FF6B00] inline-flex items-center gap-0.5 transition-colors"
        >
          View all trips <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
