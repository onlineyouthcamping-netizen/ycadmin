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
    <div className="p-6 pb-0 shrink-0">
      <div className="relative bg-[#0B1220] rounded-2xl overflow-hidden text-white shadow-md">
        {/* BACKGROUND IMAGE OVERLAY */}
        {trip.heroImage && (
          <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay bg-cover bg-center" 
            style={{ backgroundImage: `url('${trip.heroImage}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-transparent to-transparent opacity-80" />

        <div className="relative p-6 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block px-2.5 py-1 bg-[#FF6B00] text-white text-[10px] font-black tracking-wider uppercase rounded mb-3">
                {trip.category || 'DOMESTIC TRIP'}
              </span>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight">{trip.title}</h1>
                <button className="text-slate-400 hover:text-white transition-colors">
                  <Star className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-bold backdrop-blur-sm transition-all">
              View Trip Brief (Customer)
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-6 mt-6 text-xs font-bold text-slate-300">
            {trip.duration && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                {trip.duration} {trip.duration.includes('Days') ? '' : 'Days'}
              </div>
            )}
            {trip.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                {trip.location}
              </div>
            )}
            {trip.difficulty && (
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                {trip.difficulty}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              {trip.maxGroupSize ? `Up to ${trip.maxGroupSize} Pax` : '15 - 45 Pax'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
