import React from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { NormalizedPassenger } from "@/utils/passengerUtils";

interface PassengerTimelineProps {
  passenger: NormalizedPassenger;
  booking: any;
  activeStep?: number;
  onSelectStep?: (index: number) => void;
}

export function PassengerTimeline({
  passenger,
  booking,
  activeStep,
  onSelectStep,
}: PassengerTimelineProps) {
  // Determine statuses for timeline
  const directId =
    passenger.aadhaarUrl ||
    passenger.idProofUrl ||
    passenger.aadhaar ||
    (passenger as any).idProof ||
    (passenger as any).idProofUrl;

  const hasDocs = Boolean(
    (passenger.documents && passenger.documents.length > 0) ||
      (directId && typeof directId === "string" && (directId.startsWith("http") || directId.startsWith("/"))),
  );

  const paymentCompleted = Boolean(
    booking?.paymentStatus === "Paid" ||
      booking?.paymentStatus === "Completed" ||
      booking?.payment_status === "completed" ||
      (booking?.remainingAmount !== undefined && booking.remainingAmount <= 0),
  );

  // Train requirement check (Requirements 2)
  const isTrainRequired = Boolean(
    booking?.trainTicketRequired !== false &&
      booking?.trainTicketStatus !== "NOT_REQUIRED" &&
      booking?.trainTicketStatus !== "NOT_BOOKED",
  );

  const hasTrainTicket = Boolean(
    (passenger.trainDetails && passenger.trainDetails.trim() !== "") ||
      (booking?.trainTickets &&
        booking.trainTickets.some(
          (t: any) =>
            t.ticketStatus === "CONFIRMED" || t.ticketStatus === "BOOKED",
        )),
  );

  const trainCompleted = !isTrainRequired || hasTrainTicket;

  // Sharing requirement check (Requirement 4)
  const roomSharingVal = (passenger.roomSharing || "").toLowerCase();
  const isSingleSharing = roomSharingVal.includes("single");
  const isSharingWithSet = Boolean(passenger.sharingWith && passenger.sharingWith.trim() !== "");
  const roomPlanned = Boolean(
    isSingleSharing || (roomSharingVal && isSharingWithSet),
  );

  const transportAllocated = Boolean(
    (passenger.tempoAllocation && passenger.tempoAllocation.trim() !== "") ||
      (passenger.seatNumber && passenger.seatNumber.trim() !== "") ||
      (booking?.opsVehicleAllocations &&
        booking.opsVehicleAllocations.length > 0),
  );

  const guideAssigned = Boolean(
    booking?.tripRef?.guideAssignments?.length > 0 ||
      booking?.guideName ||
      booking?.trip?.vendors?.some((v: any) => v.vendorType === "guide"),
  );

  const isBookingConfirmed =
    booking?.status === "confirmed" || booking?.status === "Confirmed";

  // Derived readiness calculation (Requirements 11)
  const isDepartureReady =
    isBookingConfirmed &&
    paymentCompleted &&
    hasDocs &&
    trainCompleted &&
    transportAllocated;

  const missingRequirements: string[] = [];
  if (!isBookingConfirmed) missingRequirements.push("Booking Confirmation");
  if (!paymentCompleted) missingRequirements.push("Payment Settlement");
  if (!hasDocs) missingRequirements.push("ID Proof / Documents");
  if (!trainCompleted) missingRequirements.push("Train Ticket Confirmation");
  if (!roomPlanned) missingRequirements.push("Sharing Allocation");
  if (!transportAllocated) missingRequirements.push("Transport Allocation");

  const steps = [
    { label: "Booking", completed: isBookingConfirmed, actionRequired: !isBookingConfirmed, key: "booking" },
    { label: "Docs", completed: hasDocs, actionRequired: !hasDocs, key: "docs" },
    { label: "Payment", completed: paymentCompleted, actionRequired: !paymentCompleted, key: "payment" },
    { label: "Train", completed: trainCompleted, actionRequired: !trainCompleted, key: "train" },
    { label: "Sharing", completed: roomPlanned, actionRequired: !roomPlanned, key: "sharing" },
    { label: "Transport", completed: transportAllocated, actionRequired: !transportAllocated, key: "transport" },
    { label: "Guide", completed: guideAssigned, actionRequired: !guideAssigned, key: "guide" },
    {
      label: "Departure",
      completed: isDepartureReady,
      actionRequired: !isDepartureReady,
      key: "departure",
    },
  ];

  return (
    <div className="py-2 px-1 w-full space-y-2">
      <div className="flex justify-between items-center relative min-w-[360px] overflow-x-auto scrollbar-none pb-1">
        <div className="absolute top-3 left-3 right-3 h-0.5 bg-slate-150 -z-10 rounded-full"></div>
        <div
          className="absolute top-3 left-3 h-0.5 bg-emerald-500 -z-10 transition-all duration-500 ease-in-out"
          style={{
            width: `${(steps.filter((s) => s.completed).length / (steps.length - 1)) * 100}%`,
          }}
        ></div>

        {steps.map((step, idx) => {
          const isActive = activeStep === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectStep && onSelectStep(idx)}
              className="flex flex-col items-center group relative cursor-pointer focus:outline-none px-1"
              title={`${step.label}: ${step.completed ? "Complete ✓" : step.actionRequired ? "Action Required !" : "Pending"}`}
            >
              <div
                className={`w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 transition-all ${
                  isActive
                    ? "ring-2 ring-orange-500 ring-offset-2 shadow-xs"
                    : ""
                } ${
                  step.completed
                    ? "border-emerald-500 bg-white text-emerald-600"
                    : step.actionRequired
                      ? "border-amber-500 bg-amber-50 text-amber-600"
                      : "border-slate-300 bg-white text-slate-300"
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : step.actionRequired ? (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ) : (
                  <Circle className="w-2.5 h-2.5 text-slate-300 fill-slate-100 shrink-0" />
                )}
              </div>

              {/* Tooltip for step label (floating above step circle) */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-max px-2 py-0.5 bg-slate-900 text-white text-[9.5px] font-bold rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                {step.label}: {step.completed ? "Complete ✓" : step.actionRequired ? "Action Required !" : "Pending"}
              </div>

              <div
                className={`mt-1.5 text-[9.5px] whitespace-nowrap text-center transition-colors ${
                  isActive
                    ? "text-orange-600 font-black underline"
                    : step.completed
                      ? "text-emerald-700 font-bold"
                      : step.actionRequired
                        ? "text-amber-700 font-bold"
                        : "text-slate-400 font-medium"
                }`}
              >
                {step.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Derived Readiness Badge Banner (Shown only when no specific step detail is open) */}
      {activeStep === undefined && (
        <div
          className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold border ${
            isDepartureReady
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isDepartureReady ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>
              Departure Readiness:{" "}
              <span
                className={
                  isDepartureReady ? "text-emerald-700" : "text-amber-700"
                }
              >
                {isDepartureReady ? "READY FOR DEPARTURE" : "ACTION REQUIRED"}
              </span>
            </span>
          </div>
          {!isDepartureReady && missingRequirements.length > 0 && (
            <span className="text-[10px] font-normal text-amber-700 truncate max-w-[220px]">
              Missing: {missingRequirements.join(", ")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
