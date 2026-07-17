import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { travelDeskService } from '@/services/travelDesk.service';
import { CheckCircle2, XCircle, AlertCircle, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TravelDeskLoadingState, TravelDeskEmptyState, TravelDeskErrorState } from './TravelDeskStateComponents';

interface ApprovalItem {
  id: string;
  title: string;
  status: string;
  effectiveStatus: string;
  createdAt: string;
  type: string; // 'article', 'sop', 'document'
}

export const TravelDeskApprovalCenter = () => {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;

    const fetchApprovals = async () => {
      try {
        setIsLoading(true);
        const data = await travelDeskService.getPendingApprovals(tripId);
        
        // Map backend response into a unified ApprovalItem list
        const parsedItems: ApprovalItem[] = [
          ...(data.articles || []).map((a: ApprovalItem & { effectiveStatus: string }) => ({
            id: a.id,
            title: a.title,
            status: a.status,
            effectiveStatus: a.effectiveStatus,
            createdAt: a.createdAt,
            type: 'article'
          }))
        ];

        setItems(parsedItems);
        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load approvals';
        // Handle Axios error specifically if needed, fallback to standard message
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovals();
  }, [tripId]);

  if (!tripId) return <TravelDeskEmptyState title="No Trip Selected" description="Please select a trip to view approvals." />;
  if (isLoading) return <TravelDeskLoadingState message="Loading approval queue..." />;
  if (error) return <TravelDeskErrorState message={error} />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
        <h3 className="text-lg font-black text-slate-800">All Caught Up!</h3>
        <p className="text-sm font-semibold text-slate-500">There are no pending approvals or expired items for this trip.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-[#FF6B00]" />
          Approval Center
        </h2>
        <p className="text-sm font-semibold text-slate-500 mt-1">Review content changes and handle expired items.</p>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <div key={`${item.type}-${item.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {item.type}
                </span>
                <span className={cn(
                  "text-[10px] font-bold tracking-wider px-2 py-0.5 rounded",
                  item.effectiveStatus === 'EXPIRED' ? "bg-red-100 text-red-700" :
                  item.effectiveStatus === 'UNDER_REVIEW' ? "bg-yellow-100 text-yellow-700" :
                  "bg-blue-100 text-blue-700"
                )}>
                  {item.effectiveStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800">{item.title}</p>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Submitted {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">
                <Eye className="w-4 h-4" />
                Review
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
