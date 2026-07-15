import React, { useState, useEffect } from "react";
import {
  Plus, Search, Download, CreditCard, Check, X, AlertCircle, FileText, Upload, Calendar, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { opsService } from "@/services/ops.service";
import api from "@/services/api";

interface DeparturePaymentsProps {
  tripId: string;
  departureDateStr: string;
  tripDetails: any;
  tripVendors: any[];
}

export default function DeparturePayments({
  tripId,
  departureDateStr,
  tripDetails,
  tripVendors
}: DeparturePaymentsProps) {
  const [subTab, setSubTab] = useState<"dashboard" | "clients" | "vendors">("dashboard");

  // Live Data States
  const [bookings, setBookings] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [vendorPayments, setVendorPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalClientRevenue: 0,
    clientAmountReceived: 0,
    clientOutstandingBalance: 0,
    totalVendorPayable: 0,
    vendorAmountPaid: 0,
    vendorOutstandingBalance: 0,
    estimatedProfit: 0,
    actualProfit: 0
  });

  // Filters & Search
  const [clientSearch, setClientSearch] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState("All Status");
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState("All Categories");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("All Status");

  // Modals & Forms
  const [addClientPaymentOpen, setAddClientPaymentOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [clientPaymentForm, setClientPaymentForm] = useState({
    amount: "",
    paymentMode: "UPI",
    transactionId: "",
    paymentDate: new Date().toISOString().substring(0, 10),
    proofUrl: "",
    remarks: "",
    status: "Verified"
  });

  const [addVendorPaymentOpen, setAddVendorPaymentOpen] = useState(false);
  const [editingVendorPayment, setEditingVendorPayment] = useState<any | null>(null);
  const [vendorPaymentForm, setVendorPaymentForm] = useState({
    vendorName: "",
    category: "Hotels",
    serviceDescription: "",
    agreedAmount: "",
    advancePaid: "",
    paymentDate: new Date().toISOString().substring(0, 10),
    paymentMode: "UPI",
    transactionId: "",
    invoiceProof: "",
    status: "Not Paid",
    remarks: ""
  });

  const [viewHistoryOpen, setViewHistoryOpen] = useState(false);

  // Fetch Page Data
  const fetchData = async () => {
    try {
      // 1. Dashboard stats
      const statsData = await opsService.getPaymentsDashboardStats(tripId, departureDateStr);
      if (statsData) setStats(statsData);

      // 2. Client receivables
      const clientData = await opsService.getClientPayments(tripId, departureDateStr);
      setBookings(clientData.bookings || []);
      setReceipts(clientData.receipts || []);

      // 3. Vendor payables
      const vendorData = await opsService.getVendorPayments(tripId, departureDateStr);
      setVendorPayments(vendorData || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment workspace data");
    }
  };

  useEffect(() => {
    fetchData();
  }, [tripId, departureDateStr]);

  // Client Receipts Submit
  const handleClientPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      await opsService.addClientPayment(selectedBooking.bookingId, clientPaymentForm);
      toast.success("Client payment recorded successfully!");
      setAddClientPaymentOpen(false);
      setSelectedBooking(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add client payment");
    }
  };

  // Client Payment Verification
  const handleVerifyClientPayment = async (id: string, status: string) => {
    try {
      await opsService.verifyClientPayment(id, status);
      toast.success(`Receipt marked as ${status}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  // Vendor Payment Submit
  const handleVendorPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendorPayment) {
        await opsService.updateVendorPayment(tripId, editingVendorPayment.id, vendorPaymentForm);
        toast.success("Vendor payment updated!");
      } else {
        await opsService.createVendorPayment(tripId, {
          ...vendorPaymentForm,
          departureDate: departureDateStr
        });
        toast.success("Vendor payment logged!");
      }
      setAddVendorPaymentOpen(false);
      setEditingVendorPayment(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save vendor payment");
    }
  };

  // Delete Vendor Payment
  const handleDeleteVendorPayment = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this vendor payment record?")) return;
    try {
      await opsService.deleteVendorPayment(id);
      toast.success("Vendor payment deleted successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete record");
    }
  };

  // CSV Export helper
  const handleDownloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.info("No records to export");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper formatting currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Passenger names resolver from booking JSON
  const getPassengerNames = (booking: any) => {
    try {
      const parsed = typeof booking.passengers === 'string' ? JSON.parse(booking.passengers) : booking.passengers;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => p.name || p.fullName).join(", ");
      }
    } catch {}
    return "Lead Only";
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSubTab("dashboard")}
          className={cn("px-4 py-2.5 text-xs font-bold border-b-2 transition-colors -mb-[2px]",
            subTab === "dashboard" ? "border-[#F97316] text-[#F97316]" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Payment Dashboard
        </button>
        <button
          onClick={() => setSubTab("clients")}
          className={cn("px-4 py-2.5 text-xs font-bold border-b-2 transition-colors -mb-[2px]",
            subTab === "clients" ? "border-[#F97316] text-[#F97316]" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Client Receivables
        </button>
        <button
          onClick={() => setSubTab("vendors")}
          className={cn("px-4 py-2.5 text-xs font-bold border-b-2 transition-colors -mb-[2px]",
            subTab === "vendors" ? "border-[#F97316] text-[#F97316]" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Vendor Payables
        </button>
      </div>

      {/* ──────────────────────── SUBTAB: DASHBOARD ──────────────────────── */}
      {subTab === "dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client Receivables Summary Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Client Receivables</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Total Revenue:</span>
                  <span className="font-extrabold text-slate-800">{formatCurrency(stats.totalClientRevenue)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Amount Received:</span>
                  <span className="font-extrabold text-emerald-650">{formatCurrency(stats.clientAmountReceived)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-100 pt-1.5">
                  <span className="text-slate-400 font-semibold">Outstanding Balance:</span>
                  <span className="font-extrabold text-amber-600">{formatCurrency(stats.clientOutstandingBalance)}</span>
                </div>
              </div>
            </div>

            {/* Vendor Payables Summary Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Vendor Payables</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Total Payable:</span>
                  <span className="font-extrabold text-slate-800">{formatCurrency(stats.totalVendorPayable)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Amount Paid:</span>
                  <span className="font-extrabold text-blue-600">{formatCurrency(stats.vendorAmountPaid)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-100 pt-1.5">
                  <span className="text-slate-400 font-semibold">Outstanding Payable:</span>
                  <span className="font-extrabold text-red-600">{formatCurrency(stats.vendorOutstandingBalance)}</span>
                </div>
              </div>
            </div>

            {/* Profit Margin Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Trip Profitability</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Estimated Profit:</span>
                  <span className={cn("font-extrabold", stats.estimatedProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {formatCurrency(stats.estimatedProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Actual Profit:</span>
                  <span className={cn("font-extrabold", stats.actualProfit >= 0 ? "text-emerald-650" : "text-red-655")}>
                    {formatCurrency(stats.actualProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-100 pt-1.5">
                  <span className="text-slate-400 font-semibold">Profit Margin:</span>
                  <span className="font-extrabold text-slate-700">
                    {stats.totalClientRevenue > 0 ? `${((stats.estimatedProfit / stats.totalClientRevenue) * 100).toFixed(1)}%` : "0%"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Receipts Log List */}
          <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Client Receipts</h3>
              <span className="text-[10px] text-slate-400 font-bold">{receipts.length} Transactions</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
              {receipts.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-6 font-medium">No client transactions logged yet.</div>
              ) : (
                receipts.map(rec => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800">{rec.bookingId}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase">{rec.paymentMode}</span>
                        {rec.transactionId && <span className="font-mono text-[10px] text-slate-400">Ref: {rec.transactionId}</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Recorded on {new Date(rec.paymentDate).toLocaleDateString('en-IN')} by {rec.collectedBy}
                      </p>
                      {rec.remarks && <p className="text-[10.5px] text-slate-500 italic mt-0.5">"{rec.remarks}"</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-800">{formatCurrency(rec.amount)}</span>
                      <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider block w-fit",
                        rec.status === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        rec.status === "Rejected" ? "bg-red-50 text-red-650 border-red-100" :
                        "bg-amber-50 text-amber-700 border-amber-100"
                      )}>{rec.status}</span>
                      
                      {rec.status === "Pending Verification" && (
                        <div className="flex gap-1">
                          <button onClick={() => handleVerifyClientPayment(rec.id, "Verified")} className="p-1 hover:bg-emerald-50 rounded text-emerald-600 border border-emerald-100" title="Verify">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleVerifyClientPayment(rec.id, "Rejected")} className="p-1 hover:bg-red-50 rounded text-red-650 border border-red-100" title="Reject">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────── SUBTAB: CLIENT RECEIVABLES ──────────────────────── */}
      {subTab === "clients" && (
        <div className="space-y-4">
          {/* Filters & Actions */}
          <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
            <select value={clientStatusFilter} onChange={e => setClientStatusFilter(e.target.value)} className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
              <option value="All Status">All Status</option>
              {["Unpaid", "Partially Paid", "Paid"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="relative flex-1 max-w-xs min-w-[150px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search client name or booking ID..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
            </div>
            <button onClick={() => handleDownloadCSV(bookings, "client_receivables.csv")} className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-3.5 bg-white hover:bg-slate-50 text-slate-750 flex items-center gap-1.5 ml-auto shadow-3xs">
              <Download className="w-3.5 h-3.5 text-slate-400" /> Export Excel
            </button>
          </div>

          {/* Bookings Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">
                  <th className="p-3 border-r border-slate-100">BOOKING ID & NAME</th>
                  <th className="p-3 border-r border-slate-100">PASSENGERS</th>
                  <th className="p-3 border-r border-slate-100 text-right">TOTAL AMOUNT</th>
                  <th className="p-3 border-r border-slate-100 text-right">RECEIVED</th>
                  <th className="p-3 border-r border-slate-100 text-right">OUTSTANDING</th>
                  <th className="p-3 border-r border-slate-100 text-center">STATUS</th>
                  <th className="p-3 text-center w-36">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {bookings.filter(b => {
                  const matchSearch = clientSearch === "" || b.bookingId.toLowerCase().includes(clientSearch.toLowerCase()) || b.name.toLowerCase().includes(clientSearch.toLowerCase());
                  const matchStatus = clientStatusFilter === "All Status" || b.paymentStatus === clientStatusFilter;
                  return matchSearch && matchStatus;
                }).map((b) => {
                  const balance = Math.max(0, b.totalAmount - b.advancePaid);
                  return (
                    <tr key={b.bookingId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 border-r border-slate-100">
                        <p className="font-extrabold text-slate-800">{b.bookingId}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{b.name}</p>
                      </td>
                      <td className="p-3 border-r border-slate-100 max-w-[200px] truncate">
                        <p className="text-[10px] text-slate-600 font-medium">{getPassengerNames(b)}</p>
                      </td>
                      <td className="p-3 border-r border-slate-100 text-right font-extrabold text-slate-800">{formatCurrency(b.totalAmount)}</td>
                      <td className="p-3 border-r border-slate-100 text-right font-extrabold text-emerald-650">{formatCurrency(b.advancePaid)}</td>
                      <td className="p-3 border-r border-slate-100 text-right font-extrabold text-amber-600">{formatCurrency(balance)}</td>
                      <td className="p-3 border-r border-slate-100 text-center">
                        <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider inline-block",
                          b.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          b.paymentStatus === "Partially Paid" ? "bg-amber-50 text-amber-700 border-amber-100" :
                          "bg-red-50 text-red-650 border-red-100"
                        )}>{b.paymentStatus || 'Unpaid'}</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setClientPaymentForm({
                                amount: String(balance),
                                paymentMode: "UPI",
                                transactionId: "",
                                paymentDate: new Date().toISOString().substring(0, 10),
                                proofUrl: "",
                                remarks: "",
                                status: "Verified"
                              });
                              setAddClientPaymentOpen(true);
                            }}
                            className="bg-[#F97316] text-white hover:bg-[#E05E00] text-[9.5px] font-bold px-2.5 py-1 rounded"
                          >
                            + Pay
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setViewHistoryOpen(true);
                            }}
                            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-[9.5px] font-bold px-2 py-1 rounded"
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────── SUBTAB: VENDOR PAYABLES ──────────────────────── */}
      {subTab === "vendors" && (
        <div className="space-y-4">
          {/* Filters & Actions */}
          <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
            <select value={vendorCategoryFilter} onChange={e => setVendorCategoryFilter(e.target.value)} className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
              <option value="All Categories">All Categories</option>
              {["Hotels", "Transport", "Activities", "Meals", "Guides", "Local vendors", "Other"].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select value={vendorStatusFilter} onChange={e => setVendorStatusFilter(e.target.value)} className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2.5 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
              <option value="All Status">All Status</option>
              {["Not Paid", "Advance Paid", "Partially Paid", "Pending Approval", "Paid", "Rejected"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="relative flex-1 max-w-xs min-w-[150px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Search vendor name..." value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
            </div>

            <button
              onClick={() => {
                setEditingVendorPayment(null);
                setVendorPaymentForm({
                  vendorName: "",
                  category: "Hotels",
                  serviceDescription: "",
                  agreedAmount: "",
                  advancePaid: "",
                  paymentDate: new Date().toISOString().substring(0, 10),
                  paymentMode: "UPI",
                  transactionId: "",
                  invoiceProof: "",
                  status: "Not Paid",
                  remarks: ""
                });
                setAddVendorPaymentOpen(true);
              }}
              className="text-[11px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-3.5 py-1.5 flex items-center gap-1.5 shadow-xs ml-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Log Vendor Payment
            </button>
          </div>

          {/* Vendor Payables Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-[#E2E8F0]">
                <tr className="text-[9.5px] font-bold text-slate-455 uppercase tracking-wider">
                  <th className="p-3 border-r border-slate-100">VENDOR</th>
                  <th className="p-3 border-r border-slate-100">CATEGORY</th>
                  <th className="p-3 border-r border-slate-100">DESCRIPTION</th>
                  <th className="p-3 border-r border-slate-100 text-right">AGREED</th>
                  <th className="p-3 border-r border-slate-100 text-right">PAID</th>
                  <th className="p-3 border-r border-slate-100 text-right">OUTSTANDING</th>
                  <th className="p-3 border-r border-slate-100 text-center">STATUS</th>
                  <th className="p-3 text-center w-36">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {vendorPayments.filter(v => {
                  const matchSearch = vendorSearch === "" || v.vendorName.toLowerCase().includes(vendorSearch.toLowerCase());
                  const matchCat = vendorCategoryFilter === "All Categories" || v.category === vendorCategoryFilter;
                  const matchStatus = vendorStatusFilter === "All Status" || v.status === vendorStatusFilter;
                  return matchSearch && matchCat && matchStatus;
                }).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 border-r border-slate-100">
                      <p className="font-extrabold text-slate-800">{v.vendorName}</p>
                      {v.paymentDate && <p className="text-[9px] text-slate-400 mt-0.5">Paid on {new Date(v.paymentDate).toLocaleDateString('en-IN')}</p>}
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase">{v.category}</span>
                    </td>
                    <td className="p-3 border-r border-slate-100 max-w-[200px] truncate">
                      <p className="text-[10px] text-slate-500 font-medium">{v.serviceDescription || "—"}</p>
                    </td>
                    <td className="p-3 border-r border-slate-100 text-right font-extrabold text-slate-800">{formatCurrency(v.agreedAmount)}</td>
                    <td className="p-3 border-r border-slate-100 text-right font-extrabold text-blue-600">{formatCurrency(v.advancePaid)}</td>
                    <td className="p-3 border-r border-slate-100 text-right font-extrabold text-red-600">{formatCurrency(v.remainingPayable)}</td>
                    <td className="p-3 border-r border-slate-100 text-center">
                      <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider inline-block",
                        v.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        v.status === "Partially Paid" ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-red-50 text-red-650 border-red-100"
                      )}>{v.status}</span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => {
                            setEditingVendorPayment(v);
                            setVendorPaymentForm({
                              vendorName: v.vendorName,
                              category: v.category,
                              serviceDescription: v.serviceDescription || "",
                              agreedAmount: String(v.agreedAmount),
                              advancePaid: String(v.advancePaid),
                              paymentDate: v.paymentDate ? v.paymentDate.substring(0, 10) : "",
                              paymentMode: v.paymentMode || "UPI",
                              transactionId: v.transactionId || "",
                              invoiceProof: v.invoiceProof || "",
                              status: v.status,
                              remarks: v.remarks || ""
                            });
                            setAddVendorPaymentOpen(true);
                          }}
                          className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-[9.5px] font-bold px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVendorPayment(v.id)}
                          className="bg-red-50 text-red-650 hover:bg-red-100 text-[9.5px] font-bold px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* dialog: Add / Edit Client Payment Record */}
      <Dialog open={addClientPaymentOpen} onOpenChange={setAddClientPaymentOpen}>
        <DialogContent className="max-w-md bg-white p-5 rounded-lg border border-slate-200">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Record Transaction Receipt</h3>
          {selectedBooking && <p className="text-[10px] text-slate-400 font-bold mt-1">Booking: {selectedBooking.bookingId} ({selectedBooking.name})</p>}
          <form onSubmit={handleClientPaymentSubmit} className="space-y-4 mt-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                value={clientPaymentForm.amount}
                onChange={e => setClientPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Payment Mode</label>
                <select
                  value={clientPaymentForm.paymentMode}
                  onChange={e => setClientPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">IMPS / NEFT / Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={clientPaymentForm.paymentDate}
                  onChange={e => setClientPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Transaction ID / Reference UTR</label>
              <input
                type="text"
                placeholder="UTR / Txn Reference Number"
                value={clientPaymentForm.transactionId}
                onChange={e => setClientPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Receipt / Payment Proof Link</label>
              <input
                type="text"
                placeholder="URL to payment proof / screenshot"
                value={clientPaymentForm.proofUrl}
                onChange={e => setClientPaymentForm(prev => ({ ...prev, proofUrl: e.target.value }))}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Remarks / Internal Notes</label>
              <textarea
                rows={2}
                placeholder="Staff remarks..."
                value={clientPaymentForm.remarks}
                onChange={e => setClientPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                className="w-full text-xs font-bold border border-slate-200 rounded p-2 bg-white text-slate-700 outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddClientPaymentOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                Cancel
              </Button>
              <Button type="submit" className="h-8 bg-[#F97316] hover:bg-[#E05E00] text-white font-bold text-xs uppercase rounded">
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* dialog: View Client Transaction History */}
      <Dialog open={viewHistoryOpen} onOpenChange={setViewHistoryOpen}>
        <DialogContent className="max-w-lg bg-white p-5 rounded-lg border border-slate-200">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">Transaction History Log</h3>
          {selectedBooking && <p className="text-[10px] text-slate-400 font-bold mt-1">Booking: {selectedBooking.bookingId} ({selectedBooking.name})</p>}
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1 mt-3">
            {receipts.filter(r => selectedBooking && r.bookingId === selectedBooking.bookingId).length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-6 font-medium">No transactions logged for this booking yet.</div>
            ) : (
              receipts.filter(r => selectedBooking && r.bookingId === selectedBooking.bookingId).map(rec => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">{formatCurrency(rec.amount)}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase">{rec.paymentMode}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Recorded on {new Date(rec.paymentDate).toLocaleDateString('en-IN')} by {rec.collectedBy}</p>
                    {rec.remarks && <p className="text-[10.5px] text-slate-500 italic mt-0.5">"{rec.remarks}"</p>}
                    {rec.proofUrl && (
                      <a href={rec.proofUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline font-bold mt-1 block">
                        🔗 View Payment Proof
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider block",
                      rec.status === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      rec.status === "Rejected" ? "bg-red-50 text-red-650 border-red-100" :
                      "bg-amber-50 text-amber-700 border-amber-100"
                    )}>{rec.status}</span>
                    {rec.status === "Pending Verification" && (
                      <div className="flex gap-1">
                        <button onClick={() => { handleVerifyClientPayment(rec.id, "Verified"); setViewHistoryOpen(false); }} className="p-1 hover:bg-emerald-50 rounded text-emerald-600 border border-emerald-100" title="Verify">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { handleVerifyClientPayment(rec.id, "Rejected"); setViewHistoryOpen(false); }} className="p-1 hover:bg-red-50 rounded text-red-650 border border-red-100" title="Reject">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* dialog: Add / Edit Vendor Payment */}
      <Dialog open={addVendorPaymentOpen} onOpenChange={setAddVendorPaymentOpen}>
        <DialogContent className="max-w-md bg-white p-5 rounded-lg border border-slate-200 overflow-y-auto max-h-[85vh]">
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
            {editingVendorPayment ? "Edit Vendor Payment Record" : "Log Vendor Payment"}
          </h3>
          <form onSubmit={handleVendorPaymentSubmit} className="space-y-4 mt-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Vendor Partner Name</label>
              <input
                type="text"
                required
                value={vendorPaymentForm.vendorName}
                onChange={e => setVendorPaymentForm(prev => ({ ...prev, vendorName: e.target.value }))}
                placeholder="e.g. Mountain Inn Shimla"
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                <select
                  value={vendorPaymentForm.category}
                  onChange={e => setVendorPaymentForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
                >
                  <option value="Hotels">Hotels</option>
                  <option value="Transport">Transport</option>
                  <option value="Activities">Activities</option>
                  <option value="Meals">Meals</option>
                  <option value="Guides">Guides</option>
                  <option value="Local vendors">Local vendors</option>
                  <option value="Other">Other expenses</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Agreed Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={vendorPaymentForm.agreedAmount}
                  onChange={e => setVendorPaymentForm(prev => ({ ...prev, agreedAmount: e.target.value }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Advance Paid (₹)</label>
                <input
                  type="number"
                  value={vendorPaymentForm.advancePaid}
                  onChange={e => setVendorPaymentForm(prev => ({ ...prev, advancePaid: e.target.value }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Payment Status</label>
                <select
                  value={vendorPaymentForm.status}
                  onChange={e => setVendorPaymentForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
                >
                  <option value="Not Paid">Not Paid</option>
                  <option value="Advance Paid">Advance Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Paid">Paid</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Payment Mode</label>
                <select
                  value={vendorPaymentForm.paymentMode}
                  onChange={e => setVendorPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">CASH</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Payment Date</label>
                <input
                  type="date"
                  value={vendorPaymentForm.paymentDate}
                  onChange={e => setVendorPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Transaction reference ID</label>
              <input
                type="text"
                placeholder="Ref UTR Number"
                value={vendorPaymentForm.transactionId}
                onChange={e => setVendorPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Invoice / Payment Proof URL</label>
              <input
                type="text"
                placeholder="Invoice link / screenshot link"
                value={vendorPaymentForm.invoiceProof}
                onChange={e => setVendorPaymentForm(prev => ({ ...prev, invoiceProof: e.target.value }))}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Service Description</label>
              <textarea
                rows={2}
                placeholder="e.g. 5 Double Rooms check-in June 5"
                value={vendorPaymentForm.serviceDescription}
                onChange={e => setVendorPaymentForm(prev => ({ ...prev, serviceDescription: e.target.value }))}
                className="w-full text-xs font-bold border border-slate-200 rounded p-2 bg-white text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Remarks</label>
              <textarea
                rows={2}
                placeholder="Vendor details, remarks..."
                value={vendorPaymentForm.remarks}
                onChange={e => setVendorPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                className="w-full text-xs font-bold border border-slate-200 rounded p-2 bg-white text-slate-700 outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddVendorPaymentOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                Cancel
              </Button>
              <Button type="submit" className="h-8 bg-[#F97316] hover:bg-[#E05E00] text-white font-bold text-xs uppercase rounded">
                {editingVendorPayment ? "Save Changes" : "Log Liability"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
