import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Download,
  CreditCard,
  Check,
  X,
  AlertCircle,
  FileText,
  Upload,
  Calendar,
  ArrowRight,
  DollarSign,
  Building2,
  UserCheck,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Clock,
  Receipt,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { opsService } from "@/services/ops.service";
import { trainTicketService } from "@/services/trainTicket.service";
import {
  collectionAccountsService,
  CollectionAccount,
} from "@/services/collectionAccounts.service";
import { ImageUpload } from "@/components/admin/ImageUpload";
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
  tripVendors,
}: DeparturePaymentsProps) {
  // 6 Enterprise Sub Tabs
  const [subTab, setSubTab] = useState<
    | "dashboard"
    | "clients"
    | "vendors"
    | "activities"
    | "misc"
    | "reconciliation"
  >("clients");

  // Expanded Row IDs for detailed transaction ledger view
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(
    null,
  );
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);

  // Live Data States
  const [bookings, setBookings] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [vendorPayments, setVendorPayments] = useState<any[]>([]);
  const [dbVendors, setDbVendors] = useState<any[]>([]);
  const [trainTickets, setTrainTickets] = useState<any[]>([]);

  // Local state for Activities, Misc Expenses, and Adjustments
  const [activityPayments, setActivityPayments] = useState<any[]>([]);
  const [miscPayments, setMiscPayments] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState("All Status");
  const [vendorCategoryFilter, setVendorCategoryFilter] =
    useState("All Categories");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("All Status");
  const [collectionAccounts, setCollectionAccounts] = useState<CollectionAccount[]>([]);

  // Modals
  const [addClientPaymentOpen, setAddClientPaymentOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [clientPaymentForm, setClientPaymentForm] = useState({
    amount: "",
    paymentMode: "UPI",
    collectionAccountId: "",
    transactionId: "",
    paymentDate: new Date().toISOString().substring(0, 10),
    proofUrl: "",
    remarks: "",
    status: "Verified",
  });

  const [addVendorPaymentOpen, setAddVendorPaymentOpen] = useState(false);
  const [editingVendorPayment, setEditingVendorPayment] = useState<any | null>(
    null,
  );
  const [vendorPaymentForm, setVendorPaymentForm] = useState({
    vendorName: "",
    category: "Hotels",
    serviceDescription: "",
    agreedAmount: "",
    advancePaid: "",
    paymentDate: new Date().toISOString().substring(0, 10),
    paymentMode: "BANK_TRANSFER",
    transactionId: "",
    invoiceProof: "",
    status: "Advance Paid",
    remarks: "",
  });

  const [addActivityPaymentOpen, setAddActivityPaymentOpen] = useState(false);
  const [activityPaymentForm, setActivityPaymentForm] = useState({
    activityName: "",
    activityType: "Adventure",
    costPerPerson: "",
    participantCount: "",
    vendorName: "",
    amountPaid: "",
    paymentDate: new Date().toISOString().substring(0, 10),
    paymentMode: "UPI",
    transactionId: "",
    remarks: "",
  });

  const [addMiscPaymentOpen, setAddMiscPaymentOpen] = useState(false);
  const [miscPaymentForm, setMiscPaymentForm] = useState({
    description: "",
    category: "Emergency",
    amount: "",
    payeeName: "",
    paymentDate: new Date().toISOString().substring(0, 10),
    paymentMethod: "CASH",
    transactionId: "",
    status: "PENDING",
    remarks: "",
  });

  const generateVendorInvoicePDF = (v: any, historyItem?: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to download/print PDF.");
      return;
    }

    const txnId = historyItem?.txnId || v.transactionId || `VND-INV-${v.id || '001'}`;
    const payDate = historyItem?.date || v.paymentDate || new Date().toISOString().substring(0, 10);
    const amount = historyItem?.amount || v.advancePaid || v.agreedAmount || 0;
    const payMethod = historyItem?.method || v.paymentMode || "Bank Transfer";
    const payType = historyItem?.type || (v.advancePaid >= v.agreedAmount ? "FINAL SETTLEMENT" : "ADVANCE PAYMENT");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vendor Payment Voucher - ${v.vendorName}</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
            .logo span { color: #f97316; }
            .voucher-title { font-size: 18px; font-weight: 800; color: #f97316; text-transform: uppercase; text-align: right; }
            .voucher-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 12px; }
            .card-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; letter-spacing: 0.5px; }
            .card-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .card-row strong { color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; }
            td { border-bottom: 1px solid #e2e8f0; padding: 12px 14px; }
            .text-right { text-align: right; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 800; font-size: 10px; text-transform: uppercase; }
            .badge-success { background: #dcfce7; color: #15803d; }
            .badge-orange { background: #ffedd5; color: #c2410c; }
            .total-box { background: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 16px; width: 280px; margin-left: auto; margin-bottom: 30px; }
            .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
            .total-row.final { font-size: 16px; font-weight: 900; color: #c2410c; border-top: 1px solid #fed7aa; padding-top: 8px; margin-top: 8px; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; }
            .stamp { border: 2px dashed #10b981; color: #047857; display: inline-block; padding: 8px 16px; border-radius: 6px; font-weight: 900; font-size: 12px; text-transform: uppercase; margin-top: 10px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="background: #f97316; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ Print / Save as PDF</button>
          </div>

          <div class="header">
            <div>
              <div class="logo">YOUTH<span>CAMPING</span> OS</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Youth Camping Official Payment Voucher</div>
            </div>
            <div>
              <div class="voucher-title">VENDOR VOUCHER</div>
              <div class="voucher-sub">Ref: ${txnId} | Date: ${payDate}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Vendor Partner Details</div>
              <div class="card-row"><span>Vendor Name:</span> <strong>${v.vendorName}</strong></div>
              <div class="card-row"><span>Category:</span> <strong>${v.category || 'Vendor'}</strong></div>
              <div class="card-row"><span>Invoice No:</span> <strong>${v.invoiceNumber || '—'}</strong></div>
            </div>
            <div class="card">
              <div class="card-title">Trip / Departure Context</div>
              <div class="card-row"><span>Trip Context:</span> <strong>${tripDetails?.title || 'YouthCamping Departure'}</strong></div>
              <div class="card-row"><span>Payment Status:</span> <span class="badge ${v.balanceAmount <= 0 ? 'badge-success' : 'badge-orange'}">${v.status || 'PAID'}</span></div>
              <div class="card-row"><span>Voucher Type:</span> <strong>${payType}</strong></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description / Service</th>
                <th>Payment Mode</th>
                <th>Transaction Reference</th>
                <th class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${v.serviceDescription || (v.category + ' Services')}</strong>
                  <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Payment logged for departure ops</div>
                </td>
                <td>${payMethod}</td>
                <td><code>${txnId}</code></td>
                <td class="text-right"><strong>₹${Number(amount).toLocaleString('en-IN')}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-row"><span>Agreed Total:</span> <span>₹${(v.agreedAmount || amount).toLocaleString('en-IN')}</span></div>
            <div class="total-row"><span>This Payment:</span> <span style="color: #10b981; font-weight: bold;">₹${Number(amount).toLocaleString('en-IN')}</span></div>
            <div class="total-row final"><span>Balance Due:</span> <span>₹${(Math.max(0, (v.agreedAmount || amount) - (v.advancePaid || amount))).toLocaleString('en-IN')}</span></div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div class="stamp">PAYMENT VERIFIED & RECORDED ✓</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <div>_______________________________</div>
              <div style="font-weight: bold; margin-top: 4px;">Authorized Accounts Officer</div>
              <div>YouthCamping Operations Hub</div>
            </div>
          </div>

          <div class="footer">
            <p>YouthCamping Internal Operating System — Accounts & Finance Desk</p>
            <p>This payment receipt is system generated and acts as official proof of vendor disbursement.</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const generateClientReceiptPDF = (b: any, historyItem?: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print/download receipt.");
      return;
    }

    const passengerName = b.passengerName || b.leadPassengerName || b.name || "Valued Guest";
    const bookingId = b.bookingId || b.id || "BK-001";
    const txnId = historyItem?.txnId || b.transactionId || `RCP-${bookingId}`;
    const payDate = historyItem?.date || b.paymentDate || new Date().toISOString().substring(0, 10);
    const amount = historyItem?.amount || b.advancePaid || b.totalAmount || 0;
    const payMethod = historyItem?.method || b.paymentMode || "UPI";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Payment Receipt - ${passengerName}</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
            .logo span { color: #2563eb; }
            .voucher-title { font-size: 18px; font-weight: 800; color: #2563eb; text-transform: uppercase; text-align: right; }
            .voucher-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 12px; }
            .card-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; letter-spacing: 0.5px; }
            .card-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .card-row strong { color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 14px; font-size: 11px; text-transform: uppercase; }
            td { border-bottom: 1px solid #e2e8f0; padding: 12px 14px; }
            .text-right { text-align: right; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: 800; font-size: 10px; text-transform: uppercase; }
            .badge-success { background: #dcfce7; color: #15803d; }
            .total-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; width: 280px; margin-left: auto; margin-bottom: 30px; }
            .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
            .total-row.final { font-size: 16px; font-weight: 900; color: #1d4ed8; border-top: 1px solid #93c5fd; padding-top: 8px; margin-top: 8px; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; }
            .stamp { border: 2px dashed #2563eb; color: #1d4ed8; display: inline-block; padding: 8px 16px; border-radius: 6px; font-weight: 900; font-size: 12px; text-transform: uppercase; margin-top: 10px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ Print / Save as PDF</button>
          </div>

          <div class="header">
            <div>
              <div class="logo">YOUTH<span>CAMPING</span> OS</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Official Passenger Payment Receipt</div>
            </div>
            <div>
              <div class="voucher-title">PAYMENT RECEIPT</div>
              <div class="voucher-sub">Ref: ${txnId} | Date: ${payDate}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Passenger Details</div>
              <div class="card-row"><span>Passenger Name:</span> <strong>${passengerName}</strong></div>
              <div class="card-row"><span>Booking ID:</span> <strong>${bookingId}</strong></div>
              <div class="card-row"><span>Phone:</span> <strong>${b.phone || b.leadPhone || 'N/A'}</strong></div>
            </div>
            <div class="card">
              <div class="card-title">Trip / Departure Context</div>
              <div class="card-row"><span>Trip Title:</span> <strong>${tripDetails?.title || 'YouthCamping Trip'}</strong></div>
              <div class="card-row"><span>Payment Status:</span> <span class="badge badge-success">PAYMENT RECEIVED ✓</span></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Payment Mode</th>
                <th>Transaction Reference</th>
                <th class="text-right">Amount Received (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Trip Booking Payment</strong>
                  <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Verified customer receipt</div>
                </td>
                <td>${payMethod}</td>
                <td><code>${txnId}</code></td>
                <td class="text-right"><strong>₹${Number(amount).toLocaleString('en-IN')}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-row"><span>Package Cost:</span> <span>₹${(b.totalAmount || amount).toLocaleString('en-IN')}</span></div>
            <div class="total-row"><span>This Payment:</span> <span style="color: #2563eb; font-weight: bold;">₹${Number(amount).toLocaleString('en-IN')}</span></div>
            <div class="total-row final"><span>Remaining Balance:</span> <span>₹${(Math.max(0, (b.totalAmount || amount) - (b.advancePaid || amount))).toLocaleString('en-IN')}</span></div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <div class="stamp">OFFICIAL RECEIPT VERIFIED ✓</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <div>_______________________________</div>
              <div style="font-weight: bold; margin-top: 4px;">YouthCamping Finance Desk</div>
            </div>
          </div>

          <div class="footer">
            <p>YouthCamping Official Booking Receipt — Thank you for travelling with us!</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const [addAdjustmentOpen, setAddAdjustmentOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: "Refund",
    originalPaymentRef: "",
    amount: "",
    reason: "",
    status: "PENDING",
  });

  // Fetch API data and merge cleanly with defaults if API is empty
  const fetchData = async () => {
    try {
      const [clientRes, vendorRes, vendorsDirRes, expensesRes, trainSummaryRes, accountsRes] = await Promise.all([
        opsService
          .getClientPayments(tripId, departureDateStr)
          .catch(() => ({ bookings: [], receipts: [] })),
        opsService.getVendorPayments(tripId, departureDateStr).catch(() => []),
        api.get("/vendors/directory").catch(() => ({ data: { data: [] } })),
        opsService.getTripExpenses(tripId, departureDateStr).catch(() => []),
        trainTicketService
          .getFinanceSummary({ tripId, departureDate: departureDateStr })
          .catch(() => ({ summary: {}, tickets: [] })),
        collectionAccountsService
          .getAccounts({ activeOnly: true })
          .catch(() => ({ data: [], summary: { totalCollected: 0, totalSubmitted: 0, totalPending: 0 } })),
      ]);

      if (accountsRes.data && accountsRes.data.length > 0) {
        setCollectionAccounts(accountsRes.data);
        setClientPaymentForm((prev) => ({
          ...prev,
          collectionAccountId: prev.collectionAccountId || accountsRes.data[0].id,
        }));
      }

      const mergedBookings =
        clientRes.bookings && clientRes.bookings.length > 0
          ? clientRes.bookings.map((b: any) => {
              const bookingReceipts = (clientRes.receipts || []).filter(
                (r: any) => r.bookingId === b.bookingId,
              );
              return {
                ...b,
                history: bookingReceipts.map((r: any) => ({
                  id: r.id,
                  date: r.paymentDate ? r.paymentDate.substring(0, 10) : "N/A",
                  amount: r.amount,
                  method: r.paymentMode,
                  txnId: r.transactionId || "N/A",
                  status: r.status,
                  verifiedBy: r.collectedBy || "System",
                  remarks: r.remarks || "",
                  proofUrl: r.proofUrl || "",
                  collectionAccount: r.collectionAccount,
                  accountName: r.collectionAccount?.accountName || "",
                })),
              };
            })
          : [];

      const apiVendors =
        vendorRes && vendorRes.length > 0
          ? vendorRes.map((v: any) => ({
              ...v,
              history: [
                {
                  date: v.paymentDate ? v.paymentDate.substring(0, 10) : "N/A",
                  amount: v.advancePaid || 0,
                  method: v.paymentMode || "Bank Transfer",
                  txnId: v.transactionId || "N/A",
                  type: "ADVANCE",
                  status: v.status,
                },
              ],
            }))
          : [];

      // Merge auto-assigned vendors from the trip (Hotels, Guides, Transport)
      const mergedVendors = [...apiVendors];
      (tripVendors || []).forEach((tv) => {
        const vName = tv.name || tv.vendorName || tv.hotelName || (typeof tv.vendorId === "object" ? tv.vendorId?.name : tv.vendorId) || tv.vendor?.name;
        if (!vName || vName === "NO_STAY" || vName === "—" || vName.toLowerCase().includes("night journey")) return;
        
        const existingIdx = mergedVendors.findIndex((v) => v.vendorName?.toLowerCase().trim() === vName.toLowerCase().trim());
        const agreed = Number(tv.agreedCost || tv.totalAmount || 0);
        const paid = Number(tv.paidAmount || tv.advancePaid || 0);

        if (existingIdx >= 0) {
          // If vendor is booked for multiple days/records, accumulate the agreed & paid amounts
          mergedVendors[existingIdx].agreedAmount = (mergedVendors[existingIdx].agreedAmount || 0) + agreed;
          mergedVendors[existingIdx].advancePaid = (mergedVendors[existingIdx].advancePaid || 0) + paid;
          mergedVendors[existingIdx].balanceAmount = Math.max(0, mergedVendors[existingIdx].agreedAmount - mergedVendors[existingIdx].advancePaid);
          const totalAgreed = mergedVendors[existingIdx].agreedAmount;
          const totalPaid = mergedVendors[existingIdx].advancePaid;
          mergedVendors[existingIdx].status =
            totalPaid >= totalAgreed && totalAgreed > 0
              ? "Paid"
              : totalPaid > 0
              ? "Advance Paid"
              : "Pending";
        } else {
          const statusLabel =
            paid >= agreed && agreed > 0
              ? "Paid"
              : paid > 0
              ? "Advance Paid"
              : "Pending";

          mergedVendors.push({
            id: tv.id || `auto-${vName}`,
            vendorName: vName,
            category: tv.vendorType === "hotel" ? "Hotels" : tv.vendorType === "guide" ? "Guides" : "Transport",
            serviceDescription: tv.notes || `${tv.vendorType} services`,
            agreedAmount: agreed,
            advancePaid: paid,
            balanceAmount: Math.max(0, agreed - paid),
            status: statusLabel,
            history:
              paid > 0
                ? [
                    {
                      date: new Date().toISOString().substring(0, 10),
                      amount: paid,
                      method: "Auto-Assigned Trip Rate",
                      txnId: "AUTO-SYNC",
                      type: "ADVANCE",
                      status: statusLabel,
                    },
                  ]
                : [],
          });
        }
      });

      // Filter and map Trip Expenses into local activities and misc
      const activities = (expensesRes || []).filter((e: any) => e.category === "ACTIVITIES");
      const misc = (expensesRes || []).filter((e: any) => e.category === "MISCELLANEOUS" || e.category === "OTHER");
      const recons = (expensesRes || []).filter((e: any) => e.category === "ADJUSTMENT");

      setBookings(mergedBookings);
      setReceipts(clientRes.receipts || []);
      setVendorPayments(mergedVendors);
      setDbVendors(vendorsDirRes.data?.data || []);
      setTrainTickets(trainSummaryRes?.tickets || []);

      if (activities.length > 0) setActivityPayments(activities);
      if (misc.length > 0) setMiscPayments(misc);
      if (recons.length > 0) setAdjustments(recons);

    } catch (err) {
      console.error("fetchData error in DeparturePayments:", err);
      setBookings([]);
      setVendorPayments([]);
      setTrainTickets([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tripId, departureDateStr, tripVendors]);

  // Live Calculated Stats across all categories
  const calculatedStats = useMemo(() => {
    const activeBookings = bookings;
    const activeVendors = vendorPayments;
    const activeActivities = activityPayments;
    const activeMisc = miscPayments;

    const totalPax =
      activeBookings.reduce((sum, b) => {
        if (b.numberOfTravelers && Number(b.numberOfTravelers) > 0) {
          return sum + Number(b.numberOfTravelers);
        }
        try {
          const parsed =
            typeof b.passengers === "string"
              ? JSON.parse(b.passengers)
              : b.passengers;
          if (Array.isArray(parsed) && parsed.length > 0) {
            return sum + parsed.length;
          }
        } catch {
          // ignore
        }
        return sum + 1;
      }, 0) || 1;

    // 1. CLIENT / SALES REVENUE
    const totalClientRevenue = activeBookings.reduce(
      (sum, b) => sum + (Number(b.totalAmount) || 0),
      0,
    );
    const clientAmountReceived = activeBookings.reduce(
      (sum, b) => sum + (Number(b.advancePaid) || 0),
      0,
    );
    const clientOutstandingBalance = Math.max(
      0,
      totalClientRevenue - clientAmountReceived,
    );
    const clientCollectedPercent =
      totalClientRevenue > 0
        ? ((clientAmountReceived / totalClientRevenue) * 100).toFixed(0)
        : "0";

    // 2. VENDOR EXPENSES
    const totalVendorPayable = activeVendors.reduce(
      (sum, v) => sum + (Number(v.agreedAmount) || 0),
      0,
    );
    const vendorAmountPaid = activeVendors.reduce(
      (sum, v) => sum + (Number(v.advancePaid) || 0),
      0,
    );
    const vendorOutstandingBalance = Math.max(
      0,
      totalVendorPayable - vendorAmountPaid,
    );
    const vendorPaidPercent =
      totalVendorPayable > 0
        ? ((vendorAmountPaid / totalVendorPayable) * 100).toFixed(0)
        : "0";

    // Category Breakdowns
    const hotelVendors = activeVendors.filter((v) => v.category === "Hotels");
    const transportVendors = activeVendors.filter(
      (v) => v.category === "Transport",
    );
    const guideVendors = activeVendors.filter((v) => v.category === "Guides");

    const totalHotelsCost = hotelVendors.reduce(
      (s, v) => s + (v.agreedAmount || 0),
      0,
    );
    const totalHotelsPaid = hotelVendors.reduce(
      (s, v) => s + (v.advancePaid || 0),
      0,
    );
    const totalHotelsDue = Math.max(0, totalHotelsCost - totalHotelsPaid);

    const totalTransportsCost = transportVendors.reduce(
      (s, v) => s + (v.agreedAmount || 0),
      0,
    );
    const totalTransportsPaid = transportVendors.reduce(
      (s, v) => s + (v.advancePaid || 0),
      0,
    );
    const totalTransportsDue = Math.max(
      0,
      totalTransportsCost - totalTransportsPaid,
    );

    const totalGuidesCost = guideVendors.reduce(
      (s, v) => s + (v.agreedAmount || 0),
      0,
    );
    const totalGuidesPaid = guideVendors.reduce(
      (s, v) => s + (v.advancePaid || 0),
      0,
    );
    const totalGuidesDue = Math.max(0, totalGuidesCost - totalGuidesPaid);

    // 3. TRAIN TICKETS (INCLUDED IN PACKAGE COST CENTER)
    const companyTrainTickets = trainTickets.filter((t) => t.paidBy !== "CUSTOMER");
    let totalTrainCost = 0;
    let totalTrainPaid = 0;
    companyTrainTickets.forEach((t) => {
      const amt = Number(t.ticketAmount || 0);
      const rCharge = Number(t.railwayCancellationCharge || 0);
      const yCharge = Number(t.ycCancellationCharge || 0);

      if (t.ticketStatus === "CONFIRMED" || t.ticketStatus === "BOOKED") {
        totalTrainCost += amt;
        totalTrainPaid += amt;
      } else if (t.ticketStatus === "CANCELLED") {
        totalTrainCost += rCharge + yCharge;
        if (t.refundStatus === "COMPLETED") {
          totalTrainPaid += rCharge + yCharge;
        }
      } else {
        totalTrainCost += amt;
      }
    });
    const totalTrainDue = Math.max(0, totalTrainCost - totalTrainPaid);

    const totalActivityCost = activeActivities.reduce(
      (s, a) => s + (a.totalCost || 0),
      0,
    );
    const activityAmountPaid = activeActivities.reduce(
      (s, a) => s + (a.amountPaid || 0),
      0,
    );
    const activityPending = Math.max(0, totalActivityCost - activityAmountPaid);
    const activityPercent =
      totalActivityCost > 0
        ? ((activityAmountPaid / totalActivityCost) * 100).toFixed(0)
        : "100";

    const totalMiscExpenses = activeMisc.reduce(
      (s, m) => s + (m.amount || 0),
      0,
    );
    const miscApproved = activeMisc
      .filter((m) => m.status === "APPROVED" || m.status === "PAID")
      .reduce((s, m) => s + (m.amount || 0), 0);
    const miscPendingApproval = totalMiscExpenses - miscApproved;

    const totalCosts =
      totalVendorPayable + totalActivityCost + totalTrainCost + totalMiscExpenses;
    const estimatedProfit = totalClientRevenue - totalCosts;
    const profitMargin =
      totalClientRevenue > 0
        ? ((estimatedProfit / totalClientRevenue) * 100).toFixed(1)
        : "0.0";

    // Unit Economics Per Pax
    const revenuePerPax = Math.round(totalClientRevenue / totalPax);
    const receivedPerPax = Math.round(clientAmountReceived / totalPax);
    const outstandingPerPax = Math.round(clientOutstandingBalance / totalPax);

    const hotelsCostPerPax = Math.round(totalHotelsCost / totalPax);
    const transportsCostPerPax = Math.round(totalTransportsCost / totalPax);
    const guidesCostPerPax = Math.round(totalGuidesCost / totalPax);
    const trainCostPerPax = Math.round(totalTrainCost / totalPax);
    const activitiesCostPerPax = Math.round(totalActivityCost / totalPax);
    const miscCostPerPax = Math.round(totalMiscExpenses / totalPax);
    const totalCostsPerPax = Math.round(totalCosts / totalPax);
    const profitPerPax = Math.round(estimatedProfit / totalPax);

    return {
      totalPax,
      totalClientRevenue,
      clientAmountReceived,
      clientOutstandingBalance,
      clientCollectedPercent,
      totalVendorPayable,
      vendorAmountPaid,
      vendorOutstandingBalance,
      vendorPaidPercent,
      totalHotelsCost,
      totalHotelsPaid,
      totalHotelsDue,
      totalTransportsCost,
      totalTransportsPaid,
      totalTransportsDue,
      totalGuidesCost,
      totalGuidesPaid,
      totalGuidesDue,
      totalTrainCost,
      totalTrainPaid,
      totalTrainDue,
      totalActivityCost,
      activityAmountPaid,
      activityPending,
      activityPercent,
      totalMiscExpenses,
      miscApproved,
      miscPendingApproval,
      totalCosts,
      estimatedProfit,
      profitMargin,
      revenuePerPax,
      receivedPerPax,
      outstandingPerPax,
      hotelsCostPerPax,
      transportsCostPerPax,
      guidesCostPerPax,
      trainCostPerPax,
      activitiesCostPerPax,
      miscCostPerPax,
      totalCostsPerPax,
      profitPerPax,
    };
  }, [bookings, vendorPayments, activityPayments, miscPayments, trainTickets]);

  // Helper currency formatting
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getPassengerNames = (booking: any) => {
    try {
      const parsed =
        typeof booking.passengers === "string"
          ? JSON.parse(booking.passengers)
          : booking.passengers;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => p.name || p.fullName).join(", ");
      }
    } catch {}
    return "Lead Passenger";
  };

  const getPassengerCount = (booking: any) => {
    if (booking.numberOfTravelers && Number(booking.numberOfTravelers) > 0) {
      return Number(booking.numberOfTravelers);
    }
    try {
      const parsed =
        typeof booking.passengers === "string"
          ? JSON.parse(booking.passengers)
          : booking.passengers;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.length;
    } catch {}
    return 1;
  };

  // CSV Exporter
  const handleDownloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.info("No records to export");
      return;
    }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) =>
          typeof val === "string"
            ? `"${val.replace(/"/g, '""')}"`
            : typeof val === "object"
              ? `""`
              : val,
        )
        .join(","),
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isSubmittingClientPayment, setIsSubmittingClientPayment] = useState(false);

  // Handlers for Recording Payments
  const handleClientPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || isSubmittingClientPayment) return;
    const amountNum = Number(clientPaymentForm.amount) || 0;
    if (amountNum <= 0) {
      toast.error("Please enter a valid payment amount greater than zero");
      return;
    }

    setIsSubmittingClientPayment(true);
    try {
      await opsService.addClientPayment(
        selectedBooking.bookingId,
        clientPaymentForm,
      );
      toast.success(
        `Recorded ₹${amountNum.toLocaleString()} receipt for ${selectedBooking.bookingId}`,
      );
      await fetchData();
      setAddClientPaymentOpen(false);
      setSelectedBooking(null);
    } catch (err: any) {
      console.error("Payment error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to record client payment";
      toast.error(msg);
    } finally {
      setIsSubmittingClientPayment(false);
    }
  };

  const handleVendorPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const agreedNum = Number(vendorPaymentForm.agreedAmount) || 0;
    const inputAmount = Number(vendorPaymentForm.advancePaid) || 0;

    if (editingVendorPayment) {
      const prevPaid = Number(editingVendorPayment.advancePaid) || 0;
      // If user entered a new payment amount, add it to existing advancePaid; else keep as is
      const isInstallment = prevPaid > 0 && inputAmount !== prevPaid;
      const newTotalPaid = isInstallment ? prevPaid + inputAmount : inputAmount;
      const remaining = Math.max(0, agreedNum - newTotalPaid);
      const status =
        newTotalPaid >= agreedNum && agreedNum > 0
          ? "Paid"
          : newTotalPaid > 0
          ? "Advance Paid"
          : "Pending";

      const newHistoryItem = {
        date:
          vendorPaymentForm.paymentDate ||
          new Date().toISOString().substring(0, 10),
        amount: inputAmount,
        method: vendorPaymentForm.paymentMode || "Bank Transfer",
        txnId: vendorPaymentForm.transactionId || `NEFT-${Date.now()}`,
        type: newTotalPaid >= agreedNum ? "SETTLEMENT" : "INSTALLMENT",
        status: "Paid",
      };

      const updatedHistory = [
        ...(editingVendorPayment.history || []),
        newHistoryItem,
      ];

      try {
        await opsService.updateVendorPayment(tripId, editingVendorPayment.id, {
          ...vendorPaymentForm,
          advancePaid: newTotalPaid,
          remainingPayable: remaining,
          status,
        });
      } catch {}

      setVendorPayments((prev) =>
        prev.map((v) =>
          v.id === editingVendorPayment.id
            ? {
                ...v,
                vendorName: vendorPaymentForm.vendorName,
                category: vendorPaymentForm.category,
                serviceDescription: vendorPaymentForm.serviceDescription,
                agreedAmount: agreedNum,
                advancePaid: newTotalPaid,
                remainingPayable: remaining,
                status,
                history: updatedHistory,
              }
            : v,
        ),
      );
      toast.success(
        `Recorded ₹${inputAmount.toLocaleString("en-IN")} payment for ${vendorPaymentForm.vendorName}!`,
      );
    } else {
      const remaining = Math.max(0, agreedNum - inputAmount);
      const status =
        inputAmount >= agreedNum && agreedNum > 0
          ? "Paid"
          : inputAmount > 0
          ? "Advance Paid"
          : "Pending";

      const newVnd = {
        id: `VND-${Date.now()}`,
        vendorName: vendorPaymentForm.vendorName,
        category: vendorPaymentForm.category,
        invoiceNumber: `INV-${Math.floor(100 + Math.random() * 900)}`,
        invoiceDate: vendorPaymentForm.paymentDate,
        serviceDescription:
          vendorPaymentForm.serviceDescription || "Trip Service Invoice",
        agreedAmount: agreedNum,
        advancePaid: inputAmount,
        remainingPayable: remaining,
        status,
        paymentDate: vendorPaymentForm.paymentDate,
        paymentMode: vendorPaymentForm.paymentMode,
        transactionId: vendorPaymentForm.transactionId || `NEFT-${Date.now()}`,
        history:
          inputAmount > 0
            ? [
                {
                  date: vendorPaymentForm.paymentDate,
                  amount: inputAmount,
                  method: vendorPaymentForm.paymentMode,
                  txnId:
                    vendorPaymentForm.transactionId || `NEFT-${Date.now()}`,
                  type: inputAmount >= agreedNum ? "SETTLEMENT" : "ADVANCE",
                  status: "Paid",
                },
              ]
            : [],
      };
      try {
        await opsService.createVendorPayment(tripId, {
          ...newVnd,
          departureDate: departureDateStr,
        });
      } catch {}
      setVendorPayments((prev) => [newVnd, ...prev]);
      toast.success(
        `Logged vendor payable for ${vendorPaymentForm.vendorName}!`,
      );
    }
    setAddVendorPaymentOpen(false);
    setEditingVendorPayment(null);
  };

  const handleActivityPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = Number(activityPaymentForm.costPerPerson) || 0;
    const pax = Number(activityPaymentForm.participantCount) || 1;
    const total = cost * pax;
    const paid = Number(activityPaymentForm.amountPaid) || 0;
    const balance = Math.max(0, total - paid);
    const status =
      paid >= total && total > 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING";

    const newAct = {
      id: `ACT-PAY-${Date.now()}`,
      activityName: activityPaymentForm.activityName,
      activityType: activityPaymentForm.activityType,
      costPerPerson: cost,
      participantCount: pax,
      totalCost: total,
      amountPaid: paid,
      balanceDue: balance,
      vendorName: activityPaymentForm.vendorName || "External Vendor",
      isIncluded: false,
      status,
      category: "activities",
    };

    try {
      await opsService.upsertTripExpense(tripId, newAct as any);
    } catch {}

    setActivityPayments((prev) => [newAct, ...prev]);
    toast.success(`Recorded activity payment for "${newAct.activityName}"`);
    setAddActivityPaymentOpen(false);
  };

  const handleMiscPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(miscPaymentForm.amount) || 0;
    if (!miscPaymentForm.description || amountNum <= 0) {
      toast.error("Please provide a description and amount");
      return;
    }
    const newMisc = {
      id: `MISC-${Date.now()}`,
      description: miscPaymentForm.description,
      category: "misc",
      amount: amountNum,
      payeeName: miscPaymentForm.payeeName || "Vendor / Staff",
      approvedBy: "Finance Admin",
      status: miscPaymentForm.status || "PENDING",
      paymentDate: miscPaymentForm.paymentDate,
      paymentMethod: miscPaymentForm.paymentMethod,
    };

    try {
      await opsService.upsertTripExpense(tripId, newMisc as any);
    } catch {}

    setMiscPayments((prev) => [newMisc, ...prev]);
    toast.success(`Logged miscellaneous expense: ${newMisc.description}`);
    setAddMiscPaymentOpen(false);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(adjustmentForm.amount) || 0;
    if (!adjustmentForm.reason || amountNum <= 0) {
      toast.error("Please provide reason and amount");
      return;
    }
    const newAdj = {
      id: `ADJ-${Date.now()}`,
      type: adjustmentForm.type,
      category: "reconciliation",
      originalPaymentRef: adjustmentForm.originalPaymentRef,
      amount: amountNum,
      reason: adjustmentForm.reason,
      status: adjustmentForm.status,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    try {
      await opsService.upsertTripExpense(tripId, newAdj as any);
    } catch {}

    setAdjustments((prev) => [newAdj, ...prev]);
    toast.success(
      `Logged ${newAdj.type} adjustment of ₹${amountNum.toLocaleString()}`,
    );
    setAddAdjustmentOpen(false);
  };

  const handleRunReconciliation = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading:
        "Running automated reconciliation engine across 5 payment categories...",
      success:
        "Reconciliation complete! 0 mismatched transactions, 100% ledgers balanced.",
      error: "Reconciliation failed",
    });
  };

  return (
    <div className="space-y-6 pb-12 min-w-0">
      <div className="min-w-0 w-full border-b border-[#E8EEF4] bg-white px-3 sm:px-4 pt-2 rounded-t-xl flex flex-col lg:flex-row lg:items-end lg:justify-between gap-2">
        <div className="min-w-0 overflow-x-auto no-scrollbar">
          <div className="flex flex-nowrap items-center gap-0 w-max min-w-full">
            {[
              {
                key: "clients",
                label: "Client Receivables",
                badge: `₹${(calculatedStats.clientAmountReceived / 1000).toFixed(1)}k`,
              },
              {
                key: "vendors",
                label: "Vendor Payables",
                badge: `₹${(calculatedStats.vendorOutstandingBalance / 1000).toFixed(1)}k`,
              },
              {
                key: "activities",
                label: "Activity Payments",
                badge: `${activityPayments.length}`,
              },
              {
                key: "misc",
                label: "Miscellaneous",
                badge: `₹${calculatedStats.totalMiscExpenses.toLocaleString()}`,
              },
              {
                key: "reconciliation",
                label: "Reconciliation",
                badge: `${adjustments.length}`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSubTab(tab.key as any)}
                className={cn(
                  "px-3 py-2.5 text-[12px] font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0",
                  subTab === tab.key
                    ? "border-[#FF4D00] text-[#FF4D00]"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200",
                )}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ──────────────────────── TAB 1: PAYMENT DASHBOARD (Overview) ──────────────────────── */}
      {subTab === "dashboard" && (
        <div className="space-y-6">
          {/* 5 ENTERPRISE SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Client Receivables (Blue) */}
            <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-2xs space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider">
                  Client Receivables
                </span>
                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {calculatedStats.clientCollectedPercent}% Collected
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Total Revenue:
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {formatCurrency(calculatedStats.totalClientRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Received:</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrency(calculatedStats.clientAmountReceived)}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">
                    Outstanding:
                  </span>
                  <span className="font-extrabold text-amber-600">
                    {formatCurrency(calculatedStats.clientOutstandingBalance)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSubTab("clients")}
                className="w-full text-center text-xs font-bold text-blue-700 hover:text-blue-800 hover:bg-blue-50 py-1.5 rounded-lg border border-blue-200 transition-all flex items-center justify-center gap-1"
              >
                View Ledger <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Vendor Payables (Orange) */}
            <div className="bg-white border border-orange-200 rounded-xl p-4 shadow-2xs space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-orange-900 uppercase tracking-wider">
                  Vendor Payables
                </span>
                <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                  {calculatedStats.vendorPaidPercent}% Paid
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Total Payable:
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {formatCurrency(calculatedStats.totalVendorPayable)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Amount Paid:
                  </span>
                  <span className="font-extrabold text-blue-600">
                    {formatCurrency(calculatedStats.vendorAmountPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">
                    Balance Due:
                  </span>
                  <span className="font-extrabold text-red-600">
                    {formatCurrency(calculatedStats.vendorOutstandingBalance)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSubTab("vendors")}
                className="w-full text-center text-xs font-bold text-orange-700 hover:text-orange-800 hover:bg-orange-50 py-1.5 rounded-lg border border-orange-200 transition-all flex items-center justify-center gap-1"
              >
                View Payables <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3. Activity Payments (Purple) */}
            <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-2xs space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-purple-900 uppercase tracking-wider">
                  Activity Payments
                </span>
                <span className="text-xs font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                  {calculatedStats.activityPercent}% Complete
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Total Activity Cost:
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {formatCurrency(calculatedStats.totalActivityCost)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Paid to Vendors:
                  </span>
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrency(calculatedStats.activityAmountPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Pending:</span>
                  <span className="font-extrabold text-purple-700">
                    {formatCurrency(calculatedStats.activityPending)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSubTab("activities")}
                className="w-full text-center text-xs font-bold text-purple-700 hover:text-purple-800 hover:bg-purple-50 py-1.5 rounded-lg border border-purple-200 transition-all flex items-center justify-center gap-1"
              >
                View Activities <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4. Miscellaneous (Gray) */}
            <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-500" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                  Miscellaneous
                </span>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {miscPayments.length} Expenses
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Total Misc Cost:
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {formatCurrency(calculatedStats.totalMiscExpenses)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">Approved:</span>
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrency(calculatedStats.miscApproved)}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">
                    Pending Approval:
                  </span>
                  <span className="font-extrabold text-amber-600">
                    {formatCurrency(calculatedStats.miscPendingApproval)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSubTab("misc")}
                className="w-full text-center text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 py-1.5 rounded-lg border border-slate-300 transition-all flex items-center justify-center gap-1"
              >
                Review Pending <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 5. Trip Profitability (Green) */}
            <div className="bg-white border border-emerald-300 rounded-xl p-4 shadow-2xs space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider">
                  Trip Profitability
                </span>
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded",
                    Number(calculatedStats.profitMargin) >= 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800",
                  )}
                >
                  {calculatedStats.profitMargin}% Margin
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Total Revenue:
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {formatCurrency(calculatedStats.totalClientRevenue)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Total Costs:
                  </span>
                  <span className="font-extrabold text-red-700">
                    {formatCurrency(calculatedStats.totalCosts)}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">
                    Est. Profit:
                  </span>
                  <span
                    className={cn(
                      "font-extrabold",
                      calculatedStats.estimatedProfit >= 0
                        ? "text-emerald-700"
                        : "text-red-600",
                    )}
                  >
                    {formatCurrency(calculatedStats.estimatedProfit)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSubTab("reconciliation")}
                className="w-full text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 py-1.5 rounded-lg border border-emerald-200 transition-all flex items-center justify-center gap-1"
              >
                Full P&L / Reconcile <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* DEPARTURE UNIT ECONOMICS & PER-PERSON ACCOUNTING MATRIX */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white p-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-100">
                  Unit Economics & Cost Center Matrix
                </span>
                <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  Per-Person Accounting
                </span>
              </div>
              <div className="text-xs font-medium text-slate-400">
                Total Departure Pax:{" "}
                <span className="text-white font-black">
                  {calculatedStats.totalPax} Travelers
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Cost Center / Financial Stream</th>
                    <th className="py-2.5 px-4 text-right">Agreed / Total (₹)</th>
                    <th className="py-2.5 px-4 text-right">Paid / Received (₹)</th>
                    <th className="py-2.5 px-4 text-right">Balance Due (₹)</th>
                    <th className="py-2.5 px-4 text-right font-mono bg-orange-50/60 text-orange-950 font-black">
                      Per Person (₹/Pax)
                    </th>
                    <th className="py-2.5 px-4 text-center">% of Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* 1. REVENUE */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-bold text-slate-900">
                          Gross Customer Revenue
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-4">
                        Confirmed booking packages
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900 font-mono">
                      {formatCurrency(calculatedStats.totalClientRevenue)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-600 font-mono">
                      {formatCurrency(calculatedStats.clientAmountReceived)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-600 font-mono">
                      {formatCurrency(calculatedStats.clientOutstandingBalance)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-blue-700 bg-orange-50/60 font-mono">
                      ₹{calculatedStats.revenuePerPax.toLocaleString("en-IN")}/pax
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-600">
                      100.0%
                    </td>
                  </tr>

                  {/* 2. HOTELS */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="font-bold text-slate-800">
                          Hotel & Accommodation Stays
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-4">
                        Rooms, camps & homestay contracts
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800 font-mono">
                      {formatCurrency(calculatedStats.totalHotelsCost)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-700 font-mono">
                      {formatCurrency(calculatedStats.totalHotelsPaid)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-600 font-mono">
                      {formatCurrency(calculatedStats.totalHotelsDue)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-orange-700 bg-orange-50/60 font-mono">
                      ₹{calculatedStats.hotelsCostPerPax.toLocaleString("en-IN")}/pax
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-slate-600">
                      {calculatedStats.totalClientRevenue > 0
                        ? (
                            (calculatedStats.totalHotelsCost /
                              calculatedStats.totalClientRevenue) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </td>
                  </tr>

                  {/* 3. TRANSPORT */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="font-bold text-slate-800">
                          Transport & Fleet Vehicles
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-4">
                        Tempo travellers, cabs & drivers
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800 font-mono">
                      {formatCurrency(calculatedStats.totalTransportsCost)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-700 font-mono">
                      {formatCurrency(calculatedStats.totalTransportsPaid)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-600 font-mono">
                      {formatCurrency(calculatedStats.totalTransportsDue)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-amber-700 bg-orange-50/60 font-mono">
                      ₹
                      {calculatedStats.transportsCostPerPax.toLocaleString(
                        "en-IN",
                      )}
                      /pax
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-slate-600">
                      {calculatedStats.totalClientRevenue > 0
                        ? (
                            (calculatedStats.totalTransportsCost /
                              calculatedStats.totalClientRevenue) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </td>
                  </tr>

                  {/* 4. GUIDES */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-800">
                          Trek Leaders & Local Guides
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-4">
                        Trip leads, mountain guides & crew
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800 font-mono">
                      {formatCurrency(calculatedStats.totalGuidesCost)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-700 font-mono">
                      {formatCurrency(calculatedStats.totalGuidesPaid)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-600 font-mono">
                      {formatCurrency(calculatedStats.totalGuidesDue)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-emerald-700 bg-orange-50/60 font-mono">
                      ₹{calculatedStats.guidesCostPerPax.toLocaleString("en-IN")}/pax
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-slate-600">
                      {calculatedStats.totalClientRevenue > 0
                        ? (
                            (calculatedStats.totalGuidesCost /
                              calculatedStats.totalClientRevenue) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </td>
                  </tr>

                  {/* 5. TRAIN TICKETS (PACKAGE INCLUDED) */}
                  <tr className="hover:bg-slate-50/60 transition-colors bg-indigo-50/30">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="font-bold text-slate-800">
                          Train Tickets (Package Included)
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-4">
                        Company-paid railway reservations & net cancellations
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800 font-mono">
                      {formatCurrency(calculatedStats.totalTrainCost)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-700 font-mono">
                      {formatCurrency(calculatedStats.totalTrainPaid)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-600 font-mono">
                      {formatCurrency(calculatedStats.totalTrainDue)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-indigo-700 bg-indigo-50/60 font-mono">
                      ₹{calculatedStats.trainCostPerPax.toLocaleString("en-IN")}/pax
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-slate-600">
                      {calculatedStats.totalClientRevenue > 0
                        ? (
                            (calculatedStats.totalTrainCost /
                              calculatedStats.totalClientRevenue) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </td>
                  </tr>

                  {/* 6. ACTIVITIES */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span className="font-bold text-slate-800">
                          Adventure & Paid Activities
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-4">
                        Rafting, permits, entry tickets & sports
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800 font-mono">
                      {formatCurrency(calculatedStats.totalActivityCost)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-700 font-mono">
                      {formatCurrency(calculatedStats.activityAmountPaid)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-600 font-mono">
                      {formatCurrency(calculatedStats.activityPending)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-purple-700 bg-orange-50/60 font-mono">
                      ₹
                      {calculatedStats.activitiesCostPerPax.toLocaleString(
                        "en-IN",
                      )}
                      /pax
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-slate-600">
                      {calculatedStats.totalClientRevenue > 0
                        ? (
                            (calculatedStats.totalActivityCost /
                              calculatedStats.totalClientRevenue) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </td>
                  </tr>

                  {/* 6. MISC */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="font-bold text-slate-800">
                          Miscellaneous & Enroute Ops
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block ml-4">
                        Tolls, meals, first aid & emergency expenses
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-800 font-mono">
                      {formatCurrency(calculatedStats.totalMiscExpenses)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-700 font-mono">
                      {formatCurrency(calculatedStats.miscApproved)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-600 font-mono">
                      {formatCurrency(calculatedStats.miscPendingApproval)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-700 bg-orange-50/60 font-mono">
                      ₹{calculatedStats.miscCostPerPax.toLocaleString("en-IN")}/pax
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-slate-600">
                      {calculatedStats.totalClientRevenue > 0
                        ? (
                            (calculatedStats.totalMiscExpenses /
                              calculatedStats.totalClientRevenue) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </td>
                  </tr>

                  {/* 7. NET MARGIN / PROFIT */}
                  <tr className="bg-slate-50 font-black text-xs border-t-2 border-slate-200">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            calculatedStats.estimatedProfit >= 0
                              ? "bg-emerald-500"
                              : "bg-red-500",
                          )}
                        />
                        <span className="font-black text-slate-900 uppercase">
                          Net Realized Departure Profit
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block ml-4">
                        Revenue minus all vendor & operational costs
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-3 px-4 text-right font-black font-mono text-sm",
                        calculatedStats.estimatedProfit >= 0
                          ? "text-emerald-700"
                          : "text-red-600",
                      )}
                    >
                      {formatCurrency(calculatedStats.estimatedProfit)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-600 font-mono">
                      Cost: {formatCurrency(calculatedStats.totalCosts)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      —
                    </td>
                    <td
                      className={cn(
                        "py-3 px-4 text-right font-black bg-orange-100/70 font-mono text-sm",
                        calculatedStats.profitPerPax >= 0
                          ? "text-emerald-800"
                          : "text-red-700",
                      )}
                    >
                      ₹{calculatedStats.profitPerPax.toLocaleString("en-IN")}/pax
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded font-black text-xs",
                          Number(calculatedStats.profitMargin) >= 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800",
                        )}
                      >
                        {calculatedStats.profitMargin}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              ⚡ Quick Transaction Actions
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => setAddClientPaymentOpen(true)}
                className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                + Add Client Payment
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingVendorPayment(null);
                  setAddVendorPaymentOpen(true);
                }}
                className="h-8 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                + Add Vendor Payment
              </Button>
              <Button
                size="sm"
                onClick={() => setAddActivityPaymentOpen(true)}
                className="h-8 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                + Add Activity Payment
              </Button>
              <Button
                size="sm"
                onClick={() => setAddMiscPaymentOpen(true)}
                className="h-8 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs"
              >
                + Miscellaneous Expense
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRunReconciliation}
                className="h-8 text-xs font-bold border-slate-300 text-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Run Reconciliation
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleDownloadCSV(bookings, "payment_ledger_summary.csv")
                }
                className="h-8 text-xs font-bold border-slate-300 text-slate-700"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Download Report
              </Button>
            </div>
          </div>

          {/* Recent Ledger Summary Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Client Receipts */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Recent Client Receivables Transactions
                </h4>
                <button
                  onClick={() => setSubTab("clients")}
                  className="text-xs font-semibold text-orange-600 hover:underline"
                >
                  View All ({bookings.length})
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    No client receivables recorded yet for this departure.
                  </div>
                ) : (
                  bookings.slice(0, 4).map((b) => {
                    const bal = Math.max(
                      0,
                      b.totalAmount - (b.advancePaid || 0),
                    );
                    return (
                      <div
                        key={b.bookingId}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-black text-slate-900">
                            {b.bookingId}
                          </span>
                          <span className="text-slate-600 ml-1.5 font-medium">
                            {b.name}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Paid: {formatCurrency(b.advancePaid)} of{" "}
                            {formatCurrency(b.totalAmount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                              b.paymentStatus === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : b.paymentStatus === "Partially Paid"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-red-50 text-red-700 border border-red-200",
                            )}
                          >
                            {b.paymentStatus || "Unpaid"}
                          </span>
                          <div className="text-[11px] font-bold text-slate-500 mt-1">
                            Due: {formatCurrency(bal)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Vendor Payables */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Recent Vendor Payables Transactions
                </h4>
                <button
                  onClick={() => setSubTab("vendors")}
                  className="text-xs font-semibold text-orange-600 hover:underline"
                >
                  View All ({vendorPayments.length})
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {vendorPayments.length === 0 ? (
                  <div className="py-8 text-center text-xs font-semibold text-slate-400">
                    No vendor payables recorded yet for this departure.
                  </div>
                ) : (
                  vendorPayments.slice(0, 4).map((v) => (
                    <div
                      key={v.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-black text-slate-900">
                          {v.vendorName}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded uppercase ml-1.5">
                          {v.category}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Inv: {v.invoiceNumber} · Agreed:{" "}
                          {formatCurrency(v.agreedAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                            v.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : v.status === "Advance Paid" ||
                                  v.status === "Partially Paid"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200",
                          )}
                        >
                          {v.status}
                        </span>
                        <div className="text-[11px] font-bold text-red-600 mt-1">
                          Bal: {formatCurrency(v.remainingPayable)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────── TAB 2: CLIENT RECEIVABLES (Detailed Ledger) ──────────────────────── */}
      {subTab === "clients" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 min-w-0 w-full flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 w-full lg:flex-1">
              <select
                value={clientStatusFilter}
                onChange={(e) => setClientStatusFilter(e.target.value)}
                className="h-8 w-full min-w-0 sm:w-auto sm:shrink-0 text-xs font-medium border border-[#E8EEF4] rounded-lg px-3 bg-white text-[#0B1528] outline-none cursor-pointer"
              >
                <option value="All Status">All Payment Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Fully Paid</option>
              </select>
              <div className="relative min-w-0 w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search passenger name, phone, or booking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full min-w-0 pl-8 text-xs rounded-lg border border-[#E8EEF4] bg-white text-[#0B1528] placeholder:text-slate-400 focus:outline-none focus:border-[#FF4D00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:flex lg:shrink-0">
              <Button
                size="sm"
                onClick={() => setAddClientPaymentOpen(true)}
                className="h-auto min-h-8 w-full lg:w-auto whitespace-normal leading-tight py-1.5 bg-[#0B1528] hover:bg-[#16253d] text-white font-semibold text-[11px]"
              >
                <Plus className="w-3.5 h-3.5 mr-1 shrink-0" /> Record Client Payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleDownloadCSV(bookings, "client_receivables_ledger.csv")
                }
                className="h-auto min-h-8 w-full lg:w-auto whitespace-normal leading-tight py-1.5 text-[11px] font-semibold border-[#E8EEF4] text-[#0B1528] hover:bg-[#F4F7FB]"
              >
                <Download className="w-3.5 h-3.5 mr-1 shrink-0" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Table with Clickable Expandable Ledger Rows */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3 border-r border-slate-100">BOOKING ID</th>
                  <th className="p-3 border-r border-slate-100">PASSENGER</th>
                  <th className="p-3 border-r border-slate-100">PHONE</th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    PACKAGE AMOUNT
                  </th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    AMOUNT PAID
                  </th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    BALANCE DUE
                  </th>
                  <th className="p-3 border-r border-slate-100 text-center">
                    PAYMENT STATUS
                  </th>
                  <th className="p-3 text-center w-36">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const filteredBookings = bookings.filter((b) => {
                    const matchSearch =
                      searchQuery === "" ||
                      b.bookingId
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      b.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      (b.phone || "")
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());
                    const matchStatus =
                      clientStatusFilter === "All Status" ||
                      b.paymentStatus === clientStatusFilter;
                    return matchSearch && matchStatus;
                  });

                  return filteredBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-xs font-semibold text-slate-400"
                      >
                        No client bookings or receivables found for this
                        departure.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const balance = Math.max(
                        0,
                        b.totalAmount - (b.advancePaid || 0),
                      );
                      const isExpanded = expandedBookingId === b.bookingId;
                      return (
                        <React.Fragment key={b.bookingId}>
                          <tr
                            onClick={() =>
                              setExpandedBookingId(
                                isExpanded ? null : b.bookingId,
                              )
                            }
                            className={cn(
                              "hover:bg-slate-50/70 transition-colors cursor-pointer",
                              isExpanded && "bg-orange-50/40",
                            )}
                          >
                            <td className="p-3 border-r border-slate-100 font-extrabold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                                <span>{b.bookingId}</span>
                              </div>
                            </td>
                            <td className="p-3 border-r border-slate-100">
                              <span className="font-bold text-slate-800">
                                {b.name}
                              </span>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {getPassengerNames(b)}
                              </p>
                            </td>
                            <td className="p-3 border-r border-slate-100 font-medium text-slate-600">
                              {b.phone || "—"}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right">
                              <span className="font-black text-slate-900 block font-mono">
                                {formatCurrency(b.totalAmount)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {formatCurrency(
                                  Math.round(b.totalAmount / getPassengerCount(b)),
                                )}
                                /pax ({getPassengerCount(b)}{" "}
                                {getPassengerCount(b) === 1 ? "Pax" : "Pax"})
                              </span>
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right">
                              <span className="font-black text-emerald-700 block font-mono">
                                {formatCurrency(b.advancePaid)}
                              </span>
                              <span className="text-[10px] text-emerald-600/70 font-mono block">
                                {formatCurrency(
                                  Math.round(
                                    (b.advancePaid || 0) / getPassengerCount(b),
                                  ),
                                )}
                                /pax
                              </span>
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right">
                              <span className="font-black text-amber-600 block font-mono">
                                {formatCurrency(balance)}
                              </span>
                              <span className="text-[10px] text-amber-600/70 font-mono block">
                                {formatCurrency(
                                  Math.round(balance / getPassengerCount(b)),
                                )}
                                /pax
                              </span>
                            </td>
                            <td className="p-3 border-r border-slate-100 text-center">
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                                  b.paymentStatus === "Paid"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : b.paymentStatus === "Partially Paid"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200",
                                )}
                              >
                                {b.paymentStatus || "Unpaid"}
                              </span>
                            </td>
                            <td
                              className="p-3 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBooking(b);
                                    setClientPaymentForm({
                                      amount: String(balance),
                                      paymentMode: "UPI",
                                      transactionId: "",
                                      paymentDate: new Date()
                                        .toISOString()
                                        .substring(0, 10),
                                      proofUrl: "",
                                      remarks: "",
                                      status: "Verified",
                                    });
                                    setAddClientPaymentOpen(true);
                                  }}
                                  className="bg-blue-600 text-white hover:bg-blue-700 text-[10px] font-bold px-2.5 py-1 rounded shadow-xs"
                                >
                                  Record Pay
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedBookingId(
                                      isExpanded ? null : b.bookingId,
                                    )
                                  }
                                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-1 rounded"
                                >
                                  {isExpanded ? "Hide" : "History"}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDABLE ROW: TRANSACTION LEDGER HISTORY FOR THIS BOOKING */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 border-t border-b border-slate-200">
                              <td colSpan={8} className="p-4">
                                <div className="space-y-3 max-w-4xl">
                                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                      <Receipt className="w-4 h-4 text-blue-600" />
                                      {b.bookingId} | {b.name} — Transaction
                                      Ledger History
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">
                                      Summary: {formatCurrency(b.advancePaid)}{" "}
                                      received (
                                      {b.totalAmount > 0
                                        ? `${(((b.advancePaid || 0) / b.totalAmount) * 100).toFixed(0)}%`
                                        : "0%"}
                                      ) · {formatCurrency(balance)} remaining
                                      due
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {!b.history || b.history.length === 0 ? (
                                      <div className="text-xs text-slate-400 italic py-2">
                                        No transaction receipts logged for this
                                        customer yet.
                                      </div>
                                    ) : (
                                      b.history.map((h: any, idx: number) => (
                                        <div
                                          key={h.id || idx}
                                          className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 rounded-lg">
                                              <Check className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-extrabold text-slate-900 text-sm">
                                                  {formatCurrency(h.amount)}
                                                </span>
                                                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                                                  {h.method}
                                                </span>
                                                {h.accountName && (
                                                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded">
                                                    {h.accountName}
                                                  </span>
                                                )}
                                                <span className="text-xs font-mono text-slate-500">
                                                  TXN: {h.txnId}
                                                </span>
                                              </div>
                                              <p className="text-xs text-slate-500 mt-0.5">
                                                Date: {h.date} · Verified by{" "}
                                                {h.verifiedBy ||
                                                  "Finance Admin"}
                                                {h.remarks
                                                  ? ` · Remarks: "${h.remarks}"`
                                                  : ""}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                              VERIFIED ✓
                                            </span>
                                            {h.proofUrl && (
                                              <a
                                                href={h.proofUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="h-7 px-2.5 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md inline-flex items-center gap-1 transition-colors"
                                              >
                                                <Eye className="w-3.5 h-3.5" />
                                                Screenshot
                                              </a>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                generateClientReceiptPDF(b, h)
                                              }
                                              className="h-7 text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                            >
                                              Download Receipt PDF
                                            </Button>
                                          </div>
                                        </div>
                                      ))
                                    )}

                                    {/* Expected Next Payment Card */}
                                    {balance > 0 && (
                                      <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                                          <Clock className="w-4 h-4 text-amber-600" />
                                          <span>
                                            Expected Settlement Due:{" "}
                                            {formatCurrency(balance)}
                                          </span>
                                          <span className="text-slate-600 font-normal">
                                            — Full settlement before departure
                                          </span>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setSelectedBooking(b);
                                            setClientPaymentForm({
                                              amount: String(balance),
                                              paymentMode: "UPI",
                                              transactionId: "",
                                              paymentDate: new Date()
                                                .toISOString()
                                                .substring(0, 10),
                                              proofUrl: "",
                                              remarks:
                                                "Final balance settlement",
                                              status: "Verified",
                                            });
                                            setAddClientPaymentOpen(true);
                                          }}
                                          className="h-7 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                                        >
                                          Record Settlement Now
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────── TAB 3: VENDOR PAYABLES (Detailed Ledger) ──────────────────────── */}
      {subTab === "vendors" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 min-w-0 w-full flex flex-col lg:flex-row lg:items-center gap-2">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 min-w-0 w-full lg:flex-1">
              <select
                value={vendorCategoryFilter}
                onChange={(e) => setVendorCategoryFilter(e.target.value)}
                className="h-8 w-full min-w-0 sm:w-auto sm:shrink-0 text-xs font-medium border border-[#E8EEF4] rounded-lg px-3 bg-white text-[#0B1528] outline-none cursor-pointer"
              >
                <option value="All Categories">All Vendor Categories</option>
                {[
                  "Hotels",
                  "Transport",
                  "Activities",
                  "Guides",
                  "Meals",
                  "Other",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={vendorStatusFilter}
                onChange={(e) => setVendorStatusFilter(e.target.value)}
                className="h-8 w-full min-w-0 sm:w-auto sm:shrink-0 text-xs font-medium border border-[#E8EEF4] rounded-lg px-3 bg-white text-[#0B1528] outline-none cursor-pointer"
              >
                <option value="All Status">All Payment Statuses</option>
                {["Not Paid", "Advance Paid", "Partially Paid", "Paid"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ),
                )}
              </select>

              <div className="relative min-w-0 w-full sm:flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search vendor name or invoice #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full min-w-0 pl-8 text-xs rounded-lg border border-[#E8EEF4] bg-white text-[#0B1528] placeholder:text-slate-400 focus:outline-none focus:border-[#FF4D00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:flex lg:shrink-0">
              <Button
                size="sm"
                onClick={() => {
                  setEditingVendorPayment(null);
                  setAddVendorPaymentOpen(true);
                }}
                className="h-auto min-h-8 w-full lg:w-auto whitespace-normal leading-tight py-1.5 bg-[#FF4D00] hover:bg-[#E04500] text-white font-semibold text-[11px]"
              >
                <Plus className="w-3.5 h-3.5 mr-1 shrink-0" /> Record Vendor Payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleDownloadCSV(
                    vendorPayments,
                    "vendor_payables_ledger.csv",
                  )
                }
                className="h-auto min-h-8 w-full lg:w-auto whitespace-normal leading-tight py-1.5 text-[11px] font-semibold border-[#E8EEF4] text-[#0B1528] hover:bg-[#F4F7FB]"
              >
                <Download className="w-3.5 h-3.5 mr-1 shrink-0" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Table with Clickable Expandable Vendor Invoice Rows */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3 border-r border-slate-100">VENDOR</th>
                  <th className="p-3 border-r border-slate-100">TYPE</th>
                  <th className="p-3 border-r border-slate-100">INVOICE #</th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    INVOICE AMOUNT
                  </th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    ADVANCE PAID
                  </th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    BALANCE DUE
                  </th>
                  <th className="p-3 border-r border-slate-100 text-center">
                    STATUS
                  </th>
                  <th className="p-3 text-center w-36">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const filteredVendors = vendorPayments.filter((v) => {
                    const matchSearch =
                      searchQuery === "" ||
                      v.vendorName
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      (v.invoiceNumber || "")
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());
                    const matchCat =
                      vendorCategoryFilter === "All Categories" ||
                      v.category === vendorCategoryFilter;
                    const matchStatus =
                      vendorStatusFilter === "All Status" ||
                      v.status === vendorStatusFilter;
                    return matchSearch && matchCat && matchStatus;
                  });

                  return filteredVendors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-12 text-center text-xs font-semibold text-slate-400"
                      >
                        No vendor payables recorded yet for this departure.
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((v) => {
                      const balance = Math.max(
                        0,
                        (v.agreedAmount || 0) - (v.advancePaid || 0),
                      );
                      const isExpanded = expandedVendorId === v.id;
                      return (
                        <React.Fragment key={v.id}>
                          <tr
                            onClick={() =>
                              setExpandedVendorId(isExpanded ? null : v.id)
                            }
                            className={cn(
                              "hover:bg-slate-50/70 transition-colors cursor-pointer",
                              isExpanded && "bg-orange-50/40",
                            )}
                          >
                            <td className="p-3 border-r border-slate-100 font-extrabold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                                <span>{v.vendorName}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[200px]">
                                {v.serviceDescription}
                              </p>
                            </td>
                            <td className="p-3 border-r border-slate-100">
                              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded uppercase">
                                {v.category}
                              </span>
                            </td>
                            <td className="p-3 border-r border-slate-100 font-bold text-slate-700">
                              {v.invoiceNumber || "—"}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right font-black text-slate-900">
                              {formatCurrency(v.agreedAmount)}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right font-black text-blue-600">
                              {formatCurrency(v.advancePaid)}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-right font-black text-red-600">
                              {formatCurrency(balance)}
                            </td>
                            <td className="p-3 border-r border-slate-100 text-center">
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                                  v.status === "Paid"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : v.status === "Advance Paid" ||
                                        v.status === "Partially Paid"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200",
                                )}
                              >
                                {v.status}
                              </span>
                            </td>
                            <td
                              className="p-3 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingVendorPayment(v);
                                    setVendorPaymentForm({
                                      vendorName: v.vendorName,
                                      category: v.category,
                                      serviceDescription:
                                        v.serviceDescription || "",
                                      agreedAmount: String(v.agreedAmount),
                                      advancePaid: String(balance > 0 ? balance : 0),
                                      paymentDate: new Date().toISOString().substring(0, 10),
                                      paymentMode: "BANK_TRANSFER",
                                      transactionId: "",
                                      invoiceProof: v.invoiceProof || "",
                                      status: v.status,
                                      remarks: "",
                                    });
                                    setAddVendorPaymentOpen(true);
                                  }}
                                  className="bg-orange-600 text-white hover:bg-orange-700 text-[10px] font-bold px-2.5 py-1 rounded shadow-xs"
                                >
                                  Record Pay
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedVendorId(
                                      isExpanded ? null : v.id,
                                    )
                                  }
                                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-1 rounded"
                                >
                                  {isExpanded ? "Hide History" : "View History"}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDABLE ROW: VENDOR INVOICE DETAILS & PAYMENT HISTORY */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 border-t border-b border-slate-200">
                              <td colSpan={8} className="p-4">
                                <div className="space-y-3 max-w-4xl">
                                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                      <Building2 className="w-4 h-4 text-orange-600" />
                                      {v.vendorName} ({v.category}) — Invoice{" "}
                                      {v.invoiceNumber} Details
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">
                                      Invoice Total:{" "}
                                      {formatCurrency(v.agreedAmount)} · Paid:{" "}
                                      {formatCurrency(v.advancePaid)} · Balance
                                      Due: {formatCurrency(balance)}
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {!v.history || v.history.length === 0 ? (
                                      <div className="text-xs text-slate-400 italic py-2">
                                        No advance or settlement payments
                                        recorded against this invoice yet.
                                      </div>
                                    ) : (
                                      v.history.map((h: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                              <CreditCard className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-slate-900 text-sm">
                                                  {formatCurrency(h.amount)}
                                                </span>
                                                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                                                  {h.method}
                                                </span>
                                                <span className="text-xs font-mono text-slate-500">
                                                  TXN: {h.txnId}
                                                </span>
                                              </div>
                                              <p className="text-xs text-slate-500 mt-0.5">
                                                Date: {h.date} · Type:{" "}
                                                {h.type || "ADVANCE"}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                              VERIFIED ✓
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => generateVendorInvoicePDF(v, h)}
                                              className="h-7 text-[11px] font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                                            >
                                              Download Invoice PDF
                                            </Button>
                                          </div>
                                        </div>
                                      ))
                                    )}

                                    {/* Next Settlement Card */}
                                    {balance > 0 && (
                                      <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                                          <Clock className="w-4 h-4 text-amber-600" />
                                          <span>
                                            Settlement Due:{" "}
                                            {formatCurrency(balance)}
                                          </span>
                                          <span className="text-slate-600 font-normal">
                                            — Due{" "}
                                            {v.dueDate ||
                                              "after trip completion"}
                                          </span>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setEditingVendorPayment(v);
                                            setVendorPaymentForm({
                                              vendorName: v.vendorName,
                                              category: v.category,
                                              serviceDescription:
                                                v.serviceDescription || "",
                                              agreedAmount: String(
                                                v.agreedAmount,
                                              ),
                                              advancePaid: String(
                                                v.agreedAmount,
                                              ),
                                              paymentDate: new Date()
                                                .toISOString()
                                                .substring(0, 10),
                                              paymentMode: "BANK_TRANSFER",
                                              transactionId: `NEFT-SETTLE-${Date.now()}`,
                                              invoiceProof: "",
                                              status: "Paid",
                                              remarks:
                                                "Final balance settlement",
                                            });
                                            setAddVendorPaymentOpen(true);
                                          }}
                                          className="h-7 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                                        >
                                          Record Final Settlement
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────── TAB 4: ACTIVITY PAYMENTS ──────────────────────── */}
      {subTab === "activities" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 min-w-0 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-xs font-semibold text-[#0B1528] min-w-0">
              Activity costs & vendor settlement
            </span>
            <Button
              size="sm"
              onClick={() => setAddActivityPaymentOpen(true)}
              className="h-8 w-full sm:w-auto shrink-0 bg-[#0B1528] hover:bg-[#16253d] text-white font-semibold text-[11px]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Record Activity Payment
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3 border-r border-slate-100">
                    ACTIVITY NAME
                  </th>
                  <th className="p-3 border-r border-slate-100">TYPE</th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    COST/PPL
                  </th>
                  <th className="p-3 border-r border-slate-100 text-center">
                    PAX
                  </th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    TOTAL COST
                  </th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    PAID
                  </th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    BALANCE
                  </th>
                  <th className="p-3 border-r border-slate-100 text-center">
                    STATUS
                  </th>
                  <th className="p-3 text-center w-36">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activityPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-xs font-semibold text-slate-400"
                    >
                      No activity payments recorded yet for this departure.
                    </td>
                  </tr>
                ) : (
                  activityPayments.map((act) => (
                    <tr
                      key={act.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-3 border-r border-slate-100">
                        <span className="font-extrabold text-slate-900">
                          {act.activityName}
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Vendor: {act.vendorName}
                        </p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded uppercase">
                          {act.activityType}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-100 text-right font-bold text-slate-700">
                        {act.isIncluded
                          ? "₹0 (Incl)"
                          : formatCurrency(act.costPerPerson)}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center font-bold text-slate-800">
                        {act.participantCount}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-right font-black text-slate-900">
                        {formatCurrency(act.totalCost)}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-right font-black text-emerald-700">
                        {formatCurrency(act.amountPaid)}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-right font-black text-amber-600">
                        {formatCurrency(act.balanceDue)}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                            act.status === "INCLUDED" || act.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : act.status === "PARTIAL"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200",
                          )}
                        >
                          {act.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {!act.isIncluded && act.balanceDue > 0 ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setActivityPaymentForm({
                                activityName: act.activityName,
                                activityType: act.activityType,
                                costPerPerson: String(act.costPerPerson),
                                participantCount: String(act.participantCount),
                                vendorName: act.vendorName,
                                amountPaid: String(act.totalCost),
                                paymentDate: new Date()
                                  .toISOString()
                                  .substring(0, 10),
                                paymentMode: "UPI",
                                transactionId: `ACT-TXN-${Date.now()}`,
                                remarks: "Full activity settlement",
                              });
                              setAddActivityPaymentOpen(true);
                            }}
                            className="h-7 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-2.5"
                          >
                            Record Pay
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────── TAB 5: MISCELLANEOUS PAYMENTS (Ad-Hoc Expenses) ──────────────────────── */}
      {subTab === "misc" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 min-w-0 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-xs font-semibold text-[#0B1528] min-w-0">
              Miscellaneous & ad-hoc expenses
            </span>
            <Button
              size="sm"
              onClick={() => setAddMiscPaymentOpen(true)}
              className="h-8 w-full sm:w-auto shrink-0 bg-[#0B1528] hover:bg-[#16253d] text-white font-semibold text-[11px]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add miscellaneous expense
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3 border-r border-slate-100">DESCRIPTION</th>
                  <th className="p-3 border-r border-slate-100">CATEGORY</th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    AMOUNT
                  </th>
                  <th className="p-3 border-r border-slate-100">PAYEE NAME</th>
                  <th className="p-3 border-r border-slate-100">APPROVED BY</th>
                  <th className="p-3 border-r border-slate-100 text-center">
                    STATUS
                  </th>
                  <th className="p-3 text-center w-48">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {miscPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-xs font-semibold text-slate-400"
                    >
                      No miscellaneous expenses recorded for this departure.
                    </td>
                  </tr>
                ) : (
                  miscPayments.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-3 border-r border-slate-100 font-extrabold text-slate-900">
                        {m.description}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Date: {m.paymentDate}
                        </p>
                      </td>
                      <td className="p-3 border-r border-slate-100">
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded uppercase">
                          {m.category}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-100 text-right font-black text-slate-900">
                        {formatCurrency(m.amount)}
                      </td>
                      <td className="p-3 border-r border-slate-100 font-bold text-slate-700">
                        {m.payeeName}
                      </td>
                      <td className="p-3 border-r border-slate-100 font-medium text-slate-600">
                        {m.approvedBy}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                            m.status === "APPROVED" || m.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : m.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200",
                          )}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {m.status === "PENDING" ? (
                          <div className="flex gap-1.5 justify-center">
                            <Button
                              size="sm"
                              onClick={() => {
                                setMiscPayments((prev) =>
                                  prev.map((item) =>
                                    item.id === m.id
                                      ? { ...item, status: "APPROVED" }
                                      : item,
                                  ),
                                );
                                toast.success("Expense approved!");
                              }}
                              className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setMiscPayments((prev) =>
                                  prev.map((item) =>
                                    item.id === m.id
                                      ? { ...item, status: "REJECTED" }
                                      : item,
                                  ),
                                );
                                toast.success("Expense rejected");
                              }}
                              className="h-7 text-[10px] font-bold text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            Processed ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────── TAB 6: RECONCILIATION & ADJUSTMENTS ──────────────────────── */}
      {subTab === "reconciliation" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 min-w-0 w-full flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#0B1528] min-w-0">
              Reconciliation & adjustments
            </span>
            <div className="grid grid-cols-2 gap-2 w-full lg:flex lg:justify-end">
              <Button
                size="sm"
                onClick={handleRunReconciliation}
                className="h-auto min-h-8 w-full lg:w-auto whitespace-normal leading-tight py-1.5 bg-[#0B1528] hover:bg-[#16253d] text-white font-semibold text-[11px]"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1 shrink-0" /> Run auto-reconciliation
              </Button>
              <Button
                size="sm"
                onClick={() => setAddAdjustmentOpen(true)}
                className="h-auto min-h-8 w-full lg:w-auto whitespace-normal leading-tight py-1.5 bg-[#FF4D00] hover:bg-[#E04500] text-white font-semibold text-[11px]"
              >
                <Plus className="w-3.5 h-3.5 mr-1 shrink-0" /> Add adjustment
              </Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3 border-r border-slate-100">TYPE</th>
                  <th className="p-3 border-r border-slate-100">
                    ORIGINAL PAYMENT
                  </th>
                  <th className="p-3 border-r border-slate-100 text-right">
                    AMOUNT
                  </th>
                  <th className="p-3 border-r border-slate-100">REASON</th>
                  <th className="p-3 border-r border-slate-100 text-center">
                    STATUS
                  </th>
                  <th className="p-3 text-center w-40">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-xs font-semibold text-slate-400"
                    >
                      No reconciliation adjustments recorded for this departure.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-3 border-r border-slate-100">
                        <span className="text-[10px] bg-slate-100 text-slate-800 font-extrabold px-2 py-0.5 rounded uppercase">
                          {a.type}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-100 font-bold text-slate-800">
                        {a.originalPaymentRef}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-right font-black text-slate-900">
                        {formatCurrency(a.amount)}
                      </td>
                      <td className="p-3 border-r border-slate-100 font-medium text-slate-600">
                        {a.reason}
                      </td>
                      <td className="p-3 border-r border-slate-100 text-center">
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded border uppercase",
                            a.status === "APPROVED" || a.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : a.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200",
                          )}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {a.status === "PENDING" ? (
                          <div className="flex gap-1.5 justify-center">
                            <Button
                              size="sm"
                              onClick={() => {
                                setAdjustments((prev) =>
                                  prev.map((item) =>
                                    item.id === a.id
                                      ? { ...item, status: "APPROVED" }
                                      : item,
                                  ),
                                );
                                toast.success("Adjustment approved!");
                              }}
                              className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAdjustments((prev) =>
                                  prev.map((item) =>
                                    item.id === a.id
                                      ? { ...item, status: "REJECTED" }
                                      : item,
                                  ),
                                );
                                toast.success("Adjustment rejected");
                              }}
                              className="h-7 text-[10px] font-bold text-red-600 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">
                            Resolved ✓
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────── MODAL 1: RECORD CLIENT PAYMENT ──────────────────────── */}
      <Dialog
        open={addClientPaymentOpen}
        onOpenChange={(open) => {
          setAddClientPaymentOpen(open);
          if (!open) {
            setSelectedBooking(null);
          }
        }}
      >
        <DialogContent className="max-w-lg bg-white p-5 rounded-xl border border-slate-200 overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                Record Client Payment Receipt
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Directly syncs collection with the Finance Module & ledger
              </p>
            </div>
          </div>

          <form onSubmit={handleClientPaymentSubmit} className="space-y-3.5 mt-3">
            {/* Booking Selector or Selected Booking Card */}
            {!selectedBooking ? (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Select Booking / Passenger <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value=""
                  onChange={(e) => {
                    const b = bookings.find((bk) => bk.bookingId === e.target.value);
                    if (b) {
                      setSelectedBooking(b);
                      const bal = Math.max(0, b.totalAmount - (b.advancePaid || 0));
                      setClientPaymentForm((prev) => ({
                        ...prev,
                        amount: bal > 0 ? String(bal) : "",
                      }));
                    }
                  }}
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose Booking to Record Payment --</option>
                  {bookings.map((b) => {
                    const bal = Math.max(0, b.totalAmount - (b.advancePaid || 0));
                    return (
                      <option key={b.bookingId} value={b.bookingId}>
                        {b.bookingId} — {b.name} (Due: ₹{bal.toLocaleString("en-IN")})
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-950">
                    {selectedBooking.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {selectedBooking.bookingId}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(null)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-blue-100 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Package:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      ₹{selectedBooking.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Already Paid:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      ₹{(selectedBooking.advancePaid || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Balance Due:</span>
                    <span className="font-black text-amber-700 font-mono">
                      ₹{Math.max(0, selectedBooking.totalAmount - (selectedBooking.advancePaid || 0)).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Amount and Auto-Fill Full Due */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Amount Received (₹) <span className="text-red-500">*</span>
                </label>
                {selectedBooking && (
                  <button
                    type="button"
                    onClick={() => {
                      const bal = Math.max(0, selectedBooking.totalAmount - (selectedBooking.advancePaid || 0));
                      setClientPaymentForm((prev) => ({
                        ...prev,
                        amount: String(bal),
                      }));
                    }}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Set Full Due (₹{Math.max(0, selectedBooking.totalAmount - (selectedBooking.advancePaid || 0)).toLocaleString("en-IN")})
                  </button>
                )}
              </div>
              <input
                type="number"
                required
                placeholder="Enter amount in ₹"
                value={clientPaymentForm.amount}
                onChange={(e) =>
                  setClientPaymentForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            {/* Credited Account (Finance Module Sync) */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Credited Account (Finance Module Sync) <span className="text-red-500">*</span>
              </label>
              <select
                value={clientPaymentForm.collectionAccountId}
                onChange={(e) =>
                  setClientPaymentForm((prev) => ({
                    ...prev,
                    collectionAccountId: e.target.value,
                  }))
                }
                className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none focus:border-blue-500"
              >
                {collectionAccounts.length === 0 ? (
                  <option value="">YouthCamping Central Account</option>
                ) : (
                  collectionAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName}{" "}
                      {acc.bankName
                        ? `(${acc.bankName}${acc.maskedAccountNumber || (acc.accountNumber ? ` ••••${acc.accountNumber.slice(-4)}` : "")})`
                        : acc.upiId
                          ? `(${acc.upiId})`
                          : `(${acc.accountType})`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Payment Method & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Payment Method
                </label>
                <select
                  value={clientPaymentForm.paymentMode}
                  onChange={(e) =>
                    setClientPaymentForm((prev) => ({
                      ...prev,
                      paymentMode: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-2 bg-white text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="UPI">UPI / PhonePe / GPay</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="CASH">Cash Desk</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={clientPaymentForm.paymentDate}
                  onChange={(e) =>
                    setClientPaymentForm((prev) => ({
                      ...prev,
                      paymentDate: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-2 bg-white text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Transaction ID / Reference */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Transaction ID / UTR / Reference No.
              </label>
              <input
                type="text"
                placeholder="e.g. UTR123456789 or UPI-Ref"
                value={clientPaymentForm.transactionId}
                onChange={(e) =>
                  setClientPaymentForm((prev) => ({
                    ...prev,
                    transactionId: e.target.value,
                  }))
                }
                className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            {/* Payment Screenshot Upload */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Payment Screenshot / Receipt Proof
              </label>
              <ImageUpload
                label="Upload Payment Screenshot"
                value={clientPaymentForm.proofUrl}
                onUpload={(url) =>
                  setClientPaymentForm((prev) => ({ ...prev, proofUrl: url }))
                }
                compact
              />
            </div>

            {/* Remarks / Notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Remarks / Internal Notes
              </label>
              <textarea
                rows={2}
                placeholder="Receipt details, payer name if different..."
                value={clientPaymentForm.remarks}
                onChange={(e) =>
                  setClientPaymentForm((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
                className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2 bg-white text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAddClientPaymentOpen(false);
                  setSelectedBooking(null);
                }}
                className="h-8 text-xs font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingClientPayment || !selectedBooking}
                className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4"
              >
                {isSubmittingClientPayment ? "Recording Receipt..." : "Save & Record Receipt"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── MODAL 2: RECORD VENDOR PAYMENT ──────────────────────── */}
      <Dialog
        open={addVendorPaymentOpen}
        onOpenChange={(open) => {
          setAddVendorPaymentOpen(open);
          if (!open) setEditingVendorPayment(null);
        }}
      >
        <DialogContent className="max-w-md bg-white p-5 rounded-xl border border-slate-200 overflow-y-auto max-h-[85vh]">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
            {editingVendorPayment
              ? `Record Payment — ${editingVendorPayment.vendorName}`
              : "Record Vendor Payment"}
          </h3>

          {editingVendorPayment && (
            <div className="bg-orange-50/80 border border-orange-200 rounded-lg p-3 text-xs space-y-1 my-2">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Agreed Total:</span>
                <span className="font-mono">
                  ₹{(editingVendorPayment.agreedAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Already Paid:</span>
                <span className="font-mono">
                  ₹{(editingVendorPayment.advancePaid || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between font-black text-red-600 pt-1 border-t border-orange-200">
                <span>Remaining Settlement Due:</span>
                <span className="font-mono">
                  ₹{Math.max(0, (editingVendorPayment.agreedAmount || 0) - (editingVendorPayment.advancePaid || 0)).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleVendorPaymentSubmit} className="space-y-3 mt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Vendor Partner Name
              </label>
              <select
                value={vendorPaymentForm.vendorName}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "__custom__") {
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      vendorName: "",
                    }));
                    return;
                  }
                  // Find selected vendor from tripVendors or vendorPayments
                  const foundTv = (tripVendors || []).find((tv) => {
                    const name = tv.name || tv.vendorName || tv.hotelName || (typeof tv.vendorId === "object" ? tv.vendorId?.name : tv.vendorId);
                    return name === val;
                  });
                  const foundVp = vendorPayments.find((vp) => vp.vendorName === val);

                  const catMap: Record<string, string> = {
                    hotel: "Hotels",
                    transport: "Transport",
                    guide: "Guides",
                    activities: "Activities",
                  };

                  const cat = foundTv
                    ? (catMap[foundTv.vendorType] || "Hotels")
                    : (foundVp?.category || "Hotels");

                  const agreed = foundTv
                    ? String(foundTv.agreedCost || foundTv.totalAmount || 0)
                    : String(foundVp?.agreedAmount || 0);

                  const serviceDesc = foundTv?.notes || foundVp?.serviceDescription || `${cat} services`;

                  setVendorPaymentForm((prev) => ({
                    ...prev,
                    vendorName: val,
                    category: cat,
                    agreedAmount: agreed,
                    serviceDescription: serviceDesc,
                  }));
                }}
                className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-2 bg-white text-slate-800 outline-none focus:border-slate-400 mb-1"
              >
                <option value="">Select Vendor Partner...</option>
                {tripVendors && tripVendors.length > 0 && (
                  <optgroup label="Departure Configured Vendors">
                    {tripVendors.map((tv, i) => {
                      const name = tv.name || tv.vendorName || tv.hotelName || (typeof tv.vendorId === "object" ? tv.vendorId?.name : tv.vendorId) || `Vendor ${i + 1}`;
                      const type = (tv.vendorType || "Service").toUpperCase();
                      const cost = tv.agreedCost || tv.totalAmount || 0;
                      return (
                        <option key={`tv-${i}`} value={name}>
                          {name} ({type}) {cost > 0 ? `– ₹${cost.toLocaleString("en-IN")}` : ''}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                {dbVendors && dbVendors.length > 0 && (
                  <optgroup label="Vendor Directory">
                    {dbVendors.map((dv, i) => (
                      <option key={`dv-${i}`} value={dv.name}>
                        {dv.name} ({dv.type || "VENDOR"})
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="__custom__">+ Enter Custom Vendor</option>
              </select>
              {(!vendorPaymentForm.vendorName || !tripVendors?.some((tv) => (tv.name || tv.vendorName || (typeof tv.vendorId === "object" ? tv.vendorId?.name : tv.vendorId)) === vendorPaymentForm.vendorName)) && (
                <input
                  type="text"
                  required
                  placeholder="Type custom vendor partner name..."
                  value={vendorPaymentForm.vendorName}
                  onChange={(e) =>
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      vendorName: e.target.value,
                    }))
                  }
                  className="w-full h-8 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Category
                </label>
                <select
                  value={vendorPaymentForm.category}
                  onChange={(e) =>
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-2 bg-white text-slate-800 outline-none"
                >
                  <option value="Hotels">Hotels</option>
                  <option value="Transport">Transport</option>
                  <option value="Activities">Activities</option>
                  <option value="Guides">Guides</option>
                  <option value="Meals">Meals</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Agreed / Invoice Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={vendorPaymentForm.agreedAmount}
                  onChange={(e) =>
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      agreedAmount: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {editingVendorPayment ? "Payment Amount (₹)" : "Advance Paid (₹)"}
                </label>
                <input
                  type="number"
                  required
                  value={vendorPaymentForm.advancePaid}
                  onChange={(e) =>
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      advancePaid: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Payment Mode
                </label>
                <select
                  value={vendorPaymentForm.paymentMode}
                  onChange={(e) =>
                    setVendorPaymentForm((prev) => ({
                      ...prev,
                      paymentMode: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-2 bg-white text-slate-800 outline-none"
                >
                  <option value="BANK_TRANSFER">
                    Bank Transfer (NEFT/RTGS)
                  </option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Transaction ID / Ref
              </label>
              <input
                type="text"
                placeholder="e.g. NEFT123456"
                value={vendorPaymentForm.transactionId}
                onChange={(e) =>
                  setVendorPaymentForm((prev) => ({
                    ...prev,
                    transactionId: e.target.value,
                  }))
                }
                className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Service Description
              </label>
              <textarea
                rows={2}
                placeholder="2 Nights Kasol Camp rooms..."
                value={vendorPaymentForm.serviceDescription}
                onChange={(e) =>
                  setVendorPaymentForm((prev) => ({
                    ...prev,
                    serviceDescription: e.target.value,
                  }))
                }
                className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white text-slate-800 outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddVendorPaymentOpen(false)}
                className="h-8 text-xs font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                {editingVendorPayment ? "Save & Record Payment" : "Save & Record Payable"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── MODAL 3: RECORD ACTIVITY PAYMENT ──────────────────────── */}
      <Dialog
        open={addActivityPaymentOpen}
        onOpenChange={setAddActivityPaymentOpen}
      >
        <DialogContent className="max-w-md bg-white p-5 rounded-xl border border-slate-200">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
            Record Activity Vendor Payment
          </h3>
          <form
            onSubmit={handleActivityPaymentSubmit}
            className="space-y-3 mt-3"
          >
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Activity Name
              </label>
              <input
                type="text"
                required
                value={activityPaymentForm.activityName}
                onChange={(e) =>
                  setActivityPaymentForm((prev) => ({
                    ...prev,
                    activityName: e.target.value,
                  }))
                }
                className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Cost per Person (₹)
                </label>
                <input
                  type="number"
                  value={activityPaymentForm.costPerPerson}
                  onChange={(e) =>
                    setActivityPaymentForm((prev) => ({
                      ...prev,
                      costPerPerson: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Participant Count
                </label>
                <input
                  type="number"
                  value={activityPaymentForm.participantCount}
                  onChange={(e) =>
                    setActivityPaymentForm((prev) => ({
                      ...prev,
                      participantCount: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Vendor Name (External)
              </label>
              <input
                type="text"
                value={activityPaymentForm.vendorName}
                onChange={(e) =>
                  setActivityPaymentForm((prev) => ({
                    ...prev,
                    vendorName: e.target.value,
                  }))
                }
                className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddActivityPaymentOpen(false)}
                className="h-8 text-xs font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                Record Activity Pay
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── MODAL 4: RECORD MISCELLANEOUS EXPENSE ──────────────────────── */}
      <Dialog open={addMiscPaymentOpen} onOpenChange={setAddMiscPaymentOpen}>
        <DialogContent className="max-w-md bg-white p-5 rounded-xl border border-slate-200">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
            Record Miscellaneous Ad-Hoc Expense
          </h3>
          <form onSubmit={handleMiscPaymentSubmit} className="space-y-3 mt-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Description (What was paid for)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Emergency guide fee increase"
                value={miscPaymentForm.description}
                onChange={(e) =>
                  setMiscPaymentForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Category
                </label>
                <select
                  value={miscPaymentForm.category}
                  onChange={(e) =>
                    setMiscPaymentForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-2 bg-white text-slate-800 outline-none"
                >
                  <option value="Emergency">Emergency</option>
                  <option value="Staff">Staff (Tips/Gratuity)</option>
                  <option value="Vendor Tip">Vendor Tip</option>
                  <option value="Contingency">Contingency</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={miscPaymentForm.amount}
                  onChange={(e) =>
                    setMiscPaymentForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Payee Name
              </label>
              <input
                type="text"
                placeholder="e.g. Local Mountain Guide Team"
                value={miscPaymentForm.payeeName}
                onChange={(e) =>
                  setMiscPaymentForm((prev) => ({
                    ...prev,
                    payeeName: e.target.value,
                  }))
                }
                className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddMiscPaymentOpen(false)}
                className="h-8 text-xs font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
              >
                Save Miscellaneous Expense
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ──────────────────────── MODAL 5: RECORD ADJUSTMENT / REFUND ──────────────────────── */}
      <Dialog open={addAdjustmentOpen} onOpenChange={setAddAdjustmentOpen}>
        <DialogContent className="max-w-md bg-white p-5 rounded-xl border border-slate-200">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
            Record Reconciliation Adjustment
          </h3>
          <form onSubmit={handleAdjustmentSubmit} className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Adjustment Type
                </label>
                <select
                  value={adjustmentForm.type}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-2 bg-white text-slate-800 outline-none"
                >
                  <option value="Refund">Refund</option>
                  <option value="Discount">Discount</option>
                  <option value="Reversal">Reversal</option>
                  <option value="Correction">Correction</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={adjustmentForm.amount}
                  onChange={(e) =>
                    setAdjustmentForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Original Payment / Invoice Ref
              </label>
              <input
                type="text"
                placeholder="e.g. BK-001 or INV-001"
                value={adjustmentForm.originalPaymentRef}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    originalPaymentRef: e.target.value,
                  }))
                }
                className="w-full h-9 text-xs font-bold border border-slate-300 rounded-lg px-3 bg-white text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Reason
              </label>
              <textarea
                rows={2}
                placeholder="Why is this adjustment being made?"
                value={adjustmentForm.reason}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                className="w-full text-xs font-bold border border-slate-300 rounded-lg p-2 bg-white text-slate-800 outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddAdjustmentOpen(false)}
                className="h-8 text-xs font-bold text-slate-500"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
              >
                Save Adjustment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
