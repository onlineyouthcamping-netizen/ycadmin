import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Copy, Trash2, CheckCircle, Clock, Filter, X, Link2, Users, ChevronDown, Edit, Pencil, FileDown, RotateCw, ChevronLeft, ChevronRight, CreditCard, FileText, ClipboardList, Bookmark, Ticket, Train, CheckSquare, MessageSquare, HelpCircle, Wallet, Compass, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingsService } from "@/services/bookings.service";
import { adminUsersService } from "@/services/adminUsers.service";
import BookingDetailsView from "@/components/admin/BookingDetailsView";
import NewBookingModal from "@/components/admin/NewBookingModal";
import type { Booking, BookingTrip } from "@/types";
import { toast } from "sonner";
import { cn, safeFormatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { trainTicketService } from "@/services/trainTicket.service";
import EmailComposerDrawer from "@/components/admin/EmailComposerDrawer";

import { TripManager } from "@/components/bookings/TripManagerModal";
import { ConfirmModal } from "@/components/bookings/ConfirmModal";
import { BookingsToolbar } from "@/components/bookings/BookingsToolbar";
// Booking source helper
const getBookingMetaData = (booking: Booking) => {
  const salesAdminId = (booking as any).salesAdminId as string | undefined;
  const link = (booking as any).sourceBookingLink as
    | { tokenPrefix?: string | null; id?: string | null; shareUrl?: string | null }
    | undefined;

  let bookedBy = salesAdminId ? `Sales ${salesAdminId}` : "Website / Unknown";
  let source = link?.tokenPrefix ? `Booking Link #${link.tokenPrefix}` : "Website / Inquiry";

  const notesLower = ((booking.notes as any) || "").toString().toLowerCase() + " " + ((booking.adminNotes as any) || "").toString().toLowerCase();
  if (notesLower.includes("booked by:")) {
    const match = notesLower.match(/booked by:\s*([a-zA-Z\s]+)/);
    if (match && match[1]) bookedBy = match[1].trim();
  }
  if (notesLower.includes("source:")) {
    const match = notesLower.match(/source:\s*([a-zA-Z\s]+)/);
    if (match && match[1]) source = match[1].trim();
  }

  return { bookedBy, source };
};

// Caches
let cachedBookingTrips: BookingTrip[] | null = null;
let cachedSalesOptions: string[] | null = null;

// ── MAIN PAGE ──
export default function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trips, setTrips] = useState<BookingTrip[]>(cachedBookingTrips || []);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'confirmed' | 'all'>('all');
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(prev => (prev !== searchInput ? searchInput : prev));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [filterTrip, setFilterTrip] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterSalesAdmin, setFilterSalesAdmin] = useState("all");
  const [bookingStart, setBookingStart] = useState("");
  const [bookingEnd, setBookingEnd] = useState("");
  const [depStart, setDepStart] = useState("");
  const [depEnd, setDepEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [showTrips, setShowTrips] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Booking | null>(null);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Booking | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  // Custom states
  const [detailsDefaultTab, setDetailsDefaultTab] = useState<string>("overview");
  const [balanceOnly, setBalanceOnly] = useState(false);
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewTarget, setPreviewTarget] = useState<Booking | null>(null);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [salesOptions, setSalesOptions] = useState<string[]>(cachedSalesOptions || []);
  const bookingsRequestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { admin: currentAdmin } = useAuthStore();

  const tripMap = useMemo(() => {
    const m = new Map<string, BookingTrip>();
    for (const t of trips) {
      if (t.id) m.set(t.id, t);
      if (t.tripCode) m.set(t.tripCode, t);
    }
    return m;
  }, [trips]);

  useEffect(() => {
    const handleReset = () => { 
      setDetailsTarget(null);
      setSearchParams({});
    };
    window.addEventListener("reset-bookings-view", handleReset);
    return () => window.removeEventListener("reset-bookings-view", handleReset);
  }, [setSearchParams]);

  useEffect(() => {
    const bookingIdFromUrl = searchParams.get('id');
    if (bookingIdFromUrl && (!detailsTarget || detailsTarget.id !== bookingIdFromUrl)) {
      bookingsService.getById(bookingIdFromUrl)
        .then(fresh => {
          setDetailsTarget(fresh);
        })
        .catch(() => {
          toast.error("Failed to load booking details from URL");
        });
    }
  }, [searchParams]);

  useEffect(() => {
    bookingsService.getTrips()
      .then(t => {
        const arr = Array.isArray(t) ? t : [];
        cachedBookingTrips = arr;
        setTrips(arr);
      })
      .catch(err => console.error("Trips failed", err));
  }, []);

  useEffect(() => {
    if (currentAdmin && (currentAdmin.role === "admin" || currentAdmin.role === "superadmin")) {
      if (cachedSalesOptions) setSalesOptions(cachedSalesOptions);
      adminUsersService.listAdmins()
        .then((users) => {
          const ids = users.map((u: any) => u.id || u.username || u.email).filter(Boolean);
          cachedSalesOptions = ids;
          setSalesOptions(ids);
        })
        .catch((err) => console.error("Failed to load sales options:", err));
    } else if (currentAdmin && currentAdmin.role === "sales") {
      setSalesOptions([currentAdmin.id]);
    }
  }, [currentAdmin]);

  const filterKey = `${tab}-${filterTrip}-${filterPayment}-${filterSalesAdmin}-${bookingStart}-${bookingEnd}-${depStart}-${depEnd}-${statusFilter}-${paymentStatusFilter}-${balanceOnly}-${search}-${quickFilter}-${selectedStatuses.join(',')}`;
  const lastFilterKeyRef = useRef(filterKey);

  const fetchBookings = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let queryPage = page;
    if (lastFilterKeyRef.current !== filterKey) {
      lastFilterKeyRef.current = filterKey;
      queryPage = 1;
      setPage(1);
    }

    const requestId = ++bookingsRequestRef.current;
    setLoading(true);
    try {
      // Fetch both confirmed and pending if filtering by unconfirmed status
      let apiStatus = tab;
      if (quickFilter === 'unconfirmed_bookings' || selectedStatuses.includes('Unconfirmed')) {
        apiStatus = 'all' as any;
      }
      
      const res = await bookingsService.getAll({
        status: apiStatus,
        tripId: filterTrip,
        paymentStatus: statusFilter,
        payment_status: paymentStatusFilter,
        search,
        salesAdminId: filterSalesAdmin,
        balanceOnly,
        bookingStart,
        bookingEnd,
        depStart,
        depEnd,
        page: queryPage,
        limit: pageSize,
      }, controller.signal);
      if (requestId !== bookingsRequestRef.current) return;

      const currentTotalPages = res.pagination?.totalPages || 0;
      if (currentTotalPages > 0 && queryPage > currentTotalPages) {
        setPage(currentTotalPages);
        return;
      }

      setBookings(res.data || []);
      setTotalCount(res.pagination?.totalCount || 0);
      setTotalPages(currentTotalPages);
    } catch (err: any) {
      if (err.name !== 'CanceledError') {
        toast.error("Failed to load bookings");
      }
    } finally {
      if (requestId === bookingsRequestRef.current) setLoading(false);
    }
  }, [filterKey, page, pageSize]);

  useEffect(() => {
    fetchBookings();
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort(); };
  }, [fetchBookings]);

  const fetchAll = () => { fetchBookings(); };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const getFlowStatus = (b: Booking) => {
    if (b.status === 'cancelled') return 'Cancelled';
    if (b.status === 'expired') return 'Expired';
    if (b.status === 'draft') return 'Draft';
    if (b.status === 'confirmed') return 'Confirmed';
    return 'Inquiry';
  };

  const openBookingDetails = async (b: Booking, defaultTab?: string) => {
    setDetailsDefaultTab(defaultTab || "overview");
    setDetailsLoadingId(b.id);
    try {
      const fresh = await bookingsService.getById(b.id);
      setDetailsTarget(fresh);
      setSearchParams({ id: b.id });
    } catch {
      toast.error("Failed to load booking details");
    } finally {
      setDetailsLoadingId(null);
    }
  };

  const refreshBookingDetails = async () => {
    if (!detailsTarget) return;
    try {
      const fresh = await bookingsService.getById(detailsTarget.id);
      setDetailsTarget(fresh);
      fetchAll();
    } catch {
      toast.error("Failed to refresh details");
    }
  };

  const openEdit = (b: Booking) => {
    setEditTarget(b);
    setEditForm({
      fullName: b.fullName,
      mobile: b.mobile,
      age: b.age || '',
      gender: b.gender || 'Male',
      email: b.email || '',
      paymentStatus: b.paymentStatus, 
      notes: b.notes || '',
      departureDate: b.departureDate || ''
    });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    try {
      await bookingsService.update(editTarget.id, editForm);
      toast.success("Booking updated!"); setEditTarget(null); fetchAll();
    } catch { toast.error("Update failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    try { await bookingsService.delete(id); toast.success("Deleted"); fetchAll(); } catch { toast.error("Failed"); }
  };

  const handleConfirmPayment = async (id: string) => {
    if (!confirm("Confirm payment for this booking?")) return;
    try {
      await bookingsService.confirmPayment(id);
      toast.success("Payment confirmed and WhatsApp triggered!");
      fetchAll();
    } catch {
      toast.error("Failed to confirm payment");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setFilterTrip("all");
    setFilterPayment("all");
    setBookingStart("");
    setBookingEnd("");
    setDepStart("");
    setDepEnd("");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setBalanceOnly(false);
    setQuickFilter('all');
    setSelectedStatuses([]);
    setTab('all');
  };

  const handleExportCSV = () => {
    if (bookings.length === 0) return toast.error("No bookings to export");
    const headers = ["Booking ID", "Guest Name", "Email", "Mobile", "Expedition ID", "Total Price", "Advance Paid", "Balance Due", "Status", "Created Date"];
    const rows = bookings.map(b => [
      `"${b.bookingId}"`,
      `"${b.fullName}"`,
      `"${b.email || 'N/A'}"`,
      `"${b.mobile}"`,
      `"${b.tripId}"`,
      b.totalAmount || 0,
      b.advancePaid || 0,
      b.remainingAmount || 0,
      `"${b.status === 'confirmed' ? b.paymentStatus : 'Pending Confirmation'}"`,
      `"${safeFormatDate(b.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${bookings.length} bookings exported to CSV!`);
  };

  const selectAll = () => {
    if (selectedIds.length === bookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bookings.map(b => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Metrics for counters
  const totalAmountDue = bookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);
  const totalPendingInquiries = bookings.filter(b => b.status === 'pending').length;
  const totalConfirmedCount = bookings.filter(b => b.status === 'confirmed').length;

  const getPriority = (b: Booking) => {
    if (b.status === 'pending') return 'amber';
    if (b.remainingAmount > 15000) return 'red';
    if (b.remainingAmount > 0) return 'blue';
    if (b.status === 'confirmed') return 'green';
    return 'purple';
  };

  const getDays = (b: Booking) => {
    if (!b.departureDate) return 0;
    const diff = new Date(b.departureDate).getTime() - new Date(b.createdAt).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getProgress = (b: Booking) => {
    if (b.status === 'confirmed' && b.remainingAmount === 0) return 100;
    if (b.status === 'confirmed') return 85;
    if (b.status === 'pending' && b.advancePaid > 0) return 60;
    if (b.status === 'pending') return 35;
    return 15;
  };

  const getNextAction = (b: Booking) => {
    if (b.status === 'pending') return 'Confirm Booking';
    if (b.remainingAmount > 0) return 'Collect Balance';
    if (b.ticketStatus !== 'ISSUED') return 'Generate Ticket';
    return 'Final Checklist';
  };

  const getActivityTime = (b: Booking) => {
    const diff = new Date().getTime() - new Date(b.updatedAt || b.createdAt).getTime();
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    if (hrs < 1) return 'Just now';
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Quick Filters
      if (quickFilter === 'my') {
        const meta = getBookingMetaData(b);
        if (meta.bookedBy !== (currentAdmin?.name || currentAdmin?.username)) return false;
      } else if (quickFilter === 'confirmed_bookings') {
        if (b.status !== 'confirmed') return false;
      } else if (quickFilter === 'unconfirmed_bookings') {
        if (b.status !== 'pending' && b.status !== 'draft' && b.status !== 'abandoned') return false;
      } else if (quickFilter === 'payment_pending') {
        if (b.remainingAmount <= 0) return false;
      } else if (quickFilter === 'payment_overdue') {
        if (b.remainingAmount <= 0) return false;
        if (!b.departureDate) return false;
        const diff = new Date(b.departureDate).getTime() - new Date().getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        if (days > 3) return false;
      } else if (quickFilter === 'ticket_verification') {
        if (b.trainTicketStatus !== 'Pending' && b.trainTicketStatus !== 'Waitlisted') return false;
      } else if (quickFilter === 'departing_7_days') {
        if (!b.departureDate) return false;
        const diff = new Date(b.departureDate).getTime() - new Date().getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        if (days < 0 || days > 7) return false;
      } else if (quickFilter === 'ops_blocked') {
        if (b.status !== 'confirmed' || getProgress(b) >= 85) return false;
      } else if (quickFilter === 'completed_bookings') {
        if (b.status !== 'confirmed' || getProgress(b) < 100) return false;
      } else if (quickFilter === 'cancelled_bookings') {
        if (b.status !== 'expired' && b.status !== 'cancelled') return false;
      }

      // 2. Booking Status Filters (Checkboxes)
      if (selectedStatuses.length > 0) {
        const isConfirmed = b.status === 'confirmed';
        const isUnconfirmed = b.status === 'pending' || b.status === 'draft' || b.status === 'abandoned';
        const isCancelled = b.status === 'expired' || b.status === 'cancelled';
        const isCompleted = getProgress(b) === 100 && b.status === 'confirmed';

        let matchesOne = false;
        if (selectedStatuses.includes('Confirmed') && isConfirmed) matchesOne = true;
        if (selectedStatuses.includes('Unconfirmed') && isUnconfirmed) matchesOne = true;
        if (selectedStatuses.includes('Cancelled') && isCancelled) matchesOne = true;
        if (selectedStatuses.includes('Completed') && isCompleted) matchesOne = true;
        if (!matchesOne) return false;
      }

      // 3. Dropdowns
      if (filterTrip !== 'all' && b.tripId !== filterTrip) return false;
      if (filterSalesAdmin !== 'all' && b.salesAdminId !== filterSalesAdmin) return false;

      return true;
    });
  }, [bookings, quickFilter, selectedStatuses, filterTrip, filterSalesAdmin, currentAdmin]);



  const [bulkModalAction, setBulkModalAction] = useState<string | null>(null);
  const [bulkSalesperson, setBulkSalesperson] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkReminderChannel, setBulkReminderChannel] = useState("WhatsApp");
  const [bulkReminderMessage, setBulkReminderMessage] = useState("");
  const [bulkTaskTitle, setBulkTaskTitle] = useState("");
  const [bulkTaskDueDate, setBulkTaskDueDate] = useState("");
  const [bulkTaskPriority, setBulkTaskPriority] = useState("Medium");
  const [bulkTaskAssignee, setBulkTaskAssignee] = useState("");

  const handleBulkAction = (action: string) => {
    setBulkModalAction(action);
    setBulkSalesperson("");
    setBulkReminderMessage("");
    setBulkTaskTitle("");
    setBulkTaskDueDate("");
    setBulkTaskPriority("Medium");
    setBulkTaskAssignee("");
  };

  const executeBulkAction = async () => {
    if (!bulkModalAction) return;
    setBulkProcessing(true);
    try {
      if (bulkModalAction === 'assign') {
        if (!bulkSalesperson) {
          toast.error("Please select a salesperson");
          setBulkProcessing(false);
          return;
        }
        await Promise.all(selectedIds.map(id => bookingsService.update(id, { salesAdminId: bulkSalesperson })));
        toast.success(`Assigned executive ${bulkSalesperson} to ${selectedIds.length} bookings!`);
      } else if (bulkModalAction === 'reminder') {
        await Promise.all(selectedIds.map(id => bookingsService.sendEmail(id, 'reminder')));
        toast.success(`Reminders dispatched via ${bulkReminderChannel} to ${selectedIds.length} travelers!`);
      } else if (bulkModalAction === 'link') {
        await Promise.all(selectedIds.map(id => bookingsService.sendEmail(id, 'invoice')));
        toast.success(`Invoice payment links sent to ${selectedIds.length} travelers!`);
      } else if (bulkModalAction === 'assign_task') {
        if (!bulkTaskTitle) {
          toast.error("Please enter a task title");
          setBulkProcessing(false);
          return;
        }
        // Simulating creating a task on the booking's task board
        await Promise.all(selectedIds.map(id => 
          bookingsService.update(id, {
            notes: `[Task Assigned: ${bulkTaskTitle} | Assignee: ${bulkTaskAssignee || 'Unassigned'} | Due: ${bulkTaskDueDate || 'No due date'} | Priority: ${bulkTaskPriority}]`
          })
        ));
        toast.success(`Assigned task "${bulkTaskTitle}" to ${bulkTaskAssignee || 'colleague'} for ${selectedIds.length} bookings!`);
      } else if (bulkModalAction === 'mark_complete') {
        await Promise.all(selectedIds.map(id => bookingsService.update(id, { status: 'confirmed', paymentStatus: 'Paid', remainingAmount: 0 })));
        toast.success(`Marked ${selectedIds.length} bookings as confirmed and complete!`);
      }
      setBulkModalAction(null);
      setSelectedIds([]);
      fetchAll();
    } catch (e) {
      toast.error("Failed to execute bulk action");
    } finally {
      setBulkProcessing(false);
    }
  };



  if (detailsTarget) {
    return (
      <BookingDetailsView
        booking={detailsTarget}
        onBack={() => {
          setDetailsTarget(null);
          setSearchParams({});
        }}
        onRefresh={refreshBookingDetails}
        trips={trips}
        defaultTab={detailsDefaultTab}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#F4F7FB] text-[#162B45] font-sans antialiased -mx-6 -my-6">
      
      <BookingsToolbar 
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        fetchAll={fetchAll}
        handleExportCSV={handleExportCSV}
        setShowTrips={setShowTrips}
      />

      {/* MAIN CONTAINER */}
      <div className="zoho-main flex flex-1 overflow-hidden">
        {/* CONTENT & TABLE AREA */}
        <div className="zoho-content-left flex-1 flex flex-col overflow-hidden bg-white">
          {/* APPLIED FILTER INDICATOR */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Showing:</span>
              <span className="text-slate-800 font-bold capitalize text-[12px]">
                {quickFilter.replace('_', ' ')}
              </span>
              {(selectedStatuses.length > 0 || filterTrip !== 'all' || filterSalesAdmin !== 'all' || search !== "") && (
                <span className="text-slate-400">|</span>
              )}
              {selectedStatuses.length > 0 && (
                <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                  Statuses: {selectedStatuses.join(', ')}
                </span>
              )}
              {filterTrip !== 'all' && (
                <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                  Trip: {filterTrip}
                </span>
              )}
              {filterSalesAdmin !== 'all' && (
                <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                  Executive: {filterSalesAdmin}
                </span>
              )}
              {search !== "" && (
                <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px] truncate max-w-[120px]">
                  Query: "{search}"
                </span>
              )}
            </div>
            {(search !== "" || filterTrip !== 'all' || filterSalesAdmin !== 'all' || selectedStatuses.length > 0 || quickFilter !== 'confirmed_bookings') && (
              <button onClick={clearFilters} className="text-orange-600 hover:text-orange-700 font-bold text-[11px] hover:underline flex items-center gap-0.5">
                [Clear Filters]
              </button>
            )}
          </div>

          <div className="zoho-table-area flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-white">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 py-10 font-bold">
                <RotateCw className="w-5 h-5 animate-spin mr-2" /> Loading Bookings...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 text-sm mb-1">No Reservations Found</h3>
                <p className="text-slate-400 text-xs max-w-sm">No reservations fit the selected criteria.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-xs border-collapse bg-white font-sans border border-slate-200">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-slate-50 text-slate-650 border-b border-slate-200">
                      <th className="p-2.5 w-10 text-center border-r border-slate-200">
                        <input 
                          type="checkbox" 
                          className="rounded-[4px] border-slate-300 text-[#0F172A] focus:ring-[#0F172A] cursor-pointer"
                          checked={selectedIds.length === filteredBookings.length && filteredBookings.length > 0} 
                          onChange={selectAll} 
                        />
                      </th>
                      <th className="p-2.5 w-3 border-r border-slate-200"></th>
                      <th className="p-2.5 w-28 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200">Customer</th>
                      <th className="p-2.5 w-24 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200">Phone</th>
                      <th className="p-2.5 w-16 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200 text-center">Age/Gender</th>
                      <th className="p-2.5 w-24 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200">Trip Code</th>
                      <th className="p-2.5 w-24 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200">Departure</th>
                      <th className="p-2.5 w-14 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200">Days</th>
                      <th className="p-2.5 w-12 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200">Pass.</th>
                      <th className="p-2.5 w-24 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200">Executive</th>
                      <th className="p-2.5 w-20 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200">Package</th>
                      <th className="p-2.5 w-24 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200 text-right pr-4">Balance</th>
                      <th className="p-2.5 w-24 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200 text-right pr-4">Received</th>
                      <th className="p-2.5 w-28 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200 text-center">Progress</th>
                      <th className="p-2.5 w-28 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200 text-center">Next Action</th>
                      <th className="p-2.5 w-24 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200 text-center">Status</th>
                      <th className="p-2.5 w-28 text-[9px] font-bold uppercase tracking-wider border-r border-slate-200 text-center">Last Activity</th>
                      <th className="p-2.5 w-56 text-[9px] font-bold uppercase tracking-wider pl-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map(b => {
                      const isSelected = selectedIds.includes(b.id);
                      const priority = getPriority(b);
                      const days = getDays(b);
                      const progress = getProgress(b);
                      const nextAction = getNextAction(b);
                      const flowStatus = getFlowStatus(b);
                      const activityTime = getActivityTime(b);
                      const meta = getBookingMetaData(b);

                      const role = (currentAdmin?.role || 'admin').toLowerCase();
                      const showPayment = ['admin', 'superadmin', 'senior', 'sales', 'accounts'].includes(role);
                      const showPassengers = ['admin', 'superadmin', 'senior', 'sales', 'operations'].includes(role);
                      const showDocuments = ['admin', 'superadmin', 'senior', 'operations', 'accounts'].includes(role);
                      const showTicketing = ['admin', 'superadmin', 'senior', 'sales', 'operations'].includes(role);
                      const showOperations = ['admin', 'superadmin', 'senior', 'operations'].includes(role);
                      const showChecklist = ['admin', 'superadmin', 'senior', 'operations'].includes(role);
                      const showNotes = true;

                      let paymentDot: 'red' | 'amber' | undefined = undefined;
                      if (b.remainingAmount > 0 && b.paymentStatus !== 'Paid') {
                        const isOverdue = b.departureDate && (new Date(b.departureDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 3;
                        paymentDot = isOverdue ? 'red' : 'amber';
                      }

                      let passengersDot: 'amber' | undefined = undefined;
                      if (!b.numberOfTravelers || b.numberOfTravelers === 0) {
                        passengersDot = 'amber';
                      }

                      let documentsDot: 'red' | undefined = undefined;
                      if (!b.isVerified) {
                        documentsDot = 'red';
                      }

                      let ticketingDot: 'amber' | undefined = undefined;
                      if (b.trainTicketStatus === 'Pending' || b.trainTicketStatus === 'Waitlisted') {
                        ticketingDot = 'amber';
                      }

                      let operationsDot: 'red' | undefined = undefined;
                      if (b.status === 'confirmed' && progress < 85) {
                        operationsDot = 'red';
                      }

                      let checklistDot: 'green' | undefined = undefined;
                      if (progress === 100) {
                        checklistDot = 'green';
                      }

                      let notesDot: 'blue' | undefined = undefined;
                      if (b.notes?.includes('[Task Assigned')) {
                        notesDot = 'blue';
                      }

                      return (
                        <tr 
                          key={b.id} 
                          className={cn("hover:bg-[#F8FAFC]/75 border-b border-slate-200/60 transition-colors h-[38px] cursor-pointer text-xs select-none", isSelected ? "bg-amber-50/20 border-l border-l-[#FF6B00]" : "")} 
                          onClick={() => setPreviewTarget(b)}
                        >
                          <td className="p-2.5 text-center border-r border-slate-150" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              className="rounded-[4px] border-slate-300 text-[#0F172A] focus:ring-[#0F172A] cursor-pointer" 
                              checked={isSelected}
                              onChange={() => toggleSelect(b.id)}
                            />
                          </td>
                          <td className={cn(
                            "p-2.5 w-3 border-r border-slate-150 relative overflow-hidden",
                            (b.status === 'confirmed' && progress < 85) || (b.remainingAmount > 0 && b.departureDate && (new Date(b.departureDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 3) ? 'bg-[#dc2626]' :
                            b.status === 'pending' ? 'bg-[#d97706]' :
                            b.status === 'confirmed' && progress < 100 ? 'bg-[#2563eb]' :
                            progress === 100 ? 'bg-[#16a34a]' : 'bg-[#94a3b8]'
                          )} onClick={e => e.stopPropagation()} />
                          <td className="p-2.5 border-r border-slate-150 font-bold text-slate-800 truncate" title={b.fullName}>{b.fullName}</td>
                          <td className="p-2.5 border-r border-slate-150 font-mono text-slate-500 truncate" title={b.mobile}>{b.mobile}</td>
                          <td className="p-2.5 border-r border-slate-150 text-center font-medium text-slate-650">{b.age ? `${b.age}y` : 'N/A'} / {b.gender ? (b.gender.toLowerCase() === 'male' ? 'M' : b.gender.toLowerCase() === 'female' ? 'F' : 'U') : 'U'}</td>
                          <td className="p-2.5 border-r border-slate-150 font-bold text-slate-700 truncate" title={b.tripName || b.tripId}>{b.tripId}</td>
                          <td className="p-2.5 border-r border-slate-150 text-slate-600 font-medium">{safeFormatDate(b.departureDate, { day: '2-digit', month: 'short' }, 'No Dep')}</td>
                          <td className="p-2.5 border-r border-slate-150 text-slate-550 font-medium text-center">{days}d</td>
                          <td className="p-2.5 border-r border-slate-150 text-slate-755 font-bold text-center">{b.numberOfTravelers || 1}</td>
                          <td className="p-2.5 border-r border-slate-150 text-slate-600 truncate" title={meta.bookedBy}>{meta.bookedBy}</td>
                          <td className="p-2.5 border-r border-slate-150 text-slate-550 font-medium">{b.trainClass || 'Sleeper'}</td>
                          <td className="p-2.5 border-r border-slate-150 text-right pr-4 font-mono font-bold text-red-650">₹{Number(b.remainingAmount || 0).toLocaleString('en-IN')}</td>
                          <td className="p-2.5 border-r border-slate-150 text-right pr-4 font-mono font-bold text-[#12B76A]">₹{Number(b.advancePaid || 0).toLocaleString('en-IN')}</td>
                          <td className="p-2.5 border-r border-slate-150 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div className="h-full bg-[#12B76A] rounded-full" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 w-6 text-right">{progress}%</span>
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-slate-150 text-center truncate" title={nextAction}>
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-650 font-bold text-[9.5px] uppercase tracking-wider">{nextAction}</span>
                          </td>
                          <td className="p-2.5 border-r border-slate-150 text-center">
                            <span className={cn("inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider min-w-[70px]", 
                              flowStatus === 'Confirmed' ? "bg-green-50 text-green-700 border-green-200" :
                              flowStatus === 'Completed' ? "bg-teal-50 text-teal-700 border-teal-200" :
                              flowStatus === 'Cancelled' ? "bg-red-50 text-red-700 border-red-200" :
                              "bg-amber-50 text-amber-700 border-amber-200"
                            )}>
                              {flowStatus}
                            </span>
                          </td>
                          <td className="p-2.5 border-r border-slate-150 text-center text-slate-550 font-medium truncate" title={activityTime}>{activityTime}</td>
                          <td className="p-2.5 pl-2" onClick={e => e.stopPropagation()}>
                             <div className="flex items-center gap-1 justify-start pl-1">
                               {showPayment && (
                                 <button 
                                   className={cn(
                                     "relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all",
                                     paymentDot ? "text-amber-600 hover:text-amber-700" : "text-slate-500 hover:text-slate-800"
                                   )}
                                   title={paymentDot === 'red' ? "Payment Overdue (Red Indicator)" : "Payment Details"}
                                   onClick={() => openBookingDetails(b, 'payments')}
                                 >
                                   <CreditCard className="w-3 h-3" />
                                   {paymentDot && (
                                     <span className={cn(
                                       "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white",
                                       paymentDot === 'red' ? 'bg-[#dc2626]' : 'bg-[#d97706]'
                                     )} />
                                   )}
                                 </button>
                               )}
                               {showPassengers && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Passenger Manifest"
                                   onClick={() => openBookingDetails(b, 'passengers')}
                                 >
                                   <Users className="w-3 h-3" />
                                   {passengersDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#d97706]" />
                                   )}
                                 </button>
                               )}
                               {showDocuments && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Files & Documents"
                                   onClick={() => openBookingDetails(b, 'files')}
                                 >
                                   <FileText className="w-3 h-3" />
                                   {documentsDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#dc2626]" />
                                   )}
                                 </button>
                               )}
                               {showTicketing && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Train Tickets"
                                   onClick={() => openBookingDetails(b, 'ticketing')}
                                 >
                                   <Train className="w-3 h-3" />
                                   {ticketingDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#d97706]" />
                                   )}
                                 </button>
                               )}
                               {showOperations && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Operations & Tasks"
                                   onClick={() => openBookingDetails(b, 'operations')}
                                 >
                                   <CheckSquare className="w-3 h-3" />
                                   {operationsDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#dc2626]" />
                                   )}
                                 </button>
                               )}
                               {showChecklist && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Checklist / Departure Readiness"
                                   onClick={() => openBookingDetails(b, 'verification')}
                                 >
                                   <ClipboardList className="w-3 h-3" />
                                   {checklistDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#16a34a]" />
                                   )}
                                 </button>
                               )}
                               {showNotes && (
                                 <button 
                                   className="relative w-[26px] h-[26px] rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all text-slate-500 hover:text-slate-800"
                                   title="Notes & Activities"
                                   onClick={() => openBookingDetails(b, 'notes')}
                                 >
                                   <MessageSquare className="w-3 h-3" />
                                   {notesDot && (
                                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-[#2563eb]" />
                                   )}
                                 </button>
                               )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 bg-slate-50 text-xs shrink-0 font-semibold">
              <p className="text-slate-555">
                Showing {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} reservations
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={page <= 1}
                    className="h-8 w-8 rounded border-slate-200 hover:bg-slate-50 bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                    disabled={page >= totalPages}
                    className="h-8 w-8 rounded border-slate-200 hover:bg-slate-50 bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* BULK ACTIONS DRAWER */}
          <div className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white py-3 px-6 rounded-lg shadow-xl z-55 flex items-center gap-3 transition-all duration-350 ease-out border border-slate-700/50",
            selectedIds.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          )}>
            <span className="font-bold text-xs mr-2">{selectedIds.length} Selected</span>
            <button className="h-8 px-3 rounded border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer" onClick={() => handleBulkAction('assign')}>Assign Executive</button>
            <button className="h-8 px-3 rounded border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer" onClick={() => handleBulkAction('reminder')}>Send Reminder</button>
            <button className="h-8 px-3 rounded border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer" onClick={() => handleBulkAction('link')}>Payment Link</button>
            <button className="h-8 px-3 rounded border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer" onClick={() => handleBulkAction('assign_task')}>Assign Task</button>
            <button className="h-8 px-3 rounded border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer" onClick={() => handleBulkAction('mark_complete')}>Mark Complete</button>
            <button className="h-8 px-3 rounded border border-indigo-400/40 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs transition-colors cursor-pointer" onClick={() => setIsBulkEmailOpen(true)}>Send Email</button>
          </div>
        </div>
      </div>

      {/* PREVIEW DRAWER SLIDE-OUT */}
      {previewTarget && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={() => setPreviewTarget(null)} />
          <div className={cn(
            "fixed top-0 right-0 h-screen w-[400px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out font-sans",
            previewTarget ? "translate-x-0" : "translate-x-full"
          )}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="font-extrabold text-slate-800 text-sm">#{previewTarget.bookingId} - {previewTarget.fullName}</div>
              <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors" onClick={() => setPreviewTarget(null)}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Name</span>
                    <span className="font-bold text-slate-800">{previewTarget.fullName}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Phone</span>
                    <span className="font-mono font-bold text-slate-700">{previewTarget.mobile}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Email</span>
                    <span className="font-mono font-bold text-slate-700">{previewTarget.email || 'no email'}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Age / Gender</span>
                    <span className="font-bold text-slate-800">{previewTarget.age || 'N/A'} yrs / {previewTarget.gender || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Salesperson</span>
                    <span className="font-bold text-slate-800">{getBookingMetaData(previewTarget).bookedBy}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trip Details</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Trip</span>
                    <span className="font-bold text-slate-800">{previewTarget.tripName || previewTarget.tripId}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Departure</span>
                    <span className="font-bold text-slate-800">{safeFormatDate(previewTarget.departureDate, { day: '2-digit', month: 'short', year: 'numeric' }, 'Not Scheduled')}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Passengers</span>
                    <span className="font-bold text-slate-800">{previewTarget.numberOfTravelers || 1} pax</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Package Option</span>
                    <span className="font-bold text-slate-800">{previewTarget.trainClass || 'Sleeper'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Summary</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Total Amount</span>
                    <span className="font-bold text-slate-800">₹{Number(previewTarget.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Received</span>
                    <span className="font-bold text-[#12B76A]">₹{Number(previewTarget.advancePaid || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Pending</span>
                    <span className="font-bold text-rose-600">₹{Number(previewTarget.remainingAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Booking status</span>
                    <span className="font-bold text-slate-800 uppercase text-[10px]">{getFlowStatus(previewTarget)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-400">Next Action</span>
                    <span className="font-bold text-blue-600 text-[10px] uppercase tracking-wide">{getNextAction(previewTarget)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button 
                className="w-full bg-[#0F172A] hover:bg-slate-850 text-white font-bold py-2.5 rounded-[6px] text-xs transition-colors cursor-pointer" 
                onClick={() => { openBookingDetails(previewTarget); setPreviewTarget(null); }}
              >
                Open Full Workspace
              </button>
            </div>
          </div>
        </>
      )}

      {/* Trip & Confirm modals */}
      <TripManager open={showTrips} onClose={() => setShowTrips(false)} onRefresh={fetchAll} />
      <ConfirmModal booking={confirmTarget} trips={trips} onClose={() => setConfirmTarget(null)} onDone={() => { setConfirmTarget(null); fetchAll(); }} />
      
      {/* BULK ACTIONS MODAL */}
      {bulkModalAction && (
        <Dialog open={!!bulkModalAction} onOpenChange={v => !v && setBulkModalAction(null)}>
          <DialogContent className="sm:max-w-[420px] p-0 border border-slate-200 rounded-lg overflow-hidden shadow-premium bg-white">
            <DialogHeader className="bg-slate-900 px-4 py-3 text-white">
              <DialogTitle className="text-xs font-bold uppercase tracking-wider text-white">
                {bulkModalAction === 'assign' && 'Assign Executive'}
                {bulkModalAction === 'reminder' && 'Send Reminders'}
                {bulkModalAction === 'link' && 'Generate Payment Links'}
                {bulkModalAction === 'assign_task' && 'Assign Tasks'}
                {bulkModalAction === 'mark_complete' && 'Mark as Complete'}
              </DialogTitle>
              <DialogDescription className="sr-only">Bulk operations for selected bookings.</DialogDescription>
            </DialogHeader>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-500 font-semibold">
                You have selected <span className="font-bold text-slate-800">{selectedIds.length}</span> bookings to update.
              </p>

              {bulkModalAction === 'assign' && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-400">Select Executive / Salesperson</label>
                  <Select value={bulkSalesperson} onValueChange={setBulkSalesperson}>
                    <SelectTrigger className="h-9 text-xs rounded bg-white"><SelectValue placeholder="Choose salesperson..." /></SelectTrigger>
                    <SelectContent>
                      {salesOptions.map(id => (
                        <SelectItem key={id} value={id} className="text-xs">{id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {bulkModalAction === 'reminder' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Reminder Channel</label>
                    <Select value={bulkReminderChannel} onValueChange={setBulkReminderChannel}>
                      <SelectTrigger className="h-9 text-xs rounded bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WhatsApp" className="text-xs">WhatsApp Notification</SelectItem>
                        <SelectItem value="Email" className="text-xs">Email Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Custom message notes (Optional)</label>
                    <textarea 
                      className="w-full min-h-[60px] p-2 bg-white border border-slate-200 rounded text-xs outline-none"
                      placeholder="Type custom note to attach to the template..."
                      value={bulkReminderMessage}
                      onChange={e => setBulkReminderMessage(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {bulkModalAction === 'link' && (
                <div className="bg-slate-55 p-3 rounded border border-slate-100/80 text-[11px] leading-relaxed text-slate-600">
                  This will generate and trigger automated billing invoice payment links for the selected reservations, delivering them to the primary passenger's email address.
                </div>
              )}

              {bulkModalAction === 'assign_task' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Task Title / Description</label>
                    <Input 
                      value={bulkTaskTitle} 
                      onChange={e => setBulkTaskTitle(e.target.value)} 
                      placeholder="e.g. Call client for train tickets preference"
                      className="h-9 text-xs rounded bg-white" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Assign to Colleague / Executive</label>
                    <Select value={bulkTaskAssignee} onValueChange={setBulkTaskAssignee}>
                      <SelectTrigger className="h-9 text-xs rounded bg-white"><SelectValue placeholder="Select colleague..." /></SelectTrigger>
                      <SelectContent>
                        {salesOptions.map(id => (
                          <SelectItem key={id} value={id} className="text-xs">{id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400">Due Date</label>
                      <Input 
                        type="date"
                        value={bulkTaskDueDate} 
                        onChange={e => setBulkTaskDueDate(e.target.value)} 
                        className="h-9 text-xs rounded bg-white font-mono" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400">Priority</label>
                      <Select value={bulkTaskPriority} onValueChange={setBulkTaskPriority}>
                        <SelectTrigger className="h-9 text-xs rounded bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low" className="text-xs">Low</SelectItem>
                          <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                          <SelectItem value="High" className="text-xs">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {bulkModalAction === 'mark_complete' && (
                <div className="bg-slate-55 p-3 rounded border border-slate-100/80 text-[11px] leading-relaxed text-slate-600">
                  Are you sure you want to mark all {selectedIds.length} selected bookings as <span className="text-green-600 font-bold">CONFIRMED</span> and set their payment status to <span className="text-green-600 font-bold">PAID</span>?
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={executeBulkAction} 
                  disabled={bulkProcessing}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 rounded text-xs"
                >
                  {bulkProcessing ? 'Processing...' : 'Confirm Action'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setBulkModalAction(null)}
                  disabled={bulkProcessing}
                  className="h-9 rounded text-xs border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {editTarget && (
        <NewBookingModal
          open={!!editTarget}
          onOpenChange={v => !v && setEditTarget(null)}
          booking={editTarget}
          onSuccess={() => {
            setEditTarget(null);
            fetchAll();
          }}
        />
      )}
      {/* Bulk Email Composer Drawer */}
      <EmailComposerDrawer
        isOpen={isBulkEmailOpen}
        onClose={() => setIsBulkEmailOpen(false)}
        contextType="booking"
        selectedIds={selectedIds}
        onSent={() => {
          setSelectedIds([]);
          setIsBulkEmailOpen(false);
          loadBookings();
        }}
      />
    </div>
  );
}

// Simple Helper
function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
      <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.553.553 0 0 1-1.1 0L7.1 4.995z"/>
    </svg>
  );
}
