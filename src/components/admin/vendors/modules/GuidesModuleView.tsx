import React from "react";
import {
  UserCheck,
  MapPin,
  Plus,
  RotateCw,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  return (
    <div className="space-y-4">
      {/* Contextual Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Input
            placeholder="Search Guide Name, Specialization, Phone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8.5 text-xs bg-white border-[#E2E8F0] rounded-md"
          />
        </div>
        <Select
          value={filterDestination}
          onValueChange={onDestinationChange}
        >
          <SelectTrigger className="h-8.5 w-44 text-xs border-[#E2E8F0]">
            <SelectValue placeholder="Destination" />
          </SelectTrigger>
          <SelectContent className="text-xs bg-white">
            <SelectItem value="ALL">All Destinations</SelectItem>
            {destinations.map((d, i) => (
              <SelectItem key={i} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={onRefresh}
          variant="ghost"
          className="h-8.5 px-3 hover:bg-slate-50 text-slate-500 cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Clean Full-Width Guides Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
            <tr>
              <th className="p-3.5 min-w-[200px]">Guide / Leader Partner</th>
              <th className="p-3.5 whitespace-nowrap">Category / Type</th>
              <th className="p-3.5 whitespace-nowrap">Destination</th>
              <th className="p-3.5 whitespace-nowrap">Contact Info</th>
              <th className="p-3.5 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {guides.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center bg-slate-50/50">
                  <div className="space-y-2 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mx-auto">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      No Tour Guides Found
                    </p>
                    <p className="text-xs text-slate-500">
                      There are no tour guides registered in this scope. Click below to add a guide vendor.
                    </p>
                    <Button
                      onClick={onAddVendor}
                      className="mt-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Tour Guide
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              guides.map((g) => (
                <tr
                  key={g.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-extrabold shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm block leading-tight">
                          {g.name}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                          {g.vendorCode || g.id}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-bold text-slate-700 whitespace-nowrap">
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                      GUIDE
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700 font-bold whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />{" "}
                      {g.city || g.location || "N/A"}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 text-xs whitespace-nowrap">
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {g.contactPerson || g.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {g.phone || g.contactNumber || "No Phone"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Button
                        onClick={() => onSelectVendor(g)}
                        className="h-8 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold px-2.5 rounded-lg whitespace-nowrap cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Workspace
                      </Button>
                      <button
                        onClick={() => onEditVendor(g)}
                        title="Edit Vendor Details"
                        className="h-8 px-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-600" /> Edit
                      </button>
                      <button
                        onClick={() => onDeleteVendor(g.id)}
                        title="Delete / Unmap Vendor"
                        className="h-8 px-2.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Synchronized Pagination Footer */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
        <span>
          Showing {pagination?.startIndex ?? 0}–{pagination?.endIndex ?? 0} of{" "}
          {pagination?.total ?? 0} guide partners
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            disabled={(pagination?.page ?? 1) <= 1}
            onClick={() => onPageChange((pagination?.page ?? 1) - 1)}
            variant="outline"
            className="h-8 px-2.5 text-xs cursor-pointer"
          >
            &lt; Prev
          </Button>
          <span className="px-2 font-bold text-slate-800">
            Page {pagination?.page ?? 1} of {pagination?.pages ?? 1}
          </span>
          <Button
            disabled={(pagination?.page ?? 1) >= (pagination?.pages ?? 1)}
            onClick={() => onPageChange((pagination?.page ?? 1) + 1)}
            variant="outline"
            className="h-8 px-2.5 text-xs cursor-pointer"
          >
            Next &gt;
          </Button>
        </div>
      </div>
    </div>
  );
}
