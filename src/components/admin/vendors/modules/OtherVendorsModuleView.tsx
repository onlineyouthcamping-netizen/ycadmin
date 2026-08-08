import React from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Plus,
  RotateCw,
  Eye,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface OtherVendorsModuleViewProps {
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

export function OtherVendorsModuleView({
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
}: OtherVendorsModuleViewProps) {
  const otherVendors = vendors.filter(
    (v) =>
      ![
        "HOTEL",
        "RESORT",
        "HOMESTAY",
        "HOSTEL",
        "TRANSPORT",
        "ACTIVITIES",
        "RESTAURANT",
        "GUIDE",
        "CAMPING",
      ].includes(v.type),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Other Vendor Partners Subsystem
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Misc Local Vendors, Equipment Suppliers & Special Services
          </p>
        </div>
        <Button
          onClick={onAddVendor}
          className="bg-[#F97316] hover:bg-[#E05E00] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-2xs"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Vendor Partner
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Input
            placeholder="Search Vendor Name, Contact, City..."
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
              <th className="p-3.5">Vendor Partner</th>
              <th className="p-3.5">Category Type</th>
              <th className="p-3.5">Contact Person</th>
              <th className="p-3.5">Location</th>
              <th className="p-3.5">Payment Terms</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {otherVendors.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-extrabold text-slate-800">
                  {v.name}
                </td>
                <td className="p-3.5">
                  <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-slate-200">
                    {v.type}
                  </span>
                </td>
                <td className="p-3.5 text-slate-700 font-bold">
                  {v.contactPerson || v.phone || "—"}
                </td>
                <td className="p-3.5 font-bold text-slate-800">
                  {v.city || v.location || "—"}
                </td>
                <td className="p-3.5 text-slate-700">
                  {v.paymentTerms || "30 Days Credit"}
                </td>
                <td className="p-3.5 text-right space-x-1.5">
                  <Button
                    onClick={() => onSelectVendor(v)}
                    className="h-8 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold px-2.5 rounded-lg"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View Workspace
                  </Button>
                  <button
                    onClick={() => onEditVendor(v)}
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
          {pagination.total} vendor partners
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
  );
}
