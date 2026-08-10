import React, { useState } from "react";
import {
  Hotel,
  MapPin,
  Plus,
  RotateCw,
  Eye,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDisplayVendorCode } from "@/utils/vendorUtils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AccommodationModuleViewProps {
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

export function AccommodationModuleView({
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
}: AccommodationModuleViewProps) {
  const [filterStayType, setFilterStayType] = useState("ALL");

  const hotels = vendors.filter((v) => {
    if (filterStayType === "ALL") return true;
    const sType = filterStayType.toUpperCase();
    const vType = (v.type || "").toUpperCase();
    const accType = (v.accommodationType || "").toUpperCase();
    return vType === sType || accType === sType;
  });

  return (
    <div className="space-y-4">
      {/* Contextual Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-2.5 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <Input
            placeholder="Search property, phone, or city..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8.5 text-xs bg-white border-slate-200 rounded-lg pl-8.5 focus:border-[#F97316]"
          />
        </div>
        <Select value={filterDestination} onValueChange={onDestinationChange}>
          <SelectTrigger className="h-8.5 w-44 text-xs border-slate-200 rounded-lg bg-white">
            <SelectValue placeholder="Destination" />
          </SelectTrigger>
          <SelectContent className="text-xs bg-white">
            <SelectItem value="ALL">All Destinations</SelectItem>
            {destinations.map((d, i) => (
              <SelectItem key={i} value={d}>
                📍 {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStayType} onValueChange={setFilterStayType}>
          <SelectTrigger className="h-8.5 w-40 text-xs border-slate-200 rounded-lg bg-white">
            <SelectValue placeholder="Stay Type" />
          </SelectTrigger>
          <SelectContent className="text-xs bg-white">
            <SelectItem value="ALL">All Stay Types</SelectItem>
            <SelectItem value="HOTEL">Hotel</SelectItem>
            <SelectItem value="RESORT">Resort</SelectItem>
            <SelectItem value="HOMESTAY">Homestay</SelectItem>
            <SelectItem value="HOSTEL">Hostel</SelectItem>
            <SelectItem value="CAMP">Camp</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={onRefresh}
          variant="outline"
          className="h-8.5 px-3 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Clean Full-Width Accommodation Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Vendor / Property</th>
              <th className="py-3 px-4 whitespace-nowrap">Category</th>
              <th className="py-3 px-4 whitespace-nowrap">Destination</th>
              <th className="py-3 px-4 whitespace-nowrap">Contact</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {hotels.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center bg-slate-50/50">
                  <div className="space-y-2 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
                      <Hotel className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      No Accommodation Vendors Found
                    </p>
                    <p className="text-xs text-slate-500">
                      There are no stay partners registered in this scope. Click below to add a new accommodation vendor.
                    </p>
                    <Button
                      onClick={onAddVendor}
                      className="mt-3 bg-[#F97316] hover:bg-[#E05E00] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-4 h-4" /> Add Accommodation Vendor
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              hotels.map((h) => {
                const sType = (h.type || h.accommodationType || "HOTEL").toUpperCase();
                const badgeColor =
                  sType === "CAMP" || sType === "TENT"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                    : sType === "RESORT"
                    ? "bg-purple-50 text-purple-800 border-purple-200/80"
                    : sType === "HOMESTAY"
                    ? "bg-blue-50 text-blue-800 border-blue-200/80"
                    : "bg-amber-50 text-amber-800 border-amber-200/80";

                return (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#F97316] font-bold shrink-0">
                          <Hotel className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span
                            onClick={() => onSelectVendor(h)}
                            className="font-bold text-slate-900 text-xs block leading-tight hover:text-[#F97316] cursor-pointer transition-colors"
                          >
                            {h.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-medium">
                            {getDisplayVendorCode(h)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className={`font-black px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide border ${badgeColor}`}>
                        {sType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-slate-700 font-medium text-xs">
                      📍 {h.city || h.location || "N/A"}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 text-xs block">
                        {h.contactPerson || h.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {h.phone || h.contactNumber || "—"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectVendor(h)}
                          className="h-7 px-2.5 text-[11px] font-bold text-[#F97316] hover:text-white bg-white hover:bg-[#F97316] rounded-md border border-orange-300 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> Workspace
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditVendor(h)}
                          title="Edit"
                          className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteVendor(h.id)}
                          title="Deactivate"
                          className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-md border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Synchronized Pagination Footer */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium">
        <span>
          Showing {pagination?.startIndex ?? 0}–{pagination?.endIndex ?? 0} of{" "}
          {pagination?.total ?? 0} vendors
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
