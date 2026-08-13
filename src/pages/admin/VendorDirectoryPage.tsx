import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Truck,
  UserCheck,
  UtensilsCrossed,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Search,
  Copy,
  RotateCw,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Filter,
  FileText,
  IndianRupee,
  ShieldCheck,
  Calculator,
  Receipt,
  ArrowRight,
  Settings,
  LayoutGrid,
  Hotel,
  Bus,
  Compass,
  Eye,
  ChevronLeft,
} from "lucide-react";
import { VendorDashboardView } from "@/components/admin/vendors/VendorDashboardView";
import { AccommodationDetailPage } from "@/components/admin/vendors/AccommodationDetailPage";
import { DuplicateVendorDialog } from "@/components/admin/vendors/DuplicateVendorDialog";
import { AccommodationModuleView } from "@/components/admin/vendors/modules/AccommodationModuleView";
import { TransportModuleView } from "@/components/admin/vendors/modules/TransportModuleView";
import { ActivitiesModuleView } from "@/components/admin/vendors/modules/ActivitiesModuleView";
import { RestaurantsModuleView } from "@/components/admin/vendors/modules/RestaurantsModuleView";
import { GuidesModuleView } from "@/components/admin/vendors/modules/GuidesModuleView";
import { CampingModuleView } from "@/components/admin/vendors/modules/CampingModuleView";
import { OtherVendorsModuleView } from "@/components/admin/vendors/modules/OtherVendorsModuleView";
import { VendorContractManager } from "@/components/admin/vendors/VendorContractManager";

// Category Tab List - Pure Vendor Directory
const TABS = [
  { id: "accommodation", label: "Accommodation", icon: Hotel, countKey: "accommodation" },
  { id: "transport", label: "Transport", icon: Bus, countKey: "transport" },
  { id: "activities", label: "Activities", icon: Compass, countKey: "activities" },
  { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed, countKey: "restaurants" },
  { id: "guides", label: "Guides", icon: UserCheck, countKey: "guides" },
  { id: "other", label: "Other Vendors", icon: Building2, countKey: "other" },
];

export default function VendorDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory =
    searchParams.get("category") || searchParams.get("tab") || "accommodation";
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDetailVendor, setViewingDetailVendor] = useState<any>(null);

  // Duplicate detection dialog state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateVendorMatch, setDuplicateVendorMatch] = useState<any>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterState, setFilterState] = useState("ALL");
  const [filterDestination, setFilterDestination] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [destinationsList, setDestinationsList] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [pagination, setPagination] = useState<any>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
    startIndex: 0,
    endIndex: 0,
  });

  // Selected entities for Rates view
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  // Trip-Scoped Vendor Directory state
  const [tripsList, setTripsList] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [tripDestinations, setTripDestinations] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<{
    total: number;
    accommodation: number;
    transport: number;
    activities: number;
    restaurants: number;
    guides: number;
    other: number;
  }>({
    total: 0,
    accommodation: 0,
    transport: 0,
    activities: 0,
    restaurants: 0,
    guides: 0,
    other: 0,
  });

  // Costing inputs
  const [costingPax, setCostingPax] = useState("10");
  const [costingContingency, setCostingContingency] = useState("5");
  const [costingResult, setCostingResult] = useState<any>(null);

  // Form State
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [vendorForm, setVendorForm] = useState<any>({
    vendorCode: "",
    name: "",
    legalName: "",
    type: "HOTEL",
    contactPerson: "",
    contactNumber: "",
    alternateNumber: "",
    whatsappNumber: "",
    email: "",
    
    // Tax & Entity
    companyName: "",
    gstin: "",
    panNumber: "",
    
    // Address
    state: "Himachal Pradesh",
    city: "",
    area: "",
    address: "",
    
    // Terms & Services
    paymentTerms: "",
    creditDays: "30",
    priority: "3",
    rating: "0",
    blacklisted: false,
    preferred: false,
    citiesCovered: [],
    services: [],
    
    notes: "",
    contacts: [],
  });

  // Rates Form
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateType, setRateType] = useState<
    "ROOM" | "TRANSPORT" | "FOOD" | "GUIDE" | "MISC"
  >("ROOM");
  const [roomRateForm, setRoomRateForm] = useState<any>({
    propertyName: "",
    roomCategory: "Standard",
    sharingType: "DOUBLE",
    standardOccupancy: "2",
    maximumOccupancy: "3",
    mixedOccupancyAllowed: true,
    rateBasis: "PER_ROOM_PER_NIGHT",
    amount: "",
    extraAdultRate: "",
    extraChildRate: "",
    guideRoomRate: "",
    availableRooms: "",
    mealPlan: "EP",
    season: "ALL",
    validFrom: "",
    validTo: "",
    taxIncluded: false,
    taxPercent: "12",
  });

  const [transportRateForm, setTransportRateForm] = useState<any>({
    routeName: "",
    pickupLocation: "",
    dropLocation: "",
    vehicleType: "17 Seater Tempo",
    seatCapacity: "17",
    rateBasis: "PER_VEHICLE",
    amount: "",
    extraCharge: "0",
    season: "ALL",
  });

  // Payments log form
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<any>({
    vendorId: "",
    invoiceAmount: "",
    advanceAmount: "0",
    paidAmount: "0",
    dueDate: "",
    paymentMode: "BANK_TRANSFER",
    transactionRef: "",
    remarks: "",
  });

  const [paymentsList, setPaymentsList] = useState<any[]>([]);

  // Load Data from Server APIs
  const loadData = async (targetPage = 1, categoryOverride?: string) => {
    setLoading(true);
    try {
      const catToUse =
        categoryOverride !== undefined ? categoryOverride : currentCategory;
      let catParam = "ALL";
      if (catToUse === "accommodation")
        catParam =
          "HOTEL,RESORT,HOMESTAY,HOSTEL,GUEST_HOUSE,VILLA,CAMP,COTTAGE,APARTMENT,DORMITORY,LUXURY_TENT";
      else if (catToUse === "transport") catParam = "TRANSPORT";
      else if (catToUse === "activities") catParam = "ACTIVITIES";
      else if (catToUse === "restaurants") catParam = "RESTAURANT,FOOD,MEALS";
      else if (catToUse === "guides") catParam = "GUIDE";
      else if (catToUse === "camping") catParam = "CAMPING,CAMP";
      else if (catToUse === "other") catParam = "OTHER";

      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.set("search", searchTerm);
      if (catParam !== "ALL") queryParams.set("type", catParam);
      if (filterDestination !== "ALL")
        queryParams.set("destination", filterDestination);
      if (filterStatus !== "ALL")
        queryParams.set(
          "isActive",
          filterStatus === "ACTIVE" ? "true" : "false",
        );
      if (selectedTripId) {
        queryParams.set("tripId", selectedTripId);
      }
      queryParams.set("page", targetPage.toString());
      queryParams.set("limit", "10");

      const [res, analyticsRes, destRes] = await Promise.all([
        api.get(`/vendors/directory?${queryParams.toString()}`),
        api
          .get("/vendors/directory/analytics")
          .catch(() => ({ data: { data: null } })),
        api
          .get("/vendors/directory/destinations")
          .catch(() => ({ data: { data: [] } })),
      ]);

      const vendorData = res.data?.data || [];
      const pag = res.data?.pagination || {
        total: vendorData.length,
        page: 1,
        limit: 10,
        pages: 1,
        startIndex: vendorData.length > 0 ? 1 : 0,
        endIndex: vendorData.length,
      };

      setVendors(vendorData);
      setPagination(pag);

      if (res.data?.categoryCounts) {
        setCategoryCounts(res.data.categoryCounts);
      }
      if (analyticsRes.data?.data) setAnalytics(analyticsRes.data.data);
      if (destRes.data?.data) setDestinationsList(destRes.data.data);

      const payRes = await api
        .get("/vendors/directory/payments")
        .catch(() => ({ data: { data: [] } }));
      setPaymentsList(payRes.data?.data || []);
    } catch (err: any) {
      toast.error(
        "Failed to load directory data: " +
          (err.response?.data?.message || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  // Load trips list on mount
  useEffect(() => {
    api
      .get("/vendors/trips")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setTripsList(res.data.data);
          setSelectedTripId((prev) => prev || res.data.data[0].id);
        }
      })
      .catch(() => null);
  }, []);

  // Auto-select first trip when trips are loaded
  useEffect(() => {
    if (tripsList.length > 0 && !selectedTripId) {
      setSelectedTripId(tripsList[0].id);
    }
  }, [tripsList]);

  // Fetch trip destinations when selectedTripId changes
  useEffect(() => {
    setViewingDetailVendor(null);
    if (selectedTripId) {
      api
        .get(`/vendors/trips/${selectedTripId}/destinations`)
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setTripDestinations(res.data.data);
          }
        })
        .catch(() => null);
    } else {
      setTripDestinations([]);
    }
    setFilterDestination("ALL");
    if (selectedTripId) loadData(1, currentCategory);
  }, [selectedTripId, currentCategory, searchParams, filterStatus, filterDestination]);

  const handleRemoveVendorFromTrip = async (vendorId: string, vendorName: string) => {
    if (!selectedTripId) return;
    const tripTitle = tripsList.find((t) => t.id === selectedTripId)?.title || "this trip";
    if (!confirm(`Remove "${vendorName}" from ${tripTitle}? The vendor record itself is NOT deleted.`)) return;
    try {
      await api.delete(`/vendors/trips/${selectedTripId}/remove/${vendorId}`);
      toast.success(`Removed "${vendorName}" from trip (vendor record preserved)`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove vendor from trip");
    }
  };

  const getCategoryVendorType = (cat: string) => {
    switch (cat) {
      case "transport":
        return "TRANSPORT";
      case "activities":
        return "ACTIVITIES";
      case "restaurants":
        return "RESTAURANT";
      case "guides":
        return "GUIDE";
      case "camping":
        return "CAMPING";
      case "other":
        return "OTHER";
      case "accommodation":
      default:
        return "HOTEL";
    }
  };

  const handleOpenAddVendor = (forcedCategory?: string) => {
    if (!selectedTripId) {
      toast.error("Please select a trip first");
      return;
    }
    const categoryToUse = forcedCategory || currentCategory;
    const defaultType = getCategoryVendorType(categoryToUse);

    setEditingVendor(null);
    setVendorForm({
      vendorCode: "",
      name: "",
      legalName: "",
      type: defaultType,
      contactPerson: "",
      contactNumber: "",
      alternateNumber: "",
      whatsappNumber: "",
      email: "",
      companyName: "",
      gstin: "",
      panNumber: "",
      state: "Himachal Pradesh",
      city: "",
      area: "",
      address: "",
      paymentTerms: "",
      creditDays: "30",
      priority: "3",
      rating: "0",
      blacklisted: false,
      preferred: false,
      citiesCovered: [],
      services: [],
      notes: "",
      contacts: [],
      accommodationType: "",
      starRating: "3",
      checkInTime: "",
      checkOutTime: "",
      fleetTypes: [],
      fleetType: "",
      fleetSize: "",
      seatCapacity: "",
      permitType: "",
      driverName: "",
      dailyTariff: "",
      activityType: "",
      batchCapacity: "",
      safetyRating: "",
      commissionPercent: "",
      outletType: "",
      cuisineTypes: "",
      buffetCapacity: "",
      avgMealRate: "",
      guideRole: "",
      certifications: "",
      languages: "",
      dailyGuideFee: "",
      campsiteType: "",
      washroomType: "",
      tentCapacity: "",
      customCategory: "",
    });
    setVendorModalOpen(true);
  };

  const handleSaveVendor = async (force: boolean = false) => {
    if (!vendorForm.name || !vendorForm.type) {
      toast.error("Please fill in Vendor Name and Category");
      return;
    }

    // Pre-save duplicate check
    if (!editingVendor && !force) {
      const match = vendors.find(
        (v) =>
          (v.name && v.name.toLowerCase() === vendorForm.name.toLowerCase()) ||
          (vendorForm.contactNumber &&
            (v.contactNumber === vendorForm.contactNumber ||
              v.phone === vendorForm.contactNumber)) ||
          (vendorForm.gstin &&
            v.gstin &&
            v.gstin.toLowerCase() === vendorForm.gstin.toLowerCase()),
      );
      if (match) {
        setDuplicateVendorMatch(match);
        setDuplicateDialogOpen(true);
        return;
      }
    }

    try {
      if (editingVendor) {
        await api.patch(`/vendors/directory/${editingVendor.id}`, vendorForm);
        toast.success("Vendor updated successfully");
      } else {
        const createRes = await api.post("/vendors/directory", vendorForm);
        const newVendorId = createRes.data?.data?.id;
        // Auto-assign the new vendor to the currently selected trip
        if (newVendorId && selectedTripId) {
          await api.post(`/vendors/trips/${selectedTripId}/assign`, {
            vendorId: newVendorId,
            category: vendorForm.type || "OTHER",
          }).catch(() => null); // silent — vendor is created even if mapping fails
        }
        toast.success("Vendor created and mapped to trip");
      }
      setVendorModalOpen(false);
      setDuplicateDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(
        "Failed to save vendor: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this vendor?")) return;
    try {
      await api.delete(`/vendors/directory/${id}`);
      toast.success("Vendor deactivated successfully");
      setVendors((prev) => prev.filter((v) => v.id !== id));
      loadData();
    } catch (err: any) {
      toast.error("Deactivation failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSaveRate = async () => {
    if (!selectedVendor) return;
    try {
      let endpoint = `/vendors/directory/${selectedVendor.id}/room-rates`;
      let payload = roomRateForm;
      if (rateType === "TRANSPORT") {
        endpoint = `/vendors/directory/${selectedVendor.id}/transport-rates`;
        payload = transportRateForm;
      }
      await api.post(endpoint, payload);
      toast.success("Rate successfully registered!");
      setRateModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error("Failed to create rate: " + err.message);
    }
  };

  const runCosting = async () => {
    // Run mock pricing calculation or direct pricing engine logic
    if (vendors.length === 0) return;
    try {
      // Find hotel rate
      const hotel = vendors.find(
        (v) => v.type === "HOTEL" && v.roomRates.length > 0,
      );
      const transport = vendors.find(
        (v) => v.type === "TRANSPORT" && v.transportRates.length > 0,
      );

      const payload = {
        paxCount: parseInt(costingPax),
        contingencyPercent: parseInt(costingContingency),
        accommodations: hotel
          ? [
              {
                sharingType: hotel.roomRates[0].sharingType,
                rateBasis: hotel.roomRates[0].rateBasis,
                amount: hotel.roomRates[0].amount,
                paxCount: parseInt(costingPax),
                numberOfNights: 3,
                maxRoomCapacity: hotel.roomRates[0].maximumOccupancy,
              },
            ]
          : [],
        transports: transport
          ? [
              {
                vehicleType: transport.transportRates[0].vehicleType,
                seatCapacity: transport.transportRates[0].seatCapacity,
                amount: transport.transportRates[0].amount,
                paxCount: parseInt(costingPax),
                rateBasis: transport.transportRates[0].rateBasis,
              },
            ]
          : [],
      };

      const res = await api.post(
        "/vendors/directory/costing/calculate",
        payload,
      );
      setCostingResult(res.data?.data);
      toast.success("Pricing calculation compiled!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const handleSavePayment = async () => {
    if (!paymentForm.vendorId || !paymentForm.invoiceAmount) {
      toast.error("Please fill in vendor and invoice fields");
      return;
    }
    try {
      await api.post("/vendors/directory/payments", paymentForm);
      toast.success("Payment logged successfully!");
      setPaymentModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error("Payment failed: " + err.message);
    }
  };

  const selectedTrip = tripsList.find((t) => t.id === selectedTripId);

  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            {selectedTrip ? `${selectedTrip.title} — Vendor Directory` : "Vendor Directory"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {selectedTrip
              ? `${selectedTrip.location || ""} · ${selectedTrip._count?.tripVendors || 0} vendors mapped`
              : "Select a trip to manage its vendors"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Trip Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider px-2">Trip:</span>
            <Select value={selectedTripId} onValueChange={setSelectedTripId}>
              <SelectTrigger className="w-[260px] h-8 text-xs font-bold bg-white border-slate-200 shadow-2xs">
                <SelectValue placeholder="— Select Trip —" />
              </SelectTrigger>
              <SelectContent className="bg-white text-xs font-medium">
                {tripsList.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="font-bold">
                    {t.title}
                    <span className="ml-1.5 text-[9px] font-mono text-slate-400">
                      ({t._count?.tripVendors || 0})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Vendor — only active when a trip is selected */}
          <Button
            disabled={!selectedTripId}
            onClick={() => handleOpenAddVendor()}
            className="bg-[#F97316] hover:bg-[#E05E00] disabled:opacity-40 text-white text-xs font-bold h-8 px-3.5 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Notion Style Slate Category Tab Segment Bar */}
      {!viewingDetailVendor && (
        <div className="bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentCategory === tab.id;
            const count = (categoryCounts as any)[tab.countKey] ?? 0;

            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ category: tab.id })}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  isActive
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#F97316]" : "text-slate-500")} />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full",
                    isActive ? "bg-[#F97316] text-white" : "bg-slate-200 text-slate-600"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail View Overlay */}
      {viewingDetailVendor ? (
        <AccommodationDetailPage
          vendor={viewingDetailVendor}
          onBack={() => setViewingDetailVendor(null)}
          onUpdateVendor={loadData}
        />
      ) : (
        <>
          {/* Main Module Switcher based on current URL category */}
          {currentCategory === "dashboard" && (
            <VendorDashboardView
              vendors={vendors}
              onSelectCategory={(cat) => setSearchParams({ category: cat })}
            />
          )}

          {/* Active destinations list for current scope */}
          {!selectedTripId ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Building2 className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-sm font-black text-slate-500">No Trip Selected</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Select a trip from the dropdown above to manage its vendors</p>
            </div>
          ) : (
          <>{ (() => {
            const activeDestinations = tripDestinations.length > 0 ? tripDestinations : destinationsList;
            const handleDeleteOrRemove = (id: string) => {
              const target = vendors.find((v) => v.id === id);
              handleRemoveVendorFromTrip(id, target?.name || "Vendor");
            };

            return (
              <>
                {currentCategory === "accommodation" && (
                  <AccommodationModuleView
                    vendors={vendors}
                    destinations={activeDestinations}
                    pagination={pagination}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterDestination={filterDestination}
                    onDestinationChange={setFilterDestination}
                    filterStatus={filterStatus}
                    onStatusChange={setFilterStatus}
                    onRefresh={() => loadData(1)}
                    onPageChange={(p) => loadData(p)}
                    onSelectVendor={(v) => setViewingDetailVendor(v)}
                    onAddVendor={() => handleOpenAddVendor("accommodation")}
                    onEditVendor={(v) => {
                      setEditingVendor(v);
                      setVendorForm({ ...v, type: v.type || "HOTEL" });
                      setVendorModalOpen(true);
                    }}
                    onDeleteVendor={handleDeleteOrRemove}
                  />
                )}

                {currentCategory === "transport" && (
                  <TransportModuleView
                    vendors={vendors}
                    destinations={activeDestinations}
                    pagination={pagination}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterDestination={filterDestination}
                    onDestinationChange={setFilterDestination}
                    filterStatus={filterStatus}
                    onStatusChange={setFilterStatus}
                    onRefresh={() => loadData(1)}
                    onPageChange={(p) => loadData(p)}
                    onSelectVendor={(v) => setViewingDetailVendor(v)}
                    onAddVendor={() => handleOpenAddVendor("transport")}
                    onEditVendor={(v) => {
                      setEditingVendor(v);
                      setVendorForm({ ...v, type: v.type || "TRANSPORT" });
                      setVendorModalOpen(true);
                    }}
                    onDeleteVendor={handleDeleteOrRemove}
                  />
                )}

                {currentCategory === "activities" && (
                  <ActivitiesModuleView
                    vendors={vendors}
                    destinations={activeDestinations}
                    pagination={pagination}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterDestination={filterDestination}
                    onDestinationChange={setFilterDestination}
                    filterStatus={filterStatus}
                    onStatusChange={setFilterStatus}
                    onRefresh={() => loadData(1)}
                    onPageChange={(p) => loadData(p)}
                    onSelectVendor={(v) => setViewingDetailVendor(v)}
                    onAddVendor={() => handleOpenAddVendor("activities")}
                    onEditVendor={(v) => {
                      setEditingVendor(v);
                      setVendorForm({ ...v, type: v.type || "ACTIVITIES" });
                      setVendorModalOpen(true);
                    }}
                    onDeleteVendor={handleDeleteOrRemove}
                  />
                )}

                {currentCategory === "restaurants" && (
                  <RestaurantsModuleView
                    vendors={vendors}
                    destinations={activeDestinations}
                    pagination={pagination}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterDestination={filterDestination}
                    onDestinationChange={setFilterDestination}
                    filterStatus={filterStatus}
                    onStatusChange={setFilterStatus}
                    onRefresh={() => loadData(1)}
                    onPageChange={(p) => loadData(p)}
                    onSelectVendor={(v) => setViewingDetailVendor(v)}
                    onAddVendor={() => handleOpenAddVendor("restaurants")}
                    onEditVendor={(v) => {
                      setEditingVendor(v);
                      setVendorForm({ ...v, type: v.type || "RESTAURANT" });
                      setVendorModalOpen(true);
                    }}
                    onDeleteVendor={handleDeleteOrRemove}
                  />
                )}

                {currentCategory === "guides" && (
                  <GuidesModuleView
                    vendors={vendors}
                    destinations={activeDestinations}
                    pagination={pagination}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterDestination={filterDestination}
                    onDestinationChange={setFilterDestination}
                    filterStatus={filterStatus}
                    onStatusChange={setFilterStatus}
                    onRefresh={() => loadData(1)}
                    onPageChange={(p) => loadData(p)}
                    onSelectVendor={(v) => setViewingDetailVendor(v)}
                    onAddVendor={() => handleOpenAddVendor("guides")}
                    onEditVendor={(v) => {
                      setEditingVendor(v);
                      setVendorForm({ ...v, type: v.type || "GUIDE" });
                      setVendorModalOpen(true);
                    }}
                    onDeleteVendor={handleDeleteOrRemove}
                  />
                )}

                {currentCategory === "other" && (
                  <OtherVendorsModuleView
                    vendors={vendors}
                    destinations={activeDestinations}
                    pagination={pagination}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterDestination={filterDestination}
                    onDestinationChange={setFilterDestination}
                    filterStatus={filterStatus}
                    onStatusChange={setFilterStatus}
                    onRefresh={() => loadData(1)}
                    onPageChange={(p) => loadData(p)}
                    onSelectVendor={(v) => setViewingDetailVendor(v)}
                    onAddVendor={() => handleOpenAddVendor("other")}
                    onEditVendor={(v) => {
                      setEditingVendor(v);
                      setVendorForm({ ...v, type: v.type || "OTHER" });
                      setVendorModalOpen(true);
                    }}
                    onDeleteVendor={handleDeleteOrRemove}
                  />
                )}
              </>
            );
          })()}</>
          )}
        </>
      )}

      <DuplicateVendorDialog
        open={duplicateDialogOpen}
        onClose={() => setDuplicateDialogOpen(false)}
        existingVendor={duplicateVendorMatch}
        onUseExisting={(v) => {
          setViewingDetailVendor(v);
          setDuplicateDialogOpen(false);
          setVendorModalOpen(false);
        }}
        onForceCreate={() => handleSaveVendor(true)}
      />

      {/* Vendor Form Modal — Dynamic Category Specific Fields */}
      <Dialog open={vendorModalOpen} onOpenChange={setVendorModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-xl p-6 shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center justify-between border-b pb-2 border-slate-100">
              <span>
                {editingVendor
                  ? "Edit Vendor Details"
                  : "Register New Directory Vendor"}
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                Category: {vendorForm.type}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Basic Universal Fields */}
          <div className="space-y-4 mt-3">
            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
              Universal Vendor Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-semibold text-slate-650">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Vendor Name *
                </label>
                <Input
                  value={vendorForm.name}
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, name: e.target.value })
                  }
                  placeholder="e.g. Hotel Mountain View / Shashi Transport"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Vendor Category / Type *
                </label>
                <Select
                  value={vendorForm.type}
                  onValueChange={(v) =>
                    setVendorForm({ ...vendorForm, type: v })
                  }
                >
                  <SelectTrigger className="h-8.5 border-slate-200 bg-white font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs bg-white">
                    <SelectItem value="HOTEL">ACCOMMODATION & STAYS</SelectItem>
                    <SelectItem value="TRANSPORT">TRANSPORT & FLEET</SelectItem>
                    <SelectItem value="ACTIVITIES">
                      ACTIVITIES & ADVENTURE
                    </SelectItem>
                    <SelectItem value="RESTAURANT">
                      RESTAURANTS & MEALS
                    </SelectItem>
                    <SelectItem value="GUIDE">GUIDES & EXPEDITIONS</SelectItem>
                    <SelectItem value="OTHER">OTHER VENDORS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Vendor Code
                </label>
                <Input
                  value={vendorForm.vendorCode}
                  placeholder="Auto-generated if empty"
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, vendorCode: e.target.value })
                  }
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Contact Person *
                </label>
                <Input
                  value={vendorForm.contactPerson}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      contactPerson: e.target.value,
                    })
                  }
                  placeholder="e.g. Suresh Kumar"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Primary Phone *
                </label>
                <Input
                  value={vendorForm.contactNumber}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      contactNumber: e.target.value,
                    })
                  }
                  placeholder="+91 98166 00000"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Email Address *
                </label>
                <Input
                  value={vendorForm.email}
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, email: e.target.value })
                  }
                  placeholder="vendor@company.com"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  City *
                </label>
                <Input
                  value={vendorForm.city}
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, city: e.target.value })
                  }
                  placeholder="Manali / Shimla / Kasol"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  State *
                </label>
                <Input
                  value={vendorForm.state}
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, state: e.target.value })
                  }
                  placeholder="Himachal Pradesh"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
            </div>
            {/* TRAVEL ERP SPECIFIC FIELDS */}
            <div className="pt-3 border-t border-slate-100 space-y-3 mt-4">
              <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                ERP Legal & Financials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-semibold text-slate-650">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Company Name</label>
                  <Input value={vendorForm.companyName} onChange={(e) => setVendorForm({...vendorForm, companyName: e.target.value})} placeholder="Legal Entity Name" className="h-8.5" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">GST Number</label>
                  <Input value={vendorForm.gstin} onChange={(e) => setVendorForm({...vendorForm, gstin: e.target.value})} placeholder="22AAAAA0000A1Z5" className="h-8.5" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">PAN Number</label>
                  <Input value={vendorForm.panNumber} onChange={(e) => setVendorForm({...vendorForm, panNumber: e.target.value})} placeholder="ABCDE1234F" className="h-8.5" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">ERP Priority (1-5)</label>
                  <Input type="number" min="1" max="5" value={vendorForm.priority} onChange={(e) => setVendorForm({...vendorForm, priority: e.target.value})} placeholder="3" className="h-8.5" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Rating (0-5)</label>
                  <Input type="number" step="0.5" min="0" max="5" value={vendorForm.rating} onChange={(e) => setVendorForm({...vendorForm, rating: e.target.value})} placeholder="4.5" className="h-8.5" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Credit Days</label>
                  <Input type="number" value={vendorForm.creditDays} onChange={(e) => setVendorForm({...vendorForm, creditDays: e.target.value})} placeholder="30" className="h-8.5" />
                </div>
                <div className="space-y-1 sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Payment Terms</label>
                  <Input value={vendorForm.paymentTerms} onChange={(e) => setVendorForm({...vendorForm, paymentTerms: e.target.value})} placeholder="e.g. 50% advance, 50% on arrival" className="h-8.5" />
                </div>
              </div>
            </div>

            {/* DYNAMIC CATEGORY-SPECIFIC OPERATIONAL PARAMETERS */}
            <div className="pt-2 border-t border-slate-100 space-y-3 mt-4">
              <h4 className="text-[11px] font-black text-[#F97316] uppercase tracking-wider flex items-center gap-1.5">
                Category-Specific Parameters ({vendorForm.type})
              </h4>

              {/* HOTEL / ACCOMMODATION PARAMETERS */}
              {vendorForm.type === "HOTEL" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-amber-50/40 p-3.5 rounded-lg border border-amber-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Accommodation Category
                    </label>
                    <Select
                      value={vendorForm.accommodationType || "HOTEL"}
                      onValueChange={(v) =>
                        setVendorForm({ ...vendorForm, accommodationType: v })
                      }
                    >
                      <SelectTrigger className="h-8.5 bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="HOTEL">Hotel</SelectItem>
                        <SelectItem value="RESORT">Resort</SelectItem>
                        <SelectItem value="HOMESTAY">Homestay</SelectItem>
                        <SelectItem value="HOSTEL">Hostel</SelectItem>
                        <SelectItem value="CAMP">Camp / Luxury Tent</SelectItem>
                        <SelectItem value="GUEST_HOUSE">Guest House</SelectItem>
                        <SelectItem value="VILLA">Villa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Star Rating
                    </label>
                    <Select
                      value={(vendorForm.starRating || 3).toString()}
                      onValueChange={(v) =>
                        setVendorForm({ ...vendorForm, starRating: v })
                      }
                    >
                      <SelectTrigger className="h-8.5 bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="1">1 Star ★</SelectItem>
                        <SelectItem value="2">2 Star ★★</SelectItem>
                        <SelectItem value="3">3 Star ★★★</SelectItem>
                        <SelectItem value="4">4 Star ★★★★</SelectItem>
                        <SelectItem value="5">5 Star ★★★★★</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Check-In Time
                    </label>
                    <Input
                      value={vendorForm.checkInTime || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          checkInTime: e.target.value,
                        })
                      }
                      placeholder="e.g. 12:00 PM"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Check-Out Time
                    </label>
                    <Input
                      value={vendorForm.checkOutTime || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          checkOutTime: e.target.value,
                        })
                      }
                      placeholder="e.g. 11:00 AM"
                      className="h-8.5 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* TRANSPORT PARAMETERS */}
              {vendorForm.type === "TRANSPORT" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-emerald-50/40 p-3.5 rounded-lg border border-emerald-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Fleet Vehicle Category
                    </label>
                    <Select
                      value={vendorForm.fleetType || ""}
                      onValueChange={(v) =>
                        setVendorForm({ ...vendorForm, fleetType: v })
                      }
                    >
                      <SelectTrigger className="h-8.5 bg-white border-slate-200">
                        <SelectValue placeholder="Select Fleet Category" />
                      </SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="Tempo Traveller">
                          Tempo Traveller Fleet
                        </SelectItem>
                        <SelectItem value="SUV / Innova">
                          SUV Fleet (Innova / Ertiga)
                        </SelectItem>
                        <SelectItem value="Volvo Luxury Bus">
                          Volvo Luxury Bus Fleet
                        </SelectItem>
                        <SelectItem value="Cab / Sedan">
                          Local Cab / Sedan
                        </SelectItem>
                        <SelectItem value="Force Urbania">
                          Force Urbania Luxury Van
                        </SelectItem>
                        <SelectItem value="Multiple Vehicles">
                          Multiple Fleet Vehicles
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Vehicle Seating Capacity
                    </label>
                    <Input
                      value={vendorForm.seatCapacity || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          seatCapacity: e.target.value,
                        })
                      }
                      placeholder="e.g. 17 or 12, 17, 26"
                      className="h-8.5 bg-white font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Permit Type
                    </label>
                    <Select
                      value={vendorForm.permitType || ""}
                      onValueChange={(v) =>
                        setVendorForm({ ...vendorForm, permitType: v })
                      }
                    >
                      <SelectTrigger className="h-8.5 bg-white border-slate-200">
                        <SelectValue placeholder="Select Permit Type" />
                      </SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="All India Tourist Permit (AITP)">
                          All India Tourist Permit (AITP)
                        </SelectItem>
                        <SelectItem value="State Permit">
                          State Commercial Permit
                        </SelectItem>
                        <SelectItem value="Local Permit">
                          Local Commercial Permit
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Driver Name & License
                    </label>
                    <Input
                      value={vendorForm.driverName || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          driverName: e.target.value,
                        })
                      }
                      placeholder="e.g. Ramesh Singh (DL-142019)"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Base Daily Tariff (₹)
                    </label>
                    <Input
                      value={vendorForm.dailyTariff || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          dailyTariff: e.target.value,
                        })
                      }
                      placeholder="e.g. 4500"
                      className="h-8.5 bg-white font-bold text-emerald-700"
                    />
                  </div>
                </div>
              )}

              {/* ACTIVITIES PARAMETERS */}
              {vendorForm.type === "ACTIVITIES" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-purple-50/40 p-3.5 rounded-lg border border-purple-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Activities Offered
                    </label>
                    <Input
                      value={vendorForm.activityType || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          activityType: e.target.value,
                        })
                      }
                      placeholder="e.g. River Rafting, Paragliding, Zipline"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Batch Capacity (Travelers / Batch)
                    </label>
                    <Input
                      type="number"
                      value={vendorForm.batchCapacity || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          batchCapacity: e.target.value,
                        })
                      }
                      placeholder="e.g. 30"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Safety Rating
                    </label>
                    <Input
                      value={vendorForm.safetyRating || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          safetyRating: e.target.value,
                        })
                      }
                      placeholder="e.g. Certified Standard A+"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Commission %
                    </label>
                    <Input
                      type="number"
                      value={vendorForm.commissionPercent || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          commissionPercent: e.target.value,
                        })
                      }
                      placeholder="e.g. 15"
                      className="h-8.5 bg-white font-bold text-purple-700"
                    />
                  </div>
                </div>
              )}

              {/* RESTAURANT PARAMETERS */}
              {vendorForm.type === "RESTAURANT" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-blue-50/40 p-3.5 rounded-lg border border-blue-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Outlet Type
                    </label>
                    <Select
                      value={vendorForm.outletType || ""}
                      onValueChange={(v) =>
                        setVendorForm({ ...vendorForm, outletType: v })
                      }
                    >
                      <SelectTrigger className="h-8.5 bg-white border-slate-200">
                        <SelectValue placeholder="Select Outlet Type" />
                      </SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="Group Buffet Hall">
                          Group Buffet Hall
                        </SelectItem>
                        <SelectItem value="Highway Dhaba">
                          Highway Dhaba
                        </SelectItem>
                        <SelectItem value="Café">Café & Restaurant</SelectItem>
                        <SelectItem value="Fine Dine">
                          Fine Dine Restaurant
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Cuisines Offered
                    </label>
                    <Input
                      value={vendorForm.cuisineTypes || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          cuisineTypes: e.target.value,
                        })
                      }
                      placeholder="e.g. North Indian, Pahadi, Veg / Jain"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Buffet Capacity (Persons)
                    </label>
                    <Input
                      type="number"
                      value={vendorForm.buffetCapacity || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          buffetCapacity: e.target.value,
                        })
                      }
                      placeholder="e.g. 60"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Avg Meal Rate / Person (₹)
                    </label>
                    <Input
                      type="number"
                      value={vendorForm.avgMealRate || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          avgMealRate: e.target.value,
                        })
                      }
                      placeholder="e.g. 250"
                      className="h-8.5 bg-white font-bold text-blue-700"
                    />
                  </div>
                </div>
              )}

              {/* GUIDE PARAMETERS */}
              {vendorForm.type === "GUIDE" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-indigo-50/40 p-3.5 rounded-lg border border-indigo-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Guide Expedition Role
                    </label>
                    <Input
                      value={vendorForm.guideRole || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          guideRole: e.target.value,
                        })
                      }
                      placeholder="e.g. Mountain Trekking Guide"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Certifications (NIM / IMF)
                    </label>
                    <Input
                      value={vendorForm.certifications || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          certifications: e.target.value,
                        })
                      }
                      placeholder="e.g. NIM Basic & Advance, IMF Certified"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Languages Spoken
                    </label>
                    <Input
                      value={vendorForm.languages || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          languages: e.target.value,
                        })
                      }
                      placeholder="e.g. English, Hindi, Pahadi"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Daily Guide Fee (₹ / Day)
                    </label>
                    <Input
                      type="number"
                      value={vendorForm.dailyGuideFee || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          dailyGuideFee: e.target.value,
                        })
                      }
                      placeholder="e.g. 2000"
                      className="h-8.5 bg-white font-bold text-indigo-700"
                    />
                  </div>
                </div>
              )}

              {/* CAMPING PARAMETERS */}
              {vendorForm.type === "CAMPING" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-pink-50/40 p-3.5 rounded-lg border border-pink-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Campsite Type
                    </label>
                    <Input
                      value={vendorForm.campsiteType || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          campsiteType: e.target.value,
                        })
                      }
                      placeholder="e.g. Riverside Luxury Tents"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Washroom Facility
                    </label>
                    <Select
                      value={vendorForm.washroomType || ""}
                      onValueChange={(v) =>
                        setVendorForm({ ...vendorForm, washroomType: v })
                      }
                    >
                      <SelectTrigger className="h-8.5 bg-white border-slate-200">
                        <SelectValue placeholder="Select Washroom Type" />
                      </SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="Attached Western Toilet">
                          Attached Western Toilet
                        </SelectItem>
                        <SelectItem value="Common Sanitary Block">
                          Common Sanitary Block
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Tent Occupancy
                    </label>
                    <Input
                      value={vendorForm.tentCapacity || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          tentCapacity: e.target.value,
                        })
                      }
                      placeholder="e.g. Twin / Triple Sharing"
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Base Tariff / Tent (₹)
                    </label>
                    <Input
                      type="number"
                      value={vendorForm.dailyTariff || ""}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          dailyTariff: e.target.value,
                        })
                      }
                      placeholder="e.g. 1800"
                      className="h-8.5 bg-white font-bold text-pink-700"
                    />
                  </div>
                </div>
              )}

              {/* OTHER VENDORS PARAMETERS */}
              {vendorForm.type === "OTHER" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-100/60 p-3.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Service Category Description
                    </label>
                    <Input
                      value={
                        vendorForm.customCategory ||
                        "Equipment Rental / Porter Service"
                      }
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          customCategory: e.target.value,
                        })
                      }
                      className="h-8.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                      Custom Tariff Rate (₹)
                    </label>
                    <Input
                      type="number"
                      value={vendorForm.dailyTariff || "1000"}
                      onChange={(e) =>
                        setVendorForm({
                          ...vendorForm,
                          dailyTariff: e.target.value,
                        })
                      }
                      className="h-8.5 bg-white font-bold text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 border-t pt-3 border-slate-100">
            <Button
              variant="outline"
              onClick={() => setVendorModalOpen(false)}
              className="rounded h-8.5 cursor-pointer text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVendor}
              className="bg-[#F97316] hover:bg-[#E05E00] text-white rounded h-8.5 px-4 cursor-pointer text-xs font-bold"
            >
              Save {vendorForm.type} Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rate Form Modal */}
      <Dialog open={rateModalOpen} onOpenChange={setRateModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">
              Add Rate Agreement for {selectedVendor?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Conditional form fields based on selected vendor type */}
          {selectedVendor?.type === "HOTEL" && (
            <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-semibold text-slate-650">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Room Category *
                </label>
                <Input
                  value={roomRateForm.roomCategory}
                  onChange={(e) =>
                    setRoomRateForm({
                      ...roomRateForm,
                      roomCategory: e.target.value,
                    })
                  }
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Sharing Option *
                </label>
                <Select
                  value={roomRateForm.sharingType}
                  onValueChange={(v) =>
                    setRoomRateForm({ ...roomRateForm, sharingType: v })
                  }
                >
                  <SelectTrigger className="h-8.5 border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs bg-white">
                    <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                    <SelectItem value="TRIPLE">TRIPLE</SelectItem>
                    <SelectItem value="QUAD">QUAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Standard Occupancy *
                </label>
                <Input
                  type="number"
                  value={roomRateForm.standardOccupancy}
                  onChange={(e) =>
                    setRoomRateForm({
                      ...roomRateForm,
                      standardOccupancy: e.target.value,
                    })
                  }
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Maximum Occupancy *
                </label>
                <Input
                  type="number"
                  value={roomRateForm.maximumOccupancy}
                  onChange={(e) =>
                    setRoomRateForm({
                      ...roomRateForm,
                      maximumOccupancy: e.target.value,
                    })
                  }
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Rate (INR) *
                </label>
                <Input
                  type="number"
                  value={roomRateForm.amount}
                  onChange={(e) =>
                    setRoomRateForm({ ...roomRateForm, amount: e.target.value })
                  }
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Meal Plan *
                </label>
                <Select
                  value={roomRateForm.mealPlan}
                  onValueChange={(v) =>
                    setRoomRateForm({ ...roomRateForm, mealPlan: v })
                  }
                >
                  <SelectTrigger className="h-8.5 border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs bg-white">
                    <SelectItem value="EP">EP</SelectItem>
                    <SelectItem value="CP">CP</SelectItem>
                    <SelectItem value="MAP">MAP</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {selectedVendor?.type === "TRANSPORT" && (
            <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-semibold text-slate-650">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Route Name *
                </label>
                <Input
                  value={transportRateForm.routeName}
                  placeholder="e.g. Chandigarh-Shimla-Kaza"
                  onChange={(e) =>
                    setTransportRateForm({
                      ...transportRateForm,
                      routeName: e.target.value,
                    })
                  }
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Vehicle Type *
                </label>
                <Input
                  value={transportRateForm.vehicleType}
                  onChange={(e) =>
                    setTransportRateForm({
                      ...transportRateForm,
                      vehicleType: e.target.value,
                    })
                  }
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Seat Capacity *
                </label>
                <Input
                  type="number"
                  value={transportRateForm.seatCapacity}
                  onChange={(e) =>
                    setTransportRateForm({
                      ...transportRateForm,
                      seatCapacity: e.target.value,
                    })
                  }
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">
                  Package Amount *
                </label>
                <Input
                  type="number"
                  value={transportRateForm.amount}
                  onChange={(e) =>
                    setTransportRateForm({
                      ...transportRateForm,
                      amount: e.target.value,
                    })
                  }
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setRateModalOpen(false)}
              className="rounded h-8.5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRate}
              className="bg-[#F97316] hover:bg-[#E05E00] text-white rounded h-8.5 px-4 cursor-pointer"
            >
              Register Rate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">
              Log Vendor Payment Payout
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 text-xs font-semibold text-slate-650">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">
                Vendor *
              </label>
              <Select
                value={paymentForm.vendorId}
                onValueChange={(v) =>
                  setPaymentForm({ ...paymentForm, vendorId: v })
                }
              >
                <SelectTrigger className="h-8.5 border-slate-200 bg-white">
                  <SelectValue placeholder="Select Vendor" />
                </SelectTrigger>
                <SelectContent className="text-xs bg-white font-semibold">
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">
                Invoice Amount (INR) *
              </label>
              <Input
                type="number"
                value={paymentForm.invoiceAmount}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    invoiceAmount: e.target.value,
                  })
                }
                className="h-8.5 bg-white border-slate-200 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">
                Advance Paid (INR)
              </label>
              <Input
                type="number"
                value={paymentForm.advanceAmount}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    advanceAmount: e.target.value,
                  })
                }
                className="h-8.5 bg-white border-slate-200 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">
                Balance Paid Amount (INR)
              </label>
              <Input
                type="number"
                value={paymentForm.paidAmount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paidAmount: e.target.value })
                }
                className="h-8.5 bg-white border-slate-200 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">
                Due Date
              </label>
              <Input
                type="date"
                value={paymentForm.dueDate}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, dueDate: e.target.value })
                }
                className="h-8.5 bg-white border-slate-200 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">
                Payment Mode
              </label>
              <Select
                value={paymentForm.paymentMode}
                onValueChange={(v) =>
                  setPaymentForm({ ...paymentForm, paymentMode: v })
                }
              >
                <SelectTrigger className="h-8.5 border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs bg-white font-semibold">
                  <SelectItem value="BANK_TRANSFER">BANK TRANSFER</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CASH">CASH</SelectItem>
                  <SelectItem value="CHEQUE">CHEQUE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
              className="rounded h-8.5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePayment}
              className="bg-[#F97316] hover:bg-[#E05E00] text-white rounded h-8.5 px-4 cursor-pointer"
            >
              Log Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
