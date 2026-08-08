import React, { useState } from "react";
import {
  Hotel,
  MapPin,
  Phone,
  Mail,
  Star,
  Plus,
  RotateCw,
  Eye,
  Pencil,
  Trash2,
  ShieldCheck,
  Building2,
  Bed,
  Calendar,
  FileText,
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
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  const allHotels = vendors.filter((v) =>
    [
      "HOTEL",
      "RESORT",
      "HOMESTAY",
      "HOSTEL",
      "GUEST_HOUSE",
      "VILLA",
      "CAMP",
      "COTTAGE",
      "APARTMENT",
      "DORMITORY",
      "LUXURY_TENT",
    ].includes(v.type),
  );

  const hotels = allHotels.filter((v) => {
    if (filterStayType === "ALL") return true;
    const sType = filterStayType.toUpperCase();
    const vType = (v.type || "").toUpperCase();
    const accType = (v.accommodationType || "").toUpperCase();
    return vType === sType || accType === sType;
  });

  const kpis = [
    {
      title: "Hotels & Resorts",
      count:
        allHotels.filter(
          (h) =>
            h.type === "HOTEL" ||
            h.type === "RESORT" ||
            h.accommodationType === "HOTEL" ||
            h.accommodationType === "RESORT",
        ).length || 14,
      icon: Hotel,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      title: "Homestays & Villas",
      count:
        allHotels.filter(
          (h) =>
            h.type === "HOMESTAY" ||
            h.type === "VILLA" ||
            h.accommodationType === "HOMESTAY" ||
            h.accommodationType === "VILLA",
        ).length || 6,
      icon: Building2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Hostels & Dorms",
      count:
        allHotels.filter(
          (h) =>
            h.type === "HOSTEL" ||
            h.type === "DORMITORY" ||
            h.accommodationType === "HOSTEL" ||
            h.accommodationType === "DORMITORY",
        ).length || 3,
      icon: Bed,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      title: "Luxury Camps & Tents",
      count:
        allHotels.filter(
          (h) =>
            h.type === "CAMP" ||
            h.type === "LUXURY_TENT" ||
            h.accommodationType === "CAMP" ||
            h.accommodationType === "LUXURY_TENT",
        ).length || 2,
      icon: Calendar,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Accommodation Management Subsystem
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Hotels, Resorts, Homestays, Hostels, Guest Houses & Luxury Camps
          </p>
        </div>
        <Button
          onClick={onAddVendor}
          className="bg-[#F97316] hover:bg-[#E05E00] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-2xs"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Accommodation Partner
        </Button>
      </div>

      {/* Vendor Performance Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-xl border border-slate-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-[#F97316] text-white px-2 py-0.5 rounded uppercase tracking-wider">
              Featured Partner Stats
            </span>
            <span className="text-sm font-black text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Mountain Hospitality
            </span>
            <span className="text-amber-400 text-xs font-normal">
              ★★★★☆ (4.7)
            </span>
          </div>
          <p className="text-xs text-slate-300 font-semibold mt-1">
            Top performing accommodation vendor across Himachal & Spiti
            departures.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs border-t md:border-t-0 border-slate-700 pt-3 md:pt-0 w-full md:w-auto">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Hotels
            </span>
            <span className="font-extrabold text-white text-sm">18</span>
          </div>
          <div className="h-6 w-px bg-slate-700 hidden sm:block" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Trips Served
            </span>
            <span className="font-extrabold text-white text-sm">72</span>
          </div>
          <div className="h-6 w-px bg-slate-700 hidden sm:block" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Outstanding
            </span>
            <span className="font-extrabold text-amber-400 text-sm">₹2.1L</span>
          </div>
          <div className="h-6 w-px bg-slate-700 hidden sm:block" />
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Last Used
            </span>
            <span className="font-extrabold text-slate-200 text-sm">
              Yesterday
            </span>
          </div>
          <div className="h-6 w-px bg-slate-700 hidden sm:block" />
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded font-black text-[11px]">
            Preferred Vendor ✓
          </div>
        </div>
      </div>

      {/* Accommodation-Specific KPIs */}
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
                  {k.count} Partners
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
        {/* Main Table Column (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Contextual Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Input
                placeholder="Search Property Name, GST, Phone, City..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-8.5 text-xs bg-white border-[#E2E8F0] rounded-md"
              />
            </div>
            <Select
              value={filterDestination}
              onValueChange={onDestinationChange}
            >
              <SelectTrigger className="h-8.5 w-40 text-xs border-[#E2E8F0]">
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
            <Select value={filterStayType} onValueChange={setFilterStayType}>
              <SelectTrigger className="h-8.5 w-36 text-xs border-[#E2E8F0]">
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
              variant="ghost"
              className="h-8.5 px-3 hover:bg-slate-50 text-slate-500"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Dedicated Accommodation Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 min-w-[180px]">Property Partner</th>
                  <th className="p-3.5 whitespace-nowrap">Destination</th>
                  <th className="p-3.5 whitespace-nowrap">Room Capacity</th>
                  <th className="p-3.5 whitespace-nowrap">Meal Plan</th>
                  <th className="p-3.5 whitespace-nowrap">Check-In / Out</th>
                  <th className="p-3.5 text-center whitespace-nowrap">
                    Rating
                  </th>
                  <th className="p-3.5 text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {hotels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center bg-slate-50/50">
                      <div className="space-y-1.5 max-w-sm mx-auto">
                        <Hotel className="w-6 h-6 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-700">
                          No {filterStayType === "ALL" ? "" : filterStayType}{" "}
                          Stay Partners Found
                        </p>
                        <p className="text-[11px] text-slate-450">
                          Try selecting "All Stay Types" or adjusting your
                          search keyword.
                        </p>
                        {filterStayType !== "ALL" && (
                          <Button
                            onClick={() => setFilterStayType("ALL")}
                            variant="outline"
                            className="h-7 text-[11px] font-bold text-slate-600 border-slate-200 mt-2 cursor-pointer"
                          >
                            Reset Filter to All
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  hotels.map((h) => (
                    <tr
                      key={h.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-extrabold shrink-0">
                            <Hotel className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 text-sm block leading-tight">
                              {h.name}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                              {h.vendorCode || h.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 font-bold whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />{" "}
                          {h.city || h.location || "Manali"}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-700 whitespace-nowrap">
                        {h.totalRooms || 15} Rooms
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-slate-200">
                          {h.mealPlans || "EP, CP, MAP"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px] whitespace-nowrap">
                        {h.checkInTime || "12:00 PM"} /{" "}
                        {h.checkOutTime || "11:00 AM"}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="font-black text-amber-600 inline-flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{" "}
                          {h.starRating || 3}.0
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => onSelectVendor(h)}
                            className="h-8 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold px-2.5 rounded-lg whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Workspace
                          </Button>
                          <button
                            onClick={() => onEditVendor(h)}
                            title="Edit Vendor Details"
                            className="h-8 px-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-600" />{" "}
                            Edit
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
              Showing {pagination?.startIndex ?? 0}–{pagination?.endIndex ?? 0}{" "}
              of {pagination?.total ?? 0} stay partners
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                disabled={(pagination?.page ?? 1) <= 1}
                onClick={() => onPageChange((pagination?.page ?? 1) - 1)}
                variant="outline"
                className="h-8 px-2.5 text-xs"
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
                className="h-8 px-2.5 text-xs"
              >
                Next &gt;
              </Button>
            </div>
          </div>
        </div>

        {/* Accommodation Right Sidebar Widget */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <h3 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600" /> Stay Partner
              Radar
            </h3>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium space-y-1">
              <span className="font-bold block">Peak Season Occupancy</span>
              <p>
                Manali & Kasol stay partners at 85% allocated capacity for June
                departures.
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <span className="font-bold text-slate-700 block">
                Expiring Contracts
              </span>
              <p className="text-slate-500">
                2 Master Hotel agreements due for annual renewal in 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
