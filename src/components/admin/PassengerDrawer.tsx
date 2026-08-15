import React, { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NormalizedPassenger, formatDOBForInput } from "@/utils/passengerUtils";
import { trainTicketService } from "@/services/trainTicket.service";
import API_BASE_URL from "@/config/environment";
import {
  Save,
  User,
  Heart,
  MapPin,
  Train,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building,
  Tag,
} from "lucide-react";
import { PassengerTimeline } from "./PassengerTimeline";

interface PassengerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  passenger: NormalizedPassenger | null;
  booking: any;
  onSave: (passengerId: string, updatedData: Partial<NormalizedPassenger>) => void;
}

export function PassengerDrawer({
  isOpen,
  onClose,
  passenger,
  booking,
  onSave,
}: PassengerDrawerProps) {
  const [formData, setFormData] = useState<Partial<NormalizedPassenger>>({});
  const [activeTab, setActiveTab] = useState("profile");
  const [activeStep, setActiveStep] = useState<number | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view (Requirement 7)
  useEffect(() => {
    if (tabsListRef.current) {
      const activeEl = tabsListRef.current.querySelector('[data-state="active"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }
  }, [activeTab]);

  // Invalidate & reset state whenever selected passenger changes (Requirement 2)
  useEffect(() => {
    if (passenger) {
      setFormData({ ...passenger });
      setActiveTab("profile");
      setActiveStep(undefined);

      // Fetch real train tickets for this booking
      if (booking?.id) {
        trainTicketService
          .getTicketsByBooking(booking.id)
          .then((res) => setTickets(res || []))
          .catch(() => setTickets([]));
      }
    } else {
      setFormData({});
      setTickets([]);
    }
  }, [passenger?.id, booking?.id]);

  if (!passenger) return null;

  const handleChange = (field: keyof NormalizedPassenger, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(passenger.id, formData);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter train tickets matching this passenger name
  const passengerTickets = tickets.filter((t: any) => {
    if (!t.travelerName || !passenger?.name) return false;
    const pName = passenger.name.toLowerCase();
    const tName = t.travelerName.toLowerCase();
    return pName.includes(tName) || tName.includes(pName);
  });

  // Handle Document Upload via /api/upload/single
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      const res = await fetch(`${API_BASE_URL}/api/upload/single`, {
        method: "POST",
        body: uploadData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        const newDoc = {
          id: `doc-${Date.now()}`,
          title: file.name,
          url: data.url,
          fileUrl: data.url,
          uploadedAt: new Date().toISOString(),
        };
        const updatedDocs = [...(formData.documents || []), newDoc];
        setFormData((prev) => ({
          ...prev,
          documents: updatedDocs,
          aadhaarUrl: data.url,
          idProofUrl: data.url,
        }));
      } else {
        alert("Upload failed: " + (data.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Document upload error:", err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRemoveDoc = (docId: string) => {
    const updatedDocs = (formData.documents || []).filter((d: any) => d.id !== docId);
    setFormData((prev) => ({ ...prev, documents: updatedDocs }));
  };

  const paymentStatusText =
    booking?.paymentStatus || booking?.payment_status || "Pending";
  const isPaid =
    paymentStatusText === "Paid" ||
    paymentStatusText === "Completed" ||
    paymentStatusText === "completed" ||
    (booking?.remainingAmount !== undefined && booking.remainingAmount <= 0);

  // Preview modal state
  const [previewModalDoc, setPreviewModalDoc] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Aggregate all passenger documents from all available sources
  const allPassengerDocs = (() => {
    const list: any[] = [];
    const pId = String(passenger?.id || "");

    const getFullDocUrl = (url?: string, docId?: string) => {
      if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:"))) {
        return url;
      }
      if (url && url.startsWith("/")) {
        return `${API_BASE_URL}${url}`;
      }
      if (docId && booking?.id) {
        return `${API_BASE_URL}/api/bookings/${booking.id}/documents/${docId}`;
      }
      return url || "";
    };

    if (Array.isArray(formData.documents)) {
      formData.documents.forEach((d: any) => {
        if (d && (d.url || d.fileUrl || d.id)) {
          const finalUrl = getFullDocUrl(d.url || d.fileUrl, d.id);
          list.push({
            id: d.id || `doc-${d.url || Math.random()}`,
            title: d.title || d.originalFileName || "Aadhaar / ID Proof",
            url: finalUrl,
            fileUrl: finalUrl,
            mimeType: d.mimeType,
          });
        }
      });
    }

    if (Array.isArray(passenger?.documents)) {
      passenger.documents.forEach((d: any) => {
        if (d && (d.url || d.fileUrl || d.id)) {
          const finalUrl = getFullDocUrl(d.url || d.fileUrl, d.id);
          list.push({
            id: d.id || `pdoc-${d.url || Math.random()}`,
            title: d.title || d.originalFileName || "Aadhaar / ID Proof",
            url: finalUrl,
            fileUrl: finalUrl,
            mimeType: d.mimeType,
          });
        }
      });
    }

    if (Array.isArray((booking as any)?.documents)) {
      (booking as any).documents.forEach((d: any) => {
        if (
          String(d.passengerId) === pId ||
          (pId === "primary" && (!d.passengerId || d.passengerId === "primary" || d.passengerId === "main")) ||
          (pId === "main" && (!d.passengerId || d.passengerId === "primary" || d.passengerId === "main"))
        ) {
          const finalUrl = getFullDocUrl(d.url || d.fileUrl, d.id);
          list.push({
            id: d.id,
            title: d.originalFileName || d.title || "Aadhaar / ID Proof",
            url: finalUrl,
            fileUrl: finalUrl,
            mimeType: d.mimeType,
          });
        }
      });
    }

    const directIdUrl =
      (formData as any).aadhaarUrl ||
      (formData as any).idProofUrl ||
      (formData as any).idProof ||
      formData.aadhaar ||
      (passenger as any)?.aadhaarUrl ||
      (passenger as any)?.idProofUrl ||
      (passenger as any)?.idProof ||
      passenger?.aadhaar;

    if (
      directIdUrl &&
      typeof directIdUrl === "string" &&
      (directIdUrl.startsWith("http") || directIdUrl.startsWith("/") || directIdUrl.startsWith("data:"))
    ) {
      const finalUrl = getFullDocUrl(directIdUrl);
      list.push({
        id: `direct-idproof-${pId}`,
        title: "Aadhaar / ID Proof",
        url: finalUrl,
        fileUrl: finalUrl,
      });
    }

    return list.filter(
      (doc, idx, self) =>
        doc &&
        doc.url &&
        self.findIndex((d) => d.url === doc.url || (d.id && d.id === doc.id)) === idx,
    );
  })();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto bg-white border-l border-slate-200 p-6 space-y-5">
        <SheetHeader className="pb-3 border-b border-slate-150">
          <SheetTitle className="text-xl font-black text-slate-900 flex justify-between items-center">
            <span>{formData.name || passenger.name}</span>
            <Button
              size="sm"
              disabled={isSaving}
              onClick={handleSave}
              className="gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs h-8 px-3 shadow-xs mr-8"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </SheetTitle>
          <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <span>
              {formData.formattedAgeGender || passenger.formattedAgeGender}
            </span>
            <span>•</span>
            <span className="font-mono">{formData.phone || passenger.phone || "No phone"}</span>
          </div>
        </SheetHeader>

        {/* Stepper Timeline */}
        <div className="px-1">
          <PassengerTimeline
            passenger={{ ...formData, documents: allPassengerDocs } as NormalizedPassenger}
            booking={booking}
            activeStep={activeStep}
            onSelectStep={(stepIdx) => {
              setActiveStep((prev) => (prev === stepIdx ? undefined : stepIdx));
              // Switch relevant tab on step click
              if (stepIdx === 1) setActiveTab("docs");
              else if (stepIdx === 3) setActiveTab("train");
              else if (stepIdx === 4 || stepIdx === 5) setActiveTab("logistics");
              else if (stepIdx === 0) setActiveTab("profile");
            }}
          />
        </div>

        {/* Interactive Step Detail Card (Toggleable & Dismissible) */}
        {activeStep !== undefined && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs relative">
            <button
              type="button"
              onClick={() => setActiveStep(undefined)}
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-700 text-xs font-bold p-1 rounded hover:bg-slate-200/60 transition-colors"
              title="Close step detail"
            >
              ✕
            </button>
            {activeStep === 0 && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Booking Overview
                </h4>
                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                  <div>Booking ID: <span className="font-bold font-mono text-slate-900">{booking?.bookingId}</span></div>
                  <div>Status: <span className="font-bold uppercase text-emerald-700">{booking?.status}</span></div>
                  <div>Trip: <span className="font-bold text-slate-900">{booking?.tripName || booking?.tripId}</span></div>
                  <div>Departure: <span className="font-bold font-mono text-slate-900">{booking?.departureDate ? new Date(booking.departureDate).toLocaleDateString() : "Flexible"}</span></div>
                  <div>Travelers: <span className="font-bold text-slate-900">{booking?.numberOfTravelers || 1} Pax</span></div>
                  <div>Sales Owner: <span className="font-bold text-slate-900">{booking?.salesAdmin?.name || "Web Direct"}</span></div>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <FileText className="w-4 h-4 text-blue-600" /> ID Proof & Documents
                </h4>
                <p className="text-slate-600 text-[11px]">
                  {allPassengerDocs.length > 0
                    ? `${allPassengerDocs.length} document(s) attached for this passenger.`
                    : "No documents uploaded yet for this passenger."}
                </p>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <CreditCard className="w-4 h-4 text-amber-600" /> Booking Payment Status
                </h4>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">TOTAL</span>
                    <span className="font-mono font-bold text-slate-800">₹{booking?.totalAmount || booking?.amount || 0}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">PAID</span>
                    <span className="font-mono font-bold text-emerald-600">₹{booking?.advancePaid || 0}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">DUE</span>
                    <span className="font-mono font-bold text-rose-600">₹{booking?.remainingAmount || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Train className="w-4 h-4 text-indigo-600" /> Passenger Train Tickets
                </h4>
                <div className="text-slate-600 text-[11px]">
                  {passengerTickets.length > 0 ? (
                    <span>{passengerTickets.length} ticket(s) found for {formData.name || "passenger"}.</span>
                  ) : formData.trainDetails ? (
                    <span>Train PNR Details: {formData.trainDetails}</span>
                  ) : booking?.trainTicketRequired === false || booking?.trainTicketStatus === "NOT_REQUIRED" ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" /> No train ticket required for this journey.
                    </span>
                  ) : (
                    <span className="text-amber-800 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 inline" /> No passenger-specific ticket has been issued yet. Status: Action Required.
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Building className="w-4 h-4 text-purple-600" /> Sharing & Occupancy
                </h4>
                <p className="text-slate-600 text-[11px]">
                  Type: <span className="font-bold text-slate-800">{formData.roomSharing || "Triple Sharing"}</span>
                  {formData.sharingWith && (
                    <span className="block mt-0.5">Sharing with: <span className="font-bold text-slate-800">{formData.sharingWith}</span></span>
                  )}
                </p>
              </div>
            )}

            {activeStep === 5 && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Transport & Pickup Allocation
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-0.5">
                  <div>Vehicle: <span className="font-bold text-slate-800">{formData.tempoAllocation || "Not assigned"}</span></div>
                  <div>Seat: <span className="font-bold text-slate-800">{formData.seatNumber || "Unassigned"}</span></div>
                  <div className="col-span-2">Pickup Point: <span className="font-bold text-slate-800">{formData.pickupPoint || booking?.pickupCity || "TBD"}</span></div>
                </div>
              </div>
            )}

            {activeStep === 6 && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <User className="w-4 h-4 text-blue-600" /> Guide Assignment
                </h4>
                <p className="text-slate-600 text-[11px]">
                  Trip Captain: <span className="font-bold text-slate-900">{booking?.guideName || booking?.tripRef?.guideAssignments?.[0]?.guideAdmin?.name || "Assigned closer to departure"}</span>
                </p>
              </div>
            )}

            {activeStep === 7 && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Departure Readiness Summary
                </h4>
                <p className="text-slate-600 text-[11px]">
                  Derived from operational requirements: Booking status, payment settlement, ID proof, transport, and guide assignment.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            ref={tabsListRef}
            className="w-full flex overflow-x-auto justify-start h-auto p-1 mb-4 bg-slate-100/80 border border-slate-200 rounded-lg scrollbar-none whitespace-nowrap"
          >
            <TabsTrigger value="profile" className="flex gap-1.5 text-xs font-bold shrink-0"><User className="w-3.5 h-3.5"/> Profile</TabsTrigger>
            <TabsTrigger value="health" className="flex gap-1.5 text-xs font-bold shrink-0"><Heart className="w-3.5 h-3.5"/> Health</TabsTrigger>
            <TabsTrigger value="logistics" className="flex gap-1.5 text-xs font-bold shrink-0"><MapPin className="w-3.5 h-3.5"/> Logistics</TabsTrigger>
            <TabsTrigger value="train" className="flex gap-1.5 text-xs font-bold shrink-0"><Train className="w-3.5 h-3.5"/> Train</TabsTrigger>
            <TabsTrigger value="notes" className="flex gap-1.5 text-xs font-bold shrink-0"><FileText className="w-3.5 h-3.5"/> Notes</TabsTrigger>
            <TabsTrigger value="docs" className="flex gap-1.5 text-xs font-bold shrink-0"><CreditCard className="w-3.5 h-3.5"/> Documents</TabsTrigger>
          </TabsList>

          {/* 1. PROFILE TAB */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Full Name *</Label>
                <Input className="h-9 text-xs" value={formData.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Phone</Label>
                <Input className="h-9 text-xs font-mono" value={formData.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Email</Label>
                <Input className="h-9 text-xs" value={formData.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">DOB</Label>
                <Input type="date" className="h-9 text-xs font-mono" value={formatDOBForInput(formData.dob) || ""} onChange={(e) => handleChange("dob", e.target.value)} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Gender</Label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-lg border border-slate-200">
                  {[
                    { label: "Male", code: "M" as const, full: "Male" },
                    { label: "Female", code: "F" as const, full: "Female" },
                    { label: "Other", code: "O" as const, full: "Other" },
                  ].map((g) => {
                    const isSelected =
                      formData.gender === g.code ||
                      formData.genderFull?.toLowerCase() === g.full.toLowerCase();
                    return (
                      <button
                        key={g.code}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            gender: g.code,
                            genderFull: g.full,
                            formattedAgeGender: `${prev.age !== null && prev.age !== undefined ? prev.age + "y" : "N/A"} / ${g.code}`,
                          }));
                        }}
                        className={cn(
                          "py-1.5 px-3 text-xs font-bold rounded-md transition-all text-center",
                          isSelected
                            ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50",
                        )}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Food Preference</Label>
                <Input className="h-9 text-xs" value={formData.foodPreference || ""} onChange={(e) => handleChange("foodPreference", e.target.value)} placeholder="e.g. Normal Food, Jain Food" />
              </div>
            </div>
          </TabsContent>

          {/* 2. HEALTH TAB */}
          <TabsContent value="health" className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Emergency Contact (Name & Number)</Label>
              <Input className="h-9 text-xs" value={formData.emergencyContact || ""} onChange={(e) => handleChange("emergencyContact", e.target.value)} placeholder="e.g. Parent Name (9876543210)" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Medical Conditions / Allergies / Physical Requirements</Label>
              <Textarea className="text-xs" value={formData.medicalConditions || ""} onChange={(e) => handleChange("medicalConditions", e.target.value)} rows={4} placeholder="e.g. Asthma, Peanut Allergy, Low BP" />
            </div>
          </TabsContent>

          {/* 3. LOGISTICS TAB */}
          <TabsContent value="logistics" className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Sharing Type (Occupancy)</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                  value={formData.roomSharing || "Triple Sharing"} 
                  onChange={(e) => handleChange("roomSharing", e.target.value)}
                >
                  <option value="Single Sharing">Single Sharing</option>
                  <option value="Double Sharing">Double Sharing</option>
                  <option value="Triple Sharing">Triple Sharing</option>
                  <option value="Quad Sharing">Quad Sharing</option>
                  <option value="Family Sharing">Family Sharing</option>
                  <option value="Dormitory">Dormitory</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Sharing With (Partners)</Label>
                <Input className="h-9 text-xs" placeholder="e.g. Rahul, Amit" value={formData.sharingWith || ""} onChange={(e) => handleChange("sharingWith", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Tempo / Vehicle</Label>
                <Input className="h-9 text-xs" placeholder="e.g. Tempo 1" value={formData.tempoAllocation || ""} onChange={(e) => handleChange("tempoAllocation", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Seat Number</Label>
                <Input className="h-9 text-xs font-mono" placeholder="e.g. 4B" value={formData.seatNumber || ""} onChange={(e) => handleChange("seatNumber", e.target.value)} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Pickup Point</Label>
                <Input className="h-9 text-xs" value={formData.pickupPoint || booking?.pickupCity || ""} onChange={(e) => handleChange("pickupPoint", e.target.value)} placeholder="e.g. Ahmedabad / Gandhinagar" />
              </div>
            </div>
          </TabsContent>

          {/* 4. TRAIN TAB */}
          <TabsContent value="train" className="space-y-3.5">
            {passengerTickets.length > 0 ? (
              <div className="space-y-2.5">
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Issued Train Tickets</h5>
                {passengerTickets.map((t: any) => (
                  <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{t.trainName || "Train"} ({t.trainNumber || "N/A"})</span>
                      <span className="font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                        {t.ticketStatus}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600 font-mono">
                      <span>PNR: <strong>{t.pnr || "—"}</strong></span>
                      <span>Coach/Seat: <strong>{t.coach || "-"}-{t.seatNumber || "-"}</strong></span>
                    </div>
                    {t.sourceStation && (
                      <div className="text-[10px] text-slate-500">
                        {t.sourceStation} &rarr; {t.destinationStation} ({t.passengerReference || "Journey"})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : booking?.trainTicketRequired === false || booking?.trainTicketStatus === "NOT_REQUIRED" ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                No train ticket required for this journey.
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Status: Action Required
                </div>
                <p className="text-[11px] text-amber-800 font-medium">
                  No passenger-specific ticket has been issued yet.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Train Details & PNR</Label>
              <Input className="h-9 text-xs font-mono" value={formData.trainDetails || ""} onChange={(e) => handleChange("trainDetails", e.target.value)} placeholder="e.g. PNR 1234567890 (Confirmed)" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Activity / Tour Add-on Selection</Label>
              <Textarea className="text-xs" value={formData.activitySelection || ""} onChange={(e) => handleChange("activitySelection", e.target.value)} placeholder="e.g. Scuba, Paragliding, Rafting" />
            </div>
          </TabsContent>

          {/* 5. NOTES TAB */}
          <TabsContent value="notes" className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Passenger Remarks (Visible on operations manifest)</Label>
              <Textarea className="text-xs" value={formData.remarks || ""} onChange={(e) => handleChange("remarks", e.target.value)} placeholder="e.g. Needs lower berth, prefers veg meals" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Internal Notes (Admin & Team only)</Label>
              <Textarea className="text-xs bg-amber-50/60 border-amber-200" value={formData.internalNotes || ""} onChange={(e) => handleChange("internalNotes", e.target.value)} placeholder="e.g. Customer requested special follow-up" rows={3} />
            </div>
          </TabsContent>

          {/* 6. DOCUMENTS TAB */}
          <TabsContent value="docs" className="space-y-3.5">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Passenger Documents & ID Proof</Label>
              <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-2.5 py-1 rounded gap-1 flex items-center shadow-xs">
                {uploadingDoc ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                Upload Document
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            {uploadingDoc && (
              <div className="text-xs text-amber-600 font-bold animate-pulse flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading file to server...
              </div>
            )}

            {allPassengerDocs.length > 0 ? (
              <div className="space-y-2">
                {allPassengerDocs.map((doc: any) => {
                  const docUrl = doc.url || doc.fileUrl;
                  const isPdf = docUrl?.toLowerCase().includes(".pdf") || doc.mimeType?.includes("pdf");
                  return (
                    <div key={doc.id || docUrl} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors">
                      <div
                        className="flex items-center gap-2 overflow-hidden min-w-0 cursor-pointer flex-1"
                        onClick={() => setPreviewModalDoc({ url: docUrl, title: doc.title || "Aadhaar / ID Proof" })}
                      >
                        <CreditCard className="w-4 h-4 text-orange-600 shrink-0" />
                        <span className="font-bold text-slate-800 truncate hover:text-orange-600">{doc.title || "Aadhaar / ID Proof"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => setPreviewModalDoc({ url: docUrl, title: doc.title || "Aadhaar / ID Proof" })}
                          className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center gap-0.5 px-2 py-1 rounded border border-orange-200"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </button>
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-slate-800 font-bold text-[10px] px-1.5 py-1"
                          title="Open in new tab"
                        >
                          ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="text-rose-600 hover:text-rose-700 font-bold text-[10px] px-1.5 py-0.5"
                          title="Remove document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs italic">
                No documents uploaded for this passenger. Click "Upload Document" to add Aadhaar or ID proof.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* In-drawer Document Preview Modal */}
        {previewModalDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <span className="font-bold text-slate-900 text-sm">{previewModalDoc.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewModalDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded"
                  >
                    Open Original <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewModalDoc(null)}
                    className="text-slate-400 hover:text-slate-700 font-bold text-base px-2 py-0.5"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100 min-h-[300px]">
                {previewModalDoc.url.toLowerCase().includes(".pdf") ? (
                  <iframe
                    src={previewModalDoc.url}
                    className="w-full h-[500px] rounded border border-slate-200 bg-white"
                    title={previewModalDoc.title}
                  />
                ) : (
                  <img
                    src={previewModalDoc.url}
                    alt={previewModalDoc.title}
                    className="max-h-[500px] max-w-full object-contain rounded shadow-xs"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
