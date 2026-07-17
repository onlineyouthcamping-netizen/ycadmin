import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Compass, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TravelDeskTripSidebarProps {
  trips: any[];
  activeTripId?: string;
  isLoading: boolean;
  onFeedClick: () => void;
}

export const TravelDeskTripSidebar: React.FC<TravelDeskTripSidebarProps> = ({ trips, activeTripId, isLoading, onFeedClick }) => {
  const [searchParams] = useSearchParams();
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
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-slate-100 space-y-2 shrink-0">
        <div className="flex gap-1.5 p-0.5 bg-slate-50 border border-slate-200 rounded-lg">
          <button
            onClick={() => setTripTypeFilter("domestic")}
            className={cn(
              "flex-1 text-center py-1.5 text-[10px] font-black rounded-md uppercase tracking-wider transition-all cursor-pointer",
              tripTypeFilter === "domestic" ? "bg-white text-slate-800 shadow-sm border" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Domestic
          </button>
          <button
            onClick={() => setTripTypeFilter("international")}
            className={cn(
              "flex-1 text-center py-1.5 text-[10px] font-black rounded-md uppercase tracking-wider transition-all cursor-pointer",
              tripTypeFilter === "international" ? "bg-white text-slate-800 shadow-sm border" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Int'l
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search active trips..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
          />
        </div>
        <button
          onClick={onFeedClick}
          className="w-full flex items-center justify-center gap-1.5 bg-slate-900 text-white py-2 rounded-md font-bold text-xs hover:bg-slate-800 transition-colors"
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
              <Link
                key={trip.id}
                to={`/admin/travel-desk?tripId=${trip.id}&tab=${currentTab}`}
                className={cn(
                  "block p-2 rounded-lg border transition-all",
                  isActive 
                    ? "bg-[#FFF9F5] border-[#FF6B00]/30 shadow-sm" 
                    : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className={cn(
                    "text-[13px] font-bold truncate pr-2",
                    isActive ? "text-[#FF6B00]" : "text-slate-800"
                  )}>
                    {trip.shortName || trip.title}
                  </h3>
                  {score < 50 && (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] font-semibold text-slate-500 truncate flex-1 pr-2">
                    {trip.location || "Location TBD"}
                  </p>
                  <div className={cn(
                    "px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] font-bold shrink-0",
                    score >= 80 ? "bg-green-100 text-green-700" :
                    score >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  )}>
                    {score}%
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};
