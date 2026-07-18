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
    <div className="w-[280px] bg-white border-l border-slate-200 shrink-0 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Quick Actions</h3>
      </div>
      <div className="p-4 space-y-2 overflow-y-auto border-b border-slate-100">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              className="w-full flex items-center gap-3 p-3 text-left bg-white border border-slate-200 rounded-xl hover:border-[#FF6B00] hover:shadow-sm transition-all group"
            >
              <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-orange-50 group-hover:text-[#FF6B00] text-slate-500 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">{action.label}</span>
            </button>
          );
        })}
      </div>

      {currentTab === 'knowledge' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Recent Updates</h3>
            <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800">View all</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
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
    return <p className="text-xs text-slate-400 text-center py-4">No recent updates.</p>;
  }

  return (
    <>
      {updates.map(update => (
        <div key={update.id} className="relative pl-4 border-l border-slate-200 pb-4 last:pb-0">
          <div className="absolute w-2 h-2 rounded-full bg-slate-300 left-[-4.5px] top-1"></div>
          <p className="text-[10px] font-bold text-slate-400 mb-0.5">
            {new Date(update.publishedAt || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-slate-700 line-clamp-2">{update.title}</p>
            <span className="shrink-0 text-[8px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded tracking-wider border border-red-100">
              NEW
            </span>
          </div>
        </div>
      ))}
    </>
  );
};
