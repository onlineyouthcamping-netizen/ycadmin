import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus, Pencil, Trash2, Building2, Truck, UserCheck,
  UtensilsCrossed, HelpCircle, Phone, Mail, MapPin,
  Search, Copy, RotateCw, CheckCircle2, XCircle,
  MoreVertical, Filter, FileText, IndianRupee, ShieldCheck,
  Calculator, Receipt, ArrowRight, Settings, LayoutGrid, Hotel, Bus, Compass, Eye, ChevronLeft
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

// Category Tab List
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "accommodation", label: "Accommodation", icon: Hotel },
  { id: "transport", label: "Transport", icon: Bus },
  { id: "activities", label: "Activities", icon: Compass },
  { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { id: "guides", label: "Guides", icon: UserCheck },
  { id: "other", label: "Other Vendors", icon: Building2 },
  { id: "rates", label: "Rates Manager", icon: Settings },
  { id: "payments", label: "Payments", icon: IndianRupee },
];

export default function VendorDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get("category") || searchParams.get("tab") || "dashboard";
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
  const [pagination, setPagination] = useState<any>({ total: 0, page: 1, limit: 10, pages: 1, startIndex: 0, endIndex: 0 });

  // Selected entities for Rates view
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

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
    gstin: "",
    panNumber: "",
    state: "Himachal Pradesh",
    city: "",
    area: "",
    address: "",
    paymentTerms: "",
    creditDays: "30",
    notes: "",
    contacts: [],
  });

  // Rates Form
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateType, setRateType] = useState<"ROOM" | "TRANSPORT" | "FOOD" | "GUIDE" | "MISC">("ROOM");
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
      const catToUse = categoryOverride !== undefined ? categoryOverride : currentCategory;
      let catParam = "ALL";
      if (catToUse === "accommodation") catParam = "HOTEL,RESORT,HOMESTAY,HOSTEL,GUEST_HOUSE,VILLA,CAMP,COTTAGE,APARTMENT,DORMITORY,LUXURY_TENT";
      else if (catToUse === "transport") catParam = "TRANSPORT";
      else if (catToUse === "activities") catParam = "ACTIVITIES";
      else if (catToUse === "restaurants") catParam = "RESTAURANT,FOOD,MEALS";
      else if (catToUse === "guides") catParam = "GUIDE";
      else if (catToUse === "camping") catParam = "CAMPING,CAMP";
      else if (catToUse === "other") catParam = "OTHER";

      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.set("search", searchTerm);
      if (catParam !== "ALL") queryParams.set("type", catParam);
      if (filterDestination !== "ALL") queryParams.set("destination", filterDestination);
      if (filterStatus !== "ALL") queryParams.set("isActive", filterStatus === "ACTIVE" ? "true" : "false");
      queryParams.set("page", targetPage.toString());
      queryParams.set("limit", "10");

      const [res, analyticsRes, destRes] = await Promise.all([
        api.get(`/vendors/directory?${queryParams.toString()}`),
        api.get("/vendors/directory/analytics").catch(() => ({ data: { data: null } })),
        api.get("/vendors/directory/destinations").catch(() => ({ data: { data: [] } }))
      ]);

      const vendorData = res.data?.data || [];
      const pag = res.data?.pagination || { total: vendorData.length, page: 1, limit: 10, pages: 1, startIndex: vendorData.length > 0 ? 1 : 0, endIndex: vendorData.length };

      setVendors(vendorData);
      setPagination(pag);
      if (analyticsRes.data?.data) setAnalytics(analyticsRes.data.data);
      if (destRes.data?.data) setDestinationsList(destRes.data.data);

      const payRes = await api.get("/vendors/directory/payments").catch(() => ({ data: { data: [] } }));
      setPaymentsList(payRes.data?.data || []);
    } catch (err: any) {
      toast.error("Failed to load directory data: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setViewingDetailVendor(null);
    loadData(1, currentCategory);
  }, [currentCategory, searchParams, filterStatus, filterDestination]);

  const handleSaveVendor = async (force: boolean = false) => {
    if (!vendorForm.name || !vendorForm.type) {
      toast.error("Please fill in Vendor Name and Category");
      return;
    }

    // Pre-save duplicate check
    if (!editingVendor && !force) {
      const match = vendors.find(v => 
        (v.name && v.name.toLowerCase() === vendorForm.name.toLowerCase()) ||
        (vendorForm.contactNumber && (v.contactNumber === vendorForm.contactNumber || v.phone === vendorForm.contactNumber)) ||
        (vendorForm.gstin && v.gstin && v.gstin.toLowerCase() === vendorForm.gstin.toLowerCase())
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
        await api.post("/vendors/directory", vendorForm);
        toast.success("Vendor created successfully");
      }
      setVendorModalOpen(false);
      setDuplicateDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error("Failed to save vendor: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this vendor?")) return;
    try {
      await api.delete(`/vendors/directory/${id}`);
      toast.success("Vendor deactivated");
      loadData();
    } catch (err: any) {
      toast.error("Deactivation failed: " + err.message);
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
      const hotel = vendors.find(v => v.type === "HOTEL" && v.roomRates.length > 0);
      const transport = vendors.find(v => v.type === "TRANSPORT" && v.transportRates.length > 0);

      const payload = {
        paxCount: parseInt(costingPax),
        contingencyPercent: parseInt(costingContingency),
        accommodations: hotel ? [
          {
            sharingType: hotel.roomRates[0].sharingType,
            rateBasis: hotel.roomRates[0].rateBasis,
            amount: hotel.roomRates[0].amount,
            paxCount: parseInt(costingPax),
            numberOfNights: 3,
            maxRoomCapacity: hotel.roomRates[0].maximumOccupancy,
          }
        ] : [],
        transports: transport ? [
          {
            vehicleType: transport.transportRates[0].vehicleType,
            seatCapacity: transport.transportRates[0].seatCapacity,
            amount: transport.transportRates[0].amount,
            paxCount: parseInt(costingPax),
            rateBasis: transport.transportRates[0].rateBasis,
          }
        ] : [],
      };

      const res = await api.post("/vendors/directory/costing/calculate", payload);
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

  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[8px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {currentCategory !== "dashboard" && (
            <Button
              onClick={() => setSearchParams({ category: "dashboard" })}
              variant="outline"
              className="h-8.5 px-3 text-slate-700 border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" /> Back to Dashboard
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">Vendor Management Directory</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Enterprise Partner Management & Operation Workspace</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            setEditingVendor(null);
            let defaultType = "HOTEL";
            if (currentCategory === "transport") defaultType = "TRANSPORT";
            else if (currentCategory === "activities") defaultType = "ACTIVITIES";
            else if (currentCategory === "restaurants") defaultType = "RESTAURANT";
            else if (currentCategory === "guides") defaultType = "GUIDE";
            else if (currentCategory === "camping") defaultType = "CAMPING";
            else if (currentCategory === "other") defaultType = "OTHER";

            setVendorForm({
              vendorCode: "", name: "", legalName: "", type: defaultType, contactPerson: "", contactNumber: "",
              alternateNumber: "", whatsappNumber: "", email: "", gstin: "", panNumber: "",
              state: "Himachal Pradesh", city: "", area: "", address: "", paymentTerms: "", creditDays: "30",
              notes: "", contacts: [], accommodationType: "HOTEL", starRating: "3", checkInTime: "12:00 PM", checkOutTime: "11:00 AM",
              fleetType: "Tempo Traveller", permitType: "All India Tourist Permit (AITP)", activityType: "River Rafting, Trekking",
              outletType: "Group Buffet Hall", guideRole: "Mountain Trekking Guide", campsiteType: "Riverside Tents"
            });
            setVendorModalOpen(true);
          }} className="bg-[#F97316] hover:bg-[#E05E00] text-white text-xs font-bold px-4 py-2.5 rounded">
            <Plus className="w-4 h-4 mr-1.5" />
            Add New Vendor
          </Button>
          <Button onClick={() => setPaymentModalOpen(true)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded">
            <Plus className="w-4 h-4 mr-1.5" />
            Log Payment
          </Button>
        </div>
      </div>


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

          {currentCategory === "accommodation" && (
            <AccommodationModuleView
              vendors={vendors}
              destinations={destinationsList}
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
              onAddVendor={() => { setEditingVendor(null); setVendorModalOpen(true); }}
              onEditVendor={(v) => { setEditingVendor(v); setVendorForm({ ...v }); setVendorModalOpen(true); }}
              onDeleteVendor={(id) => handleDeleteVendor(id)}
            />
          )}

          {currentCategory === "transport" && (
            <TransportModuleView
              vendors={vendors}
              destinations={destinationsList}
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
              onAddVendor={() => { setEditingVendor(null); setVendorModalOpen(true); }}
              onEditVendor={(v) => { setEditingVendor(v); setVendorForm({ ...v }); setVendorModalOpen(true); }}
              onDeleteVendor={(id) => handleDeleteVendor(id)}
            />
          )}

          {currentCategory === "activities" && (
            <ActivitiesModuleView
              vendors={vendors}
              destinations={destinationsList}
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
              onAddVendor={() => { setEditingVendor(null); setVendorModalOpen(true); }}
              onEditVendor={(v) => { setEditingVendor(v); setVendorForm({ ...v }); setVendorModalOpen(true); }}
              onDeleteVendor={(id) => handleDeleteVendor(id)}
            />
          )}

          {currentCategory === "restaurants" && (
            <RestaurantsModuleView
              vendors={vendors}
              destinations={destinationsList}
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
              onAddVendor={() => { setEditingVendor(null); setVendorModalOpen(true); }}
              onEditVendor={(v) => { setEditingVendor(v); setVendorForm({ ...v }); setVendorModalOpen(true); }}
              onDeleteVendor={(id) => handleDeleteVendor(id)}
            />
          )}

          {currentCategory === "guides" && (
            <GuidesModuleView
              vendors={vendors}
              destinations={destinationsList}
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
              onAddVendor={() => { setEditingVendor(null); setVendorModalOpen(true); }}
              onEditVendor={(v) => { setEditingVendor(v); setVendorForm({ ...v }); setVendorModalOpen(true); }}
              onDeleteVendor={(id) => handleDeleteVendor(id)}
            />
          )}

          {currentCategory === "camping" && (
            <CampingModuleView
              vendors={vendors}
              destinations={destinationsList}
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
              onAddVendor={() => { setEditingVendor(null); setVendorModalOpen(true); }}
              onEditVendor={(v) => { setEditingVendor(v); setVendorForm({ ...v }); setVendorModalOpen(true); }}
              onDeleteVendor={(id) => handleDeleteVendor(id)}
            />
          )}

          {currentCategory === "other" && (
            <OtherVendorsModuleView
              vendors={vendors}
              destinations={destinationsList}
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
              onAddVendor={() => { setEditingVendor(null); setVendorModalOpen(true); }}
              onEditVendor={(v) => { setEditingVendor(v); setVendorForm({ ...v }); setVendorModalOpen(true); }}
              onDeleteVendor={(id) => handleDeleteVendor(id)}
            />
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

      {currentCategory === "rates" && (
        <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Rates Management Dashboard</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Select a vendor below to manage active rate agreements.</p>
            </div>
            {selectedVendor && (
              <Button onClick={() => setRateModalOpen(true)} className="bg-[#F97316] hover:bg-[#E05E00] text-white text-xs font-bold h-8.5 rounded">
                <Plus className="w-4 h-4 mr-1.5" />
                Create New Rate
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 border-r border-slate-200 pr-4 space-y-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Vendors List</h4>
              {vendors.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVendor(v)}
                  className={cn(
                    "w-full text-left p-2.5 text-xs font-semibold rounded transition-all cursor-pointer flex justify-between items-center",
                    selectedVendor?.id === v.id ? "bg-slate-100 text-slate-900 border-l-4 border-[#F97316]" : "text-slate-650 hover:bg-slate-50"
                  )}
                >
                  <span>{v.name}</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase">{v.type}</span>
                </button>
              ))}
            </div>

            <div className="md:col-span-3 space-y-4 pl-2">
              {selectedVendor ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-slate-850">{selectedVendor.name} Active Rates</h3>
                  </div>

                  {selectedVendor.type === "HOTEL" && (
                    <div className="border border-slate-200 rounded-[6px] overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-[10px] uppercase">
                          <tr>
                            <th className="p-3">Room Category</th>
                            <th className="p-3">Sharing</th>
                            <th className="p-3 text-right">Standard Rate</th>
                            <th className="p-3 text-right">Meal Plan</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {selectedVendor.roomRates?.map((r: any) => (
                            <tr key={r.id}>
                              <td className="p-3 font-bold text-slate-800">{r.roomCategory}</td>
                              <td className="p-3 font-mono">{r.sharingType}</td>
                              <td className="p-3 text-right text-[#F97316]">₹{r.amount}</td>
                              <td className="p-3 text-right font-mono">{r.mealPlan}</td>
                              <td className="p-3 text-right"><span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-150">ACTIVE</span></td>
                            </tr>
                          ))}
                          {(!selectedVendor.roomRates || selectedVendor.roomRates.length === 0) && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">No rates registered. Click Create New Rate to add one.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedVendor.type === "TRANSPORT" && (
                    <div className="border border-slate-200 rounded-[6px] overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-[10px] uppercase">
                          <tr>
                            <th className="p-3">Route</th>
                            <th className="p-3">Vehicle</th>
                            <th className="p-3 text-center">Seat Capacity</th>
                            <th className="p-3 text-right">Package Cost</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {selectedVendor.transportRates?.map((r: any) => (
                            <tr key={r.id}>
                              <td className="p-3 font-bold text-slate-800">{r.routeName}</td>
                              <td className="p-3 font-mono">{r.vehicleType}</td>
                              <td className="p-3 text-center font-mono">{r.seatCapacity}</td>
                              <td className="p-3 text-right text-[#F97316]">₹{r.amount}</td>
                              <td className="p-3 text-right"><span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-150">ACTIVE</span></td>
                            </tr>
                          ))}
                          {(!selectedVendor.transportRates || selectedVendor.transportRates.length === 0) && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">No transport rates registered. Click Create New Rate to add one.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-16 border border-dashed border-slate-200 rounded text-center text-slate-400 font-semibold bg-slate-50/20">
                  Select a vendor from the sidebar list to manage active rate agreements.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentCategory === "costing" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-[8px] border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Costing Parameters</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Group Size (Pax Count)</label>
                <Input
                  type="number"
                  value={costingPax}
                  onChange={e => setCostingPax(e.target.value)}
                  className="h-8.5 text-xs font-semibold text-slate-700 bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Contingency percent (%)</label>
                <Input
                  type="number"
                  value={costingContingency}
                  onChange={e => setCostingContingency(e.target.value)}
                  className="h-8.5 text-xs font-semibold text-slate-700 bg-white"
                />
              </div>
              <Button onClick={runCosting} className="w-full bg-[#F97316] hover:bg-[#E05E00] text-white text-xs font-bold h-9 rounded mt-4 cursor-pointer">
                Run Costing Engine
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-[8px] border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Per-Person Cost Results</h2>
            {costingResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-[6px] border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-450 uppercase block">Base Operations Cost</span>
                    <span className="text-xl font-bold text-slate-800">₹{costingResult.baseVendorCost}</span>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-[6px] border border-[#FFF0E6]">
                    <span className="text-[10px] font-bold text-[#F97316] uppercase block">Cost Per Person</span>
                    <span className="text-xl font-bold text-[#F97316]">₹{costingResult.costPerPerson}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10.5px] font-black text-slate-650 uppercase tracking-wider">Rooms Distribution Splitting Result</h4>
                  {costingResult.allocations.accommodation?.map((acc: any, i: number) => (
                    <div key={i} className="text-xs font-semibold text-slate-750 bg-slate-50 border border-slate-200 p-3 rounded">
                      Rooms count allocated: <span className="font-mono text-[#F97316]">{acc.numberOfRooms} rooms</span> | Pax split: <span className="font-mono text-[#F97316]">{acc.roomDistribution?.join(" + ")}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button onClick={async () => {
                    try {
                      await api.post("/vendors/directory/costing/snapshot", {
                        tripId: "spiti-valley-road-trip",
                        paxCount: parseInt(costingPax),
                        calculationData: costingResult
                      });
                      toast.success("Costing snapshot safely archived!");
                    } catch (err: any) {
                      toast.error("Snapshot failed: " + err.message);
                    }
                  }} className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold h-9 rounded cursor-pointer">
                    Save Cost Snapshot
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-16 border border-dashed border-slate-200 rounded text-center text-slate-400 font-semibold bg-slate-50/20">
                Click Run Costing Engine to compile automatic per-person costing splits.
              </div>
            )}
          </div>
        </div>
      )}

      {currentCategory === "payments" && (
        <div className="bg-white p-6 rounded-[8px] border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Vendor Payments Ledger</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Logs advances, balance payouts, and remaining balances per vendor.</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-[6px] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-[10px] uppercase">
                <tr>
                  <th className="p-3">Vendor</th>
                  <th className="p-3 text-right">Invoice Amount</th>
                  <th className="p-3 text-right">Advance Amount</th>
                  <th className="p-3 text-right">Paid Amount</th>
                  <th className="p-3 text-right">Remaining Balance</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {paymentsList.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/20">
                    <td className="p-3 font-bold text-slate-800">{p.vendor?.name}</td>
                    <td className="p-3 text-right">₹{p.invoiceAmount}</td>
                    <td className="p-3 text-right">₹{p.advanceAmount}</td>
                    <td className="p-3 text-right">₹{p.paidAmount}</td>
                    <td className="p-3 text-right text-rose-500 font-mono">₹{p.remainingBalance}</td>
                    <td className="p-3 text-right">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border",
                        p.paymentStatus === "PAID" ? "bg-green-50 text-green-600 border-green-150" : "bg-amber-50 text-amber-600 border-amber-150"
                      )}>
                        {p.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {paymentsList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">No payments logged in directory. Log a payment above to begin.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vendor Form Modal — Dynamic Category Specific Fields */}
      <Dialog open={vendorModalOpen} onOpenChange={setVendorModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-xl p-6 shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center justify-between border-b pb-2 border-slate-100">
              <span>{editingVendor ? "Edit Vendor Details" : "Register New Directory Vendor"}</span>
              <span className="text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                Category: {vendorForm.type}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Basic Universal Fields */}
          <div className="space-y-4 mt-3">
            <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Universal Vendor Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-semibold text-slate-650">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Vendor Name *</label>
                <Input
                  value={vendorForm.name}
                  onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="e.g. Hotel Mountain View / Shashi Transport"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Vendor Category / Type *</label>
                <Select value={vendorForm.type} onValueChange={v => setVendorForm({ ...vendorForm, type: v })}>
                  <SelectTrigger className="h-8.5 border-slate-200 bg-white font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs bg-white">
                    <SelectItem value="HOTEL">ACCOMMODATION & STAYS</SelectItem>
                    <SelectItem value="TRANSPORT">TRANSPORT & FLEET</SelectItem>
                    <SelectItem value="ACTIVITIES">ACTIVITIES & ADVENTURE</SelectItem>
                    <SelectItem value="RESTAURANT">RESTAURANTS & MEALS</SelectItem>
                    <SelectItem value="GUIDE">GUIDES & EXPEDITIONS</SelectItem>
                    <SelectItem value="OTHER">OTHER VENDORS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Vendor Code</label>
                <Input
                  value={vendorForm.vendorCode}
                  placeholder="Auto-generated if empty"
                  onChange={e => setVendorForm({ ...vendorForm, vendorCode: e.target.value })}
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Contact Person *</label>
                <Input
                  value={vendorForm.contactPerson}
                  onChange={e => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                  placeholder="e.g. Suresh Kumar"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Primary Phone *</label>
                <Input
                  value={vendorForm.contactNumber}
                  onChange={e => setVendorForm({ ...vendorForm, contactNumber: e.target.value })}
                  placeholder="+91 98166 00000"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Email Address *</label>
                <Input
                  value={vendorForm.email}
                  onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })}
                  placeholder="vendor@company.com"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">City *</label>
                <Input
                  value={vendorForm.city}
                  onChange={e => setVendorForm({ ...vendorForm, city: e.target.value })}
                  placeholder="Manali / Shimla / Kasol"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">State *</label>
                <Input
                  value={vendorForm.state}
                  onChange={e => setVendorForm({ ...vendorForm, state: e.target.value })}
                  placeholder="Himachal Pradesh"
                  className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
                />
              </div>
            </div>

            {/* DYNAMIC CATEGORY-SPECIFIC OPERATIONAL PARAMETERS */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <h4 className="text-[11px] font-black text-[#F97316] uppercase tracking-wider flex items-center gap-1.5">
                Category-Specific Parameters ({vendorForm.type})
              </h4>

              {/* HOTEL / ACCOMMODATION PARAMETERS */}
              {vendorForm.type === "HOTEL" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-amber-50/40 p-3.5 rounded-lg border border-amber-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Accommodation Category</label>
                    <Select value={vendorForm.accommodationType || "HOTEL"} onValueChange={v => setVendorForm({ ...vendorForm, accommodationType: v })}>
                      <SelectTrigger className="h-8.5 bg-white border-slate-200"><SelectValue /></SelectTrigger>
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
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Star Rating</label>
                    <Select value={(vendorForm.starRating || 3).toString()} onValueChange={v => setVendorForm({ ...vendorForm, starRating: v })}>
                      <SelectTrigger className="h-8.5 bg-white border-slate-200"><SelectValue /></SelectTrigger>
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
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Check-In Time</label>
                    <Input value={vendorForm.checkInTime || "12:00 PM"} onChange={e => setVendorForm({ ...vendorForm, checkInTime: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Check-Out Time</label>
                    <Input value={vendorForm.checkOutTime || "11:00 AM"} onChange={e => setVendorForm({ ...vendorForm, checkOutTime: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                </div>
              )}

              {/* TRANSPORT PARAMETERS */}
              {vendorForm.type === "TRANSPORT" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-emerald-50/40 p-3.5 rounded-lg border border-emerald-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Fleet Vehicle Category</label>
                    <Select value={vendorForm.fleetType || "Tempo Traveller"} onValueChange={v => setVendorForm({ ...vendorForm, fleetType: v })}>
                      <SelectTrigger className="h-8.5 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="Tempo Traveller">Tempo Traveller Fleet</SelectItem>
                        <SelectItem value="SUV / Innova">SUV Fleet (Innova / Ertiga)</SelectItem>
                        <SelectItem value="Volvo Luxury Bus">Volvo Luxury Bus Fleet</SelectItem>
                        <SelectItem value="Cab / Sedan">Local Cab / Sedan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Vehicle Seating Capacity *</label>
                    <Input
                      type="number"
                      value={vendorForm.seatCapacity || "17"}
                      onChange={e => setVendorForm({ ...vendorForm, seatCapacity: e.target.value })}
                      placeholder="e.g. 12, 17, 26, 45"
                      className="h-8.5 bg-white font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Permit Type</label>
                    <Select value={vendorForm.permitType || "All India Tourist Permit (AITP)"} onValueChange={v => setVendorForm({ ...vendorForm, permitType: v })}>
                      <SelectTrigger className="h-8.5 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="All India Tourist Permit (AITP)">All India Tourist Permit (AITP)</SelectItem>
                        <SelectItem value="State Permit">State Commercial Permit</SelectItem>
                        <SelectItem value="Local Permit">Local Commercial Permit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Driver Name & License</label>
                    <Input value={vendorForm.driverName || ""} onChange={e => setVendorForm({ ...vendorForm, driverName: e.target.value })} placeholder="e.g. Ramesh Singh (DL-142019)" className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Base Daily Tariff (₹)</label>
                    <Input type="number" value={vendorForm.dailyTariff || ""} onChange={e => setVendorForm({ ...vendorForm, dailyTariff: e.target.value })} placeholder="e.g. 4500" className="h-8.5 bg-white font-bold text-emerald-700" />
                  </div>
                </div>
              )}

              {/* ACTIVITIES PARAMETERS */}
              {vendorForm.type === "ACTIVITIES" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-purple-50/40 p-3.5 rounded-lg border border-purple-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Activities Offered</label>
                    <Input value={vendorForm.activityType || "River Rafting, Paragliding, Zipline"} onChange={e => setVendorForm({ ...vendorForm, activityType: e.target.value })} placeholder="Rafting, Paragliding, Trekking" className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Batch Capacity (Travelers / Batch)</label>
                    <Input type="number" value={vendorForm.batchCapacity || "30"} onChange={e => setVendorForm({ ...vendorForm, batchCapacity: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Safety Rating</label>
                    <Input value={vendorForm.safetyRating || "Certified Standard A+"} onChange={e => setVendorForm({ ...vendorForm, safetyRating: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Commission %</label>
                    <Input type="number" value={vendorForm.commissionPercent || "15"} onChange={e => setVendorForm({ ...vendorForm, commissionPercent: e.target.value })} className="h-8.5 bg-white font-bold text-purple-700" />
                  </div>
                </div>
              )}

              {/* RESTAURANT PARAMETERS */}
              {vendorForm.type === "RESTAURANT" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-blue-50/40 p-3.5 rounded-lg border border-blue-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Outlet Type</label>
                    <Select value={vendorForm.outletType || "Group Buffet Hall"} onValueChange={v => setVendorForm({ ...vendorForm, outletType: v })}>
                      <SelectTrigger className="h-8.5 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="Group Buffet Hall">Group Buffet Hall</SelectItem>
                        <SelectItem value="Highway Dhaba">Highway Dhaba</SelectItem>
                        <SelectItem value="Café">Café & Restaurant</SelectItem>
                        <SelectItem value="Fine Dine">Fine Dine Restaurant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Cuisines Offered</label>
                    <Input value={vendorForm.cuisineTypes || "North Indian, Pahadi, Veg / Jain"} onChange={e => setVendorForm({ ...vendorForm, cuisineTypes: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Buffet Capacity (Persons)</label>
                    <Input type="number" value={vendorForm.buffetCapacity || "60"} onChange={e => setVendorForm({ ...vendorForm, buffetCapacity: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Avg Meal Rate / Person (₹)</label>
                    <Input type="number" value={vendorForm.avgMealRate || "250"} onChange={e => setVendorForm({ ...vendorForm, avgMealRate: e.target.value })} className="h-8.5 bg-white font-bold text-blue-700" />
                  </div>
                </div>
              )}

              {/* GUIDE PARAMETERS */}
              {vendorForm.type === "GUIDE" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-indigo-50/40 p-3.5 rounded-lg border border-indigo-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Guide Expedition Role</label>
                    <Input value={vendorForm.guideRole || "Mountain Trekking Guide"} onChange={e => setVendorForm({ ...vendorForm, guideRole: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Certifications (NIM / IMF)</label>
                    <Input value={vendorForm.certifications || "NIM Basic & Advance, IMF Certified"} onChange={e => setVendorForm({ ...vendorForm, certifications: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Languages Spoken</label>
                    <Input value={vendorForm.languages || "English, Hindi, Pahadi"} onChange={e => setVendorForm({ ...vendorForm, languages: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Daily Guide Fee (₹ / Day)</label>
                    <Input type="number" value={vendorForm.dailyGuideFee || "2000"} onChange={e => setVendorForm({ ...vendorForm, dailyGuideFee: e.target.value })} className="h-8.5 bg-white font-bold text-indigo-700" />
                  </div>
                </div>
              )}

              {/* CAMPING PARAMETERS */}
              {vendorForm.type === "CAMPING" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-pink-50/40 p-3.5 rounded-lg border border-pink-200/60 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Campsite Type</label>
                    <Input value={vendorForm.campsiteType || "Riverside Luxury Tents"} onChange={e => setVendorForm({ ...vendorForm, campsiteType: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Washroom Facility</label>
                    <Select value={vendorForm.washroomType || "Attached Western Toilet"} onValueChange={v => setVendorForm({ ...vendorForm, washroomType: v })}>
                      <SelectTrigger className="h-8.5 bg-white border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent className="text-xs bg-white">
                        <SelectItem value="Attached Western Toilet">Attached Western Toilet</SelectItem>
                        <SelectItem value="Common Sanitary Block">Common Sanitary Block</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Tent Occupancy</label>
                    <Input value={vendorForm.tentCapacity || "Twin / Triple Sharing"} onChange={e => setVendorForm({ ...vendorForm, tentCapacity: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Base Tariff / Tent (₹)</label>
                    <Input type="number" value={vendorForm.dailyTariff || "1800"} onChange={e => setVendorForm({ ...vendorForm, dailyTariff: e.target.value })} className="h-8.5 bg-white font-bold text-pink-700" />
                  </div>
                </div>
              )}

              {/* OTHER VENDORS PARAMETERS */}
              {vendorForm.type === "OTHER" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-100/60 p-3.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Service Category Description</label>
                    <Input value={vendorForm.customCategory || "Equipment Rental / Porter Service"} onChange={e => setVendorForm({ ...vendorForm, customCategory: e.target.value })} className="h-8.5 bg-white" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Custom Tariff Rate (₹)</label>
                    <Input type="number" value={vendorForm.dailyTariff || "1000"} onChange={e => setVendorForm({ ...vendorForm, dailyTariff: e.target.value })} className="h-8.5 bg-white font-bold text-slate-800" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 border-t pt-3 border-slate-100">
            <Button variant="outline" onClick={() => setVendorModalOpen(false)} className="rounded h-8.5 cursor-pointer text-xs font-bold">Cancel</Button>
            <Button onClick={handleSaveVendor} className="bg-[#F97316] hover:bg-[#E05E00] text-white rounded h-8.5 px-4 cursor-pointer text-xs font-bold">Save {vendorForm.type} Vendor</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rate Form Modal */}
      <Dialog open={rateModalOpen} onOpenChange={setRateModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">Add Rate Agreement for {selectedVendor?.name}</DialogTitle>
          </DialogHeader>

          {/* Conditional form fields based on selected vendor type */}
          {selectedVendor?.type === "HOTEL" && (
            <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-semibold text-slate-650">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Room Category *</label>
                <Input
                  value={roomRateForm.roomCategory}
                  onChange={e => setRoomRateForm({ ...roomRateForm, roomCategory: e.target.value })}
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Sharing Option *</label>
                <Select value={roomRateForm.sharingType} onValueChange={v => setRoomRateForm({ ...roomRateForm, sharingType: v })}>
                  <SelectTrigger className="h-8.5 border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-xs bg-white">
                    <SelectItem value="DOUBLE">DOUBLE</SelectItem>
                    <SelectItem value="TRIPLE">TRIPLE</SelectItem>
                    <SelectItem value="QUAD">QUAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Standard Occupancy *</label>
                <Input
                  type="number"
                  value={roomRateForm.standardOccupancy}
                  onChange={e => setRoomRateForm({ ...roomRateForm, standardOccupancy: e.target.value })}
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Maximum Occupancy *</label>
                <Input
                  type="number"
                  value={roomRateForm.maximumOccupancy}
                  onChange={e => setRoomRateForm({ ...roomRateForm, maximumOccupancy: e.target.value })}
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Rate (INR) *</label>
                <Input
                  type="number"
                  value={roomRateForm.amount}
                  onChange={e => setRoomRateForm({ ...roomRateForm, amount: e.target.value })}
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Meal Plan *</label>
                <Select value={roomRateForm.mealPlan} onValueChange={v => setRoomRateForm({ ...roomRateForm, mealPlan: v })}>
                  <SelectTrigger className="h-8.5 border-slate-200 bg-white"><SelectValue /></SelectTrigger>
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
                <label className="text-[10px] font-bold text-slate-550 uppercase">Route Name *</label>
                <Input
                  value={transportRateForm.routeName}
                  placeholder="e.g. Chandigarh-Shimla-Kaza"
                  onChange={e => setTransportRateForm({ ...transportRateForm, routeName: e.target.value })}
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Vehicle Type *</label>
                <Input
                  value={transportRateForm.vehicleType}
                  onChange={e => setTransportRateForm({ ...transportRateForm, vehicleType: e.target.value })}
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Seat Capacity *</label>
                <Input
                  type="number"
                  value={transportRateForm.seatCapacity}
                  onChange={e => setTransportRateForm({ ...transportRateForm, seatCapacity: e.target.value })}
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-550 uppercase">Package Amount *</label>
                <Input
                  type="number"
                  value={transportRateForm.amount}
                  onChange={e => setTransportRateForm({ ...transportRateForm, amount: e.target.value })}
                  className="h-8.5 bg-white border-slate-200"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setRateModalOpen(false)} className="rounded h-8.5 cursor-pointer">Cancel</Button>
            <Button onClick={handleSaveRate} className="bg-[#F97316] hover:bg-[#E05E00] text-white rounded h-8.5 px-4 cursor-pointer">Register Rate</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">Log Vendor Payment Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 text-xs font-semibold text-slate-650">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">Vendor *</label>
              <Select value={paymentForm.vendorId} onValueChange={v => setPaymentForm({ ...paymentForm, vendorId: v })}>
                <SelectTrigger className="h-8.5 border-slate-200 bg-white"><SelectValue placeholder="Select Vendor" /></SelectTrigger>
                <SelectContent className="text-xs bg-white font-semibold">
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">Invoice Amount (INR) *</label>
              <Input
                type="number"
                value={paymentForm.invoiceAmount}
                onChange={e => setPaymentForm({ ...paymentForm, invoiceAmount: e.target.value })}
                className="h-8.5 bg-white border-slate-200 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">Advance Paid (INR)</label>
              <Input
                type="number"
                value={paymentForm.advanceAmount}
                onChange={e => setPaymentForm({ ...paymentForm, advanceAmount: e.target.value })}
                className="h-8.5 bg-white border-slate-200 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">Balance Paid Amount (INR)</label>
              <Input
                type="number"
                value={paymentForm.paidAmount}
                onChange={e => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })}
                className="h-8.5 bg-white border-slate-200 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">Due Date</label>
              <Input
                type="date"
                value={paymentForm.dueDate}
                onChange={e => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                className="h-8.5 bg-white border-slate-200 text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-555 uppercase">Payment Mode</label>
              <Select value={paymentForm.paymentMode} onValueChange={v => setPaymentForm({ ...paymentForm, paymentMode: v })}>
                <SelectTrigger className="h-8.5 border-slate-200 bg-white"><SelectValue /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)} className="rounded h-8.5 cursor-pointer">Cancel</Button>
            <Button onClick={handleSavePayment} className="bg-[#F97316] hover:bg-[#E05E00] text-white rounded h-8.5 px-4 cursor-pointer">Log Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
