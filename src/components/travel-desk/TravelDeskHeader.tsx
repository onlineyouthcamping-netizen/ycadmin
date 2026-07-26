import React, { useState } from 'react';
import { Compass, Clock, MapPin, Activity, Users, ExternalLink, Star, Share2, Settings } from 'lucide-react';
import { Trip } from '@/types';
import { DepartureSummary } from '@/services/travelDesk.service';
import { TripSettingsModal } from './TripSettingsModal';
import { toast } from 'sonner';

interface TravelDeskHeaderProps {
  trip: Trip;
  readinessScore: number;
  departures: DepartureSummary[];
  onTripUpdated?: (updatedTrip: Trip) => void;
}

export const TravelDeskHeader: React.FC<TravelDeskHeaderProps> = ({ trip, readinessScore, departures, onTripUpdated }) => {
  const activeDepartures = departures.reduce((sum, d) => sum + d.bookingsCount, 0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleTripBrief = () => {
    // Open trip public page in new tab
    const slug = (trip as any).slug || trip.id;
    window.open(`https://youthcamping.online/trips/${slug}`, '_blank');
  };

  const handleShare = () => {
    const slug = (trip as any).slug || trip.id;
    const url = `https://youthcamping.online/trips/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success('Trip link copied to clipboard!');
      });
    } else {
      toast.info(`Share URL: ${url}`);
    }
  };

  return (
    <>
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
                {/* TRAVEL DESK Badge */}
                <span className="inline-block px-2 py-0.5 bg-[#0A192F] text-[#F97316] border border-[#233554] text-[9px] font-bold tracking-wider uppercase rounded">
                  TRAVEL DESK
                </span>

                {/* Category Badge */}
                <span className="inline-block px-2 py-0.5 bg-[#F97316] text-white text-[9px] font-bold tracking-wider uppercase rounded">
                  {(trip as any).category || 'DOMESTIC TRIP'}
                </span>

                {/* YouthCamping OS text */}
                <span className="text-[10px] font-medium text-white/80 border-l border-white/20 pl-2">
                  YouthCamping OS
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleTripBrief}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] hover:bg-[#112240] border border-[#233554] text-white text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer"
                  title="View public trip page"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-white" />
                  <span>Trip Brief</span>
                </button>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] hover:bg-[#112240] border border-[#233554] hover:border-[#F97316] text-white text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer"
                  title="Edit trip settings"
                >
                  <Settings className="w-3.5 h-3.5 text-white" />
                  <span>Trip Settings</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A192F] hover:bg-[#112240] border border-[#233554] text-white text-[11px] font-semibold rounded-[6px] transition-all cursor-pointer"
                  title="Copy trip share link"
                >
                  <Share2 className="w-3.5 h-3.5 text-white" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="mt-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">{trip.title}</h1>
                <span className="text-xs text-[#64748B] font-semibold">({(trip as any).code || trip.id.substring(0, 6).toUpperCase()})</span>
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

      {/* Trip Settings Modal */}
      <TripSettingsModal
        trip={trip}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdated={(updatedTrip) => {
          onTripUpdated?.(updatedTrip);
        }}
      />
    </>
  );
};
