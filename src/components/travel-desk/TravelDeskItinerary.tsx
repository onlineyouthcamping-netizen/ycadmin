import React, { useEffect, useState } from 'react';
import { Trip } from '@/types';
import { travelDeskService } from '@/services/travelDesk.service';
import { Map, CalendarDays, CheckCircle2, XCircle, Info } from 'lucide-react';
import { TravelDeskLoadingState, TravelDeskEmptyState } from './TravelDeskStateComponents';

interface TravelDeskItineraryProps {
  trip: Trip;
}

export const TravelDeskItinerary: React.FC<TravelDeskItineraryProps> = ({ trip }) => {
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const data = await travelDeskService.getOfficialItinerary(trip.id);
        const activeVersion = data?.itineraryVersions?.[0]?.itinerary || data?.itinerary || [];
        
        if (activeVersion.length > 0) {
          setItineraries([{
            isDefault: true,
            version: data?.itineraryVersions?.[0]?.version || 1,
            days: activeVersion.map((d: any) => ({
              id: d.day || Math.random().toString(),
              dayNumber: d.day || 1,
              title: d.title,
              description: d.description
            })),
            inclusions: (data?.inclusions || []).map((text: string, i: number) => ({ id: i, text })),
            exclusions: (data?.exclusions || []).map((text: string, i: number) => ({ id: i, text }))
          }]);
        } else {
          setItineraries([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItineraries();
  }, [trip.id]);

  if (loading) return <TravelDeskLoadingState message="Loading Itineraries..." />;

  const defaultItinerary = itineraries.find(i => i.isDefault) || itineraries[0];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Official Itinerary</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">View the day-by-day travel plan and inclusions</p>
        </div>
        <div className="flex items-center gap-2">
          {defaultItinerary && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold border border-green-200">
              Version {defaultItinerary.version}
            </span>
          )}
          <button className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-xs font-bold hover:bg-[#E66000] shadow-sm">
            Manage Itineraries
          </button>
        </div>
      </div>

      {(!itineraries || itineraries.length === 0) ? (
        <div className="mt-8">
          <TravelDeskEmptyState title="No Itineraries" description="No itinerary has been created for this trip yet." />
        </div>
      ) : defaultItinerary ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Day by Day Plan
            </h3>
            {defaultItinerary.days?.map((day: any) => (
              <div key={day.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Day</span>
                    <span className="text-lg font-black text-slate-800 leading-none">{day.dayNumber}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{day.title}</h4>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{day.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Inclusions
              </h3>
              <ul className="space-y-2">
                {defaultItinerary.inclusions?.map((inc: any) => (
                  <li key={inc.id} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span> {inc.text}
                  </li>
                ))}
                {(!defaultItinerary.inclusions || defaultItinerary.inclusions.length === 0) && (
                  <p className="text-xs text-slate-400 italic">No inclusions specified.</p>
                )}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                <XCircle className="w-4 h-4 text-red-500" /> Exclusions
              </h3>
              <ul className="space-y-2">
                {defaultItinerary.exclusions?.map((exc: any) => (
                  <li key={exc.id} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span> {exc.text}
                  </li>
                ))}
                {(!defaultItinerary.exclusions || defaultItinerary.exclusions.length === 0) && (
                  <p className="text-xs text-slate-400 italic">No exclusions specified.</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
