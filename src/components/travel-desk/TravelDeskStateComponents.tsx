import React from 'react';
import { Compass, Search, AlertTriangle } from 'lucide-react';

export const TravelDeskLoadingState = ({ message = "Loading Travel Desk..." }) => (
  <div className="flex-1 flex flex-col items-center justify-center bg-white font-sans">
    <div className="w-12 h-12 border-4 border-slate-100 border-t-[#F97316] rounded-full animate-spin mb-4" />
    <h2 className="text-base font-bold text-[#0A192F]">{message}</h2>
    <p className="text-[#64748B] text-xs mt-1">Please wait while we gather the details.</p>
  </div>
);

export const TravelDeskErrorState = ({ message = "Something went wrong.", onRetry }: { message?: string, onRetry?: () => void }) => (
  <div className="flex-1 flex flex-col items-center justify-center bg-white font-sans">
    <AlertTriangle className="w-12 h-12 text-[#EF4444] mb-3" />
    <h2 className="text-base font-bold text-[#0A192F]">Error Loading Trip Data</h2>
    <p className="text-[#64748B] text-xs mt-1 max-w-md text-center">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-4 px-4 py-2 bg-[#0A192F] hover:bg-[#112240] text-white rounded-md font-semibold text-xs transition-colors">
        Try Again
      </button>
    )}
  </div>
);

export const TravelDeskEmptyState = ({ title = "No Trips Found", description = "We couldn't find any trips matching your criteria.", icon: Icon = Search, onClearFilters }: { title?: string, description?: string, icon?: any, onClearFilters?: () => void }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white font-sans">
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-full mb-4">
      <Icon className="w-8 h-8 text-[#64748B]" />
    </div>
    <h3 className="text-base font-bold text-[#0A192F]">{title}</h3>
    <p className="text-[#64748B] text-xs mt-2 max-w-sm">{description}</p>
    {onClearFilters && (
      <button onClick={onClearFilters} className="mt-5 px-4 py-2 bg-[#0A192F] hover:bg-[#112240] text-white rounded-md font-semibold text-xs transition-colors">
        Clear Filters
      </button>
    )}
  </div>
);

export const TravelDeskActivationState = ({ tripTitle, onActivate, isActivating }: { tripTitle: string; onActivate: () => void; isActivating: boolean }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white font-sans">
    <div className="bg-[#FFF7ED] border border-[#FED7AA] p-4 rounded-full mb-4">
      <Compass className="w-8 h-8 text-[#F97316]" />
    </div>
    <h3 className="text-base font-bold text-[#0A192F]">Activate Travel Desk Workspace</h3>
    <p className="text-[#64748B] text-xs mt-2 max-w-md leading-relaxed">
      A travel desk workspace has not been initialized for <span className="font-bold text-[#F97316]">{tripTitle}</span> yet.
      Activate it to begin tracking departures, managing custom itineraries, syncing vendors, and configuring ticketing templates.
    </p>
    <button 
      onClick={onActivate} 
      disabled={isActivating}
      className="mt-5 px-6 py-2.5 bg-[#0A192F] hover:bg-[#112240] text-white rounded-md font-bold text-xs disabled:opacity-50 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
    >
      {isActivating ? 'Activating Workspace...' : 'Activate Master Trip Workspace'}
    </button>
  </div>
);
