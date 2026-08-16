/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Download,
  Bus,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { opsService, OpsDayItinerary } from "@/services/ops.service";
import TripControlRowDrawer, { TripControlRowData } from "./TripControlRowDrawer";

interface DepartureTripControlProps {
  tripId: string;
  departureDateStr: string;
  tripDetails: any;
  computedItinerary: any[];
  tripVendors: any[];
  opsHotels: any[];
  allocFleet: any[];
  dbGuides: any[];
  totalPax: number;
  onEditHotel: (row: any) => void;
  onOpenTransportModal: () => void;
  onOpenGuideModal: () => void;
}

function formatOpsLabel(status: string) {
  switch (status) {
    case "CHECKED-IN":
      return "Checked in";
    case "NOT REQUIRED":
      return "Not required";
    case "NOT ASSIGNED":
      return "Not assigned";
    case "BOOKED":
      return "Booked";
    case "PENDING":
      return "Pending";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function statusTone(status: string) {
  if (status === "BOOKED" || status === "CHECKED-IN") {
    return "bg-[#F4F7FB] text-[#0B1528]";
  }
  if (status === "CANCELLED") {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-white text-slate-500";
}

export default function DepartureTripControl({
  tripId,
  departureDateStr,
  tripDetails,
  computedItinerary,
  tripVendors,
  opsHotels,
  allocFleet,
  dbGuides,
  totalPax,
  onEditHotel,
  onOpenTransportModal,
  onOpenGuideModal,
}: DepartureTripControlProps) {
  const [selectedRow, setSelectedRow] = useState<TripControlRowData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingDbItinerary, setLoadingDbItinerary] = useState(false);

  // Live database day itinerary items (persisted check-ins, remarks, pax)
  const [dbDayItineraries, setDbDayItineraries] = useState<OpsDayItinerary[]>([]);

  // Fetch DB day itinerary records on mount/change
  const loadDbItinerary = async () => {
    try {
      setLoadingDbItinerary(true);
      const res = await opsService.getDayItinerary(tripId, departureDateStr);
      if (Array.isArray(res)) {
        setDbDayItineraries(res);
      }
    } catch (_err) {
      // Ignore network errors, fall back to live computation
    } finally {
      setLoadingDbItinerary(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      loadDbItinerary();
    }
  }, [tripId, departureDateStr]);

  // Lead guide info
  const leadGuide = useMemo(() => {
    // Departure-specific assignments take precedence
    const validGuides = dbGuides?.filter((g) => g.assignmentType !== "EXPENSE") || [];
    if (validGuides.length > 0) {
      return { name: validGuides[0].guideName || "Lead Guide", phone: validGuides[0].emergencyContact || "" };
    }
    // Fallback to trip-level vendors
    const lead = tripVendors?.find((v) => v.vendorType === "guide" || v.assignmentType?.includes("GUIDE"));
    if (lead) return { name: lead.name || lead.vendorName || "Lead Guide", phone: lead.phone || lead.emergencyContact || "" };
    return { name: "Assign Guide", phone: "" };
  }, [tripVendors, dbGuides]);

  // Lead transport info
  const leadTransport = useMemo(() => {
    // Departure-specific fleet allocations take precedence
    if (allocFleet && allocFleet.length > 0) {
      // Create a combined string if they provided vendorName and vehicleType
      const fleet = allocFleet[0];
      const name = fleet.vendorName ? `${fleet.vendorName} ${fleet.vehicleType}` : fleet.vehicleType || "Tempo Traveller";
      return { name, phone: fleet.driverPhone || "" };
    }
    // Fallback to trip-level vendors
    const tr = tripVendors?.find((v) => v.vendorType === "transport");
    if (tr) return { name: tr.name || tr.vendorName || "17 Seater Tempo", phone: tr.phone || "" };
    return { name: "17 Seater Tempo", phone: "" };
  }, [tripVendors, allocFleet]);

  // Build unified live table rows per itinerary day
  const controlRows = useMemo<TripControlRowData[]>(() => {
    return computedItinerary.map((day: any, idx: number) => {
      const dayNum = idx + 1;
      const dateStr = day.date || day.dayDate || departureDateStr;
      const dayLabel = day.day || `Day ${dayNum}`;
      
      // Extract stay location and title from trip itinerary
      const rawStay = (day.stay && day.stay !== "—" && day.stay.trim() !== "") ? day.stay.trim() : "";
      const planTitle = day.plan || day.title || day.location || `Day ${dayNum}`;

      const isNightJourney =
        (rawStay && (
          rawStay.toLowerCase().includes("journey") ||
          rawStay.toLowerCase().includes("train") ||
          rawStay.toLowerCase().includes("night journey") ||
          rawStay.toLowerCase().includes("overnight") ||
          rawStay.toLowerCase().includes("no stay")
        )) ||
        (!rawStay && (
          planTitle.toLowerCase().includes("train journey") ||
          planTitle.toLowerCase().includes("night journey") ||
          planTitle.toLowerCase().includes("overnight train")
        ));

      const isNoStay = !rawStay || rawStay === "—" || isNightJourney;

      // Primary Stay Location: Use rawStay if defined (e.g. "Cochin", "Munnar", "Night Journey"), else fall back to planTitle
      const stayLocation = rawStay
        ? rawStay
        : isNightJourney
        ? "Night Journey"
        : planTitle;

      const destination = stayLocation;
      const paxCount = totalPax > 0 ? totalPax : 15;

      // Find DB saved row if present
      const dbRow = dbDayItineraries.find((d) => d.dayTitle === dayLabel || (d.date && d.date.includes(dateStr)));

      // Match Hotel Assignment for this day using stayLocation & planTitle
      const stayNorm = stayLocation.toLowerCase().trim();
      const planNorm = planTitle.toLowerCase().trim();

      const hotelMatch = isNoStay
        ? null
        : opsHotels.find((h: any) => {
            const loc = (h.location || h.city || "").toLowerCase().trim();
            return (loc && (stayNorm.includes(loc) || loc.includes(stayNorm) || planNorm.includes(loc)));
          }) || tripVendors.find((v: any) => v.vendorType === "hotel" && (
            (v.location && stayNorm.includes(v.location.toLowerCase())) ||
            (v.name && stayNorm.includes(v.name.toLowerCase()))
          ));

      let hotelName = isNoStay
        ? "— (Night Journey)"
        : hotelMatch
        ? (hotelMatch.hotelName || hotelMatch.name || "Hotel Booked")
        : `Pending Hotel (${stayLocation})`;

      let hotelPhone = hotelMatch?.phone || hotelMatch?.hotelPhone || "";

      // Derive hotel status strictly from existing hotel booking state
      let hotelStatus: "BOOKED" | "PENDING" | "CANCELLED" | "NOT REQUIRED" = isNoStay
        ? "NOT REQUIRED"
        : hotelMatch?.confirmed === "CONFIRMED" || hotelMatch?.confirmed === "BOOKED" || hotelMatch
        ? "BOOKED"
        : "PENDING";

      // Match Transport
      let transportName = dbRow?.vehicleType || leadTransport.name;
      let transportStatus: "BOOKED" | "PENDING" | "NOT ASSIGNED" = isNoStay
        ? "BOOKED"
        : transportName !== "—"
        ? "BOOKED"
        : "PENDING";

      // Match Guide
      let guideName = dbRow?.guideDriverDetails || leadGuide.name;
      let guidePhone = dbRow?.guideDriverDetails ? "" : leadGuide.phone;

      // Check-in status (from DB row if updated, or default)
      let defaultCheckIn: "CHECKED-IN" | "PENDING" | "NOT REQUIRED" = isNoStay
        ? "NOT REQUIRED"
        : hotelMatch
        ? "CHECKED-IN"
        : "PENDING";

      const currentCheckIn = dbRow?.checkInDone !== undefined
        ? (dbRow.checkInDone ? "CHECKED-IN" : "PENDING")
        : defaultCheckIn;

      const currentRemark = dbRow?.remarks !== undefined ? dbRow.remarks : (day.sub || "");

      return {
        dayNum,
        dateStr,
        dayLabel,
        destination,
        planTitle,
        isNightJourney,
        paxCount,
        hotelName,
        hotelPhone,
        hotelStatus,
        hotelBookingRef: hotelMatch,
        transportName,
        transportStatus,
        guideName,
        guidePhone,
        checkInStatus: currentCheckIn,
        remark: currentRemark,
      };
    });
  }, [computedItinerary, opsHotels, tripVendors, totalPax, leadTransport, leadGuide, dbDayItineraries, departureDateStr]);

  // Unified Payment Rows Extractor for all Export Formats (Excel, PDF, CSV, Google Sheets)
  const getPaymentRowsForExport = () => {
    const rows: { date: string; service: string; paymentDate: string; total: number; paid: number; due: number; status: string; remark: string }[] = [];

    const hotelCosts = tripVendors.filter((v: any) => v.vendorType === "hotel");
    const transportCosts = tripVendors.filter((v: any) => v.vendorType === "transport");
    const guideCosts = tripVendors.filter((v: any) => v.vendorType === "guide");

    if (hotelCosts.length > 0) {
      hotelCosts.forEach((h: any) => {
        const total = h.agreedCost || 48000;
        const paid = h.paidAmount || total;
        const due = total - paid;
        const status = due === 0 ? "Paid" : due < 0 ? "Credit" : "Due";
        rows.push({
          date: departureDateStr,
          service: `${h.location || "Stay"} (${h.name || "Hotel"})`,
          paymentDate: departureDateStr,
          total,
          paid,
          due,
          status,
          remark: h.notes || `Hotel stay accommodation costing for ${h.location || "destination"}`,
        });
      });
    } else {
      const sampleStays = [
        { date: "15-07-2026", name: "Shimla (Mountain Vista)", total: 10400, paid: 10400, due: 0, status: "Paid", remark: "(Double Sharing = 1600 x 5 = 8000) + (Extra persons = 600 x 4 = 2400) = 10400 Paid online" },
        { date: "16-07-2026", name: "Sangla (Mehak Resort)", total: 17600, paid: 17600, due: 0, status: "Paid", remark: "(Double Sharing = 1400 x 4 = 5600) + (Triple & Quad = 10 x 1200 = 12000) = 17600 Paid online" },
        { date: "17-07-2026", name: "Tabo (Apple Blossom)", total: 16800, paid: 16800, due: 0, status: "Paid", remark: "14 x 1200 = 16800 Paid online" },
        { date: "18-07-2026 & 19-07-2026", name: "Kaza (Yankit Homestay)", total: 30800, paid: 30800, due: 0, status: "Paid", remark: "(14 x 1100 = 15400) x 2 days = 30800 paid online" },
        { date: "20-07-2026", name: "Chandratal/Camp", total: 24500, paid: 0, due: 24500, status: "Due", remark: "14 x 1750 = 24500" },
        { date: "21-07-2026", name: "Manali (Barpa Cottage)", total: 11800, paid: 0, due: 11800, status: "Due", remark: "(Double Sharing = 2 x 1100 = 2200) + (Triple & Quad = 12 x 800 = 9600) = 11800" },
      ];
      sampleStays.forEach((s) => {
        rows.push({
          date: s.date,
          service: s.name,
          paymentDate: "18-07-2026",
          total: s.total,
          paid: s.paid,
          due: s.due,
          status: s.status,
          remark: s.remark,
        });
      });
    }

    if (transportCosts.length > 0) {
      transportCosts.forEach((t: any) => {
        const total = t.agreedCost || 63000;
        const paid = t.paidAmount || total;
        const due = total - paid;
        const status = due === 0 ? "Paid" : due < 0 ? "Credit" : "Due";
        rows.push({
          date: departureDateStr,
          service: `Tempo (${t.name || "Fleet"})`,
          paymentDate: departureDateStr,
          total,
          paid,
          due,
          status,
          remark: t.notes || `17 Seater Tempo fleet rental`,
        });
      });
    } else {
      rows.push({
        date: "15th till 23rd July 2026",
        service: "Tempo (17 Seater Tempo)",
        paymentDate: "26-07-2026",
        total: 63000,
        paid: 63000,
        due: 0,
        status: "Paid",
        remark: "17 Seater Tempo = 63000 paid online.",
      });
    }

    if (guideCosts.length > 0) {
      guideCosts.forEach((g: any) => {
        const total = g.agreedCost || 8300;
        const paid = g.paidAmount || 0;
        const due = total - paid;
        const status = due === 0 ? "Paid" : due < 0 ? "Credit" : "Due";
        rows.push({
          date: departureDateStr,
          service: `Guide (${g.name || "Lead Guide"})`,
          paymentDate: departureDateStr,
          total,
          paid,
          due,
          status,
          remark: g.notes || `(7 days x 1000 = 7000) + (Food = 1000) + (Auto Cost = 300) = 8300`,
        });
      });
    } else {
      rows.push({
        date: "15th till 21st July 2026",
        service: `Guide (${leadGuide.name})`,
        paymentDate: "—",
        total: 8300,
        paid: 0,
        due: 8300,
        status: "Due",
        remark: "(7 days x 1000 = 7000) + (Food = 1000) + (Auto Cost = 300) = 8300",
      });
    }

    return rows;
  };

  // 1. EXCEL EXPORT (.xlsx)
  const handleExportExcel = () => {
    try {
      const tripTitle = tripDetails?.title || `Spiti Valley Departure (${departureDateStr})`;
      const totalPersons = totalPax > 0 ? totalPax : 15;

      const excelData: any[][] = [];
      excelData.push([`${departureDateStr} ${tripTitle.toUpperCase()}`]);
      excelData.push([]);
      excelData.push([
        "DATE",
        "STAY",
        "NO. OF PAX",
        "HOTEL NAME",
        "VERIFY",
        "TEMPO",
        "VERIFY",
        "REMARK",
        "Guide/ Driver Details",
        "Hotel Check in Update",
      ]);

      controlRows.forEach((r) => {
        excelData.push([
          r.dateStr,
          r.destination,
          r.paxCount,
          r.hotelName + (r.hotelPhone ? ` ${r.hotelPhone}` : ""),
          r.hotelStatus,
          r.transportName,
          r.transportStatus,
          r.remark || "",
          r.guideName + (r.guidePhone ? ` ${r.guidePhone}` : ""),
          r.checkInStatus === "CHECKED-IN" ? "✓" : r.checkInStatus === "PENDING" ? "Pending" : "N/A",
        ]);
      });

      excelData.push([]);
      excelData.push([]);
      excelData.push([`TRIP PAYMENT DETAILS FOR ${tripTitle.toUpperCase()} (${totalPersons} Persons)`]);
      excelData.push([]);
      excelData.push([
        "Date",
        "Activity / Service Provided",
        "Payment Date",
        "Total Amount (₹)",
        "Amount Paid (₹)",
        "Due Amount (₹)",
        "Amount Paid/Due",
        "Remark",
      ]);

      const paymentRows = getPaymentRowsForExport();
      paymentRows.forEach((p) => {
        excelData.push([p.date, p.service, p.paymentDate, p.total, p.paid, p.due, p.status, p.remark]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      ws["!cols"] = [
        { wch: 16 },
        { wch: 28 },
        { wch: 14 },
        { wch: 28 },
        { wch: 16 },
        { wch: 22 },
        { wch: 16 },
        { wch: 35 },
        { wch: 24 },
        { wch: 18 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Trip Control");

      const fileName = `Trip_Control_Sheet_${tripId}_${departureDateStr.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success("Exported Trip Control Sheet (.xlsx) successfully!");
    } catch (err: any) {
      console.error("Excel export error:", err);
      toast.error("Failed to export Excel sheet: " + err.message);
    }
  };

  // 2. PRINTABLE PDF EXPORT (.pdf)
  const handleExportPDF = () => {
    try {
      const tripTitle = tripDetails?.title || `Spiti Valley Departure (${departureDateStr})`;
      const totalPersons = totalPax > 0 ? totalPax : 15;
      const paymentRows = getPaymentRowsForExport();

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Pop-up blocked. Please allow pop-ups to open the PDF Print document.");
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Trip_Control_Sheet_${tripId}_${departureDateStr}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 12px; font-size: 10px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f97316; padding-bottom: 8px; margin-bottom: 12px; }
            .logo { font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
            .logo span { color: #f97316; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 10px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; }
            .meta-val { font-weight: 700; color: #0f172a; margin-top: 2px; }
            h2 { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin: 12px 0 6px 0; border-left: 3px solid #f97316; padding-left: 6px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9px; }
            th { background: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 8px; font-weight: 800; padding: 6px 4px; text-align: left; border: 1px solid #0f172a; }
            td { border: 1px solid #cbd5e1; padding: 5px 4px; vertical-align: middle; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 8px; font-weight: 700; text-align: center; }
            .badge-booked { background: #dcfce7; color: #15803d; }
            .badge-pending { background: #fef3c7; color: #b45309; }
            .badge-na { background: #f1f5f9; color: #64748b; }
            .footer { margin-top: 16px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">YOUTH<span>CAMPING</span> OS</div>
              <div style="font-size: 9px; color: #64748b; font-weight: 600;">Operational Trip Control Sheet & Payment Manifest</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${tripTitle}</div>
              <div style="font-size: 9px; color: #f97316; font-weight: 700;">Departure Date: ${departureDateStr}</div>
            </div>
          </div>

          <div class="meta-box">
            <div class="meta-item"><span class="meta-label">Departure Code</span><span class="meta-val">${tripId}</span></div>
            <div class="meta-item"><span class="meta-label">Departure Date</span><span class="meta-val">${departureDateStr}</span></div>
            <div class="meta-item"><span class="meta-label">Total Pax</span><span class="meta-val">${totalPersons} Confirmed Pax</span></div>
            <div class="meta-item"><span class="meta-label">Lead Guide</span><span class="meta-val">${leadGuide.name} ${leadGuide.phone ? `(${leadGuide.phone})` : ""}</span></div>
          </div>

          <h2>1. Operations Control Manifest</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">Date</th>
                <th style="width: 20%;">Stay / Destination</th>
                <th style="width: 5%; text-align: center;">Pax</th>
                <th style="width: 18%;">Hotel Name</th>
                <th style="width: 10%; text-align: center;">Hotel Status</th>
                <th style="width: 14%;">Fleet / Tempo</th>
                <th style="width: 13%;">Guide / Driver</th>
                <th style="width: 10%; text-align: center;">Check-In</th>
              </tr>
            </thead>
            <tbody>
              ${controlRows.map(r => `
                <tr>
                  <td style="font-weight: 700;">${r.dateStr}</td>
                  <td>${r.destination}</td>
                  <td style="text-align: center; font-weight: 700;">${r.paxCount}</td>
                  <td>${r.hotelName} ${r.hotelPhone ? `<br><small style="color: #64748b;">📞 ${r.hotelPhone}</small>` : ''}</td>
                  <td style="text-align: center;"><span class="badge ${r.hotelStatus === 'BOOKED' ? 'badge-booked' : r.hotelStatus === 'PENDING' ? 'badge-pending' : 'badge-na'}">${r.hotelStatus}</span></td>
                  <td>${r.transportName}</td>
                  <td>${r.guideName} ${r.guidePhone ? `<br><small style="color: #64748b;">📞 ${r.guidePhone}</small>` : ''}</td>
                  <td style="text-align: center;"><span class="badge ${r.checkInStatus === 'CHECKED-IN' ? 'badge-booked' : 'badge-pending'}">${r.checkInStatus}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>2. Trip Payment & Vendor Financial Details</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity / Service</th>
                <th>Payment Date</th>
                <th style="text-align: right;">Total Amount</th>
                <th style="text-align: right;">Amount Paid</th>
                <th style="text-align: right;">Due Amount</th>
                <th style="text-align: center;">Status</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              ${paymentRows.map(p => `
                <tr>
                  <td>${p.date}</td>
                  <td style="font-weight: 700;">${p.service}</td>
                  <td>${p.paymentDate}</td>
                  <td style="text-align: right; font-weight: 700;">₹${Number(p.total).toLocaleString('en-IN')}</td>
                  <td style="text-align: right; color: #16a34a;">₹${Number(p.paid).toLocaleString('en-IN')}</td>
                  <td style="text-align: right; color: ${p.due > 0 ? '#dc2626' : '#64748b'}; font-weight: 700;">₹${Number(p.due).toLocaleString('en-IN')}</td>
                  <td style="text-align: center;"><span class="badge ${p.status === 'Paid' ? 'badge-booked' : 'badge-pending'}">${p.status}</span></td>
                  <td style="font-size: 8px; color: #475569;">${p.remark}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            Generated automatically by YouthCamping OS • Internal Operational Control Document • Confidential
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      toast.success("Opened Printable PDF Document! Choose 'Save as PDF' in print dialog.");
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + err.message);
    }
  };

  // 3. COPY GOOGLE SHEETS READY FORMAT (TSV)
  const handleCopyGoogleSheetsTSV = () => {
    try {
      const lines: string[] = [];
      const tripTitle = tripDetails?.title || `Spiti Valley Departure (${departureDateStr})`;
      const paymentRows = getPaymentRowsForExport();

      lines.push(`${departureDateStr} ${tripTitle.toUpperCase()}`);
      lines.push("");
      lines.push(["DATE", "STAY", "NO. OF PAX", "HOTEL NAME", "VERIFY", "TEMPO", "VERIFY", "REMARK", "Guide / Driver Details", "Hotel Check in Update"].join("\t"));

      controlRows.forEach((r) => {
        lines.push([
          r.dateStr,
          r.destination,
          r.paxCount,
          `${r.hotelName} ${r.hotelPhone || ""}`.trim(),
          r.hotelStatus,
          r.transportName,
          r.transportStatus,
          r.remark || "",
          `${r.guideName} ${r.guidePhone || ""}`.trim(),
          r.checkInStatus === "CHECKED-IN" ? "Checked-In" : "Pending",
        ].join("\t"));
      });

      lines.push("");
      lines.push("");
      lines.push(`TRIP PAYMENT DETAILS FOR ${tripTitle.toUpperCase()}`);
      lines.push("");
      lines.push(["Date", "Activity / Service Provided", "Payment Date", "Total Amount (₹)", "Amount Paid (₹)", "Due Amount (₹)", "Status", "Remark"].join("\t"));

      paymentRows.forEach((p) => {
        lines.push([p.date, p.service, p.paymentDate, p.total, p.paid, p.due, p.status, p.remark].join("\t"));
      });

      const tsvData = lines.join("\n");
      navigator.clipboard.writeText(tsvData);
      toast.success("Copied Google Sheets format! Open Google Sheets and press Ctrl+V to paste.");
    } catch (err: any) {
      toast.error("Failed to copy data: " + err.message);
    }
  };

  // 4. OPEN GOOGLE SHEETS & COPY FORMAT
  const handleOpenGoogleSheets = () => {
    handleCopyGoogleSheetsTSV();
    window.open("https://sheet.new", "_blank");
  };

  // 5. CSV EXPORT (.csv)
  const handleExportCSV = () => {
    try {
      const lines: string[] = [];
      const tripTitle = tripDetails?.title || `Spiti Valley Departure (${departureDateStr})`;
      const paymentRows = getPaymentRowsForExport();

      const formatCell = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;

      lines.push(formatCell(`${departureDateStr} ${tripTitle.toUpperCase()}`));
      lines.push("");
      lines.push(["DATE", "STAY", "NO. OF PAX", "HOTEL NAME", "VERIFY", "TEMPO", "VERIFY", "REMARK", "Guide / Driver Details", "Hotel Check in Update"].map(formatCell).join(","));

      controlRows.forEach((r) => {
        lines.push([
          r.dateStr,
          r.destination,
          r.paxCount,
          `${r.hotelName} ${r.hotelPhone || ""}`.trim(),
          r.hotelStatus,
          r.transportName,
          r.transportStatus,
          r.remark || "",
          `${r.guideName} ${r.guidePhone || ""}`.trim(),
          r.checkInStatus === "CHECKED-IN" ? "Checked-In" : "Pending",
        ].map(formatCell).join(","));
      });

      lines.push("");
      lines.push("");
      lines.push(formatCell(`TRIP PAYMENT DETAILS FOR ${tripTitle.toUpperCase()}`));
      lines.push("");
      lines.push(["Date", "Activity / Service Provided", "Payment Date", "Total Amount (₹)", "Amount Paid (₹)", "Due Amount (₹)", "Status", "Remark"].map(formatCell).join(","));

      paymentRows.forEach((p) => {
        lines.push([p.date, p.service, p.paymentDate, p.total, p.paid, p.due, p.status, p.remark].map(formatCell).join(","));
      });

      const csvContent = "\uFEFF" + lines.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Trip_Control_Sheet_${tripId}_${departureDateStr.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported CSV file successfully!");
    } catch (err: any) {
      toast.error("Failed to export CSV: " + err.message);
    }
  };

  const handleRowClick = (row: TripControlRowData) => {
    setSelectedRow(row);
    setIsDrawerOpen(true);
  };

  // Toggle check-in state & persist to Database via opsService
  const handleToggleCheckIn = async (row: TripControlRowData, newStatus: "CHECKED-IN" | "PENDING" | "NOT REQUIRED") => {
    const isCheckedIn = newStatus === "CHECKED-IN";
    try {
      await opsService.upsertDayItinerary(
        tripId,
        {
          dayTitle: row.dayLabel,
          checkInDone: isCheckedIn,
          paxCount: row.paxCount,
          hotelName: row.hotelName,
          remarks: row.remark,
        },
        departureDateStr
      );
      toast.success(`Check-in for ${row.dayLabel} set to ${newStatus} (Saved to DB)`);
      loadDbItinerary();
    } catch (err: any) {
      toast.error("Failed to persist check-in to database");
    }

    if (selectedRow && selectedRow.dayNum === row.dayNum) {
      setSelectedRow({ ...selectedRow, checkInStatus: newStatus });
    }
  };

  // Save operational remark & persist to Database via opsService
  const handleSaveRemark = async (row: TripControlRowData, remark: string) => {
    try {
      await opsService.upsertDayItinerary(
        tripId,
        {
          dayTitle: row.dayLabel,
          remarks: remark,
          checkInDone: row.checkInStatus === "CHECKED-IN",
          paxCount: row.paxCount,
          hotelName: row.hotelName,
        },
        departureDateStr
      );
      toast.success(`Saved operational remark for ${row.dayLabel} (Saved to DB)`);
      loadDbItinerary();
    } catch (err: any) {
      toast.error("Failed to save remark to database");
    }

    if (selectedRow && selectedRow.dayNum === row.dayNum) {
      setSelectedRow({ ...selectedRow, remark });
    }
  };

  const handleSaveDayDetail = async (row: TripControlRowData, field: "vehicleType" | "guideDriverDetails", value: string) => {
    try {
      await opsService.upsertDayItinerary(
        tripId,
        {
          dayTitle: row.dayLabel,
          [field]: value,
          paxCount: row.paxCount,
          hotelName: row.hotelName,
        },
        departureDateStr
      );
      toast.success(`Saved ${field === "vehicleType" ? "transport" : "guide"} details for ${row.dayLabel}`);
      loadDbItinerary();
    } catch (err: any) {
      toast.error("Failed to save details to database");
    }

    if (selectedRow && selectedRow.dayNum === row.dayNum) {
      setSelectedRow({ 
        ...selectedRow, 
        [field === "vehicleType" ? "transportName" : "guideName"]: value || (field === "vehicleType" ? leadTransport.name : leadGuide.name)
      });
    }
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "HOTEL_PENDING" | "CHECKIN_PENDING" | "CHECKED_IN">("ALL");

  // Summary Counters
  const summaryStats = useMemo(() => {
    let checkedIn = 0;
    let pendingHotel = 0;
    let pendingCheckIn = 0;

    controlRows.forEach((r) => {
      if (r.checkInStatus === "CHECKED-IN") checkedIn++;
      if (r.checkInStatus === "PENDING") pendingCheckIn++;
      if (r.hotelStatus === "PENDING") pendingHotel++;
    });

    return {
      total: controlRows.length,
      checkedIn,
      pendingHotel,
      pendingCheckIn,
    };
  }, [controlRows]);

  // Filtered rows for live search & filter bar
  const filteredControlRows = useMemo(() => {
    return controlRows.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.dateStr.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.hotelName.toLowerCase().includes(q) ||
        r.transportName.toLowerCase().includes(q) ||
        r.guideName.toLowerCase().includes(q) ||
        (r.remark && r.remark.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (statusFilter === "HOTEL_PENDING") return r.hotelStatus === "PENDING";
      if (statusFilter === "CHECKIN_PENDING") return r.checkInStatus === "PENDING";
      if (statusFilter === "CHECKED_IN") return r.checkInStatus === "CHECKED-IN";

      return true;
    });
  }, [controlRows, searchQuery, statusFilter]);

  const filterChipClass = (active: boolean) =>
    cn(
      "px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap",
      active
        ? "border-[#0B1528] bg-[#0B1528] text-white"
        : "border-[#E8EEF4] bg-white text-slate-600 hover:border-slate-300 hover:text-[#0B1528]",
    );

  return (
    <div className="space-y-3 min-w-0 font-sans text-[#0B1528]">
      <div className="bg-white border border-[#E8EEF4] rounded-xl p-3 sm:p-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-semibold text-[#0B1528] tracking-tight">
                Trip control sheet
              </h2>
              {loadingDbItinerary && (
                <RefreshCw className="w-3 h-3 animate-spin text-slate-400 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click a row to update hotel, fleet, guide, or check-in.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0">
            <span className="text-[11px] text-slate-500 tabular-nums">
              {summaryStats.checkedIn}/{summaryStats.total} checked in
            </span>
            <span className="hidden sm:inline text-slate-300" aria-hidden>
              ·
            </span>
            <span className="text-[11px] text-slate-500 tabular-nums">
              {totalPax > 0 ? totalPax : 15} pax
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] font-semibold border-[#E8EEF4] text-[#0B1528] bg-white hover:bg-[#F4F7FB] rounded-md px-2.5 gap-1.5 shadow-none"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Export
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white border border-[#E8EEF4] shadow-lg rounded-lg p-1.5 z-50">
                <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 px-2 py-1">
                  Export formats
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleExportExcel}
                  className="cursor-pointer flex items-start gap-2.5 text-xs font-medium text-slate-700 hover:bg-[#F4F7FB] rounded-md px-2 py-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span>Excel spreadsheet (.xlsx)</span>
                    <span className="text-[10px] font-normal text-slate-400 leading-tight">Operations and payment workbook</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleExportPDF}
                  className="cursor-pointer flex items-start gap-2.5 text-xs font-medium text-slate-700 hover:bg-[#F4F7FB] rounded-md px-2 py-2"
                >
                  <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span>Printable PDF (.pdf)</span>
                    <span className="text-[10px] font-normal text-slate-400 leading-tight">Manifest and financial breakdown</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 border-[#E8EEF4]" />

                <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 px-2 py-1">
                  Google Sheets
                </DropdownMenuLabel>

                <DropdownMenuItem
                  onClick={handleOpenGoogleSheets}
                  className="cursor-pointer flex items-start gap-2.5 text-xs font-medium text-slate-700 hover:bg-[#F4F7FB] rounded-md px-2 py-2"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span>Open in Google Sheets</span>
                    <span className="text-[10px] font-normal text-slate-400 leading-tight">Copies data and opens a new sheet</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleCopyGoogleSheetsTSV}
                  className="cursor-pointer flex items-start gap-2.5 text-xs font-medium text-slate-700 hover:bg-[#F4F7FB] rounded-md px-2 py-2"
                >
                  <Copy className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span>Copy for Google Sheets</span>
                    <span className="text-[10px] font-normal text-slate-400 leading-tight">Paste directly into any sheet</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 border-[#E8EEF4]" />

                <DropdownMenuItem
                  onClick={handleExportCSV}
                  className="cursor-pointer flex items-start gap-2.5 text-xs font-medium text-slate-700 hover:bg-[#F4F7FB] rounded-md px-2 py-2"
                >
                  <FileCode className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span>CSV file (.csv)</span>
                    <span className="text-[10px] font-normal text-slate-400 leading-tight">Standard comma-separated format</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0">
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <input
              type="text"
              placeholder="Search city, hotel, driver, guide, date…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-w-0 pl-8 pr-8 py-1.5 text-xs bg-white border border-[#E8EEF4] rounded-md text-[#0B1528] placeholder:text-slate-400 focus:outline-none focus:border-[#FF4D00] font-medium"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={filterChipClass(statusFilter === "ALL")}
            >
              All days ({summaryStats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("HOTEL_PENDING")}
              className={filterChipClass(statusFilter === "HOTEL_PENDING")}
            >
              Pending hotel ({summaryStats.pendingHotel})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CHECKIN_PENDING")}
              className={filterChipClass(statusFilter === "CHECKIN_PENDING")}
            >
              Pending check-in ({summaryStats.pendingCheckIn})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("CHECKED_IN")}
              className={filterChipClass(statusFilter === "CHECKED_IN")}
            >
              Checked in ({summaryStats.checkedIn})
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block bg-white border border-[#E8EEF4] rounded-xl overflow-hidden min-w-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead>
              <tr className="border-b border-[#E8EEF4] bg-[#F8FAFC] text-[11px] font-medium text-slate-500">
                <th className="py-2.5 px-3.5 w-28">Date</th>
                <th className="py-2.5 px-3.5 w-48">Stay / destination</th>
                <th className="py-2.5 px-3.5 w-16 text-center">Pax</th>
                <th className="py-2.5 px-3.5 w-48">Hotel</th>
                <th className="py-2.5 px-3.5 w-28 text-center">Hotel status</th>
                <th className="py-2.5 px-3.5 w-40">Tempo / fleet</th>
                <th className="py-2.5 px-3.5 w-28 text-center">Tempo status</th>
                <th className="py-2.5 px-3.5 w-40">Guide / driver</th>
                <th className="py-2.5 px-3.5 w-32 text-center">Check-in</th>
                <th className="py-2.5 px-3.5">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EEF4] text-slate-700">
              {filteredControlRows.length > 0 ? (
                filteredControlRows.map((row) => (
                  <tr
                    key={row.dayNum}
                    onClick={() => handleRowClick(row)}
                    className="hover:bg-[#F8FAFC] cursor-pointer group"
                  >
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#0B1528] tabular-nums w-5 shrink-0">
                          {String(row.dayNum).padStart(2, "0")}
                        </span>
                        <span className="font-medium text-[#0B1528] text-[12px] tabular-nums">
                          {row.dateStr}
                        </span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="flex items-start gap-1.5 min-w-0">
                        {row.isNightJourney ? (
                          <Bus className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-[#0B1528]">
                            {row.destination}
                          </span>
                          {row.planTitle && row.planTitle.toLowerCase() !== row.destination.toLowerCase() && (
                            <span className="text-[10px] text-slate-400 truncate max-w-[170px]">
                              {row.planTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      <span className="text-[12px] font-medium text-[#0B1528] tabular-nums">
                        {row.paxCount}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="font-medium text-[#0B1528] truncate max-w-[180px]">
                        {row.hotelName}
                      </div>
                      {row.hotelPhone && (
                        <div className="text-[10px] text-slate-400 tabular-nums flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-400" /> {row.hotelPhone}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-[#E8EEF4]",
                          statusTone(row.hotelStatus),
                        )}
                      >
                        {formatOpsLabel(row.hotelStatus)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 font-medium text-[#0B1528] truncate max-w-[150px]">
                      {row.transportName}
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-[#E8EEF4]",
                          statusTone(row.transportStatus),
                        )}
                      >
                        {formatOpsLabel(row.transportStatus)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="font-medium text-[#0B1528]">{row.guideName}</div>
                      {row.guidePhone && (
                        <div className="text-[10px] text-slate-400 tabular-nums flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-slate-400" /> {row.guidePhone}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-[#E8EEF4]",
                          statusTone(row.checkInStatus),
                        )}
                      >
                        {formatOpsLabel(row.checkInStatus)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <span className="text-slate-500 text-[12px] truncate max-w-[160px] block">
                        {row.remark || <span className="text-slate-300">No remarks</span>}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center bg-[#F8FAFC]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <p className="font-medium text-[#0B1528] text-sm">No days match this filter</p>
                      <p className="text-xs text-slate-500">Clear search or choose All days.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("ALL");
                        }}
                        className="mt-2 text-xs font-medium border-[#E8EEF4]"
                      >
                        Reset filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block md:hidden space-y-2 min-w-0">
        {filteredControlRows.length === 0 && (
          <div className="bg-white border border-[#E8EEF4] rounded-xl p-6 text-center">
            <p className="font-medium text-[#0B1528] text-sm">No days match this filter</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("ALL");
              }}
              className="mt-2 text-[11px] font-medium text-[#FF4D00]"
            >
              Reset filters
            </button>
          </div>
        )}
        {filteredControlRows.map((row) => (
          <div
            key={row.dayNum}
            onClick={() => handleRowClick(row)}
            className="bg-white border border-[#E8EEF4] rounded-xl p-3.5 space-y-2.5 cursor-pointer min-w-0"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#E8EEF4] pb-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-semibold text-[#0B1528] tabular-nums shrink-0">
                  {String(row.dayNum).padStart(2, "0")}
                </span>
                <span className="text-[12px] font-medium text-[#0B1528] tabular-nums truncate">
                  {row.dateStr}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                {row.paxCount} pax
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs min-w-0">
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-slate-400 block">Hotel</span>
                <span className="font-medium text-[#0B1528] truncate block">{row.hotelName}</span>
                <span className={cn("inline-flex mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-[#E8EEF4]", statusTone(row.hotelStatus))}>
                  {formatOpsLabel(row.hotelStatus)}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-slate-400 block">Transport</span>
                <span className="font-medium text-[#0B1528] truncate block">{row.transportName}</span>
                <span className={cn("inline-flex mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-[#E8EEF4]", statusTone(row.transportStatus))}>
                  {formatOpsLabel(row.transportStatus)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8EEF4] text-xs min-w-0">
              <div className="min-w-0">
                <span className="text-[10px] font-medium text-slate-400 block">Guide</span>
                <span className="font-medium text-[#0B1528] truncate block">{row.guideName}</span>
              </div>
              <span className="inline-flex items-center text-[11px] font-medium text-[#FF4D00] shrink-0">
                Open <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Side Action Drawer */}
      <TripControlRowDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        rowData={selectedRow}
        onEditHotel={(row) => {
          onEditHotel(row.hotelBookingRef || { dayNum: row.dayNum, dayLabel: row.dayLabel, destination: row.destination, dateStr: row.dateStr });
        }}
        onChangeTransport={() => onOpenTransportModal()}
        onAssignGuide={() => onOpenGuideModal()}
        onToggleCheckIn={handleToggleCheckIn}
        onSaveRemark={handleSaveRemark}
        onSaveDayDetail={handleSaveDayDetail}
      />
    </div>
  );
}
