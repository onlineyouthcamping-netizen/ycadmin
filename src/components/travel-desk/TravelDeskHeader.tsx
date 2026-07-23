import React from 'react';
import { Compass, Clock, MapPin, Activity, Users, ExternalLink, Star, Share2, Settings } from 'lucide-react';
import { Trip } from '@/types';
import { cn } from '@/lib/utils';
import { DepartureSummary } from '@/services/travelDesk.service';

interface TravelDeskHeaderProps {
  trip: Trip;
  readinessScore: number;
  departures: DepartureSummary[];
}

export const TravelDeskHeader: React.FC<TravelDeskHeaderProps> = ({ trip, readinessScore, departures }) => {
  const activeDepartures = departures.reduce((sum, d) => sum + d.bookingsCount, 0);

  return (
    <div className="p-3 pb-0 shrink-0 font-sans">
      <div className="relative bg-[#0A192F] rounded-lg overflow-hidden text-white shadow-sm border border-[#233554]">
        {/* Background Image Overlay */}
        {trip.heroImage && (
          <div 
            className="absolute inset-0 opacity-20 mix-blend-overlay bg-cover bg-center" 
            style={{ backgroundImage: `url('${trip.heroImage}')` }}
          />
        )}

        {/* Hero banner padding: 16px vertical, 20px horizontal */}
        <div className="relative py-[16px] px-[20px] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {/* TRAVEL DESK Badge: Navy #0A192F bg, Orange #F97316 text */}
              <span className="inline-block px-2 py-0.5 bg-[#0A192F] text-[#F97316] border border-[#233554] text-[9px] font-bold tracking-wider uppercase rounded">
                TRAVEL DESK
              </span>

              {/* BACKPACKING / Category Badge: Orange #F97316 */}
              <span className="inline-block px-2 py-0.5 bg-[#F97316] text-white text-[9px] font-bold tracking-wider uppercase rounded">
                {trip.category || 'DOMESTIC TRIP'}
              </span>

              {/* YouthCamping OS text: White #FFFFFF */}
              <span className="text-[10px] font-medium text-white/80 border-l border-white/20 pl-2">
                YouthCamping OS
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] hover:bg-[#112240] border border-[#233554] text-white text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5 text-white" />
                <span>Trip Brief</span>
              </button>

              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] hover:bg-[#112240] border border-[#233554] text-white text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer">
                <Settings className="w-3.5 h-3.5 text-white" />
                <span>Trip Settings</span>
              </button>

              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] hover:bg-[#112240] border border-[#233554] text-white text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer">
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Title & Metadata */}
          <div className="mt-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">{trip.title}</h1>
              <span className="text-xs text-[#64748B] font-semibold">({trip.code || 'MKA-1'})</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-300">
              {trip.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#F97316]" />
                  {trip.duration} {trip.duration.includes('Days') ? '' : 'Days'}
                </div>
              )}
              {trip.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                  {trip.location}
                </div>
              )}
              {trip.difficulty && (
                <div className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-[#F97316]" />
                  {trip.difficulty}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#F97316]" />
                {trip.maxGroupSize ? `Up to ${trip.maxGroupSize} Pax` : '15 - 45 Pax'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
