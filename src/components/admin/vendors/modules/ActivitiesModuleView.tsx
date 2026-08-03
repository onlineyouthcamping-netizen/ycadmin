import React from "react";
import { Compass, MapPin, Phone, ShieldCheck, Plus, RotateCw, Eye, Pencil, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActivitiesModuleViewProps {
  vendors: any[];
  destinations: string[];
  pagination: any;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterDestination: string;
  onDestinationChange: (v: string) => void;
  filterStatus: string;
  onStatusChange: (v: string) => void;
  onRefresh: () => void;
  onPageChange: (p: number) => void;
  onSelectVendor: (vendor: any) => void;
  onAddVendor: () => void;
  onEditVendor: (vendor: any) => void;
  onDeleteVendor: (id: string) => void;
}

export function ActivitiesModuleView({
  vendors,
  destinations,
  pagination,
  searchTerm,
  onSearchChange,
  filterDestination,
  onDestinationChange,
  filterStatus,
  onStatusChange,
  onRefresh,
  onPageChange,
  onSelectVendor,
  onAddVendor,
  onEditVendor,
  onDeleteVendor
}: ActivitiesModuleViewProps) {
  const activities = vendors.filter(v => v.type === "ACTIVITIES");

  const kpis = [
    { title: "Rafting & Water Sports", count: 6, icon: Compass, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { title: "Paragliding Operators", count: 4, icon: Star, color: "text-purple-600 bg-purple-50 border-purple-200" },
    { title: "Trekking & Expeditions", count: 8, icon: MapPin, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { title: "Safety Rating Verified", count: "4.9 ★", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Activity Operators Subsystem</h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Rafting, Paragliding, ATV, Zipline, Trekking & Safari Operators</p>
        </div>
        <Button onClick={onAddVendor} className="bg-[#F97316] hover:bg-[#E05E00] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-2xs">
          <Plus className="w-4 h-4 mr-1.5" /> Add Activity Operator
        </Button>
      </div>

      {/* Activity KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <Card key={i} className={cn("p-4 rounded-xl border flex justify-between items-center bg-white shadow-2xs", k.color)}>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">{k.title}</span>
                <span className="text-2xl font-black text-slate-800 tracking-tight">{k.count}</span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-slate-200">
                <Icon className="w-5 h-5 text-slate-700" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Table */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Input
            placeholder="Search Activity Operator, Location, Activity Type..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="h-8.5 text-xs bg-white border-[#E2E8F0] rounded-md"
          />
        </div>
        <Button onClick={onRefresh} variant="ghost" className="h-8.5 px-3 hover:bg-slate-50 text-slate-500">
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Activity Operator</th>
              <th className="p-3.5">Base Location</th>
              <th className="p-3.5">Activities Offered</th>
              <th className="p-3.5">Batch Capacity</th>
              <th className="p-3.5">Emergency Contact</th>
              <th className="p-3.5 text-center">Safety Rating</th>
              <th className="p-3.5 text-right">Commission %</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {activities.map((act) => (
              <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-800 text-sm block">{act.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">{act.vendorCode || act.id}</span>
                    </div>
                  </div>
                </td>
                <td className="p-3.5 font-bold text-slate-800">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {act.city || act.location || "Kullu / Solang"}</span>
                </td>
                <td className="p-3.5 font-bold text-slate-800">River Rafting (14 km) & Paragliding</td>
                <td className="p-3.5 text-slate-700 font-bold">40 PAX / Batch</td>
                <td className="p-3.5 text-slate-700 font-bold">{act.contactNumber || act.phone || "+91 98166 11111"}</td>
                <td className="p-3.5 text-center font-black text-amber-600">4.9 ★</td>
                <td className="p-3.5 text-right font-black text-emerald-600">15%</td>
                <td className="p-3.5 text-right space-x-1.5">
                  <Button onClick={() => onSelectVendor(act)} className="h-8 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold px-2.5 rounded-lg">
                    <Eye className="w-3.5 h-3.5 mr-1" /> View Workspace
                  </Button>
                  <button onClick={() => onEditVendor(act)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-md">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
        <span>Showing {pagination.startIndex}–{pagination.endIndex} of {pagination.total} activity operators</span>
        <div className="flex items-center gap-1.5">
          <Button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} variant="outline" className="h-8 px-2.5 text-xs">&lt; Prev</Button>
          <span className="px-2 font-bold text-slate-800">Page {pagination.page} of {pagination.pages}</span>
          <Button disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)} variant="outline" className="h-8 px-2.5 text-xs">Next &gt;</Button>
        </div>
      </div>
    </div>
  );
}
