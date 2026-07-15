import React, { useState, useMemo } from "react";
import {
  Plus, Search, Sliders, ChevronUp, ChevronDown, Edit, Trash, Copy, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DepartureActivitiesProps {
  tripId: string;
  departureDateStr: string;
  tripDetails: any;
  tripVendors: any[];
  activitiesList: any[];
  fetchPageData: () => void;
  setActivitiesList: (val: any[]) => void;
  api: any;
}

export default function DepartureActivities({
  tripId,
  departureDateStr,
  tripDetails,
  tripVendors,
  activitiesList,
  fetchPageData,
  api
}: DepartureActivitiesProps) {
  // Filter States
  const [actDayFilter, setActDayFilter] = useState("All Days");
  const [actTypeFilter, setActTypeFilter] = useState("All Activity Type");
  const [actStatusFilter, setActStatusFilter] = useState("All Status");
  const [actSearch, setActSearch] = useState("");

  // Modals & Forms
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyFromTripId, setCopyFromTripId] = useState("");
  const [copyFromDepartureDate, setCopyFromDepartureDate] = useState("");

  const [activityForm, setActivityForm] = useState({
    dayNumber: 1,
    name: "",
    type: "SIGHTSEEING",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    responsibleGuideId: "",
    responsibleStaff: "",
    vendorId: "",
    vendorName: "",
    estimatedCost: 0,
    actualCost: 0,
    maxParticipants: 0,
    safetyInstructions: "",
    requiredEquipment: "",
    status: "Planned",
    remarks: ""
  });

  const computedActivities = useMemo(() => {
    return activitiesList.filter(a => {
      const matchDay = actDayFilter === "All Days" || String(a.dayNumber) === actDayFilter;
      const matchType = actTypeFilter === "All Activity Type" || a.type === actTypeFilter;
      const matchStatus = actStatusFilter === "All Status" || a.status === actStatusFilter;
      const matchSearch = actSearch === "" || a.name.toLowerCase().includes(actSearch.toLowerCase()) || (a.location && a.location.toLowerCase().includes(actSearch.toLowerCase()));
      return matchDay && matchType && matchStatus && matchSearch;
    }).sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return (a.order || 0) - (b.order || 0);
    });
  }, [activitiesList, actDayFilter, actTypeFilter, actStatusFilter, actSearch]);

  const groupedActivities = useMemo(() => {
    const groups: Record<number, any[]> = {};
    computedActivities.forEach(a => {
      const day = a.dayNumber || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(a);
    });
    return groups;
  }, [computedActivities]);

  const handleAddActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingActivity && editingActivity.id) {
        await api.put(`/ops/activities/${tripId}/${editingActivity.id}?departureDate=${departureDateStr}`, activityForm);
        toast.success("Activity updated successfully!");
      } else {
        await api.post(`/ops/activities/${tripId}?departureDate=${departureDateStr}`, activityForm);
        toast.success("Activity created successfully!");
      }
      setActivityModalOpen(false);
      setEditingActivity(null);
      fetchPageData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save activity");
    }
  };

  const handleEditActivity = (act: any) => {
    setEditingActivity(act);
    setActivityForm({
      dayNumber: act.dayNumber,
      name: act.name,
      type: act.type,
      startTime: act.startTime || "",
      endTime: act.endTime || "",
      location: act.location || "",
      description: act.description || "",
      responsibleGuideId: act.responsibleGuideId || "",
      responsibleStaff: act.responsibleStaff || "",
      vendorId: act.vendorId || "",
      vendorName: act.vendorName || "",
      estimatedCost: act.estimatedCost || 0,
      actualCost: act.actualCost || 0,
      maxParticipants: act.maxParticipants || 0,
      safetyInstructions: act.safetyInstructions || "",
      requiredEquipment: act.requiredEquipment || "",
      status: act.status || "Planned",
      remarks: act.remarks || ""
    });
    setActivityModalOpen(true);
  };

  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      await api.delete(`/ops/activities/${id}`);
      toast.success("Activity deleted successfully!");
      fetchPageData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete activity");
    }
  };

  const handleDuplicateActivity = async (act: any) => {
    try {
      const { id, createdAt, updatedAt, responsibleGuide, vendor, ...rest } = act;
      await api.post(`/ops/activities/${tripId}?departureDate=${departureDateStr}`, {
        ...rest,
        name: `${act.name} (Copy)`
      });
      toast.success("Activity duplicated successfully!");
      fetchPageData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate activity");
    }
  };

  const handleMarkActivityStatus = async (act: any, status: string) => {
    try {
      await api.put(`/ops/activities/${tripId}/${act.id}?departureDate=${departureDateStr}`, { status });
      toast.success(`Activity marked ${status}!`);
      fetchPageData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update activity status");
    }
  };

  const handleMoveActivity = async (realIndex: number, direction: "up" | "down") => {
    const currentAct = computedActivities[realIndex];
    const targetIndex = direction === "up" ? realIndex - 1 : realIndex + 1;
    if (targetIndex < 0 || targetIndex >= computedActivities.length) return;
    const targetAct = computedActivities[targetIndex];
    
    try {
      const tempOrder = currentAct.order || 0;
      await api.put(`/ops/activities/${tripId}/${currentAct.id}?departureDate=${departureDateStr}`, { order: targetAct.order || 0 });
      await api.put(`/ops/activities/${tripId}/${targetAct.id}?departureDate=${departureDateStr}`, { order: tempOrder });
      toast.success("Activity reordered!");
      fetchPageData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reorder activity");
    }
  };

  const getActivityDayDate = (dayNum: number) => {
    try {
      const start = new Date(departureDateStr);
      const target = new Date(start.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
      return target.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-800">Activities</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Manage day wise activities and inclusions for this departure</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCopyModalOpen(true)} className="text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs">
            <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Activities
          </button>
          <button
            onClick={() => {
              setEditingActivity(null);
              setActivityForm({
                dayNumber: 1,
                name: "",
                type: "SIGHTSEEING",
                startTime: "",
                endTime: "",
                location: "",
                description: "",
                responsibleGuideId: "",
                responsibleStaff: "",
                vendorId: "",
                vendorName: "",
                estimatedCost: 0,
                actualCost: 0,
                maxParticipants: 0,
                safetyInstructions: "",
                requiredEquipment: "",
                status: "Planned",
                remarks: ""
              });
              setActivityModalOpen(true);
            }}
            className="text-[11px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-3.5 py-1.5 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Activity
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {[
          { label: "Total Activities", value: computedActivities.length, desc: "Across departure days", bg: "bg-blue-50/50" },
          { label: "Planned/Confirmed", value: computedActivities.filter(a => a.status === 'Planned' || a.status === 'Confirmed').length, desc: "Pending execution", bg: "bg-emerald-50/50" },
          { label: "In Progress", value: computedActivities.filter(a => a.status === 'In Progress').length, desc: "Active right now", bg: "bg-amber-50/50" },
          { label: "Completed", value: computedActivities.filter(a => a.status === 'Completed').length, desc: "Executed successfully", bg: "bg-purple-50/50" },
          { label: "Cancelled", value: computedActivities.filter(a => a.status === 'Cancelled').length, desc: "Inactive", bg: "bg-red-50/50" }
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs">
            <p className="text-2xl font-black text-slate-800">{kpi.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{kpi.label}</p>
            <p className="text-[9.5px] text-slate-400 mt-1">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
        <select value={actDayFilter} onChange={e => setActDayFilter(e.target.value)} className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
          <option value="All Days">All Days</option>
          {[...Array(parseInt(tripDetails?.duration) || 9)].map((_, i) => (
            <option key={i + 1} value={String(i + 1)}>Day {i + 1}</option>
          ))}
        </select>
        <select value={actTypeFilter} onChange={e => setActTypeFilter(e.target.value)} className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
          <option value="All Activity Type">All Activity Type</option>
          {["SIGHTSEEING", "TRAVEL", "ADVENTURE", "GAME", "BONFIRE", "MUSIC", "OTHER"].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={actStatusFilter} onChange={e => setActStatusFilter(e.target.value)} className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
          <option value="All Status">All Status</option>
          {["Planned", "Confirmed", "In Progress", "Completed", "Cancelled"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="relative flex-1 max-w-xs min-w-[150px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-455" />
          <input type="text" placeholder="Search activity..." value={actSearch} onChange={e => setActSearch(e.target.value)} className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
        </div>
      </div>

      {/* High-Density Activities Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
        {computedActivities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium text-xs">
            No activities set for this departure yet. Click "+ Add Activity" or "Copy Activities" to populate.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-[#E2E8F0]">
              <tr className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3 border-r border-slate-100">DAY</th>
                <th className="p-3 border-r border-slate-100">ACTIVITY</th>
                <th className="p-3 border-r border-slate-100 w-28">TYPE</th>
                <th className="p-3 border-r border-slate-100">INCLUDED</th>
                <th className="p-3 border-r border-slate-100">TIME</th>
                <th className="p-3 border-r border-slate-100">LOCATION</th>
                <th className="p-3 border-r border-slate-100">STATUS</th>
                <th className="p-3 text-center w-40">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {computedActivities.map((a, idx) => {
                const dayDate = getActivityDayDate(a.dayNumber);
                return (
                  <tr key={a.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 border-r border-slate-100 whitespace-nowrap">
                      <p className="font-bold text-slate-800">Day {a.dayNumber}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{dayDate || "—"}</p>
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      <p className="font-bold text-slate-800">{a.name}</p>
                      {a.description && (
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">{a.description}</p>
                      )}
                      {(a.safetyInstructions || a.requiredEquipment) && (
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          {a.safetyInstructions && (
                            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 py-0.2 rounded border border-red-100">⚠️ {a.safetyInstructions}</span>
                          )}
                          {a.requiredEquipment && (
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 py-0.2 rounded border border-blue-100">🎒 {a.requiredEquipment}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-[4px] border uppercase tracking-wider block w-fit",
                        a.type === "TRAVEL" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        a.type === "SIGHTSEEING" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      )}>{a.type}</span>
                    </td>
                    <td className="p-3 border-r border-slate-100 font-semibold text-slate-700">
                      {a.actualCost > 0 || a.estimatedCost > 0 ? (
                        <span className="text-amber-600 font-bold">₹{a.actualCost || a.estimatedCost}</span>
                      ) : (
                        <span className="text-emerald-650 font-bold">✓ Included</span>
                      )}
                    </td>
                    <td className="p-3 border-r border-slate-100 text-slate-600 font-semibold whitespace-nowrap">
                      {a.startTime && a.endTime ? `${a.startTime} - ${a.endTime}` : a.startTime || "⏰ TBD"}
                    </td>
                    <td className="p-3 border-r border-slate-100 text-slate-650 font-semibold">{a.location || "—"}</td>
                    <td className="p-3 border-r border-slate-100">
                      <span className={cn("text-[8.5px] font-black px-1.5 py-0.5 rounded-[3px] border uppercase tracking-wider block w-fit",
                        a.status === "Completed" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        a.status === "In Progress" ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                        a.status === "Cancelled" ? "bg-red-50 text-red-655 border-red-100" :
                        "bg-blue-50 text-blue-700 border-blue-100"
                      )}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1">
                        {a.status !== "Completed" && (
                          <button onClick={() => handleMarkActivityStatus(a, "Completed")} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                            Done
                          </button>
                        )}
                        <button disabled={idx === 0} onClick={() => handleMoveActivity(idx, "up")} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30">
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button disabled={idx === computedActivities.length - 1} onClick={() => handleMoveActivity(idx, "down")} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30">
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                        <button onClick={() => handleEditActivity(a)} className="p-1 hover:bg-slate-100 rounded text-blue-600">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDuplicateActivity(a)} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Duplicate">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteActivity(a.id)} className="p-1 hover:bg-slate-100 rounded text-red-500">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Activity Dialog */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="max-w-xl bg-white p-5 rounded-lg shadow-lg border border-slate-200 overflow-y-auto max-h-[85vh]">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
            {editingActivity ? "Edit Departure Activity" : "Add Departure Activity"}
          </h3>
          
          {/* Template loader */}
          {!editingActivity && (
            <div className="mt-3 bg-slate-50 p-2.5 border border-slate-200 rounded">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Load Template</label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const templates = [
                    { name: "Group Introduction", type: "GAME", description: "Interactive session to introduce all passengers and guides to each other.", estimatedCost: 0, safetyInstructions: "Keep it fun and friendly." },
                    { name: "Train Games & Antakshari", type: "GAME", description: "Fun board games, card games, and Antakshari session during train journey.", estimatedCost: 0 },
                    { name: "Local Sightseeing Tour", type: "SIGHTSEEING", description: "Visit local markets, monuments, and historical spots.", estimatedCost: 500 },
                    { name: "Bonfire & Music Night", type: "BONFIRE", description: "Gather around bonfire, share stories, and play soft acoustic music.", estimatedCost: 1500, requiredEquipment: "Firewood, speaker" },
                    { name: "DJ & Dance Night", type: "MUSIC", description: "DJ/speaker setup for dance and group entertainment.", estimatedCost: 3000, requiredEquipment: "DJ console, speakers" },
                    { name: "River Rafting Adventure", type: "ADVENTURE", description: "White water river rafting under professional guidance.", estimatedCost: 1200, safetyInstructions: "Enforce life jackets and helmets." },
                    { name: "Trekking & Camping", type: "ADVENTURE", description: "Guided trekking up to high-altitude campsite.", estimatedCost: 800, requiredEquipment: "Trekking poles, tents" }
                  ];
                  const t = templates.find(temp => temp.name === val);
                  if (t) {
                    setActivityForm(prev => ({
                      ...prev,
                      name: t.name,
                      type: t.type,
                      description: t.description || "",
                      estimatedCost: t.estimatedCost || 0,
                      safetyInstructions: (t as any).safetyInstructions || "",
                      requiredEquipment: (t as any).requiredEquipment || ""
                    }));
                  }
                }}
                className="w-full h-8 text-[11px] font-bold border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
              >
                <option value="">-- Load commonly used template --</option>
                <option value="Group Introduction">Group Introduction (GAME)</option>
                <option value="Train Games & Antakshari">Train Games & Antakshari (GAME)</option>
                <option value="Local Sightseeing Tour">Local Sightseeing Tour (SIGHTSEEING)</option>
                <option value="Bonfire & Music Night">Bonfire & Music Night (BONFIRE)</option>
                <option value="DJ & Dance Night">DJ & Dance Night (MUSIC)</option>
                <option value="River Rafting Adventure">River Rafting Adventure (ADVENTURE)</option>
                <option value="Trekking & Camping">Trekking & Camping (ADVENTURE)</option>
              </select>
            </div>
          )}

          <form onSubmit={handleAddActivitySubmit} className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Day Number</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={activityForm.dayNumber}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, dayNumber: parseInt(e.target.value) || 1 }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Activity Name</label>
                <input
                  type="text"
                  required
                  value={activityForm.name}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. River Rafting"
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Type</label>
                <select
                  value={activityForm.type}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
                >
                  <option value="SIGHTSEEING">SIGHTSEEING</option>
                  <option value="TRAVEL">TRAVEL</option>
                  <option value="ADVENTURE">ADVENTURE</option>
                  <option value="GAME">GAME</option>
                  <option value="BONFIRE">BONFIRE</option>
                  <option value="MUSIC">MUSIC</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Location</label>
                <input
                  type="text"
                  value={activityForm.location}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Kasol"
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Start Time</label>
                <input
                  type="text"
                  value={activityForm.startTime}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, startTime: e.target.value }))}
                  placeholder="e.g. 10:00 AM"
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">End Time</label>
                <input
                  type="text"
                  value={activityForm.endTime}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, endTime: e.target.value }))}
                  placeholder="e.g. 05:00 PM"
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Responsible Staff / Guide</label>
                <select
                  value={activityForm.responsibleGuideId}
                  onChange={(e) => {
                    const val = e.target.value;
                    const guide = tripVendors.find(v => v.id === val);
                    setActivityForm(prev => ({
                      ...prev,
                      responsibleGuideId: val,
                      responsibleStaff: guide ? (guide.vendor?.name || guide.name || "") : ""
                    }));
                  }}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                >
                  <option value="">Select Guide</option>
                  {tripVendors.filter((v: any) => v.vendorType === 'guide').map((g: any, index) => (
                    <option key={g.id || index} value={g.id}>{g.vendor?.name || g.name || 'Unnamed Guide'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Vendor Partner</label>
                <select
                  value={activityForm.vendorId}
                  onChange={(e) => {
                    const val = e.target.value;
                    const vendor = tripVendors.find(v => v.id === val);
                    setActivityForm(prev => ({
                      ...prev,
                      vendorId: val,
                      vendorName: vendor ? (vendor.vendorId?.name || vendor.vendorName || vendor.name || "") : ""
                    }));
                  }}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                >
                  <option value="">Select Vendor</option>
                  {tripVendors.filter((v: any) => v.vendorType !== 'guide').map((v: any, index) => (
                    <option key={v.id || index} value={v.id}>{v.vendorId?.name || v.vendorName || v.name || 'Unnamed Vendor'} ({v.vendorType})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Est. Cost (₹)</label>
                <input
                  type="number"
                  value={activityForm.estimatedCost}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Act. Cost (₹)</label>
                <input
                  type="number"
                  value={activityForm.actualCost}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, actualCost: parseFloat(e.target.value) || 0 }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Max Participants</label>
                <input
                  type="number"
                  value={activityForm.maxParticipants}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Status</label>
              <select
                value={activityForm.status}
                onChange={(e) => setActivityForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
              >
                <option value="Planned">Planned</option>
                <option value="Confirmed">Confirmed</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Description / Instructions</label>
              <textarea
                value={activityForm.description}
                onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Details of what passengers will do..."
                rows={2}
                className="w-full text-xs font-bold border border-slate-200 rounded p-2 bg-white text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Safety Instructions</label>
              <textarea
                value={activityForm.safetyInstructions}
                onChange={(e) => setActivityForm(prev => ({ ...prev, safetyInstructions: e.target.value }))}
                placeholder="Safety rules, emergency guidelines..."
                rows={2}
                className="w-full text-xs font-bold border border-slate-200 rounded p-2 bg-white text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Required Equipment</label>
              <input
                type="text"
                value={activityForm.requiredEquipment}
                onChange={(e) => setActivityForm(prev => ({ ...prev, requiredEquipment: e.target.value }))}
                placeholder="e.g. Warm jacket, trekking shoes, water bottle"
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Internal Remarks</label>
              <textarea
                value={activityForm.remarks}
                onChange={(e) => setActivityForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Operational notes, coordinator logs..."
                rows={2}
                className="w-full text-xs font-bold border border-slate-200 rounded p-2 bg-white text-slate-700 outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => { setActivityModalOpen(false); setEditingActivity(null); }} className="h-8 text-xs font-bold text-slate-500 rounded">
                Cancel
              </Button>
              <Button type="submit" className="h-8 bg-[#F97316] hover:bg-[#E05E00] text-white font-bold text-xs uppercase rounded">
                {editingActivity ? "Save Changes" : "Create Activity"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Copy Activities Dialog */}
      <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
        <DialogContent className="max-w-md bg-white p-5 rounded-lg shadow-lg border border-slate-200">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Copy Activities from Another Departure</h3>
          <p className="text-[11px] text-slate-500 mt-1">Copy all planned activities from an existing departure to this workspace.</p>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Source Trip ID</label>
              <input
                type="text"
                required
                placeholder="e.g. MKA"
                value={copyFromTripId}
                onChange={(e) => setCopyFromTripId(e.target.value.toUpperCase())}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Source Departure Date</label>
              <input
                type="date"
                required
                value={copyFromDepartureDate}
                onChange={(e) => setCopyFromDepartureDate(e.target.value)}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setCopyModalOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!copyFromTripId || !copyFromDepartureDate) {
                    toast.error("Please enter Trip ID and Departure Date");
                    return;
                  }
                  try {
                    const res = await api.post(`/ops/activities/${tripId}/copy?departureDate=${departureDateStr}`, {
                      fromTripId: copyFromTripId,
                      fromDepartureDate: copyFromDepartureDate
                    });
                    if (res.data?.success) {
                      toast.success(res.data.message || "Activities copied successfully!");
                      setCopyModalOpen(false);
                      fetchPageData();
                    }
                  } catch (err: any) {
                    console.error(err);
                    toast.error(err.response?.data?.message || "Failed to copy activities");
                  }
                }}
                className="h-8 bg-[#F97316] hover:bg-[#E05E00] text-white font-bold text-xs uppercase rounded"
              >
                Copy Activities
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
