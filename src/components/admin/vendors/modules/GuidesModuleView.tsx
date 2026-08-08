import React from "react";
import {
  UserCheck,
  ShieldCheck,
  MapPin,
  Plus,
  RotateCw,
  Eye,
  Pencil,
  Award,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GuidesModuleViewProps {
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

export function GuidesModuleView({
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
  onDeleteVendor,
}: GuidesModuleViewProps) {
  const guides = vendors.filter((v) => v.type === "GUIDE");

  const kpis = [
    {
      title: "NIM / IMF Certified Guides",
      count: guides.length || 15,
      icon: Award,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
    {
      title: "Senior Trek Leaders",
      count: 8,
      icon: UserCheck,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "First Aid & CPR Certified",
      count: "100%",
      icon: ShieldCheck,
      color: "text-green-600 bg-green-50 border-green-200",
    },
    {
      title: "Average Guide Rating",
      count: "4.95 ★",
      icon: Star,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Guide & Expedition Leader Subsystem
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Mountain Guides, Tour Leaders, Trek Experts & Certifications
          </p>
        </div>
        <Button
          onClick={onAddVendor}
          className="bg-[#F97316] hover:bg-[#E05E00] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-2xs"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Guide / Expedition Leader
        </Button>
      </div>

      {/* Guide KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <Card
              key={i}
              className={cn(
                "p-4 rounded-xl border flex justify-between items-center bg-white shadow-2xs",
                k.color,
              )}
            >
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  {k.title}
                </span>
                <span className="text-2xl font-black text-slate-800 tracking-tight">
                  {k.count}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-slate-200">
                <Icon className="w-5 h-5 text-slate-700" />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Input
                placeholder="Search Guide Name, Certification, Language..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-8.5 text-xs bg-white border-[#E2E8F0] rounded-md"
              />
            </div>
            <Button
              onClick={onRefresh}
              variant="ghost"
              className="h-8.5 px-3 hover:bg-slate-50 text-slate-500"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Expedition Guide</th>
                  <th className="p-3.5">Languages</th>
                  <th className="p-3.5">Certifications</th>
                  <th className="p-3.5">Experience</th>
                  <th className="p-3.5">Specialization</th>
                  <th className="p-3.5 text-center">Rating</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {guides.map((g) => (
                  <tr
                    key={g.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-extrabold shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-800 text-sm block">
                            {g.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                            {g.vendorCode || g.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      English, Hindi, Pahadi
                    </td>
                    <td className="p-3.5">
                      <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-indigo-200">
                        NIM Uttarkashi + Basic Mountaineering
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-bold">6+ Years</td>
                    <td className="p-3.5 text-slate-700 font-bold">
                      High Altitude Treks (Hampta / Pin Parvati)
                    </td>
                    <td className="p-3.5 text-center font-black text-amber-600">
                      4.95 ★
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <Button
                        onClick={() => onSelectVendor(g)}
                        className="h-8 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold px-2.5 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Workspace
                      </Button>
                      <button
                        onClick={() => onEditVendor(g)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-md"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
            <span>
              Showing {pagination.startIndex}–{pagination.endIndex} of{" "}
              {pagination.total} guides
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                variant="outline"
                className="h-8 px-2.5 text-xs"
              >
                &lt; Prev
              </Button>
              <span className="px-2 font-bold text-slate-800">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                disabled={pagination.page >= pagination.pages}
                onClick={() => onPageChange(pagination.page + 1)}
                variant="outline"
                className="h-8 px-2.5 text-xs"
              >
                Next &gt;
              </Button>
            </div>
          </div>
        </div>

        {/* Guide Sidebar Widget */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" /> Guide Roster &
              Availability
            </h3>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-medium space-y-1">
              <span className="font-bold block">
                Assigned to Upcoming Departures
              </span>
              <p>
                8 Senior leaders allocated for June 05 & June 12 Himalayan
                departures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
