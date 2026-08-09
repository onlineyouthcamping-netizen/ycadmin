import React, { useState } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Calendar,
  FileText,
  Image,
  CreditCard,
  History,
  ChevronLeft,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  Bed,
  Users,
  Plus,
  Tag,
  AlertTriangle,
  TrendingUp,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/services/api";

interface AccommodationDetailPageProps {
  vendor: any;
  onBack: () => void;
  onUpdateVendor: (updated: any) => void;
}

const TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "contacts", label: "Contacts", icon: Phone },
  { id: "rooms", label: "Rooms", icon: Bed },
  { id: "seasonal_pricing", label: "Seasonal Pricing", icon: Calendar },
  { id: "contracts", label: "Contracts & Docs", icon: FileText },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "trips", label: "Trips & Destinations", icon: Users },
  { id: "ledger", label: "Payment Ledger", icon: CreditCard },
  { id: "price_history", label: "Price History", icon: TrendingUp },
  { id: "timeline", label: "Activity Timeline", icon: History },
];

export function AccommodationDetailPage({
  vendor: initialVendor,
  onBack,
  onUpdateVendor,
}: AccommodationDetailPageProps) {
  const [vendor, setVendor] = useState<any>(initialVendor);
  const [activeTab, setActiveTab] = useState("overview");

  // Overview Editing State
  const [editOverviewOpen, setEditOverviewOpen] = useState(false);
  const [overviewForm, setOverviewForm] = useState({
    name: vendor.name || "",
    accommodationType: vendor.accommodationType || vendor.type || "HOTEL",
    starRating: vendor.starRating || 3,
    checkInTime: vendor.checkInTime || "12:00 PM",
    checkOutTime: vendor.checkOutTime || "11:00 AM",
    mealPlans: vendor.mealPlans || "EP, CP, MAP, AP",
    amenities:
      vendor.amenities ||
      "WiFi, Parking, Power Backup, Bonfire, Restaurant, Laundry",
    gstin: vendor.gstin || "",
    panNumber: vendor.panNumber || "",
    bankName: vendor.bankName || "",
    accountNumber: vendor.accountNumber || "",
    ifscCode: vendor.ifscCode || "",
    paymentTerms: vendor.paymentTerms || "30 Days Credit",
  });

  // State for dynamic sub-items
  const [contacts, setContacts] = useState<any[]>(
    vendor.vendorContacts || [
      {
        id: "c1",
        name: vendor.contactPerson || "Suresh Kumar",
        role: "General Manager",
        phone: vendor.contactNumber || vendor.phone || "+91 98166 66244",
        whatsapp: "+91 98166 66244",
        email: vendor.email || "manager@hotel.com",
        isPrimary: true,
      },
      {
        id: "c2",
        name: "Front Desk Reception",
        role: "Reception",
        phone: "+91 98166 66245",
        whatsapp: "+91 98166 66245",
        email: "reception@hotel.com",
        isPrimary: false,
      },
    ],
  );

  const [rooms, setRooms] = useState<any[]>(vendor.vendorRooms || []);
  const [seasons, setSeasons] = useState<any[]>(vendor.seasonalRates || []);
  const [contracts, setContracts] = useState<any[]>(vendor.contracts || []);
  const [gallery, setGallery] = useState<any[]>(vendor.photos || []);
  const [destinations, setDestinations] = useState<string[]>(
    vendor.destinationsList || [],
  );
  const [ledger, setLedger] = useState<any[]>(vendor.ledgerEntries || []);

  const [priceHistory, setPriceHistory] = useState<any[]>(
    vendor.priceHistory || [],
  );

  const [timeline, setTimeline] = useState<any[]>(
    vendor.timelineEntries || [],
  );

  // Modal Form States & Editing Handlers
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    role: "General Manager",
    phone: "",
    whatsapp: "",
    email: "",
    isPrimary: false,
  });

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [roomForm, setRoomForm] = useState({
    name: "",
    cap: "2",
    base: "",
    extra: "800",
  });

  const [seasonModalOpen, setSeasonModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<any>(null);
  const [seasonForm, setSeasonForm] = useState({
    name: "",
    twin: "",
    triple: "",
    quad: "",
  });

  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [contractForm, setContractForm] = useState({
    title: "",
    agreementType: "Annual Contract",
    startDate: "",
    expiryDate: "",
    commissionPercent: "10",
    cancellationPolicy: "",
  });

  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<any>(null);
  const [galleryForm, setGalleryForm] = useState({ title: "", url: "" });

  const [destModalOpen, setDestModalOpen] = useState(false);
  const [destName, setDestName] = useState("");

  const MASTER_DESTINATIONS = [
    "Manali",
    "Kasol",
    "Jibhi",
    "Shimla",
    "Spiti",
    "Dharamshala",
    "Leh",
    "Goa",
    "Rishikesh",
    "Bir Billing",
    "Auli",
    "McLeodganj",
    "Lahaul",
  ];

  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerForm, setLedgerForm] = useState({
    entryType: "INVOICE",
    amount: "",
    referenceNo: "",
    remarks: "",
  });

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyForm, setHistoryForm] = useState({
    serviceName: "",
    oldRate: "",
    newRate: "",
    changedBy: "Admin",
    reason: "",
  });

  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [timelineForm, setTimelineForm] = useState({
    eventType: "NOTE",
    description: "",
    performedBy: "Admin",
  });

  // Header Edit State
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    name: "",
    city: "",
    state: "",
    contactPerson: "",
    contactNumber: "",
    email: "",
  });

  const handleSaveHeaderInfo = async () => {
    try {
      const updated = { ...vendor, ...headerForm };
      setVendor(updated);
      await api
        .patch(`/vendors/directory/${vendor.id}`, headerForm)
        .catch(() => {});
      setHeaderModalOpen(false);
      toast.success("Vendor Name & Location updated!");
    } catch (err: any) {
      toast.error("Failed to update vendor header: " + err.message);
    }
  };

  // Save Overview Updates
  const handleSaveOverview = async () => {
    try {
      const updated = { ...vendor, ...overviewForm };
      setVendor(updated);
      await api
        .patch(`/vendors/directory/${vendor.id}`, overviewForm)
        .catch(() => {});
      onUpdateVendor(updated);
      toast.success("Property Overview updated successfully!");
    } catch (err) {
      toast.error("Failed to save overview");
    }
  };

  // Contact Handlers
  const handleSaveContact = () => {
    if (!contactForm.name || !contactForm.phone) {
      toast.error("Please enter Name and Phone number");
      return;
    }
    if (editingContact) {
      setContacts(
        contacts.map((c) =>
          c.id === editingContact.id ? { ...c, ...contactForm } : c,
        ),
      );
      toast.success("Contact updated!");
    } else {
      setContacts([{ id: `c-${Date.now()}`, ...contactForm }, ...contacts]);
      toast.success("Contact added!");
    }
    setContactModalOpen(false);
    setEditingContact(null);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
    toast.success("Contact removed");
  };

  // Room Handlers
  const handleSaveRoom = () => {
    if (!roomForm.name || !roomForm.base) {
      toast.error("Please enter Room Name and Base Tariff");
      return;
    }
    if (editingRoom) {
      setRooms(
        rooms.map((r) =>
          r.id === editingRoom.id
            ? {
                ...r,
                name: roomForm.name,
                cap: parseInt(roomForm.cap) || 2,
                base: parseFloat(roomForm.base) || 0,
                extra: parseFloat(roomForm.extra) || 0,
              }
            : r,
        ),
      );
      toast.success("Room category updated!");
    } else {
      const newRoom = {
        id: `r-${Date.now()}`,
        name: roomForm.name,
        cap: parseInt(roomForm.cap) || 2,
        base: parseFloat(roomForm.base) || 0,
        extra: parseFloat(roomForm.extra) || 0,
      };
      setRooms([...rooms, newRoom]);
      toast.success("Room category saved!");
    }
    setRoomModalOpen(false);
    setEditingRoom(null);
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(rooms.filter((r) => r.id !== id));
    toast.success("Room removed");
  };

  // Season Handlers
  const handleSaveSeason = () => {
    if (!seasonForm.name || !seasonForm.twin) {
      toast.error("Please enter Season Name and Twin Sharing Rate");
      return;
    }
    if (editingSeason) {
      setSeasons(
        seasons.map((s) =>
          s.id === editingSeason.id
            ? {
                ...s,
                name: seasonForm.name,
                twin: parseFloat(seasonForm.twin) || 0,
                triple: parseFloat(seasonForm.triple) || 0,
                quad: parseFloat(seasonForm.quad) || 0,
              }
            : s,
        ),
      );
      toast.success("Seasonal tariff updated!");
    } else {
      const newSeason = {
        id: `s-${Date.now()}`,
        name: seasonForm.name,
        twin: parseFloat(seasonForm.twin) || 0,
        triple: parseFloat(seasonForm.triple) || 0,
        quad: parseFloat(seasonForm.quad) || 0,
      };
      setSeasons([...seasons, newSeason]);
      toast.success("Seasonal tariff saved!");
    }
    setSeasonModalOpen(false);
    setEditingSeason(null);
  };

  const handleDeleteSeason = (id: string) => {
    setSeasons(seasons.filter((s) => s.id !== id));
    toast.success("Seasonal tariff removed");
  };

  // Contract Handlers
  const handleSaveContract = () => {
    if (!contractForm.title || !contractForm.expiryDate) {
      toast.error("Please enter Title and Expiry Date");
      return;
    }
    if (editingContract) {
      setContracts(
        contracts.map((c) =>
          c.id === editingContract.id
            ? {
                ...c,
                ...contractForm,
                commissionPercent:
                  parseFloat(contractForm.commissionPercent) || 0,
              }
            : c,
        ),
      );
      toast.success("Contract updated!");
    } else {
      const newContract = {
        id: `ctr-${Date.now()}`,
        ...contractForm,
        commissionPercent: parseFloat(contractForm.commissionPercent) || 0,
        status: "ACTIVE",
        fileUrl: "#",
      };
      setContracts([newContract, ...contracts]);
      toast.success("Contract saved!");
    }
    setContractModalOpen(false);
    setEditingContract(null);
  };

  const handleDeleteContract = (id: string) => {
    setContracts(contracts.filter((c) => c.id !== id));
    toast.success("Contract removed");
  };

  // Gallery Handlers
  const handleSaveGallery = () => {
    if (!galleryForm.url) {
      toast.error("Please enter image URL");
      return;
    }
    if (editingGallery) {
      setGallery(
        gallery.map((g) =>
          g.id === editingGallery.id
            ? { ...g, title: galleryForm.title, url: galleryForm.url }
            : g,
        ),
      );
      toast.success("Photo updated!");
    } else {
      setGallery([
        ...gallery,
        {
          id: `g-${Date.now()}`,
          title: galleryForm.title || "Property Photo",
          url: galleryForm.url,
        },
      ]);
      toast.success("Photo added to gallery!");
    }
    setGalleryModalOpen(false);
    setEditingGallery(null);
  };

  const handleDeleteGallery = (id: string) => {
    setGallery(gallery.filter((g) => g.id !== id));
    toast.success("Photo removed");
  };

  // Destination Handlers
  const handleAddDestination = () => {
    if (!destName.trim()) return;
    if (!destinations.includes(destName.trim())) {
      setDestinations([...destinations, destName.trim()]);
      toast.success("Destination linked!");
    }
    setDestName("");
    setDestModalOpen(false);
  };

  const handleDeleteDestination = (name: string) => {
    setDestinations(destinations.filter((d) => d !== name));
    toast.success("Destination link removed");
  };

  // Ledger Handlers
  const handleSaveLedger = () => {
    if (!ledgerForm.amount) {
      toast.error("Please enter amount");
      return;
    }
    const amt = parseFloat(ledgerForm.amount) || 0;
    const lastBalance = ledger.length > 0 ? ledger[0].balance : 0;
    const newBal =
      ledgerForm.entryType === "INVOICE"
        ? lastBalance + amt
        : lastBalance - amt;

    const newLedger = {
      id: `l-${Date.now()}`,
      ...ledgerForm,
      amount: amt,
      balance: Math.max(0, newBal),
      entryDate: new Date().toISOString().split("T")[0],
    };
    setLedger([newLedger, ...ledger]);
    setLedgerModalOpen(false);
    toast.success("Ledger entry recorded!");
  };

  // History Handlers
  const handleSaveHistory = () => {
    if (!historyForm.serviceName || !historyForm.newRate) {
      toast.error("Please enter Service Name and New Rate");
      return;
    }
    const newHist = {
      id: `ph-${Date.now()}`,
      serviceName: historyForm.serviceName,
      oldRate: parseFloat(historyForm.oldRate) || 0,
      newRate: parseFloat(historyForm.newRate) || 0,
      changedBy: historyForm.changedBy || "Admin",
      reason: historyForm.reason || "Manual Adjustment",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setPriceHistory([newHist, ...priceHistory]);
    setHistoryModalOpen(false);
    toast.success("Price change logged!");
  };

  // Timeline Handlers
  const handleSaveTimeline = () => {
    if (!timelineForm.description) {
      toast.error("Please enter activity description");
      return;
    }
    const newTime = {
      id: `t-${Date.now()}`,
      eventType: timelineForm.eventType,
      description: timelineForm.description,
      performedBy: timelineForm.performedBy || "Admin",
      createdAt: new Date().toLocaleString(),
    };
    setTimeline([newTime, ...timeline]);
    setTimelineModalOpen(false);
    toast.success("Timeline activity logged!");
  };

  if (!vendor) return null;

  const defaultTags = vendor.tags
    ? JSON.parse(vendor.tags)
    : ["Preferred", "Group Friendly", "Fast Response", "Pet Friendly"];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-2xs gap-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="h-8.5 px-3 text-slate-600 border-slate-200 hover:bg-slate-50 font-bold text-xs"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 uppercase">
                {vendor.vendorCode || vendor.id}
              </span>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                {vendor.name}
              </h2>
              <button
                onClick={() => {
                  setHeaderForm({
                    name: vendor.name || "",
                    city: vendor.city || vendor.location || "",
                    state: vendor.state || "Himachal Pradesh",
                    contactPerson: vendor.contactPerson || "",
                    contactNumber: vendor.contactNumber || vendor.phone || "",
                    email: vendor.email || "",
                  });
                  setHeaderModalOpen(true);
                }}
                title="Edit Vendor Name & Location"
                className="p-1 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-600" />
              </button>
              {vendor.isPreferred && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border border-amber-200">
                  Preferred Partner
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
              <span>
                {vendor.accommodationType || vendor.type || "Stay Partner"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />{" "}
                {vendor.city || vendor.location || "N/A"}
                {vendor.state ? `, ${vendor.state}` : ""}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setHeaderForm({
                name: vendor.name || "",
                city: vendor.city || vendor.location || "",
                state: vendor.state || "",
                contactPerson: vendor.contactPerson || "",
                contactNumber: vendor.contactNumber || vendor.phone || "",
                email: vendor.email || "",
              });
              setHeaderModalOpen(true);
            }}
            className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 rounded-lg flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Vendor Info
          </Button>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-right">
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
              Performance Score
            </span>
            <span className="text-sm font-black text-emerald-700">
              {vendor.performanceScore || 95}/100
            </span>
          </div>
        </div>
      </div>

      {/* HEADER EDIT MODAL */}
      <Dialog open={headerModalOpen} onOpenChange={setHeaderModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 border-b pb-2">
              Edit Vendor Name & Location
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-3 text-xs font-semibold text-slate-650">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase">
                Vendor Name *
              </label>
              <Input
                value={headerForm.name}
                onChange={(e) =>
                  setHeaderForm({ ...headerForm, name: e.target.value })
                }
                className="h-8.5 bg-white border-slate-200 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  City / Location *
                </label>
                <Input
                  value={headerForm.city}
                  onChange={(e) =>
                    setHeaderForm({ ...headerForm, city: e.target.value })
                  }
                  placeholder="e.g. Kasol / Manali"
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  State *
                </label>
                <Input
                  value={headerForm.state}
                  onChange={(e) =>
                    setHeaderForm({ ...headerForm, state: e.target.value })
                  }
                  placeholder="Himachal Pradesh"
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase">
                Contact Person
              </label>
              <Input
                value={headerForm.contactPerson}
                onChange={(e) =>
                  setHeaderForm({
                    ...headerForm,
                    contactPerson: e.target.value,
                  })
                }
                className="h-8.5 bg-white border-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Primary Phone
                </label>
                <Input
                  value={headerForm.contactNumber}
                  onChange={(e) =>
                    setHeaderForm({
                      ...headerForm,
                      contactNumber: e.target.value,
                    })
                  }
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Email Address
                </label>
                <Input
                  value={headerForm.email}
                  onChange={(e) =>
                    setHeaderForm({ ...headerForm, email: e.target.value })
                  }
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5 border-t pt-3 border-slate-100">
            <Button
              variant="outline"
              onClick={() => setHeaderModalOpen(false)}
              className="rounded h-8 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveHeaderInfo}
              className="bg-[#F97316] hover:bg-[#E05E00] text-white rounded h-8 text-xs font-bold px-4"
            >
              Save Header Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tags Banner */}
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-2 overflow-x-auto">
        <Tag className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs font-bold text-slate-500 shrink-0">Tags:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {defaultTags.map((tag: string, i: number) => (
            <span
              key={i}
              className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 10 Workspace Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex border-b border-slate-100 min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
                  activeTab === t.id
                    ? "border-[#F97316] text-[#F97316] bg-amber-50/20"
                    : "border-transparent text-slate-500 hover:text-slate-750 hover:bg-slate-50",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Workspace Panels */}
        <div className="p-6">
          {/* TAB 1: OVERVIEW — DIRECT INLINE EDITABLE & CONTROLLABLE */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Property & Compliance Profile
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Edit category, rating, check-in/out times, meal plans,
                    amenities, and GSTIN/banking details directly below.
                  </p>
                </div>
                <Button
                  onClick={handleSaveOverview}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold px-4 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Save Overview
                  Changes
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property & Operational Info Card */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 border-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-600" /> Property &
                    Operational Info
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">
                        Accommodation Category
                      </label>
                      <Select
                        value={overviewForm.accommodationType}
                        onValueChange={(v) =>
                          setOverviewForm({
                            ...overviewForm,
                            accommodationType: v,
                          })
                        }
                      >
                        <SelectTrigger className="h-8.5 bg-white text-xs border-slate-200 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-xs">
                          <SelectItem value="HOTEL">Hotel</SelectItem>
                          <SelectItem value="RESORT">Resort</SelectItem>
                          <SelectItem value="HOMESTAY">Homestay</SelectItem>
                          <SelectItem value="HOSTEL">Hostel</SelectItem>
                          <SelectItem value="CAMP">
                            Camp / Luxury Tent
                          </SelectItem>
                          <SelectItem value="GUEST_HOUSE">
                            Guest House
                          </SelectItem>
                          <SelectItem value="VILLA">Villa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">
                        Star Rating
                      </label>
                      <Select
                        value={overviewForm.starRating.toString()}
                        onValueChange={(v) =>
                          setOverviewForm({
                            ...overviewForm,
                            starRating: parseInt(v),
                          })
                        }
                      >
                        <SelectTrigger className="h-8.5 bg-white text-xs border-slate-200 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-xs">
                          <SelectItem value="1">1 Star ★</SelectItem>
                          <SelectItem value="2">2 Star ★★</SelectItem>
                          <SelectItem value="3">3 Star ★★★</SelectItem>
                          <SelectItem value="4">4 Star ★★★★</SelectItem>
                          <SelectItem value="5">5 Star ★★★★★</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">
                        Check-In Time
                      </label>
                      <Input
                        value={overviewForm.checkInTime}
                        onChange={(e) =>
                          setOverviewForm({
                            ...overviewForm,
                            checkInTime: e.target.value,
                          })
                        }
                        className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">
                        Check-Out Time
                      </label>
                      <Input
                        value={overviewForm.checkOutTime}
                        onChange={(e) =>
                          setOverviewForm({
                            ...overviewForm,
                            checkOutTime: e.target.value,
                          })
                        }
                        className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">
                      Meal Plans Supported
                    </label>
                    <Input
                      value={overviewForm.mealPlans}
                      onChange={(e) =>
                        setOverviewForm({
                          ...overviewForm,
                          mealPlans: e.target.value,
                        })
                      }
                      placeholder="EP, CP, MAP, AP"
                      className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">
                      Amenities
                    </label>
                    <Textarea
                      value={overviewForm.amenities}
                      onChange={(e) =>
                        setOverviewForm({
                          ...overviewForm,
                          amenities: e.target.value,
                        })
                      }
                      placeholder="WiFi, Parking, Power Backup, Bonfire..."
                      className="bg-white text-xs border-slate-200 font-medium min-h-[60px]"
                    />
                  </div>
                </div>

                {/* Financial & Compliance Info Card */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 border-slate-200 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" /> Financial &
                    Compliance
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">
                        GSTIN Number
                      </label>
                      <Input
                        value={overviewForm.gstin}
                        onChange={(e) =>
                          setOverviewForm({
                            ...overviewForm,
                            gstin: e.target.value,
                          })
                        }
                        placeholder="02AAACH1827C1Z5"
                        className="h-8.5 bg-white text-xs border-slate-200 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">
                        PAN Number
                      </label>
                      <Input
                        value={overviewForm.panNumber}
                        onChange={(e) =>
                          setOverviewForm({
                            ...overviewForm,
                            panNumber: e.target.value,
                          })
                        }
                        placeholder="AAACH1827C"
                        className="h-8.5 bg-white text-xs border-slate-200 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">
                        Bank Name
                      </label>
                      <Input
                        value={overviewForm.bankName}
                        onChange={(e) =>
                          setOverviewForm({
                            ...overviewForm,
                            bankName: e.target.value,
                          })
                        }
                        placeholder="HDFC Bank Ltd"
                        className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">
                        Account Number
                      </label>
                      <Input
                        value={overviewForm.accountNumber}
                        onChange={(e) =>
                          setOverviewForm({
                            ...overviewForm,
                            accountNumber: e.target.value,
                          })
                        }
                        placeholder="50200049281726"
                        className="h-8.5 bg-white text-xs border-slate-200 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">
                        IFSC Code
                      </label>
                      <Input
                        value={overviewForm.ifscCode}
                        onChange={(e) =>
                          setOverviewForm({
                            ...overviewForm,
                            ifscCode: e.target.value,
                          })
                        }
                        placeholder="HDFC0000240"
                        className="h-8.5 bg-white text-xs border-slate-200 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">
                        Payment Terms
                      </label>
                      <Input
                        value={overviewForm.paymentTerms}
                        onChange={(e) =>
                          setOverviewForm({
                            ...overviewForm,
                            paymentTerms: e.target.value,
                          })
                        }
                        placeholder="30 Days Credit"
                        className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT PERSONS */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Normalized Contact Persons
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Manage key personnel, managers, front desk, and emergency
                    contacts.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingContact(null);
                    setContactForm({
                      name: "",
                      role: "General Manager",
                      phone: "",
                      whatsapp: "",
                      email: "",
                      isPrimary: false,
                    });
                    setContactModalOpen(true);
                  }}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Contact Person
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 relative"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800 text-sm">
                          {c.name}
                        </span>
                        <span className="ml-2 text-[10px] font-bold uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {c.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {c.isPrimary && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-emerald-200">
                            Primary
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setEditingContact(c);
                            setContactForm({
                              name: c.name,
                              role: c.role,
                              phone: c.phone,
                              whatsapp: c.whatsapp,
                              email: c.email,
                              isPrimary: c.isPrimary,
                            });
                            setContactModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 bg-white rounded border"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 bg-white rounded border"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-slate-600 space-y-1 font-medium pt-1">
                      <p>
                        Phone:{" "}
                        <span className="font-bold text-slate-800">
                          {c.phone || "—"}
                        </span>
                      </p>
                      <p>
                        WhatsApp:{" "}
                        <span className="font-bold text-slate-800">
                          {c.whatsapp || c.phone || "—"}
                        </span>
                      </p>
                      <p>
                        Email:{" "}
                        <span className="font-bold text-slate-800">
                          {c.email || "—"}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ROOM INVENTORY */}
          {activeTab === "rooms" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Room Inventory & Occupancy Tariffs
                </h3>
                <Button
                  onClick={() => {
                    setEditingRoom(null);
                    setRoomForm({ name: "", cap: "2", base: "", extra: "800" });
                    setRoomModalOpen(true);
                  }}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Room Category
                </Button>
              </div>

              {rooms.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl space-y-2">
                  <Bed className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-700">
                    No Room Categories Added Yet
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click "Add Room Category" above to configure occupancy rates
                    and extra mattress tariffs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rooms.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 text-xs relative"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-slate-800 text-sm block">
                          {r.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingRoom(r);
                              setRoomForm({
                                name: r.name,
                                cap: r.cap.toString(),
                                base: r.base.toString(),
                                extra: r.extra.toString(),
                              });
                              setRoomModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 bg-slate-50 rounded"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 bg-slate-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-550">
                        Capacity:{" "}
                        <span className="font-bold text-slate-700">
                          {r.cap} Persons
                        </span>
                      </p>
                      <p className="text-slate-550">
                        Base Tariff / Night:{" "}
                        <span className="font-black text-emerald-600">
                          ₹{r.base}
                        </span>
                      </p>
                      <p className="text-slate-550">
                        Extra Mattress Rate:{" "}
                        <span className="font-bold text-slate-700">
                          ₹{r.extra}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SEASONAL PRICING */}
          {activeTab === "seasonal_pricing" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Seasonal Pricing Tariffs
                </h3>
                <Button
                  onClick={() => {
                    setEditingSeason(null);
                    setSeasonForm({ name: "", twin: "", triple: "", quad: "" });
                    setSeasonModalOpen(true);
                  }}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Seasonal Rate
                </Button>
              </div>

              {seasons.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-700">
                    No Seasonal Pricing Configured
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click "Add Seasonal Rate" above to create peak season
                    tariffs.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
                  {seasons.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div>
                        <span className="font-extrabold text-slate-800">
                          {s.name}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Priority: Season Rate 1 • Includes GST
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-xs font-bold">
                          <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200">
                            Twin: ₹{s.twin}
                          </span>
                          <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200">
                            Triple: ₹{s.triple}
                          </span>
                          <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200">
                            Quad: ₹{s.quad}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingSeason(s);
                            setSeasonForm({
                              name: s.name,
                              twin: s.twin.toString(),
                              triple: s.triple.toString(),
                              quad: s.quad.toString(),
                            });
                            setSeasonModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSeason(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-100 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CONTRACT MANAGEMENT */}
          {activeTab === "contracts" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Contract & SLA Agreements
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Track contract start/expiry dates, renewal reminders,
                    commission rates, and cancellation policies.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingContract(null);
                    setContractForm({
                      title: "",
                      agreementType: "Annual Contract",
                      startDate: "",
                      expiryDate: "",
                      commissionPercent: "10",
                      cancellationPolicy: "",
                    });
                    setContractModalOpen(true);
                  }}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Contract Agreement
                </Button>
              </div>

              {contracts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-700">
                    No Active Contracts
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click "Add Contract Agreement" above to record SLA
                    agreements.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts.map((ctr) => (
                    <div
                      key={ctr.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-slate-800 text-sm block">
                            {ctr.title}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {ctr.agreementType}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Supplier
                              Contract:{" "}
                              {ctr.vendorName ||
                                "Direct Hotel Property Manager"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded border border-emerald-200">
                            {ctr.status}
                          </span>
                          <button
                            onClick={() => {
                              setEditingContract(ctr);
                              setContractForm({
                                title: ctr.title,
                                agreementType:
                                  ctr.agreementType || "Annual Contract",
                                startDate: ctr.startDate || "",
                                expiryDate: ctr.expiryDate || "",
                                commissionPercent: (
                                  ctr.commissionPercent || 10
                                ).toString(),
                                cancellationPolicy:
                                  ctr.cancellationPolicy || "",
                              });
                              setContractModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 bg-slate-50 rounded"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteContract(ctr.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 bg-slate-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold">
                            START DATE
                          </span>{" "}
                          <span className="font-bold">{ctr.startDate}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold">
                            EXPIRY DATE
                          </span>{" "}
                          <span className="font-bold text-rose-600">
                            {ctr.expiryDate}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold">
                            RENEWAL REMINDER
                          </span>{" "}
                          <span className="font-bold text-amber-600">
                            {ctr.renewalReminderDate || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-450 block font-bold">
                            COMMISSION %
                          </span>{" "}
                          <span className="font-bold text-emerald-600">
                            {ctr.commissionPercent}%
                          </span>
                        </div>
                      </div>

                      {ctr.cancellationPolicy && (
                        <p className="text-slate-600 font-medium bg-amber-50/50 p-2.5 rounded border border-amber-200/60">
                          <span className="font-bold text-amber-900">
                            Cancellation Policy:
                          </span>{" "}
                          {ctr.cancellationPolicy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: GALLERY */}
          {activeTab === "gallery" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Property Photos & Media Gallery
                </h3>
                <Button
                  onClick={() => {
                    setEditingGallery(null);
                    setGalleryForm({ title: "", url: "" });
                    setGalleryModalOpen(true);
                  }}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Photo
                </Button>
              </div>

              {gallery.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl space-y-2">
                  <Image className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-700">
                    No Photos Added
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click "Add Photo" above to upload property images.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {gallery.map((g) => (
                    <div
                      key={g.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs group relative"
                    >
                      <img
                        src={g.url}
                        alt={g.title}
                        className="w-full h-36 object-cover"
                      />
                      <div className="p-3 flex justify-between items-center bg-white">
                        <span className="text-xs font-extrabold text-slate-800">
                          {g.title}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingGallery(g);
                              setGalleryForm({ title: g.title, url: g.url });
                              setGalleryModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGallery(g.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: TRIPS & DESTINATIONS MAPPING */}
          {activeTab === "trips" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Destination Mappings & Active Trips
                </h3>
                <Button
                  onClick={() => setDestModalOpen(true)}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Link Destination
                </Button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 text-[10px] uppercase block mb-2">
                    Linked Master Destinations
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {destinations.map((d, i) => (
                      <span
                        key={i}
                        className="bg-amber-100 text-amber-800 px-3 py-1 rounded-md font-extrabold text-xs flex items-center gap-1.5"
                      >
                        ✓ {d}
                        <button
                          onClick={() => handleDeleteDestination(d)}
                          className="hover:text-rose-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-700 text-[10px] uppercase block">
                    Trips Using This Vendor
                  </span>
                  {[
                    "Manali Kasol Backpacking",
                    "Himachal Escape Expedition",
                    "Winter Snow Special",
                  ].map((tripName, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white p-3 rounded border border-slate-200"
                    >
                      <span className="font-bold text-slate-800">
                        {tripName}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded">
                        Active Link
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PAYMENT LEDGER */}
          {activeTab === "ledger" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Vendor Payment Ledger
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Track Invoices, Debits, Credits, Advances, and Running
                    Balance.
                  </p>
                </div>
                <Button
                  onClick={() => setLedgerModalOpen(true)}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Log Ledger Entry
                </Button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Ref No</th>
                      <th className="p-3">Remarks</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {ledger.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-700">
                          {l.entryDate}
                        </td>
                        <td className="p-3">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                              l.entryType === "INVOICE"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800",
                            )}
                          >
                            {l.entryType}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">
                          {l.referenceNo || "—"}
                        </td>
                        <td className="p-3 text-slate-600">{l.remarks}</td>
                        <td className="p-3 text-right font-black text-slate-800">
                          ₹{l.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600">
                          ₹{l.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: PRICE AUDIT HISTORY */}
          {activeTab === "price_history" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Price Change Audit History
                </h3>
                <Button
                  onClick={() => setHistoryModalOpen(true)}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Log Price Change
                </Button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Service</th>
                      <th className="p-3 text-right">Old Rate</th>
                      <th className="p-3 text-right">New Rate</th>
                      <th className="p-3">Changed By</th>
                      <th className="p-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {priceHistory.map((ph) => (
                      <tr key={ph.id} className="hover:bg-slate-50/80">
                        <td className="p-3 text-slate-500">{ph.createdAt}</td>
                        <td className="p-3 font-bold text-slate-800">
                          {ph.serviceName}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-450 line-through">
                          ₹{ph.oldRate}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600">
                          ₹{ph.newRate}
                        </td>
                        <td className="p-3 font-bold text-slate-700">
                          {ph.changedBy}
                        </td>
                        <td className="p-3 text-slate-600">{ph.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: UNIFIED CHRONOLOGICAL TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Unified Partner Timeline
                </h3>
                <Button
                  onClick={() => setTimelineModalOpen(true)}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Log Entry
                </Button>
              </div>

              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
                {timeline.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#F97316] border-2 border-white ring-4 ring-orange-50" />
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-800 uppercase tracking-wider">
                          {item.eventType.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-450 font-medium">
                          {item.createdAt}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium">
                        {item.description}
                      </p>
                      <p className="text-[10px] text-slate-450">
                        Performed by:{" "}
                        <span className="font-bold text-slate-600">
                          {item.performedBy}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Overview Modal */}
      <Dialog open={editOverviewOpen} onOpenChange={setEditOverviewOpen}>
        <DialogContent className="max-w-xl bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              Edit Property Overview & Compliance
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Accommodation Category
              </label>
              <Select
                value={overviewForm.accommodationType}
                onValueChange={(v) =>
                  setOverviewForm({ ...overviewForm, accommodationType: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOTEL">Hotel</SelectItem>
                  <SelectItem value="RESORT">Resort</SelectItem>
                  <SelectItem value="HOMESTAY">Homestay</SelectItem>
                  <SelectItem value="HOSTEL">Hostel</SelectItem>
                  <SelectItem value="CAMP">Camp / Luxury Tent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Star Rating
              </label>
              <Select
                value={overviewForm.starRating.toString()}
                onValueChange={(v) =>
                  setOverviewForm({ ...overviewForm, starRating: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Star</SelectItem>
                  <SelectItem value="3">3 Star</SelectItem>
                  <SelectItem value="4">4 Star</SelectItem>
                  <SelectItem value="5">5 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Check-In Time
              </label>
              <Input
                value={overviewForm.checkInTime}
                onChange={(e) =>
                  setOverviewForm({
                    ...overviewForm,
                    checkInTime: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Check-Out Time
              </label>
              <Input
                value={overviewForm.checkOutTime}
                onChange={(e) =>
                  setOverviewForm({
                    ...overviewForm,
                    checkOutTime: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                GSTIN
              </label>
              <Input
                value={overviewForm.gstin}
                onChange={(e) =>
                  setOverviewForm({ ...overviewForm, gstin: e.target.value })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                PAN Number
              </label>
              <Input
                value={overviewForm.panNumber}
                onChange={(e) =>
                  setOverviewForm({
                    ...overviewForm,
                    panNumber: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Bank Name
              </label>
              <Input
                value={overviewForm.bankName}
                onChange={(e) =>
                  setOverviewForm({ ...overviewForm, bankName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Account Number
              </label>
              <Input
                value={overviewForm.accountNumber}
                onChange={(e) =>
                  setOverviewForm({
                    ...overviewForm,
                    accountNumber: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                IFSC Code
              </label>
              <Input
                value={overviewForm.ifscCode}
                onChange={(e) =>
                  setOverviewForm({ ...overviewForm, ifscCode: e.target.value })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Payment Terms
              </label>
              <Input
                value={overviewForm.paymentTerms}
                onChange={(e) =>
                  setOverviewForm({
                    ...overviewForm,
                    paymentTerms: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveOverview}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              {editingContact ? "Edit Contact Person" : "Add Contact Person"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Full Name
              </label>
              <Input
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
                placeholder="e.g. Ramesh Sharma"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Role / Designation
              </label>
              <Select
                value={contactForm.role}
                onValueChange={(v) =>
                  setContactForm({ ...contactForm, role: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Manager">
                    General Manager
                  </SelectItem>
                  <SelectItem value="Reception">Reception</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Accounts">Accounts</SelectItem>
                  <SelectItem value="Emergency">Emergency Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Phone Number
              </label>
              <Input
                value={contactForm.phone}
                onChange={(e) =>
                  setContactForm({ ...contactForm, phone: e.target.value })
                }
                placeholder="+91 98166 00000"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                WhatsApp Number
              </label>
              <Input
                value={contactForm.whatsapp}
                onChange={(e) =>
                  setContactForm({ ...contactForm, whatsapp: e.target.value })
                }
                placeholder="+91 98166 00000"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Email Address
              </label>
              <Input
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                placeholder="contact@hotel.com"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveContact}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              Save Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Category Modal */}
      <Dialog open={roomModalOpen} onOpenChange={setRoomModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              Add Room Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Room Category Name
              </label>
              <Input
                value={roomForm.name}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, name: e.target.value })
                }
                placeholder="e.g. Deluxe Lake View Twin"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Capacity (Persons)
              </label>
              <Input
                type="number"
                value={roomForm.cap}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, cap: e.target.value })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Base Tariff / Night (₹)
              </label>
              <Input
                type="number"
                value={roomForm.base}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, base: e.target.value })
                }
                placeholder="2500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Extra Mattress Rate (₹)
              </label>
              <Input
                type="number"
                value={roomForm.extra}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, extra: e.target.value })
                }
                placeholder="800"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveRoom}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              Save Room Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Season Tariff Modal */}
      <Dialog open={seasonModalOpen} onOpenChange={setSeasonModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              Add Seasonal Tariff
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Season Name & Period
              </label>
              <Input
                value={seasonForm.name}
                onChange={(e) =>
                  setSeasonForm({ ...seasonForm, name: e.target.value })
                }
                placeholder="e.g. Monsoon Special (Jul 16 - Sep 15)"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Twin Sharing Rate (₹)
              </label>
              <Input
                type="number"
                value={seasonForm.twin}
                onChange={(e) =>
                  setSeasonForm({ ...seasonForm, twin: e.target.value })
                }
                placeholder="2800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Triple Sharing Rate (₹)
              </label>
              <Input
                type="number"
                value={seasonForm.triple}
                onChange={(e) =>
                  setSeasonForm({ ...seasonForm, triple: e.target.value })
                }
                placeholder="3500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Quad Sharing Rate (₹)
              </label>
              <Input
                type="number"
                value={seasonForm.quad}
                onChange={(e) =>
                  setSeasonForm({ ...seasonForm, quad: e.target.value })
                }
                placeholder="4200"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveSeason}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              Save Seasonal Rate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Modal */}
      <Dialog open={contractModalOpen} onOpenChange={setContractModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              Add Contract Agreement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Agreement Title
              </label>
              <Input
                value={contractForm.title}
                onChange={(e) =>
                  setContractForm({ ...contractForm, title: e.target.value })
                }
                placeholder="e.g. Master Operations SLA 2026"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Expiry Date
              </label>
              <Input
                type="date"
                value={contractForm.expiryDate}
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    expiryDate: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Commission %
              </label>
              <Input
                type="number"
                value={contractForm.commissionPercent}
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    commissionPercent: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Cancellation Policy
              </label>
              <Textarea
                value={contractForm.cancellationPolicy}
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    cancellationPolicy: e.target.value,
                  })
                }
                placeholder="Terms and conditions..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveContract}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              Save Contract
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gallery Modal */}
      <Dialog open={galleryModalOpen} onOpenChange={setGalleryModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              Add Property Photo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Photo Title / Caption
              </label>
              <Input
                value={galleryForm.title}
                onChange={(e) =>
                  setGalleryForm({ ...galleryForm, title: e.target.value })
                }
                placeholder="e.g. Mountain View Balcony"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Image URL
              </label>
              <Input
                value={galleryForm.url}
                onChange={(e) =>
                  setGalleryForm({ ...galleryForm, url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveGallery}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              Add Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Destination Modal */}
      <Dialog open={destModalOpen} onOpenChange={setDestModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              Link Master Destination
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Quick Select Master Destinations
              </label>
              <div className="flex gap-1.5 flex-wrap bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-36 overflow-y-auto">
                {MASTER_DESTINATIONS.map((dName) => {
                  const isLinked = destinations.includes(dName);
                  return (
                    <button
                      key={dName}
                      onClick={() => {
                        if (isLinked) handleDeleteDestination(dName);
                        else {
                          setDestinations([...destinations, dName]);
                          toast.success(`Linked ${dName}`);
                        }
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-bold transition-all border cursor-pointer",
                        isLinked
                          ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300",
                      )}
                    >
                      {isLinked ? `✓ ${dName}` : `+ ${dName}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Or Enter Custom Destination Name
              </label>
              <Input
                value={destName}
                onChange={(e) => setDestName(e.target.value)}
                placeholder="e.g. Shimla / Spiti / Goa"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleAddDestination}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              Link Destination
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ledger Modal */}
      <Dialog open={ledgerModalOpen} onOpenChange={setLedgerModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              Log Ledger Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Entry Type
              </label>
              <Select
                value={ledgerForm.entryType}
                onValueChange={(v) =>
                  setLedgerForm({ ...ledgerForm, entryType: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INVOICE">INVOICE (Debit)</SelectItem>
                  <SelectItem value="ADVANCE">ADVANCE (Credit)</SelectItem>
                  <SelectItem value="PAYMENT">PAYMENT (Credit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Amount (₹)
              </label>
              <Input
                type="number"
                value={ledgerForm.amount}
                onChange={(e) =>
                  setLedgerForm({ ...ledgerForm, amount: e.target.value })
                }
                placeholder="15000"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Reference No / Txn ID
              </label>
              <Input
                value={ledgerForm.referenceNo}
                onChange={(e) =>
                  setLedgerForm({ ...ledgerForm, referenceNo: e.target.value })
                }
                placeholder="INV-9901 / TXN-10928"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Remarks
              </label>
              <Input
                value={ledgerForm.remarks}
                onChange={(e) =>
                  setLedgerForm({ ...ledgerForm, remarks: e.target.value })
                }
                placeholder="Allocations for departure..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveLedger}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              Log Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              Log Price Change
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Service Name
              </label>
              <Input
                value={historyForm.serviceName}
                onChange={(e) =>
                  setHistoryForm({
                    ...historyForm,
                    serviceName: e.target.value,
                  })
                }
                placeholder="e.g. Deluxe Room Peak Rate"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Old Rate (₹)
              </label>
              <Input
                type="number"
                value={historyForm.oldRate}
                onChange={(e) =>
                  setHistoryForm({ ...historyForm, oldRate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                New Rate (₹)
              </label>
              <Input
                type="number"
                value={historyForm.newRate}
                onChange={(e) =>
                  setHistoryForm({ ...historyForm, newRate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Reason
              </label>
              <Input
                value={historyForm.reason}
                onChange={(e) =>
                  setHistoryForm({ ...historyForm, reason: e.target.value })
                }
                placeholder="Reason for price revision..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveHistory}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              Save Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timeline Modal */}
      <Dialog open={timelineModalOpen} onOpenChange={setTimelineModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              Add Timeline Activity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Activity Type
              </label>
              <Select
                value={timelineForm.eventType}
                onValueChange={(v) =>
                  setTimelineForm({ ...timelineForm, eventType: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTE">Note / Observation</SelectItem>
                  <SelectItem value="CALL_LOG">Call / WhatsApp Log</SelectItem>
                  <SelectItem value="RATE_REVISION">Rate Revision</SelectItem>
                  <SelectItem value="INSPECTION">
                    Property Inspection
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Description
              </label>
              <Textarea
                value={timelineForm.description}
                onChange={(e) =>
                  setTimelineForm({
                    ...timelineForm,
                    description: e.target.value,
                  })
                }
                placeholder="Enter activity log details..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveTimeline}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              Save Activity Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
