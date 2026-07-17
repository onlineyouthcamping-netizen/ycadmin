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
    <div className="bg-white px-6 pt-2 border-b border-slate-200 shrink-0">
      <div className="flex gap-6 overflow-x-auto no-scrollbar">
        {TRAVEL_DESK_TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={`/admin/travel-desk?tripId=${tripId}&tab=${tab.id}`}
              className={cn(
                "pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap",
                isActive 
                  ? "text-[#FF6B00] border-[#FF6B00]" 
                  : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
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
