/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DepartureTransport — YouthCamping Admin
 * Transport tab: fleet, allocation rules, WhatsApp lists, room/seat assignments.
 * Logic (save, auto-allocate, copy lists) stays in DepartureHubPage.
 */
import React from "react";
import {
  AlertTriangle,
  Copy,
  Plus,
  RefreshCw,
  Save,
  Trash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { normalizeGenderCode } from "@/utils/passengerUtils";

const outlineBtn =
  "h-8 w-full sm:w-auto min-w-0 text-[12px] font-medium rounded-md border border-[#E8EEF4] bg-white text-[#0B1528] hover:bg-[#F4F7FB] px-3 inline-flex items-center justify-center gap-1.5 shadow-none transition-colors disabled:opacity-50";
const orangeBtn =
  "h-8 w-full sm:w-auto min-w-0 text-[12px] font-medium rounded-md bg-[#FF4D00] hover:bg-[#E04400] text-white px-3.5 inline-flex items-center justify-center gap-1.5 shadow-none transition-colors";
const fieldClass =
  "h-8 w-full min-w-0 text-[12px] font-medium border border-[#E8EEF4] rounded-md px-2.5 bg-white text-[#0B1528] outline-none focus:ring-1 focus:ring-[#FF4D00]/30";
const fieldReadonly =
  "h-8 w-full min-w-0 text-[12px] font-medium border border-[#E8EEF4] rounded-md px-2.5 bg-[#F8FAFC] text-slate-600 cursor-not-allowed";
const labelClass = "text-[11px] font-medium text-slate-500 block mb-1";
const nativeSelect =
  "h-8 w-full min-w-0 text-[12px] font-medium border border-[#E8EEF4] rounded-md px-2 bg-white text-[#0B1528] outline-none focus:ring-1 focus:ring-[#FF4D00]/30";
const inputText =
  "h-8 w-full min-w-0 text-[12px] font-medium border border-[#E8EEF4] rounded-md px-2.5 bg-white text-[#0B1528] outline-none focus:ring-1 focus:ring-[#FF4D00]/30 placeholder:text-slate-400";
const checkboxCls =
  "h-3.5 w-3.5 rounded border-[#E8EEF4] text-[#FF4D00] focus:ring-[#FF4D00] cursor-pointer shrink-0";

function StepHeading({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="h-5 w-5 rounded-md border border-[#E8EEF4] bg-[#F8FAFC] text-[10px] font-semibold text-[#0B1528] inline-flex items-center justify-center tabular-nums shrink-0">
        {n}
      </span>
      <h3 className="text-[11px] font-semibold text-[#0B1528] tracking-wide">
        {children}
      </h3>
    </div>
  );
}

export interface DepartureTransportProps {
  nameInputRef?: React.Ref<HTMLInputElement>;
  isSavingAllocations: boolean;
  isSavingRooms?: boolean;
  isSavingVehicles?: boolean;
  onSave: () => void;
  onSaveRooms?: () => void;
  onSaveVehicles?: () => void;
  onAutoAllocate?: () => void;
  onAutoAllocateRooms?: () => void;
  onAutoAllocateTempos?: () => void;
  onAddVehicle: (e: React.FormEvent) => void;
  onDeleteVehicle: (id: string) => void;
  onCopyTempoList: () => void;
  onCopyRoomList: () => void;
  onOpenShuffle: (traveler: { name: string; id?: string | null }) => void;
  allocFleet: any[];
  vendorDirectoryFleet: any[];
  fleetVehicles: any[];
  selectedVehicleId: string;
  setSelectedVehicleId: (v: string) => void;
  setNewVehicleType: (v: string) => void;
  newVehicleCapacity: string;
  setNewVehicleCapacity: (v: string) => void;
  newVehicleName: string;
  setNewVehicleName: (v: string) => void;
  newVehicleCost: string;
  setNewVehicleCost: (v: string) => void;
  newVehicleVendor: string;
  setNewVehicleVendor: (v: string) => void;
  setSelectedVendorId: (v: string) => void;
  sharingPref: string;
  setSharingPref: (v: string) => void;
  sameGenderEnforced: boolean;
  setSameGenderEnforced: (v: boolean) => void;
  prioritizeCouples: boolean;
  setPrioritizeCouples: (v: boolean) => void;
  fallbackToQuad: boolean;
  setFallbackToQuad: (v: boolean) => void;
  computedRoomAllocations: any[];
  computedVehicleAllocations: any[];
  allPassengers: any[];
  setPassengerAllocations: React.Dispatch<
    React.SetStateAction<Record<string, { room: string; vehicle: string; seat: string }>>
  >;
  setManualRooms: React.Dispatch<React.SetStateAction<string[]>>;
  setAddRoomModalOpen: (open: boolean) => void;
  showClearAllocationsDialog: boolean;
  setShowClearAllocationsDialog: (open: boolean) => void;
  onClearAllocations: () => void;
}

export default function DepartureTransport({
  nameInputRef,
  isSavingAllocations,
  isSavingRooms = false,
  isSavingVehicles = false,
  onSave,
  onSaveRooms,
  onSaveVehicles,
  onAutoAllocate,
  onAutoAllocateRooms,
  onAutoAllocateTempos,
  onAddVehicle,
  onDeleteVehicle,
  onCopyTempoList,
  onCopyRoomList,
  onOpenShuffle,
  allocFleet,
  vendorDirectoryFleet,
  fleetVehicles,
  selectedVehicleId,
  setSelectedVehicleId,
  setNewVehicleType,
  newVehicleCapacity,
  setNewVehicleCapacity,
  newVehicleName,
  setNewVehicleName,
  newVehicleCost,
  setNewVehicleCost,
  newVehicleVendor,
  setNewVehicleVendor,
  setSelectedVendorId,
  sharingPref,
  setSharingPref,
  sameGenderEnforced,
  setSameGenderEnforced,
  prioritizeCouples,
  setPrioritizeCouples,
  fallbackToQuad,
  setFallbackToQuad,
  computedRoomAllocations,
  computedVehicleAllocations,
  allPassengers,
  setPassengerAllocations,
  setManualRooms,
  setAddRoomModalOpen,
  showClearAllocationsDialog,
  setShowClearAllocationsDialog,
  onClearAllocations,
}: DepartureTransportProps) {
  return (
    <div className="space-y-3 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
        <p className="text-[11px] text-slate-500 min-w-0">
          <span className="font-medium text-[#0B1528] tabular-nums">
            {allocFleet.length}
          </span>{" "}
          {allocFleet.length === 1 ? "vehicle" : "vehicles"} · room groups and
          seat allotments
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto min-w-0">
          <button
            type="button"
            onClick={onSave}
            disabled={isSavingAllocations}
            className={outlineBtn}
          >
            {isSavingAllocations ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" strokeWidth={1.75} />
            ) : (
              <Save className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.75} />
            )}
            {isSavingAllocations ? "Saving…" : "Save All"}
          </button>
        </div>
      </div>

      <div
        id="transport-vehicle-fleet"
        className="bg-white border border-[#E8EEF4] rounded-xl p-3 sm:p-4 shadow-none space-y-3 min-w-0"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-[#E8EEF4] pb-2.5 min-w-0">
          <StepHeading n={1}>Vehicle fleet</StepHeading>
          <span className="text-[11px] text-slate-500">
            Tempos and cars for this departure
          </span>
        </div>

        <form
          onSubmit={onAddVehicle}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 items-end min-w-0"
        >
          <div className="md:col-span-1 min-w-0">
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Vehicle type
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedVehicleId(val);
                if (val && val !== "custom") {
                  const item =
                    fleetVehicles.find((v) => v.id === val) ||
                    vendorDirectoryFleet.find((f: any) => f.id === val);
                  if (item) {
                    setNewVehicleType(item.vehicleType || "Tempo");
                    setNewVehicleCapacity(String(item.capacity || 17));
                    setNewVehicleName(
                      item.driverName || item.name || item.vehicleType || "",
                    );
                    setNewVehicleCost(
                      item.tariff?.amount !== undefined
                        ? String(item.tariff.amount)
                        : item.totalAmount !== undefined
                          ? String(item.totalAmount)
                          : "",
                    );
                    setNewVehicleVendor(
                      item.vendor?.name ?? item.notes ?? "Vendor",
                    );
                    setSelectedVendorId(
                      item.vendor?.id ?? item.vendorId ?? "",
                    );
                  }
                }
              }}
              className={nativeSelect}
            >
              <option value="">Select vendor vehicle</option>
              {fleetVehicles.length > 0 && (
                <optgroup label="Available Vendor Fleet">
                  {fleetVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendor?.name ? `${v.vendor.name} — ` : ""}
                      {v.vehicleType} ({v.capacity} seats)
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="custom">+ Custom Entry</option>
            </select>
          </div>

          <div className="md:col-span-1 min-w-0">
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Capacity
            </label>
            <select
              value={newVehicleCapacity}
              onChange={(e) => setNewVehicleCapacity(e.target.value)}
              className={nativeSelect}
            >
              <option value="4">4 seats</option>
              <option value="6">6 seats</option>
              <option value="7">7 seats</option>
              <option value="10">10 seats</option>
              <option value="12">12 seats</option>
              <option value="14">14 seats</option>
              <option value="17">17 seats</option>
              <option value="20">20 seats</option>
              <option value="26">26 seats</option>
            </select>
          </div>

          <div className="md:col-span-1 min-w-0">
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Tempo 1"
              value={newVehicleName}
              onChange={(e) => setNewVehicleName(e.target.value)}
              className={inputText}
            />
          </div>

          <div className="md:col-span-1 min-w-0">
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Cost (₹)
            </label>
            <input
              type="number"
              placeholder="45000"
              value={newVehicleCost}
              onChange={(e) => setNewVehicleCost(e.target.value)}
              className={inputText}
            />
          </div>

          <div className="md:col-span-1 min-w-0">
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Vendor
            </label>
            <input
              type="text"
              placeholder="ABC Travels"
              value={newVehicleVendor}
              onChange={(e) => setNewVehicleVendor(e.target.value)}
              className={inputText}
            />
          </div>

          <div className="md:col-span-1 min-w-0">
            <button
              type="submit"
              className={cn(outlineBtn, "w-full justify-center")}
            >
              <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.75} />
              Add
            </button>
          </div>
        </form>

        {allocFleet.length === 0 ? (
          <p className="text-[12px] text-slate-400 py-3 text-center">
            No vehicles assigned. Select a vendor vehicle above or create a custom one.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {allocFleet.map((v) => (
              <div
                key={v.id}
                className="border border-[#E8EEF4] rounded-lg p-3 bg-white flex items-start justify-between gap-2 min-w-0"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#0B1528] truncate">
                    {v.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {v.vehicleType} · {v.capacity} seats
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {v.cost ? `₹${Number(v.cost).toLocaleString("en-IN")}` : "—"} ·{" "}
                    {v.vendor || "Self-driven"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteVehicle(v.id)}
                  className="text-slate-400 hover:text-[#FF4D00] transition-colors p-1 rounded-md hover:bg-[#F4F7FB] shrink-0"
                  aria-label={`Remove vehicle ${v.name}`}
                >
                  <Trash className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 sm:p-4 shadow-none space-y-3 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-[#E8EEF4] pb-2.5 min-w-0">
          <StepHeading n={2}>Allocation rules</StepHeading>
          <span className="text-[11px] text-slate-500">
            Room sharing preferences
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">
              Room sharing size
            </label>
            <select
              value={sharingPref}
              onChange={(e) => setSharingPref(e.target.value)}
              className={nativeSelect}
            >
              <option value="2">Double (2 per room)</option>
              <option value="3">Triple (3 per room)</option>
              <option value="4">Quad (4 per room)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="same-gender"
              checked={sameGenderEnforced}
              onChange={(e) => setSameGenderEnforced(e.target.checked)}
              className={checkboxCls}
            />
            <label
              htmlFor="same-gender"
              className="text-[11px] font-medium text-slate-700 cursor-pointer"
            >
              Separate by gender
            </label>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="prioritize-couples"
              checked={prioritizeCouples}
              onChange={(e) => setPrioritizeCouples(e.target.checked)}
              className={checkboxCls}
            />
            <label
              htmlFor="prioritize-couples"
              className="text-[11px] font-medium text-slate-700 cursor-pointer"
            >
              Prioritize couples
            </label>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="fallback-quad"
              checked={fallbackToQuad}
              onChange={(e) => setFallbackToQuad(e.target.checked)}
              className={checkboxCls}
            />
            <label
              htmlFor="fallback-quad"
              className="text-[11px] font-medium text-slate-700 cursor-pointer"
            >
              Fallback to Quad
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 min-w-0 shadow-none">
        <div className="min-w-0">
          <StepHeading n={3}>WhatsApp lists</StepHeading>
          <p className="text-[11px] text-slate-500 mt-1 md:pl-7">
            Copy into the departure group
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto min-w-0">
          <button type="button" onClick={onCopyTempoList} className={outlineBtn}>
            <Copy className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.75} />
            Copy tempo list
          </button>
          <button type="button" onClick={onCopyRoomList} className={outlineBtn}>
            <Copy className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.75} />
            Copy room list
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
        <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 sm:p-4 shadow-none space-y-3 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8EEF4] pb-2.5 min-w-0">
            <h3 className="text-[11px] font-semibold text-[#0B1528] tracking-wide">
              Hotel group assignments
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setAddRoomModalOpen(true)}
                className={cn(outlineBtn, "h-7 px-2 text-[11px]")}
              >
                <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.75} />
                Add room
              </button>
              <button
                type="button"
                onClick={onAutoAllocateRooms || onAutoAllocate}
                className={cn(outlineBtn, "h-7 px-2 text-[11px] text-[#0B1528] hover:bg-[#F4F7FB]")}
              >
                <RefreshCw className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={1.75} />
                Auto-allocate Rooms
              </button>
              <button
                type="button"
                onClick={onSaveRooms || onSave}
                disabled={isSavingRooms || isSavingAllocations}
                className={cn(outlineBtn, "h-7 px-2.5 text-[11px] bg-[#0B1528] text-white hover:bg-[#16253d] border-[#0B1528]")}
              >
                {isSavingRooms ? (
                  <RefreshCw className="w-3 h-3 animate-spin shrink-0" strokeWidth={1.75} />
                ) : (
                  <Save className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                )}
                {isSavingRooms ? "Saving…" : "Save Room List"}
              </button>
            </div>
          </div>
          {computedRoomAllocations.length === 0 ? (
            <p className="text-[12px] text-slate-400 py-6 text-center">
              No room groups yet. Auto-allocate or add a room.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(
                computedRoomAllocations.reduce((acc: Record<string, any>, r) => {
                  if (!acc[r.roomNumber])
                    acc[r.roomNumber] = {
                      type: r.roomType,
                      members: [],
                      passengerIds: [],
                      genders: [],
                      rawGenders: [],
                    };
                  acc[r.roomNumber].members.push(r.travelerName);
                  acc[r.roomNumber].passengerIds.push(r.passengerId);
                  acc[r.roomNumber].genders.push(r.genderGroup);
                  acc[r.roomNumber].rawGenders.push(r.rawGender);
                  return acc;
                }, {}),
              ).map(([roomNum, rData]: any) => (
                <div
                  key={roomNum}
                  className="border border-[#E8EEF4] rounded-lg p-3 bg-white min-w-0"
                >
                  <p className="text-[11px] font-medium text-[#0B1528] flex items-center justify-between border-b border-[#E8EEF4] pb-1.5 gap-2 min-w-0">
                    <span>{roomNum}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManualRooms((prev) => prev.filter((r) => r !== roomNum));
                        setPassengerAllocations((prev) => {
                          const updated = { ...prev };
                          rData.members.forEach((mName: string, mIdx: number) => {
                            const passId = rData.passengerIds
                              ? rData.passengerIds[mIdx]
                              : null;
                            if (updated[mName]) {
                              updated[mName] = { ...updated[mName], room: "—" };
                            }
                            if (passId && updated[passId]) {
                              updated[passId] = { ...updated[passId], room: "—" };
                            }
                            const pObj = allPassengers.find(
                              (p: any) =>
                                p.name === mName || (passId && p.id === passId),
                            );
                            if (pObj) {
                              if (pObj.id && updated[pObj.id])
                                updated[pObj.id] = { ...updated[pObj.id], room: "—" };
                              if (pObj.name && updated[pObj.name])
                                updated[pObj.name] = {
                                  ...updated[pObj.name],
                                  room: "—",
                                };
                            }
                          });
                          return updated;
                        });
                        toast.success(`Deleted room: ${roomNum}`);
                      }}
                      className="text-slate-400 hover:text-[#FF4D00] transition-colors p-0.5 rounded-md hover:bg-[#F4F7FB]"
                      aria-label={`Remove ${roomNum}`}
                    >
                      <Trash className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </p>
                  <ul
                    className="mt-2 space-y-1.5 min-h-[40px] rounded p-1"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const travelerName = e.dataTransfer.getData("travelerName");
                      const passengerId = e.dataTransfer.getData("passengerId");
                      if (!travelerName && !passengerId) return;
                      setPassengerAllocations((prev) => {
                        const pObj = allPassengers.find(
                          (p: any) =>
                            (passengerId && p.id === passengerId) ||
                            (travelerName && p.name === travelerName) ||
                            (travelerName &&
                              p.name?.toLowerCase() === travelerName.toLowerCase()),
                        );
                        const current =
                          (pObj?.id && prev[pObj.id]) ||
                          (pObj?.name && prev[pObj.name]) ||
                          prev[travelerName] || {
                            room: "—",
                            vehicle: "—",
                            seat: "—",
                          };
                        const entry = { ...current, room: roomNum };
                        const updated = { ...prev, [travelerName]: entry };
                        if (pObj) {
                          if (pObj.id) updated[pObj.id] = { ...entry };
                          if (pObj.name) updated[pObj.name] = { ...entry };
                        }
                        return updated;
                      });
                      toast.success(`Moved ${travelerName} to ${roomNum}`);
                    }}
                  >
                    {rData.members.filter(Boolean).map((m: string, i: number) => {
                      const passId = rData.passengerIds
                        ? rData.passengerIds[i]
                        : null;
                      const isFemale =
                        normalizeGenderCode(rData.rawGenders[i], m) === "F";
                      const dotColor = isFemale ? "bg-pink-500" : "bg-blue-500";
                      return (
                        <li
                          key={i}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("travelerName", m);
                            if (passId) {
                              e.dataTransfer.setData("passengerId", passId);
                            } else {
                              const pObj = allPassengers.find(
                                (p: any) => p.name === m,
                              );
                              if (pObj?.id)
                                e.dataTransfer.setData("passengerId", pObj.id);
                            }
                          }}
                          className="text-[12px] font-medium text-[#0B1528] flex items-center gap-1.5 cursor-pointer hover:text-[#FF4D00] transition-colors bg-white px-2 py-1 rounded-md border border-[#E8EEF4] select-none min-w-0"
                          onClick={() => onOpenShuffle({ name: m, id: passId })}
                        >
                          <span
                            className={`h-1.5 w-1.5 ${dotColor} rounded-full shrink-0`}
                          />
                          {m}
                        </li>
                      );
                    })}
                    {rData.members.filter(Boolean).length === 0 && (
                      <li className="text-[11px] text-slate-400 py-1 text-center">
                        Empty room
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 sm:p-4 shadow-none space-y-3 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8EEF4] pb-2.5 min-w-0">
            <h3 className="text-[11px] font-semibold text-[#0B1528] tracking-wide">
              Transport assignments
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={onAutoAllocateTempos || onAutoAllocate}
                className={cn(outlineBtn, "h-7 px-2 text-[11px] text-[#0B1528] hover:bg-[#F4F7FB]")}
              >
                <RefreshCw className="w-3 h-3 shrink-0 text-slate-400" strokeWidth={1.75} />
                Auto-allocate Tempos
              </button>
              <button
                type="button"
                onClick={onSaveVehicles || onSave}
                disabled={isSavingVehicles || isSavingAllocations}
                className={cn(orangeBtn, "h-7 px-2.5 text-[11px] bg-[#FF4D00] hover:bg-[#E04500]")}
              >
                {isSavingVehicles ? (
                  <RefreshCw className="w-3 h-3 animate-spin shrink-0" strokeWidth={1.75} />
                ) : (
                  <Save className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                )}
                {isSavingVehicles ? "Saving…" : "Save Tempo List"}
              </button>
            </div>
          </div>
          {computedVehicleAllocations.length === 0 ? (
            <p className="text-[12px] text-slate-400 py-6 text-center">
              No seat assignments yet. Add a vehicle, then auto-allocate.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(
                computedVehicleAllocations.reduce((acc: Record<string, any>, v) => {
                  if (!acc[v.fleetId]) acc[v.fleetId] = [];
                  acc[v.fleetId].push(v);
                  return acc;
                }, {}),
              ).map(([fleetId, travelers]: any) => {
                const fleetItem = allocFleet.find((f) => f.id === fleetId);
                return (
                  <div
                    key={fleetId}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const travelerName = e.dataTransfer.getData("travelerName");
                      const passengerId = e.dataTransfer.getData("passengerId");
                      if (!travelerName && !passengerId) return;
                      const fleetName = fleetItem?.name || "Tempo Traveller";
                      setPassengerAllocations((prev) => {
                        const pObj = allPassengers.find(
                          (p: any) =>
                            (passengerId && p.id === passengerId) ||
                            (travelerName && p.name === travelerName) ||
                            (travelerName &&
                              p.name?.toLowerCase() === travelerName.toLowerCase()),
                        );
                        const current =
                          (pObj?.id && prev[pObj.id]) ||
                          (pObj?.name && prev[pObj.name]) ||
                          prev[travelerName] || {
                            room: "—",
                            vehicle: "—",
                            seat: "—",
                          };
                        const entry = { ...current, vehicle: fleetName };
                        const updated = { ...prev, [travelerName]: entry };
                        if (pObj) {
                          if (pObj.id) updated[pObj.id] = { ...entry };
                          if (pObj.name) updated[pObj.name] = { ...entry };
                        }
                        return updated;
                      });
                      toast.success(`Moved ${travelerName} to ${fleetName}`);
                    }}
                    className="border border-[#E8EEF4] rounded-lg p-3 bg-white min-w-0"
                  >
                    <p className="text-[11px] font-medium text-[#0B1528] flex items-center justify-between gap-2 min-w-0">
                      <span className="truncate min-w-0">
                        {fleetItem?.name ||
                          travelers[0]?.vehicleType ||
                          "Tempo Traveller"}{" "}
                        (
                        {fleetItem?.vehicleType ||
                          travelers[0]?.vehicleType ||
                          "Tempo"}
                        )
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 tabular-nums shrink-0">
                        {travelers.length} /{" "}
                        {fleetItem?.capacity ||
                          parseInt(
                            travelers[0]?.vehicleType?.match(/\d+/)?.[0],
                          ) ||
                          17}{" "}
                        seats
                      </span>
                    </p>
                    <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 min-h-[40px]">
                      {travelers
                        .slice()
                        .sort((a: any, b: any) => {
                          const sA =
                            parseInt(
                              String(a.seatNumber || "").replace(/\D/g, ""),
                            ) || 0;
                          const sB =
                            parseInt(
                              String(b.seatNumber || "").replace(/\D/g, ""),
                            ) || 0;
                          if (sA !== sB) return sA - sB;
                          return (a.travelerName || "").localeCompare(
                            b.travelerName || "",
                          );
                        })
                        .map((t: any, i: number) => {
                          const isFemale =
                            normalizeGenderCode(t.rawGender, t.travelerName) === "F";
                          const theme = isFemale
                            ? "text-pink-600 bg-pink-50 border-pink-100"
                            : "text-blue-600 bg-blue-50 border-blue-100";
                          const seatDisplay =
                            t.seatNumber && t.seatNumber !== "—"
                              ? t.seatNumber
                              : i + 1;
                          return (
                            <div
                              key={i}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData(
                                  "travelerName",
                                  t.travelerName,
                                );
                                if (t.passengerId) {
                                  e.dataTransfer.setData(
                                    "passengerId",
                                    t.passengerId,
                                  );
                                } else {
                                  const pObj = allPassengers.find(
                                    (p: any) => p.name === t.travelerName,
                                  );
                                  if (pObj?.id)
                                    e.dataTransfer.setData(
                                      "passengerId",
                                      pObj.id,
                                    );
                                }
                              }}
                              className="text-[12px] font-medium text-[#0B1528] flex items-center gap-2 cursor-pointer hover:text-[#FF4D00] transition-colors bg-white px-2.5 py-1.5 rounded-md border border-[#E8EEF4] select-none min-w-0"
                              onClick={() =>
                                onOpenShuffle({
                                  name: t.travelerName,
                                  id: t.passengerId,
                                })
                              }
                            >
                              <span
                                className={`text-[10px] font-semibold font-mono ${theme} border min-w-[28px] h-5 px-1 inline-flex items-center justify-center rounded-md shrink-0 tabular-nums text-center`}
                              >
                                #{seatDisplay}
                              </span>
                              <span className="truncate min-w-0 flex-1">
                                {t.travelerName}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end min-w-0">
        <button
          type="button"
          onClick={() => setShowClearAllocationsDialog(true)}
          className={cn(outlineBtn, "text-slate-500")}
        >
          Clear allocations
        </button>
      </div>

      {showClearAllocationsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-[#E8EEF4] rounded-xl p-5 shadow-lg w-full max-w-sm space-y-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-md bg-[#F4F7FB] border border-[#E8EEF4] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[#FF4D00]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#0B1528]">
                  Clear all allocations?
                </p>
                <p className="text-[12px] text-slate-500 mt-1">
                  This cancels active room and vehicle allocations for this
                  departure. It cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1 justify-end">
              <button
                type="button"
                onClick={() => setShowClearAllocationsDialog(false)}
                className={outlineBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingAllocations}
                onClick={onClearAllocations}
                className={orangeBtn}
              >
                {isSavingAllocations ? "Clearing…" : "Clear all"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
