import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Bell, ExternalLink, CreditCard, FilePlus, FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';

interface Notice {
  id: string;
  title: string;
  message: string;
  publishedAt: string;
}

export const TravelDeskQuickActions = () => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'knowledge';

  const getActionsForTab = (tab: string) => {
    switch (tab) {
      case 'knowledge':
        return [
          { icon: Plus, label: "Add Knowledge Item" },
          { icon: CreditCard, label: "Manage Approvals" },
          { icon: Bell, label: "Add Notice" }
        ];
      case 'departures':
        return [
          { icon: ExternalLink, label: "View All Bookings" },
          { icon: Bell, label: "Add Operations Notice" }
        ];
      case 'ticketing':
        return [
          { icon: CreditCard, label: "Add Ticketing SOP" },
          { icon: ExternalLink, label: "Add Quick Link" }
        ];
      case 'itinerary':
        return [
          { icon: Plus, label: "Add Day Plan" }
        ];
      case 'sops':
        return [
          { icon: Plus, label: "Add New SOP" }
        ];
      case 'documents':
        return [
          { icon: Upload, label: "Upload Document" }
        ];
      case 'vendors':
        return [
          { icon: Plus, label: "Link Vendor" }
        ];
      default:
        return [
          { icon: Bell, label: "Add Notice" }
        ];
    }
  };

  const actions = getActionsForTab(currentTab);

  return (
    <div className="w-[280px] bg-white border-l border-[#E2E8F0] shrink-0 flex flex-col h-full overflow-hidden font-sans">
      <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <h3 className="text-xs font-bold text-[#0A192F] uppercase tracking-wider">Quick Actions</h3>
      </div>
      {/* 10px vertical per item padding */}
      <div className="p-3 space-y-2 overflow-y-auto border-b border-[#E2E8F0]">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              className="w-full flex items-center gap-3 py-[10px] px-3 text-left bg-white border border-[#E2E8F0] rounded-lg hover:border-[#0A192F] hover:bg-[#F8FAFC] transition-all group cursor-pointer"
            >
              <div className="bg-[#F8FAFC] p-1.5 rounded-md group-hover:bg-[#0A192F] group-hover:text-white text-[#0A192F] transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#0A192F] group-hover:text-[#0A192F]">{action.label}</span>
            </button>
          );
        })}
      </div>

      {currentTab === 'knowledge' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3.5 flex items-center justify-between border-b border-[#E2E8F0]">
            <h3 className="text-[11px] font-bold text-[#0A192F] uppercase tracking-wider">Recent Updates</h3>
            <button className="text-[11px] font-bold text-[#F97316] hover:underline">View all</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            <RecentUpdatesFeed />
          </div>
        </div>
      )}
    </div>
  );
};

const RecentUpdatesFeed = () => {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  const [updates, setUpdates] = React.useState<Notice[]>([]);

  React.useEffect(() => {
    if (!tripId) return;
    api.get(`/travel-desk/${tripId}/notices`).then(res => {
      if (res.data.success) {
        setUpdates(res.data.data.slice(0, 5));
      }
    }).catch(console.error);
  }, [tripId]);

  if (updates.length === 0) {
    {/* Left align, #64748B text */}
    return <p className="text-xs text-[#64748B] text-left py-2 font-normal">No recent updates.</p>;
  }

  return (
    <>
      {updates.map(update => (
        <div key={update.id} className="relative pl-3.5 border-l border-[#E2E8F0] pb-3 last:pb-0">
          <div className="absolute w-2 h-2 rounded-full bg-[#F97316] left-[-4.5px] top-1"></div>
          <p className="text-[10px] font-medium text-[#64748B] mb-0.5">
            {new Date(update.publishedAt || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-[#0A192F] line-clamp-2">{update.title}</p>
            <span className="shrink-0 text-[8px] font-bold bg-orange-50 text-[#F97316] px-1.5 py-0.5 rounded tracking-wider border border-orange-200">
              NEW
            </span>
          </div>
        </div>
      ))}
    </>
  );
};
