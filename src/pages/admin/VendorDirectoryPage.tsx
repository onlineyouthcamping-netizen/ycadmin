import { useEffect, useState } from "react";
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
  Calculator, Receipt, ArrowRight, Settings
} from "lucide-react";

// Tab List
const TABS = [
  { id: "directory", label: "Directory", icon: Building2 },
  { id: "rates", label: "Rates Manager", icon: Settings },
  { id: "mapping", label: "Trip Mappings", icon: ArrowRight },
  { id: "costing", label: "Costing Engine", icon: Calculator },
  { id: "payments", label: "Payments", icon: IndianRupee },
];

export default function VendorDirectoryPage() {
  const [activeTab, setActiveTab] = useState("directory");
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterState, setFilterState] = useState("ALL");
  const [filterCity, setFilterCity] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

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

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vendors/directory");
      setVendors(res.data?.data || []);

      const payRes = await api.get("/vendors/directory/payments");
      setPaymentsList(payRes.data?.data || []);
    } catch (err: any) {
      toast.error("Failed to load directory data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Directory Vendors
  const filteredVendors = vendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (v.vendorCode && v.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = filterType === "ALL" || v.type === filterType;
    const matchState = filterState === "ALL" || v.state === filterState;
    const matchCity = filterCity === "ALL" || v.city === filterCity;
    const matchStatus = filterStatus === "ALL" || (filterStatus === "ACTIVE" ? v.isActive : !v.isActive);
    return matchSearch && matchType && matchState && matchCity && matchStatus;
  });

  const handleSaveVendor = async () => {
    if (!vendorForm.name || !vendorForm.type) {
      toast.error("Please fill in Vendor Name and Category");
      return;
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
      loadData();
    } catch (err: any) {
      toast.error("Failed to save vendor: " + err.message);
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
        <div>
          <h1 className="text-xl font-bold text-slate-900">Vendor Directory</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Central Directory and Dynamic Pricing Engine</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            setEditingVendor(null);
            setVendorForm({
              vendorCode: "", name: "", legalName: "", type: "HOTEL", contactPerson: "", contactNumber: "",
              alternateNumber: "", whatsappNumber: "", email: "", gstin: "", panNumber: "",
              state: "Himachal Pradesh", city: "", area: "", address: "", paymentTerms: "", creditDays: "30",
              notes: "", contacts: []
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

      {/* Tabs Layout */}
      <div className="flex gap-1.5 border-b border-slate-200 pb-px">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer",
                activeTab === t.id 
                  ? "border-[#F97316] text-[#F97316]" 
                  : "border-transparent text-slate-500 hover:text-slate-750 hover:border-slate-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Switch */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-[6px] border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search code, name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8.5 pl-8.5 text-xs bg-white border-[#E2E8F0] rounded-[4px]"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8.5 w-36 text-xs border-[#E2E8F0]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent className="text-xs bg-white">
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="HOTEL">🏨 Hotel</SelectItem>
                <SelectItem value="TRANSPORT">🚐 Transport</SelectItem>
                <SelectItem value="GUIDE">🧑‍🤝‍🧑 Guide</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8.5 w-32 text-xs border-[#E2E8F0]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="text-xs bg-white">
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">🟢 Active</SelectItem>
                <SelectItem value="INACTIVE">🔴 Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadData} variant="ghost" className="h-8.5 px-3 hover:bg-slate-50 text-slate-500">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Vendors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map(v => (
              <div key={v.id} className="bg-white p-5 rounded-[6px] border border-slate-200 shadow-xs space-y-4 hover:border-slate-350 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block">{v.vendorCode}</span>
                    <h3 className="text-sm font-bold text-slate-800 mt-0.5">{v.name}</h3>
                    <span className="inline-block mt-1 text-[9px] font-black tracking-wider uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{v.type}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => {
                      setEditingVendor(v);
                      setVendorForm({ ...v });
                      setVendorModalOpen(true);
                    }} className="p-1.5 text-slate-400 hover:text-slate-650 bg-slate-50 hover:bg-slate-100 rounded transition-colors cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteVendor(v.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-slate-100 rounded transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {v.city}, {v.state}</div>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {v.contactNumber || "N/A"}</div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" /> {v.email || "N/A"}</div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button onClick={() => { setSelectedVendor(v); setActiveTab("rates"); }} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold h-8.5 rounded cursor-pointer">
                    Manage Rates
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "rates" && (
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

      {activeTab === "costing" && (
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

      {activeTab === "payments" && (
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

      {/* Vendor Form Modal */}
      <Dialog open={vendorModalOpen} onOpenChange={setVendorModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-md p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-800">{editingVendor ? "Edit Vendor Details" : "Register New Directory Vendor"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-semibold text-slate-650">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase">Vendor Name *</label>
              <Input
                value={vendorForm.name}
                onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })}
                className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase">Vendor Type *</label>
              <Select value={vendorForm.type} onValueChange={v => setVendorForm({ ...vendorForm, type: v })}>
                <SelectTrigger className="h-8.5 border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent className="text-xs bg-white">
                  <SelectItem value="HOTEL">🏨 HOTEL</SelectItem>
                  <SelectItem value="TRANSPORT">🚐 TRANSPORT</SelectItem>
                  <SelectItem value="GUIDE">🧑‍🤝‍🧑 GUIDE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase">Vendor Code *</label>
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
                className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase">Primary Phone *</label>
              <Input
                value={vendorForm.contactNumber}
                onChange={e => setVendorForm({ ...vendorForm, contactNumber: e.target.value })}
                className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase">Email Address *</label>
              <Input
                value={vendorForm.email}
                onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })}
                className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase">City *</label>
              <Input
                value={vendorForm.city}
                onChange={e => setVendorForm({ ...vendorForm, city: e.target.value })}
                className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase">State *</label>
              <Input
                value={vendorForm.state}
                onChange={e => setVendorForm({ ...vendorForm, state: e.target.value })}
                className="h-8.5 rounded bg-white text-slate-800 border-slate-200"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setVendorModalOpen(false)} className="rounded h-8.5 cursor-pointer">Cancel</Button>
            <Button onClick={handleSaveVendor} className="bg-[#F97316] hover:bg-[#E05E00] text-white rounded h-8.5 px-4 cursor-pointer">Save Vendor</Button>
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
