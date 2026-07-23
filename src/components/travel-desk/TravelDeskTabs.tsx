import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const TRAVEL_DESK_TABS = [
  { id: 'knowledge', label: 'Knowledge Hub' },
  { id: 'departures', label: 'Departures' },
  { id: 'vendors', label: 'Vendor Directory' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'documents', label: 'Documents' },
  { id: 'sops', label: 'SOPs' },
  { id: 'ticketing', label: 'Ticketing' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'activity', label: 'Activity Log' }
];

interface TravelDeskTabsProps {
  tripId: string;
}

export const TravelDeskTabs: React.FC<TravelDeskTabsProps> = ({ tripId }) => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'knowledge';

  return (
    <div className="bg-white px-4 pt-2.5 mt-1 border-b border-[#E2E8F0] shrink-0 font-sans">
      <div className="flex gap-5 overflow-x-auto no-scrollbar">
        {TRAVEL_DESK_TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={`/admin/travel-desk?tripId=${tripId}&tab=${tab.id}`}
              className={cn(
                "pb-2.5 text-[13px] font-semibold transition-all border-b-2 whitespace-nowrap",
                isActive 
                  ? "text-[#F97316] border-[#F97316] font-bold" 
                  : "text-[#0A192F] border-transparent hover:text-[#F97316] hover:border-slate-200"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};
