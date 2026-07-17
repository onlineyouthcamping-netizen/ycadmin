import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trip } from '@/types';
import { DepartureSummary } from '@/services/travelDesk.service';
import { Calendar, Users, ChevronRight, FileText, Settings, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TravelDeskDeparturesProps {
  trip: Trip;
  departures: DepartureSummary[];
}

export const TravelDeskDepartures: React.FC<TravelDeskDeparturesProps> = ({ trip, departures }) => {
  const navigate = useNavigate();
  const maxPax = trip.maxGroupSize || 45;

  if (!departures || departures.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-slate-300" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">No Departures Found</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md text-center">
          There are no bookings or scheduled departures for {trip.title}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Departures & Operations</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Manage passengers, vendors, and checklists for each departure</p>
        </div>
        <button className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-xs font-bold hover:bg-[#E66000] transition-colors shadow-sm">
          + Add Custom Departure
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {departures.map((dep, idx) => {
          const dateObj = new Date(dep.departureDate);
          const month = dateObj.toLocaleString('en-US', { month: 'short' });
          const day = dateObj.getDate();
          const year = dateObj.getFullYear();
          const dayOfWeek = dateObj.toLocaleString('en-US', { weekday: 'long' });

          const totalPax = dep.confirmedPassengers + dep.pendingPassengers;
          const fillPercentage = Math.min(100, Math.round((totalPax / maxPax) * 100));

          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
              <div className="p-5">
                <div className="flex items-start gap-5">
                  
                  {/* CALENDAR BLOCK */}
                  <div className="shrink-0 flex flex-col items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden w-20 shadow-sm">
                    <div className="bg-[#FF6B00] text-white text-[10px] font-black tracking-widest uppercase w-full py-1.5 text-center">
                      {month}
                    </div>
                    <div className="py-2 flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-800 leading-none">{day}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{year}</span>
                    </div>
                  </div>

                  {/* INFO BLOCK */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                          {dayOfWeek} Departure
                          {totalPax >= maxPax && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-black border border-green-200">Sold Out</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <Users className="w-4 h-4 text-slate-400" />
                            {totalPax} / {maxPax} Pax
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <FileText className="w-4 h-4 text-slate-400" />
                            {dep.bookingsCount} Bookings
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                        <span className="text-slate-500">Occupancy</span>
                        <span className="text-slate-700">{fillPercentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-green-500" 
                          style={{ width: `${Math.min(100, Math.round((dep.confirmedPassengers / maxPax) * 100))}%` }} 
                        />
                        <div 
                          className="h-full bg-yellow-400" 
                          style={{ width: `${Math.min(100, Math.round((dep.pendingPassengers / maxPax) * 100))}%` }} 
                        />
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          {dep.confirmedPassengers} Confirmed
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <div className="w-2 h-2 rounded-full bg-yellow-400" />
                          {dep.pendingPassengers} Pending
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="bg-slate-50 border-t border-slate-100 p-3 px-5 flex items-center justify-end gap-3">
                <button 
                  onClick={() => {
                    const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                    navigate(`/admin/departure-workspace?tripId=${trip.id}&departureDate=${formattedDate}&tab=manifest`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-[#FF6B00] hover:border-[#FF6B00] transition-colors shadow-sm"
                >
                  <Users className="w-3.5 h-3.5" />
                  View Manifest
                </button>
                <button 
                  onClick={() => {
                    const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                    navigate(`/admin/departure-workspace?tripId=${trip.id}&departureDate=${formattedDate}&tab=overview`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white border border-slate-800 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Manage Operations
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5 opacity-50" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
