import { useState, useEffect, useMemo } from "react";
import { AdminModal } from "./AdminModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tripsService } from "@/services/trips.service";
import { bookingsService } from "@/services/bookings.service";
import type { Trip, BookingFormData } from "@/types";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Calendar, Users, IndianRupee } from "lucide-react";

interface NewBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function NewBookingModal({ open, onOpenChange, onSuccess }: NewBookingModalProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const [form, setForm] = useState<any>({
    fullName: "",
    mobile: "",
    tripId: "",
    age: 20,
    gender: "Male",
    trainClass: "",
    ticketStatus: "Not Booked",
    roomType: "",
    totalAmount: 0,
    advancePaid: 0,
    status: "confirmed",
    paymentStatus: "Pending",
    paymentMode: "UPI",
    notes: "",
    email: "",
    departureDate: "",
    pickupCity: "",
    numberOfTravelers: 1,
  });

  useEffect(() => {
    if (open) {
      const loadTrips = async () => {
        setLoadingTrips(true);
        try {
          const data = await bookingsService.getTrips();
          setTrips((data || []) as any);
        } catch (error) {
          toast.error("Failed to load trips");
        } finally {
          setLoadingTrips(false);
        }
      };
      loadTrips();
    }
  }, [open]);

  const handleTripChange = async (tripId: string) => {
    setSelectedTripDetails(null);
    setLoadingDetails(true);
    
    const selectedTrip = trips.find((t: any) => t.id === tripId || t.tripCode === tripId);
    
    setForm(prev => ({
      ...prev,
      tripId,
      totalAmount: (selectedTrip as any)?.price || prev.totalAmount,
      pickupCity: "",
      roomType: "",
      trainClass: "",
      departureDate: "",
    }));

    try {
      const details = await tripsService.getById(tripId);
      if (details) {
        setSelectedTripDetails(details);
        
        const firstVariant = details.variants && Array.isArray(details.variants) && details.variants[0];
        const firstRoom = details.roomOptions && Array.isArray(details.roomOptions) && details.roomOptions[0];
        const firstTravel = details.travelOptions && Array.isArray(details.travelOptions) && details.travelOptions[0];
        const firstDate = details.availableDates && Array.isArray(details.availableDates) && details.availableDates[0];

        setForm(prev => ({
          ...prev,
          pickupCity: firstVariant ? firstVariant.location : "",
          roomType: firstRoom ? firstRoom.label : "Double Sharing",
          trainClass: firstTravel ? firstTravel.label : "Sleeper",
          departureDate: firstDate ? (typeof firstDate === 'string' ? firstDate : firstDate.date) : "",
        }));
      }
    } catch (err) {
      console.error("Failed to load trip details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Unified location options combining variants and pickup cities
  const locationOptions = useMemo(() => {
    if (!selectedTripDetails) return [];
    const list: { name: string; price: number }[] = [];
    const seen = new Set<string>();
    const tripPrice = Number(selectedTripDetails.price || 0);

    if (Array.isArray(selectedTripDetails.variants)) {
      selectedTripDetails.variants.forEach((v: any) => {
        const name = (v.location || v.cityName || v.name || v.variantName || v.city || '').trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          const price = Number(v.discountedPrice) || Number(v.originalPrice) || tripPrice;
          list.push({ name, price });
        }
      });
    }

    if (Array.isArray(selectedTripDetails.pickupCities)) {
      selectedTripDetails.pickupCities.forEach((c: any) => {
        const name = (c.cityName || c.location || c.name || '').trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          const deduction = Number(c.deductionAmount || 0);
          const price = Math.max(0, tripPrice - deduction);
          list.push({ name, price });
        }
      });
    }

    return list;
  }, [selectedTripDetails]);

  // Dynamic price calculation
  useEffect(() => {
    if (!form.tripId) return;

    let basePrice = Number(selectedTripDetails?.price || 0);
    if (selectedTripDetails && form.pickupCity && locationOptions.length > 0) {
      const selectedLoc = locationOptions.find(loc => loc.name.toLowerCase() === form.pickupCity.trim().toLowerCase());
      if (selectedLoc) {
        basePrice = selectedLoc.price;
      }
    }

    let roomDelta = 0;
    if (form.roomType && selectedTripDetails?.roomOptions && Array.isArray(selectedTripDetails.roomOptions)) {
      const selectedRoom = selectedTripDetails.roomOptions.find((r: any) => r.label === form.roomType);
      roomDelta = selectedRoom ? Number(selectedRoom.priceDelta || 0) : 0;
    }

    let travelDelta = 0;
    if (form.trainClass && selectedTripDetails?.travelOptions && Array.isArray(selectedTripDetails.travelOptions)) {
      const selectedTravel = selectedTripDetails.travelOptions.find((t: any) => t.label === form.trainClass);
      travelDelta = selectedTravel ? Number(selectedTravel.priceDelta || 0) : 0;
    }

    const singlePersonPrice = basePrice + roomDelta + travelDelta;
    const totalAmount = singlePersonPrice * (form.numberOfTravelers || 1);

    setForm(prev => ({
      ...prev,
      totalAmount
    }));
  }, [form.tripId, form.pickupCity, form.roomType, form.trainClass, form.numberOfTravelers, selectedTripDetails, locationOptions]);

  const handleSubmit = async () => {
    // Populate passengers list corresponding to the traveler count to inform the backend
    const passengers = Array.from({ length: Number(form.numberOfTravelers) || 1 }, (_, i) => ({
      name: i === 0 ? form.fullName : `Passenger ${i + 1}`,
      age: i === 0 ? Number(form.age) || 20 : 20,
      gender: i === 0 ? form.gender : "Male",
    }));

    const payload = {
      ...form,
      name: form.fullName, 
      phone: form.mobile,   
      amount: Number(form.totalAmount), 
      totalAmount: Number(form.totalAmount),
      passengers,
    };

    console.log("📡 Sending booking:", payload);

    if (!payload.name || !payload.phone || !payload.tripId || !payload.email || !payload.departureDate) {
      toast.error("Required fields: Name, Phone, Trip, Email, and Departure Date");
      return;
    }

    setSubmitting(true);
    try {
      const response = await bookingsService.create(payload);
      console.log("✅ Booking Success:", response);
      toast.success("Booking created successfully");
      onOpenChange(false);
      onSuccess?.();
      
      setForm({
        fullName: "",
        mobile: "",
        tripId: "",
        age: 20,
        gender: "Male",
        trainClass: "",
        ticketStatus: "Not Booked",
        roomType: "",
        totalAmount: 0,
        advancePaid: 0,
        status: "confirmed",
        paymentStatus: "Pending",
        paymentMode: "UPI",
        notes: "",
        email: "",
        departureDate: "",
        pickupCity: "",
        numberOfTravelers: 1,
      });
      setSelectedTripDetails(null);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to create booking";
      console.error("❌ FULL ERROR:", error.response?.data || error);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Balance Due</span>
        <span className="text-xl font-black text-slate-900">₹{(form.totalAmount - (form.advancePaid || 0)).toLocaleString()}</span>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-6 font-bold text-slate-600 border-slate-200">
          Discard
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] h-12 px-10 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Create Booking
        </Button>
      </div>
    </>
  );

  return (
    <AdminModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create Booking"
      description="Register a new expedition reservation"
      footer={footer}
    >
      <div className="space-y-10">
        {/* Customer Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name *</Label>
              <Input 
                value={form.fullName} 
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="Primary guest name" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number *</Label>
              <div className="flex h-11 rounded-xl border border-slate-200 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <div className="w-14 h-full bg-slate-50 border-r border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
                  +91
                </div>
                <Input 
                  value={form.mobile} 
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  placeholder="10-digit number" 
                  className="h-full border-none rounded-none flex-1 focus-visible:ring-0 shadow-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address *</Label>
              <Input 
                type="email"
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="customer@example.com" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</Label>
                <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Age</Label>
                <Input 
                  type="number"
                  value={form.age} 
                  onChange={e => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Trip Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expedition Logistics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Select Trip *</Label>
                <button 
                  type="button"
                  onClick={() => setForm({ ...form, isManualTrip: !form.isManualTrip, tripId: "" })}
                  className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {form.isManualTrip ? "Select from list" : "Manual Code"}
                </button>
              </div>
              {form.isManualTrip ? (
                <Input 
                  value={form.tripId} 
                  onChange={e => setForm({ ...form, tripId: e.target.value })}
                  placeholder="e.g. MKA1" 
                  className="font-black uppercase tracking-widest"
                />
              ) : (
                <Select value={form.tripId} onValueChange={handleTripChange}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder={loadingTrips ? "Loading..." : "Select trip"} />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map(trip => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.title} (₹{trip.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Number of Travelers *</Label>
              <Input 
                type="number"
                min="1"
                value={form.numberOfTravelers} 
                onChange={e => setForm({ ...form, numberOfTravelers: parseInt(e.target.value) || 1 })}
                placeholder="Number of guests"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Location Variant / Starting Point</Label>
              {locationOptions.length > 0 ? (
                <Select value={form.pickupCity} onValueChange={val => setForm({ ...form, pickupCity: val })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select location variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((loc: any, index: number) => (
                      <SelectItem key={index} value={loc.name}>
                        {loc.name} (₹{loc.price.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  value={form.pickupCity} 
                  onChange={e => setForm({ ...form, pickupCity: e.target.value })}
                  placeholder="e.g. Ahmedabad, Mumbai" 
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Departure Date *</Label>
              {selectedTripDetails?.availableDates && Array.isArray(selectedTripDetails.availableDates) && selectedTripDetails.availableDates.length > 0 ? (
                <Select value={form.departureDate} onValueChange={val => setForm({ ...form, departureDate: val })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select departure date" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTripDetails.availableDates.map((d: any, index: number) => {
                      const dateVal = typeof d === 'string' ? d : d.date;
                      return (
                        <SelectItem key={index} value={dateVal}>
                          {dateVal}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  type="date"
                  value={form.departureDate} 
                  onChange={e => setForm({ ...form, departureDate: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Room Type</Label>
              {selectedTripDetails?.roomOptions && Array.isArray(selectedTripDetails.roomOptions) && selectedTripDetails.roomOptions.length > 0 ? (
                <Select value={form.roomType} onValueChange={val => setForm({ ...form, roomType: val })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select room sharing type" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTripDetails.roomOptions.map((r: any, index: number) => (
                      <SelectItem key={index} value={r.label}>
                        {r.label} ({r.priceDelta > 0 ? `+₹${r.priceDelta}` : r.priceDelta < 0 ? `-₹${Math.abs(r.priceDelta)}` : "No extra cost"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  value={form.roomType} 
                  onChange={e => setForm({ ...form, roomType: e.target.value })}
                  placeholder="e.g. Double Sharing" 
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Train Class / Travel Options</Label>
              {selectedTripDetails?.travelOptions && Array.isArray(selectedTripDetails.travelOptions) && selectedTripDetails.travelOptions.length > 0 ? (
                <Select value={form.trainClass} onValueChange={val => setForm({ ...form, trainClass: val })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select travel option" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTripDetails.travelOptions.map((t: any, index: number) => (
                      <SelectItem key={index} value={t.label}>
                        {t.label} ({t.priceDelta > 0 ? `+₹${t.priceDelta}` : t.priceDelta < 0 ? `-₹${Math.abs(t.priceDelta)}` : "No extra cost"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={form.trainClass} onValueChange={v => setForm({ ...form, trainClass: v })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sleeper">Sleeper</SelectItem>
                    <SelectItem value="3AC">3AC</SelectItem>
                    <SelectItem value="Flight">Flight</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </section>

        {/* Financials */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Total Fee (₹) *</Label>
              <Input 
                type="number"
                value={form.totalAmount} 
                onChange={e => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Advance Paid (₹)</Label>
              <Input 
                type="number"
                value={form.advancePaid} 
                onChange={e => setForm({ ...form, advancePaid: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Status</Label>
              <Select value={form.paymentStatus} onValueChange={(v: any) => setForm({ ...form, paymentStatus: v })}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partial">Partial Payment</SelectItem>
                  <SelectItem value="Paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Mode</Label>
              <Select value={form.paymentMode} onValueChange={(v: any) => setForm({ ...form, paymentMode: v })}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal Notes</Label>
          <Textarea 
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Special requests or payment remarks..." 
            className="min-h-[120px] rounded-2xl border-slate-200 shadow-sm transition-all focus-visible:ring-primary/20 focus-visible:border-primary p-4"
          />
        </section>
      </div>
    </AdminModal>
  );
}
