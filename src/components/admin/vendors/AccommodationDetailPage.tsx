import React, { useState, useMemo, useEffect } from "react";
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
  Bus,
  Car,
  Truck,
  Compass,
  Utensils,
  Activity,
  Navigation,
  Check,
  Info,
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
import { tripsService } from "@/services/trips.service";
import { getDisplayVendorCode } from "@/utils/vendorUtils";
import { RoutePricingTab } from "./RoutePricingTab";

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
  const typeUpper = (vendor.type || vendor.accommodationType || vendor.category || "").toUpperCase();
  const isTransport = typeUpper.includes("TRANSPORT") || typeUpper.includes("FLEET") || typeUpper.includes("VEHICLE");
  const isGuide = typeUpper.includes("GUIDE") || typeUpper.includes("LEADER") || typeUpper.includes("TREK");
  const isActivity = typeUpper.includes("ACTIVITIES") || typeUpper.includes("ACTIVITY") || typeUpper.includes("ADVENTURE");
  const isRestaurant = typeUpper.includes("RESTAURANT") || typeUpper.includes("FOOD") || typeUpper.includes("MEAL") || typeUpper.includes("DINING");

  const dynamicTabs = useMemo(() => {
    if (isTransport) {
      return [
        { id: "overview", label: "Overview", icon: Bus },
        { id: "contacts", label: "Contacts", icon: Phone },
        { id: "vehicles", label: "Vehicles & Route Pricing", icon: Car },
        { id: "trips", label: "Trips & Routes", icon: Users },
        { id: "ledger", label: "Payment Ledger", icon: CreditCard },
        { id: "timeline", label: "Activity Timeline", icon: History },
      ];
    }
    if (isGuide) {
      return [
        { id: "overview", label: "Overview", icon: Compass },
        { id: "contacts", label: "Contacts", icon: Phone },
        { id: "rates_allowance", label: "Rates & Allowance", icon: DollarSign },
        { id: "trips", label: "Assigned Trips", icon: Users },
        { id: "ledger", label: "Payment Ledger", icon: CreditCard },
        { id: "timeline", label: "Activity Timeline", icon: History },
      ];
    }
    if (isActivity) {
      return [
        { id: "overview", label: "Overview", icon: Activity },
        { id: "contacts", label: "Contacts", icon: Phone },
        { id: "rates_allowance", label: "Rates & Allowance", icon: DollarSign },
        { id: "trips", label: "Assigned Trips", icon: Users },
        { id: "ledger", label: "Payment Ledger", icon: CreditCard },
        { id: "timeline", label: "Activity Timeline", icon: History },
      ];
    }
    if (isRestaurant) {
      return [
        { id: "overview", label: "Overview", icon: Utensils },
        { id: "contacts", label: "Contacts", icon: Phone },
        { id: "meal_tariffs", label: "Meal Tariffs & Thali Rates", icon: DollarSign },
        { id: "trips", label: "Assigned Trips", icon: Users },
        { id: "ledger", label: "Payment Ledger", icon: CreditCard },
        { id: "timeline", label: "Activity Timeline", icon: History },
      ];
    }
    return [
      { id: "overview", label: "Overview", icon: Building2 },
      { id: "contacts", label: "Contacts", icon: Phone },
      { id: "rooms", label: "Rooms", icon: Bed },
      { id: "seasonal_pricing", label: "Seasonal Pricing", icon: Calendar },
      { id: "gallery", label: "Gallery", icon: Image },
      { id: "trips", label: "Trips & Destinations", icon: Users },
      { id: "ledger", label: "Payment Ledger", icon: CreditCard },
      { id: "price_history", label: "Price History", icon: TrendingUp },
      { id: "timeline", label: "Activity Timeline", icon: History },
    ];
  }, [isTransport, isGuide, isActivity, isRestaurant]);

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
      (isTransport
        ? "GPS Tracking, Speed Governor, Pushback Seats, First Aid Kit, AC / Heater, Luggage Carrier"
        : "WiFi, Parking, Power Backup, Bonfire, Restaurant, Laundry"),
    fleetTypes: vendor.roomTypes || "20 Seater Tempo, 17 Seater Tempo, 14 Seater Tempo, Innova, Ertiga, Dzire",
    operatingCity: vendor.city || vendor.location || "Punjab & Himachal",
    tollParkingPolicy: "Included in base tariff",
    driverAllowance: "₹500 / Night (or Included)",
    routesCovered: vendor.notes || "Punjab, Himachal Pradesh, Ladakh, Kashmir, Uttarakhand",
    gstin: vendor.gstin || "",
    panNumber: vendor.panNumber || "",
    bankName: vendor.bankName || "",
    accountNumber: vendor.accountNumber || "",
    ifscCode: vendor.ifscCode || "",
    paymentTerms: vendor.paymentTerms || "30 Days Credit",
    financialDetails:
      vendor.financialDetails ||
      vendor.bankDetails ||
      (vendor.gstin || vendor.bankName
        ? `GSTIN: ${vendor.gstin || ""}\nPAN: ${vendor.panNumber || ""}\nBank: ${vendor.bankName || ""}\nA/C: ${vendor.accountNumber || ""}\nIFSC: ${vendor.ifscCode || ""}\nPayment Terms: ${vendor.paymentTerms || ""}`.trim()
        : ""),
  });

  // State for Transport Vehicles & Routes
  const [transportVehicles, setTransportVehicles] = useState<any[]>([]);

  const loadVendorVehicles = async () => {
    if (!vendor?.id) return;
    try {
      const res = await api.get(`/vendors/directory/${vendor.id}/vehicles`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        if (res.data.data.length > 0) {
          setTransportVehicles(
            res.data.data.map((v: any) => ({
              id: v.id,
              model: v.vehicleName,
              capacity: v.advertisedCapacity,
              sellableSeats: v.sellableSeats,
              acType: v.hasAC ? "AC" : "Non-AC",
              plateNumber: v.plateNumber || "PB-08",
              status: v.isActive ? "Active" : "Inactive",
            }))
          );
        } else {
          // Seed default master vehicles for quick start
          const defaultModels = [
            { name: "20 Seater Tempo Traveller", cap: 20, sell: 19 },
            { name: "17 Seater Tempo Traveller", cap: 17, sell: 16 },
            { name: "14 Seater Tempo Traveller", cap: 14, sell: 13 },
            { name: "Toyota Innova Crysta", cap: 7, sell: 6 },
            { name: "Maruti Suzuki Ertiga", cap: 6, sell: 6 },
            { name: "Swift Dzire Sedan", cap: 4, sell: 4 },
          ];
          for (const m of defaultModels) {
            await api.post(`/vendors/directory/${vendor.id}/vehicles`, {
              vehicleName: m.name,
              advertisedCapacity: m.cap,
              sellableSeats: m.sell,
              hasAC: true,
            }).catch(() => null);
          }
          const reloadRes = await api.get(`/vendors/directory/${vendor.id}/vehicles`);
          if (reloadRes.data?.success) {
            setTransportVehicles(
              reloadRes.data.data.map((v: any) => ({
                id: v.id,
                model: v.vehicleName,
                capacity: v.advertisedCapacity,
                sellableSeats: v.sellableSeats,
                acType: v.hasAC ? "AC" : "Non-AC",
                plateNumber: v.plateNumber || "PB-08",
                status: v.isActive ? "Active" : "Inactive",
              }))
            );
          }
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadVendorVehicles();
  }, [vendor?.id]);

  const [transportRoutes, setTransportRoutes] = useState<any[]>(() => {
    if (vendor.transportRates && vendor.transportRates.length > 0) {
      return vendor.transportRates.map((tr: any, idx: number) => ({
        id: tr.id || `r-${idx}`,
        routeName:
          tr.routeName ||
          `${tr.pickupLocation || "Kotkapura"} → ${tr.dropLocation || "Kotkapura"}`,
        vehicleType: tr.vehicleType || "17 Seater",
        totalAmount: Number(tr.totalVehicleCost || 44000),
        notes: tr.notes || "",
      }));
    }
    return [
      { id: "r1", routeName: "Kotkapura → Kotkapura", vehicleType: "20 Seater Tempo", totalAmount: 48000, notes: "Kotkapura pickup & drop extra: ₹2,000" },
      { id: "r2", routeName: "Kotkapura → Kotkapura", vehicleType: "17 Seater Tempo", totalAmount: 44000, notes: "Kotkapura pickup & drop extra: ₹2,000" },
      { id: "r3", routeName: "Kotkapura → Kotkapura", vehicleType: "14 Seater Tempo", totalAmount: 38000, notes: "Kotkapura pickup & drop extra: ₹2,000" },
      { id: "r4", routeName: "Kotkapura → Kotkapura", vehicleType: "Innova", totalAmount: 28000, notes: "" },
      { id: "r5", routeName: "Kotkapura → Kotkapura", vehicleType: "Ertiga", totalAmount: 28000, notes: "" },
      { id: "r6", routeName: "Kotkapura → Kotkapura", vehicleType: "Swift Dzire", totalAmount: 17500, notes: "" },
      { id: "r7", routeName: "Jalandhar → Jalandhar", vehicleType: "20 Seater Tempo", totalAmount: 45000, notes: "" },
      { id: "r8", routeName: "Jalandhar → Jalandhar", vehicleType: "17 Seater Tempo", totalAmount: 42000, notes: "" },
      { id: "r9", routeName: "Jalandhar → Jalandhar", vehicleType: "14 Seater Tempo", totalAmount: 38000, notes: "" },
      { id: "r10", routeName: "Jalandhar → Jalandhar", vehicleType: "Innova", totalAmount: 28000, notes: "" },
      { id: "r11", routeName: "Jalandhar → Jalandhar", vehicleType: "Ertiga", totalAmount: 28000, notes: "" },
    ];
  });

  // State for Transport Vehicles & Routes
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [vehicleForm, setVehicleForm] = useState({
    model: "Tempo Traveller (17 Seater)",
    capacity: "17",
    sellableSeats: "16",
    acType: "AC",
    plateNumber: "PB-08-TR-1702",
    status: "Active",
  });

  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [routeForm, setRouteForm] = useState({
    routeName: "Kotkapura → Kotkapura",
    vehicleType: "17 Seater Tempo",
    totalAmount: "44000",
    notes: "",
  });

  // State for Tour Guide Daily Rates & Allowances
  const [guideRates, setGuideRates] = useState<any[]>([
    {
      id: "gr1",
      roleName: "Lead Trek Leader",
      badgeText: "Primary Role",
      perDayFee: 2500,
      foodAllowance: 500,
      miscAllowance: 300,
    },
    {
      id: "gr2",
      roleName: "Local Cultural Guide",
      badgeText: "City / Sightseeing",
      perDayFee: 1500,
      foodAllowance: 300,
      miscAllowance: 200,
    },
  ]);
  const [guideRateModalOpen, setGuideRateModalOpen] = useState(false);
  const [editingGuideRate, setEditingGuideRate] = useState<any>(null);
  const [guideRateForm, setGuideRateForm] = useState({
    roleName: "Lead Trek Leader",
    badgeText: "Primary Role",
    perDayFee: "2500",
    foodAllowance: "500",
    miscAllowance: "300",
  });

  const handleSaveGuideRate = () => {
    if (!guideRateForm.roleName || !guideRateForm.perDayFee) {
      toast.error("Role Name and Per Day Fee are required");
      return;
    }
    const perDay = parseInt(guideRateForm.perDayFee) || 0;
    const food = parseInt(guideRateForm.foodAllowance) || 0;
    const misc = parseInt(guideRateForm.miscAllowance) || 0;

    if (editingGuideRate) {
      setGuideRates(
        guideRates.map((gr) =>
          gr.id === editingGuideRate.id
            ? {
                ...gr,
                roleName: guideRateForm.roleName,
                badgeText: guideRateForm.badgeText,
                perDayFee: perDay,
                foodAllowance: food,
                miscAllowance: misc,
              }
            : gr,
        ),
      );
      toast.success("Guide rate configuration updated");
    } else {
      const newGr = {
        id: `gr-${Date.now()}`,
        roleName: guideRateForm.roleName,
        badgeText: guideRateForm.badgeText || "Role",
        perDayFee: perDay,
        foodAllowance: food,
        miscAllowance: misc,
      };
      setGuideRates([...guideRates, newGr]);
      toast.success("New guide rate configuration added");
    }
    setGuideRateModalOpen(false);
  };

  const handleDeleteGuideRate = (id: string) => {
    setGuideRates(guideRates.filter((gr) => gr.id !== id));
    toast.success("Guide rate removed");
  };

  const handleSaveVehicle = async () => {
    if (!vehicleForm.model) {
      toast.error("Vehicle model is required");
      return;
    }
    const cap = parseInt(vehicleForm.capacity) || 17;
    const sellable = parseInt(vehicleForm.sellableSeats) || cap;

    try {
      if (editingVehicle && !editingVehicle.id.startsWith("v-")) {
        await api.patch(`/vendors/directory/vehicles/${editingVehicle.id}`, {
          vehicleName: vehicleForm.model,
          advertisedCapacity: cap,
          sellableSeats: sellable,
          hasAC: vehicleForm.acType === "AC",
          plateNumber: vehicleForm.plateNumber,
        });
        toast.success("Vehicle updated in master!");
      } else {
        await api.post(`/vendors/directory/${vendor.id}/vehicles`, {
          vehicleName: vehicleForm.model,
          advertisedCapacity: cap,
          sellableSeats: sellable,
          hasAC: vehicleForm.acType === "AC",
          plateNumber: vehicleForm.plateNumber,
        });
        toast.success("Vehicle added to master fleet!");
      }
      setVehicleModalOpen(false);
      loadVendorVehicles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save vehicle");
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      if (!id.startsWith("v-")) {
        await api.delete(`/vendors/directory/vehicles/${id}`);
      }
      toast.success("Vehicle removed from master fleet");
      loadVendorVehicles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove vehicle");
    }
  };

  const handleSaveRoute = async () => {
    if (!routeForm.routeName) {
      toast.error("Route name is required");
      return;
    }
    const tot = parseFloat(routeForm.totalAmount) || 0;

    try {
      await api
        .post("/vendors/transport-rates", {
          vendorId: vendor.id,
          tripCode: vendor.tripCode || "MKA-1",
          routeName: routeForm.routeName,
          pickupLocation:
            routeForm.routeName.split("→")[0]?.trim() || "Kotkapura",
          dropLocation:
            routeForm.routeName.split("→")[1]?.trim() || "Kotkapura",
          vehicleType: routeForm.vehicleType || "17 Seater Tempo",
          totalVehicleCost: tot,
          notes: routeForm.notes || "",
        })
        .catch(() => {});
    } catch (e) {}

    if (editingRoute) {
      setTransportRoutes(
        transportRoutes.map((r) =>
          r.id === editingRoute.id
            ? {
                ...r,
                routeName: routeForm.routeName,
                vehicleType: routeForm.vehicleType,
                totalAmount: tot,
                notes: routeForm.notes,
              }
            : r,
        ),
      );
      logActivity(
        "RATE_REVISION",
        `Updated route tariff: ${routeForm.routeName} (${routeForm.vehicleType}) to ₹${tot.toLocaleString("en-IN")}`,
      );
      toast.success("Route tariff updated successfully!");
    } else {
      const newR = {
        id: `r-${Date.now()}`,
        routeName: routeForm.routeName,
        vehicleType: routeForm.vehicleType,
        totalAmount: tot,
        notes: routeForm.notes,
      };
      setTransportRoutes([...transportRoutes, newR]);
      logActivity(
        "RATE_REVISION",
        `Added new route tariff: ${routeForm.routeName} (${routeForm.vehicleType}) for ₹${tot.toLocaleString("en-IN")}`,
      );
      toast.success("Route tariff added!");
    }
    setRouteModalOpen(false);
  };

  const handleDeleteRoute = (id: string) => {
    const rt = transportRoutes.find((r) => r.id === id);
    setTransportRoutes(transportRoutes.filter((r) => r.id !== id));
    logActivity(
      "RATE_REMOVED",
      `Removed route tariff: ${rt?.routeName || "Route"} (${rt?.vehicleType || "Vehicle"})`,
    );
    toast.success("Route tariff removed");
  };

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

  const [rooms, setRooms] = useState<any[]>(() => {
    if (vendor.vendorRooms && vendor.vendorRooms.length > 0) {
      return vendor.vendorRooms;
    }
    return [];
  });

  const [seasons, setSeasons] = useState<any[]>(() => {
    if (vendor.seasonalRates && vendor.seasonalRates.length > 0) {
      return vendor.seasonalRates;
    }
    return [];
  });
  const [contracts, setContracts] = useState<any[]>(vendor.contracts || []);
  const [gallery, setGallery] = useState<any[]>(vendor.photos || []);
  const [destinations, setDestinations] = useState<string[]>(
    vendor.destinationsList || [],
  );
  const [ledger, setLedger] = useState<any[]>(vendor.ledgerEntries || []);

  const [priceHistory, setPriceHistory] = useState<any[]>(
    vendor.priceHistory || [],
  );

  // Real Fed Trips State & Dynamic Vendor Mapping
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [linkedTripIds, setLinkedTripIds] = useState<string[]>(() => vendor.linkedTripIds || []);
  const [linkTripModalOpen, setLinkTripModalOpen] = useState<boolean>(false);
  const [selectedTripToLink, setSelectedTripToLink] = useState<string>("");

  React.useEffect(() => {
    tripsService
      .getAll()
      .then((data) => {
        if (Array.isArray(data)) {
          setAllTrips(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch real trips for vendor mapping:", err);
      });
  }, []);

  const mappedTrips = useMemo(() => {
    if (!allTrips || allTrips.length === 0) return [];

    return allTrips.filter((t) => {
      // 1. Explicitly linked trip ID
      if (linkedTripIds.includes(t.id)) return true;

      // 2. Explicit trip code matching
      if (vendor.tripCode && (t.id === vendor.tripCode || t.slug === vendor.tripCode || t.code === vendor.tripCode)) return true;

      const tripFullText = `${t.title || ""} ${t.location || ""} ${t.slug || ""} ${t.code || ""}`.toLowerCase();

      // 3. Linked Master Destinations matching (e.g. Manali, Shimla, Spiti)
      if (destinations.some((d) => d.trim() && tripFullText.includes(d.trim().toLowerCase()))) return true;

      // 4. Tokenized vendor location matching (e.g., "Manali, Himachal" -> ["manali", "himachal"])
      const vendorLocRaw = (vendor.location || vendor.city || "").toLowerCase();
      if (vendorLocRaw) {
        const tokens = vendorLocRaw
          .split(/[\s,]+/)
          .map((tok) => tok.trim())
          .filter((tok) => tok.length > 2 && tok !== "and" && tok !== "the");

        if (tokens.some((tok) => tripFullText.includes(tok))) return true;
      }

      return false;
    });
  }, [allTrips, linkedTripIds, destinations, vendor.location, vendor.city, vendor.tripCode]);

  // Helper for Automatic Activity Logging
  const logActivity = (
    eventType: string,
    description: string,
    performedBy = "Hemal Patel (Superadmin)",
  ) => {
    const newEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventType,
      description,
      performedBy,
      createdAt: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
    setTimeline((prev) => [newEntry, ...prev]);
  };

  const [timeline, setTimeline] = useState<any[]>(() => {
    if (vendor.timelineEntries && vendor.timelineEntries.length > 0) {
      return vendor.timelineEntries;
    }
    return [
      {
        id: "act-init-1",
        eventType: "RATE_APPROVED",
        description: isTransport
          ? "Master transport route rate card approved for MKA and Punjab/Himachal sectors."
          : "Seasonal accommodation tariffs and meal plans verified for active operations.",
        performedBy: "Hemal Patel (Superadmin)",
        createdAt: "Today, 11:30 AM",
      },
      {
        id: "act-init-2",
        eventType: isTransport ? "FLEET_VERIFIED" : "PROPERTY_INSPECTED",
        description: isTransport
          ? "Commercial permits, vehicle capacities, and driver details verified."
          : "Property room inventory, cleanliness, and power backup inspection completed.",
        performedBy: "Operations Team",
        createdAt: "Yesterday, 04:15 PM",
      },
      {
        id: "act-init-3",
        eventType: "VENDOR_ONBOARDED",
        description: `Vendor profile created and assigned to master operations database.`,
        performedBy: "Hemal Patel (Superadmin)",
        createdAt: "01 Aug 2026, 10:00 AM",
      },
    ];
  });

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
    doubleRate: "1200",
    tripleRate: "900",
    quadRate: "750",
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
      logActivity(
        "PROFILE_UPDATED",
        `Updated vendor info: ${headerForm.name} (${headerForm.city || vendor.city})`,
      );
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
      logActivity(
        "PROFILE_UPDATED",
        "Updated vendor operational specs & financial compliance",
      );
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
      logActivity(
        "CONTACT_UPDATED",
        `Updated contact details for ${contactForm.name} (${contactForm.role || "Contact"})`,
      );
      toast.success("Contact updated!");
    } else {
      setContacts([{ id: `c-${Date.now()}`, ...contactForm }, ...contacts]);
      logActivity(
        "CONTACT_ADDED",
        `Added contact person: ${contactForm.name} (${contactForm.role || "General Manager"}) - Phone: ${contactForm.phone}`,
      );
      toast.success("Contact added!");
    }
    setContactModalOpen(false);
    setEditingContact(null);
  };

  const handleDeleteContact = (id: string) => {
    const ct = contacts.find((c) => c.id === id);
    setContacts(contacts.filter((c) => c.id !== id));
    logActivity(
      "CONTACT_DELETED",
      `Removed contact person: ${ct?.name || "Contact"}`,
    );
    toast.success("Contact removed");
  };

  // Room Handlers
  const handleSaveRoom = () => {
    if (!roomForm.name.trim()) {
      toast.error("Please enter Room Category Name");
      return;
    }
    const dRate = parseFloat(roomForm.doubleRate) || 0;
    const tRate = parseFloat(roomForm.tripleRate) || 0;
    const qRate = parseFloat(roomForm.quadRate) || 0;

    // Auto-sync room capacity to the highest sharing tariff entered
    const derivedCap = qRate > 0 ? 4 : tRate > 0 ? 3 : 2;

    const roomData = {
      name: roomForm.name.trim(),
      cap: derivedCap,
      doubleRate: dRate,
      tripleRate: tRate,
      quadRate: qRate,
      base: dRate || tRate || qRate || 0,
    };

    if (editingRoom) {
      setRooms(
        rooms.map((r) =>
          r.id === editingRoom.id ? { ...r, ...roomData } : r,
        ),
      );
      toast.success("Room category updated!");
    } else {
      const newRoom = {
        id: `r-${Date.now()}`,
        ...roomData,
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
                {getDisplayVendorCode(vendor)}
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
          {dynamicTabs.map((t) => {
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
                    {isTransport
                      ? "Fleet & Transport Compliance Profile"
                      : isGuide
                        ? "Guide Profile & Certifications"
                        : isRestaurant
                          ? "Restaurant & Meal Plans Profile"
                          : "Property & Compliance Profile"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isTransport
                      ? "Edit vehicle categories, operating routes, driver allowance, safety features, and banking details directly below."
                      : isGuide
                        ? "Edit guide language skills, daily rates, certifications, and compliance details directly below."
                        : "Edit category, rating, check-in/out times, meal plans, amenities, and GSTIN/banking details directly below."}
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
                {/* Category-Specific Operational Info Card */}
                {isTransport ? (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 border-slate-200 flex items-center gap-1.5">
                      <Bus className="w-4 h-4 text-[#F97316]" /> Fleet & Transport Operational Info
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Primary Fleet Categories
                        </label>
                        <Input
                          value={overviewForm.fleetTypes}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              fleetTypes: e.target.value,
                            })
                          }
                          placeholder="20 Seater, 17 Seater, Innova, Ertiga"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Operating Base / Hub
                        </label>
                        <Input
                          value={overviewForm.operatingCity}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              operatingCity: e.target.value,
                            })
                          }
                          placeholder="Jalandhar / Kotkapura / Amritsar"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Toll & Parking Policy
                        </label>
                        <Input
                          value={overviewForm.tollParkingPolicy}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              tollParkingPolicy: e.target.value,
                            })
                          }
                          placeholder="Included in base tariff"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Driver Night Allowance
                        </label>
                        <Input
                          value={overviewForm.driverAllowance}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              driverAllowance: e.target.value,
                            })
                          }
                          placeholder="₹500 / Night or Included"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Service Coverage Routes / Sectors
                        </label>
                        <Input
                          value={overviewForm.routesCovered}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              routesCovered: e.target.value,
                            })
                          }
                          placeholder="Kotkapura ↔ Manali, Jalandhar ↔ Kasol, Amritsar ↔ Kullu"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Fleet Safety & Vehicle Features
                        </label>
                        <Textarea
                          value={overviewForm.amenities}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              amenities: e.target.value,
                            })
                          }
                          placeholder="GPS Tracking, Speed Governor, Pushback Seats, First Aid Kit, AC / Heater, Luggage Carrier"
                          className="bg-white text-xs border-slate-200 font-medium min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>
                ) : isGuide ? (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 border-slate-200 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-blue-600" /> Tour Guide Profile & Certifications
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Guide Role / Specialization
                        </label>
                        <Input
                          value={overviewForm.guideRole || "Lead Trek Leader & High Altitude Specialist"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              guideRole: e.target.value,
                            })
                          }
                          placeholder="e.g. Lead Trek Leader, Cultural Local Guide"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Operating Base / Hub
                        </label>
                        <Input
                          value={overviewForm.operatingCity || vendor.city || vendor.location || "Kasol / Manali / Shimla"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              operatingCity: e.target.value,
                            })
                          }
                          placeholder="e.g. Shimla / Manali / Kasol"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Languages Spoken
                        </label>
                        <Input
                          value={overviewForm.languages || "English, Hindi, Pahari"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              languages: e.target.value,
                            })
                          }
                          placeholder="e.g. English, Hindi, Pahari, Lahauli"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Mountaineering Certifications
                        </label>
                        <Input
                          value={overviewForm.certifications || "BMC (Basic Mountaineering Course), WFR"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              certifications: e.target.value,
                            })
                          }
                          placeholder="e.g. BMC, AMC, Wilderness First Responder (WFR)"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Trekking & Expedition Experience
                        </label>
                        <Input
                          value={overviewForm.experience || "7+ Years (40+ Kheerganga & Sar Pass Expeditions)"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              experience: e.target.value,
                            })
                          }
                          placeholder="e.g. 7+ Years Experience across Parvati Valley & Spiti"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Safety Equipment & Rescue Gear Carried
                        </label>
                        <Textarea
                          value={overviewForm.amenities || "First Aid Kit, Oxygen Cylinder, Stretchers, Walkie-Talkie Radio, Rope & Harness"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              amenities: e.target.value,
                            })
                          }
                          placeholder="e.g. First Aid Kit, O2 Cylinder, Satellite Radio, Rope & Harness"
                          className="bg-white text-xs border-slate-200 font-medium min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>
                ) : isRestaurant ? (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 border-slate-200 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-orange-600" /> Restaurant & Dining Profile
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Cuisine & Meal Offerings
                        </label>
                        <Input
                          value={overviewForm.cuisines || "North Indian, Himachali Dham, Continental, Chinese"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              cuisines: e.target.value,
                            })
                          }
                          placeholder="e.g. Indian, Chinese, Himachali Local"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Seating Capacity (Group Handling)
                        </label>
                        <Input
                          value={overviewForm.seatingCapacity || "80 Pax Group Seating"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              seatingCapacity: e.target.value,
                            })
                          }
                          placeholder="e.g. 80 Pax Group Indoor + Outdoor"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Operating Hours & Service Timing
                        </label>
                        <Input
                          value={overviewForm.operatingHours || "7:00 AM - 11:00 PM (Breakfast, Lunch & Dinner)"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              operatingHours: e.target.value,
                            })
                          }
                          placeholder="e.g. 7:00 AM - 11:00 PM"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ) : isActivity ? (
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2 border-slate-200 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-600" /> Adventure & Activity Profile
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Primary Activity Offerings
                        </label>
                        <Input
                          value={overviewForm.activityTypes || "Paragliding, River Rafting, Zipline, Camping"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              activityTypes: e.target.value,
                            })
                          }
                          placeholder="e.g. Paragliding, Rafting, Zipline"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-extrabold text-slate-700 block mb-1">
                          Operating Hub / Site
                        </label>
                        <Input
                          value={overviewForm.operatingCity || vendor.city || vendor.location || "Dobhi / Kullu"}
                          onChange={(e) =>
                            setOverviewForm({
                              ...overviewForm,
                              operatingCity: e.target.value,
                            })
                          }
                          placeholder="e.g. Dobhi Fly Site, Kullu River Point"
                          className="h-8.5 bg-white text-xs border-slate-200 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
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

                      <div className="sm:col-span-2">
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

                      <div className="sm:col-span-2">
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
                  </div>
                )}

                {/* Financial & Compliance Info Card */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-600" /> Financial & Compliance Details
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">GST, PAN, Bank A/C, IFSC & Payment Terms</span>
                  </div>

                  <div>
                    <Textarea
                      value={overviewForm.financialDetails}
                      onChange={(e) =>
                        setOverviewForm({
                          ...overviewForm,
                          financialDetails: e.target.value,
                        })
                      }
                      rows={6}
                      placeholder="Enter GSTIN, PAN, Bank Name, Account Number, IFSC Code & Payment Terms..."
                      className="bg-white text-xs border-slate-200 font-mono resize-y leading-relaxed font-medium min-h-[140px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TRANSPORT VEHICLES & ROUTE PRICING (UNIFIED) */}
          {(activeTab === "vehicles" || activeTab === "route_pricing" || (isTransport && activeTab === "seasonal_pricing")) && (
            <RoutePricingTab vendorId={vendor.id} vendorName={vendor.name} />
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
                    setRoomForm({
                      name: "",
                      cap: "2",
                      doubleRate: "1200",
                      tripleRate: "900",
                      quadRate: "750",
                      singleRate: "1800",
                      extraBedRate: "500",
                    });
                    setRoomModalOpen(true);
                  }}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold cursor-pointer"
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
                    Click "Add Room Category" above to configure per person double, triple, and quad sharing tariffs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rooms.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5 text-xs relative"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm block">
                            {r.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Capacity: {r.cap || 2} Persons
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingRoom(r);
                              setRoomForm({
                                name: r.name,
                                cap: (r.cap || 2).toString(),
                                doubleRate: (r.doubleRate || r.base || 1200).toString(),
                                tripleRate: (r.tripleRate || 900).toString(),
                                quadRate: (r.quadRate || 750).toString(),
                              });
                              setRoomModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 bg-slate-50 rounded cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 bg-slate-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          Per Person Tariffs
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                          <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                            <span className="text-slate-500 block text-[8.5px] font-bold">DOUBLE</span>
                            <span className="font-black text-emerald-600">₹{r.doubleRate || r.base || 0}</span>
                            <span className="text-[8px] text-slate-400 font-medium"> / person</span>
                          </div>
                          <div className="bg-[#FFF7ED] p-1.5 rounded border border-orange-100">
                            <span className="text-orange-600 block text-[8.5px] font-bold">TRIPLE</span>
                            <span className="font-black text-emerald-600">₹{r.tripleRate || 0}</span>
                            <span className="text-[8px] text-slate-400 font-medium"> / person</span>
                          </div>
                          <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                            <span className="text-slate-500 block text-[8.5px] font-bold">QUAD</span>
                            <span className="font-black text-emerald-600">₹{r.quadRate || 0}</span>
                            <span className="text-[8px] text-slate-400 font-medium"> / person</span>
                          </div>
                        </div>
                      </div>
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

          {/* TAB FOR GUIDES: RATES & ALLOWANCE */}
          {activeTab === "rates_allowance" && isGuide && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Tour Guide Daily Rates & Allowances
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Per day fee, total food allowance, and miscellaneous allowances.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingGuideRate(null);
                    setGuideRateForm({
                      roleName: "",
                      badgeText: "Primary Role",
                      perDayFee: "2500",
                      foodAllowance: "500",
                      miscAllowance: "300",
                    });
                    setGuideRateModalOpen(true);
                  }}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold px-3.5 shadow-2xs"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Rate Config
                </Button>
              </div>

              {guideRates.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl space-y-2">
                  <Compass className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-extrabold text-slate-700">
                    No Guide Rate Configurations Added
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click "Add Rate Config" above to set per-day guide tariffs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {guideRates.map((gr) => (
                    <div
                      key={gr.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 text-xs relative"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-extrabold text-slate-800 text-sm block">
                            {gr.roleName}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                            {gr.badgeText || "Role"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingGuideRate(gr);
                              setGuideRateForm({
                                roleName: gr.roleName,
                                badgeText: gr.badgeText || "Primary Role",
                                perDayFee: (gr.perDayFee || 2500).toString(),
                                foodAllowance: (gr.foodAllowance || 500).toString(),
                                miscAllowance: (gr.miscAllowance || 300).toString(),
                              });
                              setGuideRateModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 bg-slate-50 rounded border border-slate-200"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGuideRate(gr.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 bg-slate-50 rounded border border-slate-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-600 pt-1">
                        Per Day Fee:{" "}
                        <span className="font-black text-emerald-600 text-sm">
                          ₹{gr.perDayFee || 2500} / Day
                        </span>
                      </p>
                      <p className="text-slate-600">
                        Food Allowance:{" "}
                        <span className="font-bold text-slate-800">
                          ₹{gr.foodAllowance || 500} / Day
                        </span>
                      </p>
                      <p className="text-slate-600">
                        Miscellaneous Allowance:{" "}
                        <span className="font-bold text-slate-800">
                          ₹{gr.miscAllowance || 300} / Day
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB FOR ACTIVITIES: RATES & ALLOWANCE */}
          {activeTab === "rates_allowance" && isActivity && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Adventure Activity Rates & Tariffs
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Per-person rates for Paragliding, Rafting, Zipline, and Equipment.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 text-xs">
                  <span className="font-extrabold text-slate-800 text-sm block">
                    Tandem Paragliding High Fly
                  </span>
                  <p className="text-slate-600">
                    Per Pax Tariff:{" "}
                    <span className="font-black text-emerald-600 text-sm">
                      ₹2,500 / Person
                    </span>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Includes GoPro 4K Video Recording & Pilot Fee
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 text-xs">
                  <span className="font-extrabold text-slate-800 text-sm block">
                    12 KM White Water River Rafting
                  </span>
                  <p className="text-slate-600">
                    Per Pax Tariff:{" "}
                    <span className="font-black text-emerald-600 text-sm">
                      ₹1,200 / Person
                    </span>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Includes Safety Gear, Lifejacket & Helmet
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB FOR RESTAURANTS: MEAL TARIFFS */}
          {activeTab === "meal_tariffs" && isRestaurant && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Meal Tariffs & Thali Rates
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure per-head breakfast, lunch, and dinner tariffs for group bookings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 text-xs">
                  <span className="font-extrabold text-slate-800 text-sm block">
                    Group Breakfast Buffet / Thali
                  </span>
                  <p className="text-slate-600">
                    Per Pax Rate:{" "}
                    <span className="font-black text-emerald-600 text-sm">
                      ₹150 / Pax
                    </span>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Includes: Tea, Paratha, Puri Bhaji, Omelette
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 text-xs">
                  <span className="font-extrabold text-slate-800 text-sm block">
                    Group Lunch Buffet (Veg)
                  </span>
                  <p className="text-slate-600">
                    Per Pax Rate:{" "}
                    <span className="font-black text-emerald-600 text-sm">
                      ₹250 / Pax
                    </span>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Includes: Paneer, Dal, Rice, Roti, Salad, Sweet
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 text-xs">
                  <span className="font-extrabold text-slate-800 text-sm block">
                    Group Dinner Buffet (Veg + Non-Veg)
                  </span>
                  <p className="text-slate-600">
                    Per Pax Rate:{" "}
                    <span className="font-black text-emerald-600 text-sm">
                      ₹350 / Pax
                    </span>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Includes: Chicken Curry / Paneer, Dal Fry, Jeera Rice, Gulab Jamun
                  </p>
                </div>
              </div>
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
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Destination Mappings & Mapped Real Trips
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Trips dynamically linked via destination match or explicit assignment.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setDestModalOpen(true)}
                    variant="outline"
                    className="h-8 text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Link Destination
                  </Button>
                  <Button
                    onClick={() => setLinkTripModalOpen(true)}
                    className="h-8 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Link Real Trip
                  </Button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 text-[10px] uppercase block">
                    Linked Master Destinations
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {destinations.length === 0 ? (
                      <span className="text-slate-400 italic text-xs">No destinations linked yet.</span>
                    ) : (
                      destinations.map((d, i) => (
                        <span
                          key={i}
                          className="bg-amber-100 text-amber-800 px-3 py-1 rounded-md font-extrabold text-xs flex items-center gap-1.5"
                        >
                          ✓ {d}
                          <button
                            onClick={() => handleDeleteDestination(d)}
                            className="hover:text-rose-700 font-black ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* SECTION 1: MAPPED DESTINATION TRIPS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-[10px] uppercase block">
                      Destination-Matched Active Trips ({mappedTrips.length})
                    </span>
                  </div>

                  {mappedTrips.length === 0 ? (
                    <div className="bg-white p-4 rounded-lg border border-slate-200 text-center space-y-2">
                      <p className="text-slate-500 font-medium text-xs">
                        No destination-matched trips currently linked to this vendor's location.
                      </p>
                    </div>
                  ) : (
                    mappedTrips.map((trip, idx) => {
                      const displayCode =
                        trip.code ||
                        trip.shortCode ||
                        (trip.id && trip.id.length <= 10 ? trip.id.toUpperCase() : null) ||
                        (trip.slug && trip.slug.length <= 10 ? trip.slug.toUpperCase() : null) ||
                        `TRIP-${idx + 1}`;

                      return (
                        <div
                          key={trip.id || idx}
                          className="flex justify-between items-center bg-white p-3.5 rounded-lg border border-slate-200 hover:border-orange-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="px-2.5 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-700 font-mono font-black text-[10px] uppercase shrink-0 min-w-[52px] text-center">
                              {displayCode}
                            </span>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 text-xs block truncate">
                                {trip.title || trip.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium block truncate">
                                Location: {trip.location || vendor.location || "Himachal"} • {trip.duration || "Multi-day"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">
                              Active Link
                            </span>
                            {linkedTripIds.includes(trip.id) && (
                              <button
                                onClick={() => {
                                  setLinkedTripIds(linkedTripIds.filter((id) => id !== trip.id));
                                  toast.success(`Unlinked ${trip.title}`);
                                }}
                                className="text-xs text-slate-400 hover:text-red-600 font-bold px-2 py-1"
                              >
                                Unlink
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* SECTION 2: ALL AVAILABLE SYSTEM TRIPS CATALOG */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 text-xs uppercase block">
                        All Available System Trips Catalog ({allTrips.length} Total)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        View and 1-click link any fed trip in YouthCamping OS to this vendor.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {allTrips.map((t, idx) => {
                      const isLinked = mappedTrips.some((m) => m.id === t.id) || linkedTripIds.includes(t.id);
                      const displayCode =
                        t.code ||
                        t.shortCode ||
                        (t.id && t.id.length <= 10 ? t.id.toUpperCase() : null) ||
                        (t.slug && t.slug.length <= 10 ? t.slug.toUpperCase() : null) ||
                        `TRIP-${idx + 1}`;

                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border text-xs transition-colors bg-white",
                            isLinked ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 hover:border-orange-300"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[10px] uppercase shrink-0">
                              {displayCode}
                            </span>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate text-[11px]">
                                {t.title || t.name}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {t.location || "Trip"} • {t.duration || "Nights"}
                              </span>
                            </div>
                          </div>

                          <Button
                            size="xs"
                            onClick={() => {
                              if (isLinked) {
                                setLinkedTripIds(linkedTripIds.filter((id) => id !== t.id));
                                toast.success(`Unlinked ${t.title}`);
                              } else {
                                setLinkedTripIds([...linkedTripIds, t.id]);
                                logActivity("TRIP_LINKED", `Linked trip: ${t.title} to vendor`);
                                toast.success(`Linked "${t.title}" to ${vendor.name}`);
                              }
                            }}
                            className={cn(
                              "h-7 text-[10px] font-bold px-2.5 shrink-0 ml-2",
                              isLinked
                                ? "bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800"
                                : "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-600 hover:text-white"
                            )}
                          >
                            {isLinked ? "✓ Linked" : "+ Link Trip"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
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

          {/* TAB: UNIFIED CHRONOLOGICAL TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-[#F97316]" /> Unified Partner Activity Audit Trail
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Automated traceability log of all profile updates, rate revisions, fleet changes, and operational activities.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setTimelineForm({
                      eventType: "NOTE",
                      description: "",
                      performedBy: "Hemal Patel (Superadmin)",
                    });
                    setTimelineModalOpen(true);
                  }}
                  className="h-8.5 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Manual Log
                </Button>
              </div>

              {timeline.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400 font-semibold">
                  No activity entries logged yet.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-4 space-y-4 py-2">
                  {timeline.map((item) => {
                    const isRate = item.eventType?.includes("RATE");
                    const isFleet = item.eventType?.includes("FLEET");
                    const isContact = item.eventType?.includes("CONTACT");
                    const isPayment = item.eventType?.includes("PAYMENT");
                    const isProfile =
                      item.eventType?.includes("PROFILE") ||
                      item.eventType?.includes("VENDOR");

                    const badgeBg = isRate
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : isFleet
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : isContact
                          ? "bg-purple-100 text-purple-800 border-purple-200"
                          : isPayment
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : isProfile
                              ? "bg-sky-100 text-sky-800 border-sky-200"
                              : "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <div key={item.id} className="relative pl-6">
                        <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-[#F97316] border-2 border-white ring-4 ring-orange-50" />
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs space-y-2">
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border",
                                badgeBg,
                              )}
                            >
                              {item.eventType?.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] text-slate-450 font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {item.createdAt}
                            </span>
                          </div>
                          <p className="text-slate-800 font-semibold leading-relaxed">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <span className="font-semibold text-slate-400">
                              Audited By:
                            </span>
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {item.performedBy || "Hemal Patel (Superadmin)"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                Financial, Banking & Compliance Details
              </label>
              <Textarea
                value={overviewForm.financialDetails}
                onChange={(e) =>
                  setOverviewForm({
                    ...overviewForm,
                    financialDetails: e.target.value,
                  })
                }
                rows={5}
                placeholder={`GSTIN: 02AAACH1827C1Z5\nPAN: AAACH1827C\nBank: HDFC Bank Ltd\nA/C: 50200049281726\nIFSC: HDFC0000240\nPayment Terms: 30 Days Credit`}
                className="font-mono text-xs leading-relaxed"
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
              <Input
                value={contactForm.role}
                onChange={(e) =>
                  setContactForm({ ...contactForm, role: e.target.value })
                }
                placeholder="e.g. Owner, General Manager, Driver, Accounts..."
              />
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
              {editingRoom ? "Edit Room Category" : "Add Room Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Room Category Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={roomForm.name}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, name: e.target.value })
                }
                placeholder="e.g. Deluxe Mountain View Room"
              />
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Per Person Tariffs (₹ / Night)
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                    Double Sharing (₹/person)
                  </label>
                  <Input
                    type="number"
                    value={roomForm.doubleRate}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, doubleRate: e.target.value })
                    }
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                    Triple Sharing (₹/person)
                  </label>
                  <Input
                    type="number"
                    value={roomForm.tripleRate}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, tripleRate: e.target.value })
                    }
                    placeholder="900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                    Quad Sharing (₹/person)
                  </label>
                  <Input
                    type="number"
                    value={roomForm.quadRate}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, quadRate: e.target.value })
                    }
                    placeholder="750"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveRoom}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2 cursor-pointer"
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
      {/* Transport Vehicle Modal */}
      <Dialog open={vehicleModalOpen} onOpenChange={setVehicleModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              {editingVehicle ? "Edit Fleet Vehicle" : "Add Vehicle to Fleet"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Vehicle Model / Type
              </label>
              <Input
                value={vehicleForm.model}
                onChange={(e) =>
                  setVehicleForm({ ...vehicleForm, model: e.target.value })
                }
                placeholder="e.g. 20 Seater Tempo Traveller, Innova Crysta"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Advertised Capacity
                </label>
                <Input
                  type="number"
                  value={vehicleForm.capacity}
                  onChange={(e) =>
                    setVehicleForm({ ...vehicleForm, capacity: e.target.value })
                  }
                  placeholder="20"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Sellable Seats
                </label>
                <Input
                  type="number"
                  value={vehicleForm.sellableSeats}
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      sellableSeats: e.target.value,
                    })
                  }
                  placeholder="19"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Air Conditioning
                </label>
                <Select
                  value={vehicleForm.acType}
                  onValueChange={(v) =>
                    setVehicleForm({ ...vehicleForm, acType: v })
                  }
                >
                  <SelectTrigger className="h-9 bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-xs">
                    <SelectItem value="AC">AC (Air Conditioned)</SelectItem>
                    <SelectItem value="Non-AC">Non-AC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Registration Plate No.
                </label>
                <Input
                  value={vehicleForm.plateNumber}
                  onChange={(e) =>
                    setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })
                  }
                  placeholder="PB-08-TR-2001"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveVehicle}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              {editingVehicle ? "Update Vehicle" : "Save Vehicle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transport Route Tariff Modal */}
      <Dialog open={routeModalOpen} onOpenChange={setRouteModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-800">
              {editingRoute ? "Edit Route Tariff" : "Add Route Tariff"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Route Name (Pickup ➔ Drop)
              </label>
              <Input
                value={routeForm.routeName}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, routeName: e.target.value })
                }
                placeholder="e.g. Kotkapura ➔ Kotkapura, Jalandhar ➔ Jalandhar"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Vehicle Type
              </label>
              <Input
                value={routeForm.vehicleType}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, vehicleType: e.target.value })
                }
                placeholder="e.g. 20 Seater Tempo, 17 Seater Tempo, Innova"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Total Vehicle Amount (₹)
              </label>
              <Input
                type="number"
                value={routeForm.totalAmount}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, totalAmount: e.target.value })
                }
                placeholder="44000"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Notes / Special Conditions
              </label>
              <Input
                value={routeForm.notes}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, notes: e.target.value })
                }
                placeholder="e.g. Kotkapura pickup & drop extra: ₹2,000"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={handleSaveRoute}
              className="bg-[#F97316] text-white text-xs font-bold px-4 py-2"
            >
              {editingRoute ? "Update Route Tariff" : "Save Route Tariff"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guide Rate Configuration Modal */}
      <Dialog open={guideRateModalOpen} onOpenChange={setGuideRateModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-slate-800 border-b pb-2">
              {editingGuideRate ? "Edit Guide Daily Rate & Allowances" : "Add Guide Daily Rate & Allowances"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs my-2 font-medium text-slate-700">
            <div>
              <label className="font-extrabold text-slate-800 block mb-1">
                Guide Role / Designation *
              </label>
              <Input
                value={guideRateForm.roleName}
                onChange={(e) => setGuideRateForm({ ...guideRateForm, roleName: e.target.value })}
                placeholder="e.g. Lead Trek Leader, Assistant Guide, Cultural Guide"
                className="h-8.5 text-xs font-bold"
              />
            </div>
            <div>
              <label className="font-extrabold text-slate-800 block mb-1">
                Category Badge / Tag
              </label>
              <Input
                value={guideRateForm.badgeText}
                onChange={(e) => setGuideRateForm({ ...guideRateForm, badgeText: e.target.value })}
                placeholder="e.g. Primary Role, City / Sightseeing"
                className="h-8.5 text-xs"
              />
            </div>
            <div>
              <label className="font-extrabold text-slate-800 block mb-1">
                Per Day Fee (₹/Day) *
              </label>
              <Input
                type="number"
                value={guideRateForm.perDayFee}
                onChange={(e) => setGuideRateForm({ ...guideRateForm, perDayFee: e.target.value })}
                placeholder="2500"
                className="h-8.5 text-xs font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  Food Allowance (₹/Day)
                </label>
                <Input
                  type="number"
                  value={guideRateForm.foodAllowance}
                  onChange={(e) => setGuideRateForm({ ...guideRateForm, foodAllowance: e.target.value })}
                  placeholder="500"
                  className="h-8.5 text-xs"
                />
              </div>
              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  Miscellaneous Allowance (₹)
                </label>
                <Input
                  type="number"
                  value={guideRateForm.miscAllowance}
                  onChange={(e) => setGuideRateForm({ ...guideRateForm, miscAllowance: e.target.value })}
                  placeholder="300"
                  className="h-8.5 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setGuideRateModalOpen(false)}
              className="h-8 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGuideRate}
              className="h-8 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold px-4 shadow-2xs"
            >
              {editingGuideRate ? "Update Guide Rate" : "Add Guide Rate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* LINK REAL TRIP MODAL */}
      <Dialog open={linkTripModalOpen} onOpenChange={setLinkTripModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogTitle className="text-base font-black text-slate-900">
            Link Real Fed Trip
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Select an available trip fed in YouthCamping OS to map directly to <strong>{vendor.name}</strong>.
          </p>

          <div className="space-y-3 py-3 text-xs">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">
                Select Real Fed Trip
              </label>
              <select
                value={selectedTripToLink}
                onChange={(e) => setSelectedTripToLink(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold bg-white outline-none focus:border-orange-500"
              >
                <option value="">-- Choose Real Trip --</option>
                {allTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title || t.name} ({t.location || "Trip"}) [{t.id}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLinkTripModalOpen(false)}
              className="h-8 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!selectedTripToLink) {
                  toast.error("Please select a trip to link");
                  return;
                }
                const tripObj = allTrips.find((t) => t.id === selectedTripToLink);
                if (!linkedTripIds.includes(selectedTripToLink)) {
                  setLinkedTripIds([...linkedTripIds, selectedTripToLink]);
                  logActivity("TRIP_LINKED", `Linked trip: ${tripObj?.title || selectedTripToLink} to vendor`);
                  toast.success(`Linked "${tripObj?.title || selectedTripToLink}" to ${vendor.name}`);
                }
                setLinkTripModalOpen(false);
                setSelectedTripToLink("");
              }}
              className="h-8 text-xs bg-[#F97316] hover:bg-[#E05E00] text-white font-bold px-4"
            >
              Link Trip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
