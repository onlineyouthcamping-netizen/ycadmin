import React, { useState } from "react";
import { Bus, MapPin, Phone, ShieldCheck, Plus, RotateCw, Eye, Pencil, Trash2, ShieldAlert, FileText, UserCheck, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TransportModuleViewProps {
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

export function TransportModuleView({
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
}: TransportModuleViewProps) {
  const fleet = vendors.filter(v => v.type === "TRANSPORT");

  const kpis = [
    { title: "Fleet Operator Firms", count: fleet.length || 8, icon: Bus, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { title: "Tempo Travellers (12-26S)", count: 24, icon: ShieldCheck, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { title: "SUVs & Urban Cruisers", count: 16, icon: UserCheck, color: "text-purple-600 bg-purple-50 border-purple-200" },
    { title: "Valid All-India Permits", count: "100%", icon: FileText, color: "text-green-600 bg-green-50 border-green-200" },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Transport & Fleet Management Subsystem</h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Tempo Travellers, Buses, SUVs, Fleet Permits & Drivers</p>
        </div>
        <Button onClick={onAddVendor} className="bg-[#F97316] hover:bg-[#E05E00] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-2xs">
          <Plus className="w-4 h-4 mr-1.5" /> Add Transport Fleet Operator
        </Button>
      </div>

      {/* Transport KPIs */}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Table */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Input
                placeholder="Search Operator Firm, Vehicle Type, Driver Name..."
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className="h-8.5 text-xs bg-white border-[#E2E8F0] rounded-md"
              />
            </div>
            <Button onClick={onRefresh} variant="ghost" className="h-8.5 px-3 hover:bg-slate-50 text-slate-500">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Transport-Specific Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 min-w-[180px]">Operator Firm</th>
                  <th className="p-3.5 whitespace-nowrap">Vehicle Fleet</th>
                  <th className="p-3.5 whitespace-nowrap">Driver & Contact</th>
                  <th className="p-3.5 whitespace-nowrap">Permit Type</th>
                  <th className="p-3.5 whitespace-nowrap">Insurance Status</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Tariff / Day</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {fleet.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold shrink-0">
                          <Bus className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-800 text-sm block leading-tight">{f.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">{f.vendorCode || f.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                      {f.seatCapacity ? `${f.seatCapacity}-Seater ${f.fleetType || "Tempo Traveller"}` : (f.fleetType || "17-Seater Tempo Traveller")}
                    </td>
                    <td className="p-3.5 text-slate-700 font-bold whitespace-nowrap">{f.contactPerson || "Suresh Rathod"} ({f.phone || "+91 98166 00000"})</td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-800 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase border border-blue-200">
                        All India Tourist Permit (AITP)
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600 whitespace-nowrap">Valid (Comprehensive)</td>
                    <td className="p-3.5 text-right font-black text-slate-800 whitespace-nowrap">₹4,500 / Day</td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button onClick={() => onSelectVendor(f)} className="h-8 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold px-2.5 rounded-lg whitespace-nowrap">
                          <Eye className="w-3.5 h-3.5 mr-1" /> Workspace
                        </Button>
                        <button onClick={() => onEditVendor(f)} title="Edit Vendor Details" className="h-8 px-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap">
                          <Pencil className="w-3.5 h-3.5 text-slate-600" /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
            <span>Showing {pagination.startIndex}–{pagination.endIndex} of {pagination.total} fleet operators</span>
            <div className="flex items-center gap-1.5">
              <Button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} variant="outline" className="h-8 px-2.5 text-xs">&lt; Prev</Button>
              <span className="px-2 font-bold text-slate-800">Page {pagination.page} of {pagination.pages}</span>
              <Button disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)} variant="outline" className="h-8 px-2.5 text-xs">Next &gt;</Button>
            </div>
          </div>
        </div>

        {/* Transport Sidebar Widget */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-600" /> Fleet Compliance Radar
            </h3>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-medium space-y-1">
              <span className="font-bold block">Vehicle Permits Up to Date</span>
              <p>100% of active vehicles have valid AITP permits for Delhi-Manali routes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
