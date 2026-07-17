import React from 'react';
import { Compass, Search, AlertTriangle } from 'lucide-react';

export const TravelDeskLoadingState = ({ message = "Loading Travel Desk..." }) => (
  <div className="flex-1 flex flex-col items-center justify-center bg-white">
    <div className="w-16 h-16 border-4 border-slate-100 border-t-[#FF6B00] rounded-full animate-spin mb-4" />
    <h2 className="text-lg font-bold text-slate-800">{message}</h2>
    <p className="text-slate-500 text-sm mt-1">Please wait while we gather the details.</p>
  </div>
);

export const TravelDeskErrorState = ({ message = "Something went wrong.", onRetry }: { message?: string, onRetry?: () => void }) => (
  <div className="flex-1 flex flex-col items-center justify-center bg-white">
    <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
    <h2 className="text-lg font-bold text-slate-800">Error Loading Trip Data</h2>
    <p className="text-slate-500 text-sm mt-1 max-w-md text-center">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-4 px-4 py-2 bg-[#FF6B00] text-white rounded-lg font-bold text-sm">
        Try Again
      </button>
    )}
  </div>
);

export const TravelDeskEmptyState = ({ title = "No Trips Found", description = "We couldn't find any trips matching your criteria.", icon: Icon = Search, onClearFilters }: { title?: string, description?: string, icon?: any, onClearFilters?: () => void }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
    <div className="bg-slate-50 p-4 rounded-full mb-4">
      <Icon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    <p className="text-slate-500 text-sm mt-2 max-w-sm">{description}</p>
    {onClearFilters && (
      <button onClick={onClearFilters} className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">
        Clear Filters
      </button>
    )}
  </div>
);

export const TravelDeskActivationState = ({ tripTitle, onActivate, isActivating }: { tripTitle: string; onActivate: () => void; isActivating: boolean }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
    <div className="bg-[#FFF3EB] p-4 rounded-full mb-4">
      <Compass className="w-8 h-8 text-[#FF6B00]" />
    </div>
    <h3 className="text-lg font-bold text-slate-800">Activate Travel Desk Workspace</h3>
    <p className="text-slate-500 text-sm mt-2 max-w-md">
      A travel desk workspace has not been initialized for <span className="font-bold text-[#FF6B00]">{tripTitle}</span> yet.
      Activate it to begin tracking departures, managing custom itineraries, syncing vendors, and configuring ticketing templates.
    </p>
    <button 
      onClick={onActivate} 
      disabled={isActivating}
      className="mt-6 px-6 py-2.5 bg-[#FF6B00] text-white rounded-[4px] font-bold text-sm hover:bg-[#E66000] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
    >
      {isActivating ? 'Activating Workspace...' : 'Activate Master Trip Workspace'}
    </button>
  </div>
);
