import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { travelDeskService, TravelDeskWorkspace, DepartureSummary } from "@/services/travelDesk.service";
import { Trip } from "@/types";
import { Compass, Search } from "lucide-react";
import { toast } from "sonner";
import { TravelDeskHeader } from "@/components/travel-desk/TravelDeskHeader";
import { TravelDeskTabs } from "@/components/travel-desk/TravelDeskTabs";
import { TravelDeskTripSidebar } from "@/components/travel-desk/TravelDeskTripSidebar";
import { TravelDeskQuickActions } from "@/components/travel-desk/TravelDeskQuickActions";
import { FeedTripsDrawer } from "@/components/travel-desk/FeedTripsDrawer";
import { TravelDeskCreateTripModal } from "@/components/travel-desk/TravelDeskCreateTripModal";
import { TravelDeskLoadingState, TravelDeskErrorState, TravelDeskEmptyState, TravelDeskActivationState } from "@/components/travel-desk/TravelDeskStateComponents";
import { TravelDeskKnowledgeHub } from "@/components/travel-desk/TravelDeskKnowledgeHub";
import { TravelDeskDepartures } from "@/components/travel-desk/TravelDeskDepartures";
import { TravelDeskItinerary } from "@/components/travel-desk/TravelDeskItinerary";
import { TravelDeskDocuments } from "@/components/travel-desk/TravelDeskDocuments";
import { TravelDeskSops } from "@/components/travel-desk/TravelDeskSops";
import { TravelDeskTicketing } from "@/components/travel-desk/TravelDeskTicketing";
import { TravelDeskGallery } from "@/components/travel-desk/TravelDeskGallery";
import { TravelDeskActivityLog } from "@/components/travel-desk/TravelDeskActivityLog";
import { TravelDeskVendors } from "@/components/travel-desk/TravelDeskVendors";

export default function TravelDeskPage() {
  const { admin } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tripId = searchParams.get('tripId');
  const tab = searchParams.get('tab') || 'knowledge';

  // Master Lists
  const [trips, setTrips] = useState<any[]>([]);
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);
  
  // Selected Trip State
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [workspace, setWorkspace] = useState<TravelDeskWorkspace | null>(null);
  const [departures, setDepartures] = useState<DepartureSummary[]>([]);
  const [isMainLoading, setIsMainLoading] = useState(false);
  const [mainError, setMainError] = useState<string | null>(null);

  // Modal & Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // AbortController ref
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isActivating, setIsActivating] = useState(false);

  const handleActivateWorkspace = async () => {
    if (!tripId) return;
    setIsActivating(true);
    try {
      await travelDeskService.feedWorkspaces([tripId]);
      toast.success("Workspace activated successfully!");
      
      // Reload Workspace Data
      setIsMainLoading(true);
      const ws = await travelDeskService.getWorkspace(tripId);
      setWorkspace(ws);
      
      // Also update sidebar list to show it's active
      const loadedTrips = await travelDeskService.getTravelDeskTrips();
      setTrips(loadedTrips || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to activate workspace");
    } finally {
      setIsActivating(false);
      setIsMainLoading(false);
    }
  };

  // 1. Initial Load of Sidebar Trips
  useEffect(() => {
    const loadSidebar = async () => {
      try {
        const loadedTrips = await travelDeskService.getTravelDeskTrips();
        setTrips(loadedTrips || []);
        
        // Fallback Logic: If no tripId in URL, but we have trips, navigate to the first one
        if (!tripId && loadedTrips && loadedTrips.length > 0) {
          setSearchParams({ tripId: loadedTrips[0].id, tab: 'knowledge' }, { replace: true });
        }
      } catch (err) {
        console.error("Failed to load sidebar trips", err);
      } finally {
        setIsSidebarLoading(false);
      }
    };
    loadSidebar();
  }, []);

  // 2. Fetch Selected Trip Details
  useEffect(() => {
    if (!tripId) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadActiveTrip = async () => {
      setIsMainLoading(true);
      setMainError(null);

      try {
        const [overviewData, departuresData] = await Promise.all([
          travelDeskService.getTripOverview(tripId, abortController.signal),
          travelDeskService.getDepartures(tripId, abortController.signal)
        ]);

        let workspaceData = null;
        try {
          workspaceData = await travelDeskService.getWorkspace(tripId, abortController.signal);
        } catch (err: any) {
          if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
            return;
          }
          if (err?.response?.status !== 404) {
            throw err;
          }
        }

        setActiveTrip(overviewData);
        setWorkspace(workspaceData);
        setDepartures(departuresData);
      } catch (err: any) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          return; // Expected cancellation
        }
        setMainError(err?.response?.data?.message || 'Failed to load trip workspace');
        setActiveTrip(null);
        setWorkspace(null);
      } finally {
        if (abortControllerRef.current === abortController) {
          setIsMainLoading(false);
        }
      }
    };

    loadActiveTrip();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tripId]);

  return (
    <div className="flex flex-col h-screen bg-[#F7F8FA]">
      {/* GLOBAL HEADER */}
      <div className="bg-[#0B1220] text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#FF6B00] p-2 rounded-lg text-white">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
              YouthCamping OS <span className="text-[10px] bg-slate-800 text-[#FF6B00] px-2 py-0.5 rounded-[4px] font-bold border border-slate-700 tracking-wider">TRAVEL DESK</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Centralizing Departures, Itineraries, SOPs and Trip Documents</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 text-slate-450 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Global Search..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 font-bold focus:outline-none focus:ring-1 focus:ring-[#FF6B00] transition-all"
            />
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-xs font-bold text-[#FF6B00]">
            {admin?.name?.substring(0,2).toUpperCase() || "AD"}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR */}
        <TravelDeskTripSidebar 
          trips={trips} 
          activeTripId={tripId || undefined} 
          isLoading={isSidebarLoading}
          onFeedClick={() => setIsDrawerOpen(true)}
          onAddTripClick={() => setIsCreateModalOpen(true)}
        />

        {/* CENTER CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F8FA]">
          {isMainLoading ? (
            <TravelDeskLoadingState message="Loading Workspace..." />
          ) : mainError ? (
            <TravelDeskErrorState message={mainError} />
          ) : !activeTrip ? (
            <TravelDeskEmptyState title="No Workspace Selected" description="Please select an active trip from the sidebar to view its workspace." />
          ) : !workspace ? (
            <TravelDeskActivationState 
              tripTitle={activeTrip.title} 
              onActivate={handleActivateWorkspace} 
              isActivating={isActivating} 
            />
          ) : (
            <>
              <TravelDeskHeader 
                trip={activeTrip} 
                readinessScore={workspace.readinessScore} 
                departures={departures} 
              />
              
              <TravelDeskTabs tripId={tripId!} />
              
              {/* TAB CONTENT SHELL */}
              {tab === 'knowledge' ? (
                <TravelDeskKnowledgeHub trip={activeTrip} workspace={workspace} />
              ) : tab === 'departures' ? (
                <TravelDeskDepartures trip={activeTrip} departures={departures} />
              ) : tab === 'vendors' ? (
                <TravelDeskVendors trip={activeTrip} />
              ) : tab === 'itinerary' ? (
                <TravelDeskItinerary trip={activeTrip} />
              ) : tab === 'documents' ? (
                <TravelDeskDocuments trip={activeTrip} />
              ) : tab === 'sops' ? (
                <TravelDeskSops trip={activeTrip} />
              ) : tab === 'ticketing' ? (
                <TravelDeskTicketing trip={activeTrip} />
              ) : tab === 'gallery' ? (
                <TravelDeskGallery trip={activeTrip} />
              ) : tab === 'activity' ? (
                <TravelDeskActivityLog trip={activeTrip} />
              ) : (
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-2 capitalize">{tab} Module</h2>
                    <p className="text-slate-500 font-semibold text-sm">
                      This module is connected to <span className="text-[#FF6B00] font-bold">{activeTrip.title}</span>. 
                      Content loading for the {tab} tab will be implemented in subsequent stages.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT QUICK ACTIONS */}
        <TravelDeskQuickActions />

      </div>

      {/* FEED TRIPS DRAWER */}
      <FeedTripsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTripIds={trips.map(t => t.id)}
        onActivated={async (newTripId) => {
          // Refresh trips and navigate to new trip
          const loadedTrips = await travelDeskService.getTravelDeskTrips();
          setTrips(loadedTrips || []);
          setSearchParams({ tripId: newTripId, tab: 'knowledge' });
        }}
      />

      {/* CREATE NEW DESTINATION TRIP MODAL */}
      <TravelDeskCreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTripCreated={async (newTripId) => {
          const loadedTrips = await travelDeskService.getTravelDeskTrips();
          setTrips(loadedTrips || []);
          setSearchParams({ tripId: newTripId, tab: 'knowledge' });
        }}
      />
    </div>
  );
}
