import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { travelDeskService } from '@/services/travelDesk.service';

interface CreateTicketingLinkModalProps {
  tripId: string;
  onClose: () => void;
  onSuccess: (newLink: any) => void;
}

export const TravelDeskCreateTicketingLinkModal: React.FC<CreateTicketingLinkModalProps> = ({ tripId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [label, setLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [val, setVal] = useState('irctc');
  const [icon, setIcon] = useState('ExternalLink');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!label || !linkUrl || !val) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const newLink = await travelDeskService.createTicketingLink({
        tripId,
        label,
        linkUrl,
        val,
        icon
      });
      onSuccess(newLink);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create ticketing link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800">Add Ticketing Link</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">Add IRCTC, Flight portal, or Cab booking links</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Platform Name / Label *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 outline-none transition-all"
              placeholder="e.g. IRCTC Agent Portal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">URL *</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 outline-none transition-all"
              placeholder="https://"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Service Type *</label>
            <select
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 outline-none transition-all"
            >
              <option value="irctc">Train (IRCTC)</option>
              <option value="flight">Flight</option>
              <option value="bus">Bus</option>
              <option value="cab">Cab / Transfer</option>
            </select>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">
            Cancel
          </button>
          <button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Link'}
          </button>
        </div>
      </div>
    </div>
  );
};
