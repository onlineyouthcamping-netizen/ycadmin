import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingsService } from "@/services/bookings.service";
import { trainTicketService } from "@/services/trainTicket.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Booking, BookingTrip } from "@/types";

export function ConfirmModal({ booking, trips, onClose, onDone }: { booking: Booking | null; trips: BookingTrip[]; onClose: () => void; onDone: () => void }) {
  const [total, setTotal] = useState("");
  const [advance, setAdvance] = useState("");
  const [mode, setMode] = useState("UPI");
  const [email, setEmail] = useState("");
  const [trainStatus, setTrainStatus] = useState("PENDING");
  const [saving, setSaving] = useState(false);
  const [sendTicket, setSendTicket] = useState(false);
  const [ticketFile, setTicketFile] = useState<string | null>(null);
  const [ticketFileName, setTicketFileName] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setEmail(booking.email || "");
      const trip = trips.find(t => t.tripCode === booking.tripId || t.id === booking.tripId);
      if (trip && trip.price) {
        setTotal(trip.price.toString());
      } else {
        setTotal("");
      }
    }
  }, [booking, trips]);

  if (!booking) return null;

  const handleConfirm = async () => {
    if (!total || parseFloat(total) <= 0) return toast.error("Enter valid total amount");
    setSaving(true);
    try {
      await bookingsService.confirm(booking.id, {
        totalAmount: parseFloat(total),
        advancePaid: parseFloat(advance) || 0,
        paymentMode: mode,
        paymentStatus: parseFloat(advance) >= parseFloat(total) ? 'Paid' : parseFloat(advance) > 0 ? 'Partial' : 'Pending',
        email,
        trainTicketStatus: trainStatus
      });
      
      // Auto create or update train tickets for passengers in this booking with the selected status
      const passengersList = booking.passengers && Array.isArray(booking.passengers) ? booking.passengers : [];
      if (passengersList.length > 0) {
        await Promise.all(
          passengersList.map(async (p: any) => {
            return trainTicketService.createTicket(booking.bookingId, {
              travelerName: p.name,
              ticketStatus: trainStatus,
              sourceStation: booking.pickupCity || "Ahmedabad",
              destinationStation: "Jalandhar"
            });
          })
        );
      } else {
        await trainTicketService.createTicket(booking.bookingId, {
          travelerName: booking.fullName,
          ticketStatus: trainStatus,
          sourceStation: booking.pickupCity || "Ahmedabad",
          destinationStation: "Jalandhar"
        });
      }

      toast.success("Booking confirmed!");
      try {
        await bookingsService.sendEmail(booking.id, 'confirmation', undefined, sendTicket, ticketFile, ticketFileName);
        toast.success("Confirmation email sent!");
      } catch (e) {
        console.error("Failed to send automatic confirmation email", e);
        toast.error("Booking confirmed but email failed to send");
      }
      onDone();
    } catch { toast.error("Failed to confirm"); }
    setSaving(false);
  };

  const rem = (parseFloat(total) || 0) - (parseFloat(advance) || 0);

  return (
    <Dialog open={!!booking} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
        <DialogHeader className="bg-emerald-600 px-4 py-3 text-white">
          <DialogTitle className="text-xs font-bold uppercase tracking-wider text-white">Confirm Booking</DialogTitle>
          <DialogDescription className="sr-only">Confirm the booking details and payments.</DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-3.5 text-xs">
          <div className="bg-slate-55 p-2.5 rounded border border-slate-200/60">
            <span className="font-bold text-slate-555 uppercase mr-1">Booking Ref:</span>
            <span className="font-mono font-semibold">{booking.bookingId}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400">Total Package Amount *</label>
              <Input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="0.00" className="h-8 text-xs rounded bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400">Advance Paid</label>
              <Input type="number" value={advance} onChange={e => setAdvance(e.target.value)} placeholder="0.00" className="h-8 text-xs rounded bg-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 bg-slate-55 p-2.5 rounded border border-slate-100/80">
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400">Remaining Balance</p>
              <p className="text-sm font-bold font-mono text-slate-800">₹{rem.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400">Payment Status</p>
              <p className={cn("text-xs font-black uppercase tracking-wider", rem <= 0 ? "text-emerald-600" : parseFloat(advance) > 0 ? "text-orange-500" : "text-amber-500")}>
                {rem <= 0 ? "PAID" : parseFloat(advance) > 0 ? "PARTIAL" : "PENDING"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400">Payment Mode</label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-8 text-xs rounded bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI" className="text-xs">UPI</SelectItem>
                  <SelectItem value="Cash" className="text-xs">Cash</SelectItem>
                  <SelectItem value="Bank Transfer" className="text-xs">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400">Train Ticket Status</label>
              <Select value={trainStatus} onValueChange={setTrainStatus}>
                <SelectTrigger className="h-8 text-xs rounded bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
                  <SelectItem value="BOOKED" className="text-xs">Booked</SelectItem>
                  <SelectItem value="WAITLISTED" className="text-xs">Waitlisted</SelectItem>
                  <SelectItem value="CONFIRMED" className="text-xs">Confirmed</SelectItem>
                  <SelectItem value="RAC" className="text-xs">RAC</SelectItem>
                  <SelectItem value="SELF_BOOKED" className="text-xs">Self booked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-slate-400">Customer Email (For confirmation)</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" className="h-8 text-xs rounded bg-white" />
          </div>
          {trainStatus !== 'SELF_BOOKED' && (
            <div className="flex flex-col gap-2 p-2 bg-emerald-50 rounded border border-emerald-100 max-w-sm my-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="modalSendTrainWithEmail" 
                  checked={sendTicket} 
                  onChange={e => setSendTicket(e.target.checked)} 
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                />
                <label htmlFor="modalSendTrainWithEmail" className="text-[10px] font-bold text-emerald-800 cursor-pointer select-none">
                  Include train ticket confirmation details inside email
                </label>
              </div>
              {sendTicket && (
                <div className="space-y-1 pl-5">
                  <label className="block text-[9px] font-bold uppercase text-slate-500">Attach Train Ticket File (Optional)</label>
                  <input 
                    type="file" 
                    accept=".pdf,image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setTicketFileName(file.name);
                        const reader = new FileReader();
                        reader.onload = () => {
                          const base64Str = reader.result as string;
                          const base64Data = base64Str.split(',')[1] || base64Str;
                          setTicketFile(base64Data);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        setTicketFile(null);
                        setTicketFileName(null);
                      }
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                  {ticketFileName && (
                    <p className="text-[10px] text-slate-500 font-medium font-mono">Selected: {ticketFileName}</p>
                  )}
                </div>
              )}
            </div>
          )}
          <Button onClick={handleConfirm} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider h-9 rounded text-[10px] mt-2 shadow-sm">
            {saving ? "Processing..." : "Confirm Booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
