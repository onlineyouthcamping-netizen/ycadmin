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

const outlineBtn =
  "h-8 w-full sm:w-auto min-w-0 text-[12px] font-medium rounded-md border border-[#E8EEF4] bg-white text-[#0B1528] hover:bg-[#F4F7FB] px-3 inline-flex items-center justify-center gap-1.5 shadow-none transition-colors disabled:opacity-50";
const orangeBtn =
  "h-8 w-full sm:w-auto min-w-0 text-[12px] font-medium rounded-md bg-[#FF4D00] hover:bg-[#E04400] text-white px-3.5 inline-flex items-center justify-center gap-1.5 shadow-none transition-colors";
const fieldClass =
  "h-8 w-full min-w-0 text-[12px] font-medium border border-[#E8EEF4] rounded-md px-2.5 bg-white text-[#0B1528] outline-none focus:ring-1 focus:ring-[#FF4D00]/30";
const fieldReadonly =
  "h-8 w-full min-w-0 text-[12px] font-medium border border-[#E8EEF4] rounded-md px-2.5 bg-[#F8FAFC] text-slate-600 cursor-not-allowed";
const labelClass = "text-[11px] font-medium text-slate-500 block mb-1";

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
  onSave: () => void;
  onAutoAllocate: () => void;
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
  onSave,
  onAutoAllocate,
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
  const costLocked =
    selectedVehicleId !== "" &&
    selectedVehicleId !== "custom" &&
    newVehicleCost !== "";
  const vendorLocked =
    selectedVehicleId !== "" && selectedVehicleId !== "custom";

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
            {isSavingAllocations ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={onAutoAllocate} className={orangeBtn}>
            <RefreshCw className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
            Auto-allocate
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
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2 items-end min-w-0"
        >
          <div className="min-w-0">
            <label className={labelClass}>Vehicle type</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedVehicleId(val);
                if (val === "custom") {
                  setNewVehicleType("17 Seater Tempo");
                  setNewVehicleCapacity("17");
                  setNewVehicleCost("");
                  setNewVehicleVendor("");
                  setSelectedVendorId("");
                } else {
                  const dirVeh = vendorDirectoryFleet.find((v) => v.id === val);
                  if (dirVeh) {
                    setNewVehicleType(dirVeh.vehicleType);
                    setNewVehicleCapacity(String(dirVeh.capacity));
                    setNewVehicleCost(dirVeh.cost ? String(dirVeh.cost) : "");
                    setNewVehicleVendor(dirVeh.vendorName);
                    setNewVehicleName(`${dirVeh.vendorName} ${dirVeh.vehicleType}`);
                    setSelectedVendorId(dirVeh.vendorId || "");
                    return;
                  }
                  const veh = fleetVehicles.find((v) => v.id === val);
                  if (veh) {
                    setNewVehicleType(veh.vehicleType);
                    setNewVehicleCapacity(String(veh.capacity));
                    setNewVehicleCost(
                      String(veh.tariff?.amount ?? veh.totalAmount ?? ""),
                    );
                    setNewVehicleVendor(veh.vendor?.name ?? veh.notes ?? "");
                    setNewVehicleName(veh.driverName || veh.name || veh.vehicleType);
                    setSelectedVendorId(veh.vendorId || veh.vendor?.id || "");
                  }
                }
              }}
              className={fieldClass}
            >
              <option value="">Select vendor vehicle / fleet</option>
              {vendorDirectoryFleet.length > 0 && (
                <optgroup label="Trip vendors (mapped fleet)">
                  {vendorDirectoryFleet.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label || `${v.vehicleType} – ${v.vendorName}`}
                    </option>
                  ))}
                </optgroup>
              )}
              {fleetVehicles.length > 0 && (
                <optgroup label="Assigned departure fleet">
                  {fleetVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleType} – {v.vendor?.name || v.notes || "Vendor"} (
                      {v.capacity} seats) – ₹
                      {Number(v.tariff?.amount ?? v.totalAmount ?? 0).toLocaleString(
                        "en-IN",
                      )}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="custom">Custom vehicle</option>
            </select>
            {vendorDirectoryFleet.length === 0 && (
              <p className="mt-1 text-[11px] text-slate-500">
                No priced transport vendor is mapped to this trip. Assign a trip
                vendor or use a custom vehicle with an explicit cost.
              </p>
            )}
          </div>
          <div className="min-w-0">
            <label className={labelClass}>Capacity</label>
            {selectedVehicleId && selectedVehicleId !== "custom" ? (
              <input
                type="text"
                readOnly
                value={`${newVehicleCapacity} seats`}
                className={fieldReadonly}
              />
            ) : (
              <select
                value={newVehicleCapacity}
                onChange={(e) => setNewVehicleCapacity(e.target.value)}
                className={fieldClass}
              >
                {[...Array(60)].map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {i + 1} seats
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="min-w-0">
            <label className={labelClass}>Name</label>
            <input
              ref={nameInputRef}
              type="text"
              required
              placeholder="Tempo 1"
              value={newVehicleName}
              onChange={(e) => setNewVehicleName(e.target.value)}
              className={cn(fieldClass, "placeholder:text-slate-400")}
            />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>Cost (₹)</label>
            <input
              type="number"
              required
              readOnly={costLocked}
              placeholder="45000"
              value={newVehicleCost}
              onChange={(e) => setNewVehicleCost(e.target.value)}
              className={cn(
                costLocked ? fieldReadonly : fieldClass,
                "placeholder:text-slate-400",
              )}
            />
          </div>
          <div className="min-w-0">
            <label className={labelClass}>Vendor</label>
            <input
              type="text"
              readOnly={vendorLocked}
              placeholder="ABC Travels"
              value={newVehicleVendor}
              onChange={(e) => setNewVehicleVendor(e.target.value)}
              className={cn(
                vendorLocked ? fieldReadonly : fieldClass,
                "placeholder:text-slate-400",
              )}
            />
          </div>
          <button type="submit" className={cn(outlineBtn, "w-full xl:w-auto")}>
            <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.75} />
            Add
          </button>
        </form>

        {allocFleet.length === 0 ? (
          <p className="text-[12px] text-slate-400 py-4 text-center">
            No vehicles in the fleet yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 min-w-0">
            {allocFleet.map((v) => (
              <div
                key={v.id}
                className="border border-[#E8EEF4] rounded-lg p-2.5 bg-white flex items-center justify-between gap-2 min-w-0"
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#0B1528] truncate">
                    {v.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {v.vehicleType} · {v.capacity} seats
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    ₹{Number(v?.cost || 0).toLocaleString("en-IN")} · {v.vendor}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteVehicle(v.id)}
                  className="h-7 w-7 inline-flex items-center justify-center text-slate-400 hover:text-[#FF4D00] hover:bg-[#F4F7FB] rounded-md shrink-0"
                  aria-label={`Remove ${v.name}`}
                >
                  <Trash className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 sm:p-4 shadow-none space-y-3 min-w-0">
        <div className="flex items-center gap-2 border-b border-[#E8EEF4] pb-2.5">
          <StepHeading n={2}>Allocation rules</StepHeading>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-center min-w-0">
          <div className="min-w-0">
            <label className={labelClass}>Room sharing</label>
            <select
              value={sharingPref}
              onChange={(e) => setSharingPref(e.target.value)}
              className={cn(fieldClass, "hover:bg-[#F4F7FB]")}
            >
              <option value="2">2-sharing (double)</option>
              <option value="3">3-sharing (triple)</option>
              <option value="4">4-sharing (quad)</option>
            </select>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="checkbox"
              id="rule-same-gender"
              checked={sameGenderEnforced}
              onChange={(e) => setSameGenderEnforced(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#E8EEF4] text-[#FF4D00] focus:ring-[#FF4D00] cursor-pointer shrink-0"
            />
            <label
              htmlFor="rule-same-gender"
              className="text-[12px] font-medium text-[#0B1528] cursor-pointer select-none"
            >
              Same-gender rooms
            </label>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="checkbox"
              id="rule-prioritize-couples"
              checked={prioritizeCouples}
              onChange={(e) => setPrioritizeCouples(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#E8EEF4] text-[#FF4D00] focus:ring-[#FF4D00] cursor-pointer shrink-0"
            />
            <label
              htmlFor="rule-prioritize-couples"
              className="text-[12px] font-medium text-[#0B1528] cursor-pointer select-none"
            >
              Keep booking groups together
            </label>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="checkbox"
              id="rule-fallback-quad"
              checked={fallbackToQuad}
              onChange={(e) => setFallbackToQuad(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[#E8EEF4] text-[#FF4D00] focus:ring-[#FF4D00] cursor-pointer shrink-0"
            />
            <label
              htmlFor="rule-fallback-quad"
              className="text-[12px] font-medium text-[#0B1528] cursor-pointer select-none"
            >
              Put leftover pax in 4-sharing
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
            <button
              type="button"
              onClick={() => setAddRoomModalOpen(true)}
              className={cn(outlineBtn, "h-7 px-2.5")}
            >
              <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.75} />
              Add room
            </button>
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
                      const rawG = (rData.rawGenders[i] || "").toLowerCase();
                      let dotColor = "bg-emerald-500";
                      if (rawG === "male") dotColor = "bg-blue-500";
                      else if (rawG === "female") dotColor = "bg-pink-500";
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
          <h3 className="text-[11px] font-semibold text-[#0B1528] tracking-wide">
            Transport assignments
          </h3>
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
                          const rawG = (t.rawGender || "").toLowerCase();
                          let theme =
                            "text-emerald-600 bg-emerald-50 border-emerald-100";
                          if (rawG === "male")
                            theme = "text-blue-600 bg-blue-50 border-blue-100";
                          else if (rawG === "female")
                            theme = "text-pink-600 bg-pink-50 border-pink-100";
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
