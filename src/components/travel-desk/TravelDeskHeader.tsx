import React from 'react';
import { Compass, Clock, MapPin, Activity, Users, ExternalLink, Star } from 'lucide-react';
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
    <div className="p-3 pb-0 shrink-0">
      <div className="relative bg-[#0B1220] rounded-lg overflow-hidden text-white shadow-2xs">
        {/* BACKGROUND IMAGE OVERLAY */}
        {trip.heroImage && (
          <div 
            className="absolute inset-0 opacity-25 mix-blend-overlay bg-cover bg-center" 
            style={{ backgroundImage: `url('${trip.heroImage}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-transparent to-transparent opacity-70" />

        <div className="relative p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="inline-block px-1.5 py-0.5 bg-[#FF6B00] text-white text-[8px] font-black tracking-wider uppercase rounded mb-1">
                {trip.category || 'DOMESTIC TRIP'}
              </span>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight leading-tight">{trip.title}</h1>
                <button className="text-slate-450 hover:text-white transition-colors shrink-0">
                  <Star className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button className="flex items-center gap-1 px-2 py-1 bg-white/15 hover:bg-white/20 border border-white/10 rounded text-[9.5px] font-bold backdrop-blur-xs transition-all shrink-0">
              <span>Trip Brief</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-350">
            {trip.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-450" />
                {trip.duration} {trip.duration.includes('Days') ? '' : 'Days'}
              </div>
            )}
            {trip.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-450" />
                {trip.location}
              </div>
            )}
            {trip.difficulty && (
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-slate-450" />
                {trip.difficulty}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-450" />
              {trip.maxGroupSize ? `Up to ${trip.maxGroupSize} Pax` : '15 - 45 Pax'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
