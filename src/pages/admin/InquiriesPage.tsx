import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { inquiriesService } from "@/services/inquiries.service";
import type { Inquiry } from "@/types";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, Phone, Search, MoreHorizontal, Download, Upload, RefreshCw, CheckCircle2, ChevronLeft, ChevronRight, Share2, Star, X, Info, TrendingUp, MapPin, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import EmailComposerDrawer from "@/components/admin/EmailComposerDrawer";
import EmailLogsTimeline from "@/components/admin/EmailLogsTimeline";

const STATUS_TABS = [
  { key: "all", label: "All Inquiries" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "follow-up", label: "Follow-up" },
  { key: "interested", label: "Interested" },
  { key: "payment-pending", label: "Payment Pending" },
  { key: "converted", label: "Booked" },
  { key: "closed", label: "Lost" },
  { key: "spam", label: "Spam" },
];

export default function InquiriesPage() {
  const { admin } = useAuthStore();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerInquiry, setComposerInquiry] = useState<Inquiry | null>(null);
  const [bulkComposerIds, setBulkComposerIds] = useState<string[]>([]);

  // Filters state
  const [dateRange, setDateRange] = useState("Date Range");
  const [sourceFilter, setSourceFilter] = useState("Source");
  const [assigneeFilter, setAssigneeFilter] = useState("Assigned To");
  const [tripFilter, setTripFilter] = useState("Trip / Package");
  const [cityFilter, setCityFilter] = useState("City");
  const [priorityFilter, setPriorityFilter] = useState("Priority");

  // Selection state
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showFullMessage, setShowFullMessage] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(prev => {
        if (prev !== searchInput) {
          setPage(1);
          return searchInput;
        }
        return prev;
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const loadRequestRef = useRef(0);

  const load = useCallback(async (isInitial = false) => {
    const requestId = ++loadRequestRef.current;
    if (isInitial) {
      setLoading(true);
    }
    try {
      let apiStatus = activeTab;
      if (activeTab === "all") apiStatus = "all";
      if (activeTab === "follow-up") apiStatus = "contacted";
      if (activeTab === "interested") apiStatus = "contacted";
      if (activeTab === "payment-pending") apiStatus = "new";

      const res = await inquiriesService.getAll({
        status: apiStatus,
        search: searchQuery,
        page,
        limit: pageSize,
      });
      if (requestId !== loadRequestRef.current) return;
      const currentTotalPages = res.pagination?.totalPages || 0;

      if (currentTotalPages > 0 && page > currentTotalPages) {
        setPage(1);
        return;
      }

      setInquiries(res.data || []);
      setTotalCount(res.pagination?.totalCount || 0);
      setTotalPages(currentTotalPages);

      if (res.data && res.data.length > 0 && !selected) {
        setSelected(res.data[0]);
      }
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      toast.error("Failed to load inquiries");
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [activeTab, searchQuery, page, pageSize, selected]);

  useEffect(() => { load(true); }, [activeTab, searchQuery, page, pageSize]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setPage(1);
  };

  const getTabCount = (key: string) => {
    if (key === activeTab) return totalCount;
    if (key === "new") return 15;
    if (key === "contacted") return 28;
    if (key === "follow-up") return 36;
    if (key === "interested") return 17;
    if (key === "payment-pending") return 10;
    if (key === "converted") return 18;
    if (key === "closed") return 6;
    if (key === "spam") return 3;
    return 129;
  };

  const updateStatus = async (inq: Inquiry, status: string) => {
    try {
      await inquiriesService.update(inq.id, { status } as any);
      toast.success(`Status updated to ${status}`);
      load();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === inquiries.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(inquiries.map(i => i.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rId => rId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleRowEmailClick = (inq: Inquiry) => {
    setComposerInquiry(inq);
    setBulkComposerIds([]);
    setIsComposerOpen(true);
  };

  const handleBulkEmailClick = () => {
    setComposerInquiry(null);
    setBulkComposerIds(selectedRows);
    setIsComposerOpen(true);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F7F8FA] min-h-screen -mx-3 -my-3 sm:-mx-6 sm:-my-6 font-sans text-[#172033]">
      {/* LEFT COLUMN: Main List & Filters Workspace */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-4 no-scrollbar">
        
        {/* Page Header Actions */}
        <div className="flex items-start justify-between flex-shrink-0">
          <div>
            <h1 className="text-[24px] font-[600] text-[#172033] tracking-tight">Inquiries</h1>
            <p className="text-[12px] text-[#667085] font-medium mt-0.5">Track, follow up and convert leads into happy customers.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 px-3 rounded border border-[#E5EAF1] bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shadow-sm">
              <Download className="w-3.5 h-3.5 text-slate-400" /> Export
            </button>
            <button className="h-8 px-3 rounded border border-[#E5EAF1] bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shadow-sm">
              <Upload className="w-3.5 h-3.5 text-slate-400" /> Import
            </button>
            <button className="h-8 px-3 rounded bg-[#FF6B00] hover:bg-[#E85F00] text-[11px] font-bold text-white flex items-center gap-1.5 shadow-sm">
              <RefreshCw className="w-3.5 h-3.5" /> Sync Leads
            </button>
          </div>
        </div>

        {/* Zoho style CRM KPI Cards (7 cards, 80px high, 15px padding) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { label: "New", count: "15", diff: "20%", up: true },
            { label: "Contacted", count: "28", diff: "12%", up: true },
            { label: "Follow-up", count: "36", diff: "8%", up: true },
            { label: "Booking Links Sent", count: "22", diff: "18%", up: true },
            { label: "Payment Pending", count: "10", diff: "5%", up: false },
            { label: "Booked", count: "18", diff: "25%", up: true },
            { label: "Conversion Rate", count: "12.6%", diff: "Trend", up: true, trend: true }
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white border border-[#E5EAF1] rounded-lg p-3.5 shadow-xs space-y-1 h-[80px] flex flex-col justify-center">
              <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wide truncate">{kpi.label}</p>
              <div className="flex items-baseline justify-between">
                <span className="text-[20px] font-bold text-[#172033] tracking-tight">{kpi.count}</span>
                <span className={cn("text-[9px] font-bold flex items-center gap-0.5", kpi.up ? "text-[#12B76A]" : "text-[#F04438]")}>
                  {kpi.trend ? <TrendingUp className="w-3 h-3 text-[#12B76A]" /> : (kpi.up ? "↑" : "↓")} {!kpi.trend && kpi.diff}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Selection Row (Zoho CRM active style - orange underline) */}
        <div className="flex gap-2 bg-white rounded border border-[#E5EAF1] p-1 shadow-sm overflow-x-auto no-scrollbar items-center h-11 flex-shrink-0">
          {STATUS_TABS.map(tab => {
            const count = getTabCount(tab.key);
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  "px-3 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 relative",
                  isActive
                    ? "border-[#FF6B00] text-[#FF6B00] bg-transparent"
                    : "border-transparent text-[#667085] hover:text-[#172033] hover:bg-slate-50 rounded"
                )}
              >
                {tab.label}
                <span className={cn(
                  "ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                  isActive ? "bg-[#FF6B00]/10 text-[#FF6B00]" : "bg-slate-100 text-[#667085]"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar row 1 */}
        <div className="flex flex-wrap bg-white border border-[#E5EAF1] p-2 rounded-t shadow-xs items-center gap-2 flex-shrink-0 text-xs">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-[#172033] focus:outline-none">
            <option>Date Range</option>
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-[#172033] focus:outline-none">
            <option>Source</option>
          </select>
          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-[#172033] focus:outline-none">
            <option>Assigned To</option>
          </select>
          <select value={tripFilter} onChange={(e) => setTripFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-[#172033] focus:outline-none">
            <option>Trip / Package</option>
          </select>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-[#172033] focus:outline-none">
            <option>City</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-[#172033] focus:outline-none">
            <option>Priority</option>
          </select>
          <button className="text-[10px] text-slate-500 font-bold hover:underline px-2">More Filters ✓</button>
          <button className="text-[10px] text-slate-500 font-bold hover:underline border-l border-slate-200 pl-2">Save View</button>
        </div>

        {/* Filter Toolbar row 2: Bulk Selection & Search input */}
        <div className="flex bg-white border-x border-b border-[#E5EAF1] p-2 rounded-b shadow-xs items-center justify-between flex-shrink-0 text-xs">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={selectedRows.length === inquiries.length && inquiries.length > 0} 
              onChange={toggleSelectAll} 
              className="rounded border-slate-200 text-[#FF6B00] focus:ring-[#FF6B00] cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-500">{selectedRows.length} Selected</span>
            <button 
              disabled={selectedRows.length === 0} 
              className={cn("h-7 px-3 text-[10px] font-bold rounded border transition-all", 
                selectedRows.length > 0 ? "bg-white text-slate-700 hover:bg-slate-50 border-slate-200" : "bg-slate-50 text-slate-350 border-slate-100 cursor-not-allowed"
              )}
            >
              Bulk Actions
            </button>
            {selectedRows.length > 0 && (
              <button
                onClick={handleBulkEmailClick}
                className="h-7 px-3 text-[10px] font-bold rounded border bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700 flex items-center gap-1 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                Send Email
              </button>
            )}
            <button onClick={() => load()} className="text-[#AEB4C2] hover:text-[#172033] p-1"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>

          <div className="w-[300px] relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, phone, tour name…"
              className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[#FF6B00] bg-white text-[#172033] placeholder-[#98A2B3]"
            />
          </div>
        </div>

        {/* Enterprise CRM Lead Table (Row heights: 104px) */}
        <div className="bg-white rounded border border-[#E5EAF1] shadow-sm !p-0 overflow-hidden flex-1">
          {inquiries.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <MessageSquare className="h-10 w-10 mb-3 text-slate-250" />
              <p className="text-xs text-[#98A2B3] font-bold">No inquiries found</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5EAF1] bg-[#F8FAF9] h-10 select-none">
                  <th className="px-4 text-[10px] font-bold text-[#667085] uppercase tracking-wider w-[3%]"></th>
                  <th className="px-4 text-[10px] font-bold text-[#667085] uppercase tracking-wider w-[22%]">Inquiry</th>
                  <th className="px-4 text-[10px] font-bold text-[#667085] uppercase tracking-wider w-[20%]">Customer &amp; Details</th>
                  <th className="px-4 text-[10px] font-bold text-[#667085] uppercase tracking-wider w-[18%]">Trip / Package</th>
                  <th className="px-4 text-[10px] font-bold text-[#667085] uppercase tracking-wider w-[10%]">Status &amp; Priority</th>
                  <th className="px-4 text-[10px] font-bold text-[#667085] uppercase tracking-wider w-[10%]">Next Follow-up</th>
                  <th className="px-4 text-[10px] font-bold text-[#667085] uppercase tracking-wider w-[8%]">Booking Link</th>
                  <th className="px-4 text-[10px] font-bold text-[#667085] uppercase tracking-wider w-[8%]">Assigned To</th>
                  <th className="px-4 text-[10px] font-bold text-[#667085] uppercase tracking-wider w-[1%] text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF1]">
                {inquiries.map((inq) => {
                  const statusColors: Record<string, string> = {
                    new: "bg-blue-500", contacted: "bg-[#FF6B00]", converted: "bg-[#12B76A]",
                    closed: "bg-[#F04438]", archived: "bg-slate-400", spam: "bg-[#F04438]"
                  };
                  const statusDotColor = statusColors[inq.status] || "bg-slate-350";
                  const isSelected = selected?.id === inq.id;

                  return (
                    <tr key={inq.id} className={cn("hover:bg-[#F8FAFC]/55 transition-colors h-[104px] cursor-pointer", isSelected ? "bg-orange-55/20 border-l-2 border-[#FF6B00]" : "")} onClick={() => setSelected(inq)}>
                      {/* Checkbox column */}
                      <td className="px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedRows.includes(inq.id)} 
                          onChange={() => toggleSelectRow(inq.id)} 
                          className="rounded border-slate-200 text-[#FF6B00] focus:ring-[#FF6B00] cursor-pointer"
                        />
                      </td>

                      {/* Inquiry Details Column */}
                      <td className="px-4 py-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse", statusDotColor)} />
                            <span className="text-xs font-extrabold text-[#172033] hover:text-[#FF6B00]">{inq.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-800 pl-3.5 font-bold font-mono">{inq.phone}</p>
                          <p className="text-[9.5px] text-[#98A2B3] pl-3.5 truncate max-w-[170px]">{inq.email}</p>
                          <p className="text-[8.5px] text-slate-400 pl-3.5 font-mono">INQ-2026-0721-001</p>
                        </div>
                      </td>

                      {/* Customer Details info */}
                      <td className="px-4 py-2 text-[11px] text-slate-700">
                        <div className="space-y-0.5 font-bold">
                          <p>📍 Ahmedabad, Gujarat</p>
                          <p className="text-[#667085]">👥 Family &middot; 4 Travellers</p>
                          <p className="text-[#FF6B00]">Budget: ₹65,000 - ₹75,000</p>
                          <span className="text-[9px] bg-emerald-50 text-[#12B76A] border border-emerald-100 px-1 py-0.5 rounded font-black inline-block mt-0.5">Existing</span>
                        </div>
                      </td>

                      {/* Trip / Package */}
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-12 bg-slate-100 border border-slate-200 rounded flex-shrink-0 flex items-center justify-center text-[10px] text-slate-400 font-bold">Trip</div>
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{inq.tripTitle || "General Inquiry"}</p>
                            <p className="text-[10px] text-[#667085] font-semibold">MKA Trip &middot; 9D/8N</p>
                          </div>
                        </div>
                      </td>

                      {/* Status / Priority */}
                      <td className="px-4 py-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded border capitalize bg-slate-50 text-slate-650 border-slate-200">{inq.status}</span>
                          <p className="text-[9px] text-[#F04438] font-black flex items-center gap-0.5">🔥 High</p>
                        </div>
                      </td>

                      {/* Next Follow-up */}
                      <td className="px-4 py-2 text-[11px]">
                        <div className="space-y-0.5 font-bold text-slate-800">
                          <p>🗓️ Tomorrow</p>
                          <p className="text-[#98A2B3] text-[10px]">10:30 AM</p>
                          <p className="text-[#667085] text-[9.5px] font-medium">by Suresh</p>
                        </div>
                      </td>

                      {/* Booking Link state */}
                      <td className="px-4 py-2 text-[11px]">
                        <div className="space-y-0.5 font-bold">
                          <p className="text-[#12B76A]">Sent</p>
                          <p className="text-[#98A2B3] text-[9.5px] font-medium">Expires 18h 42m</p>
                        </div>
                      </td>

                      {/* Assigned salesperson info */}
                      <td className="px-4 py-2 text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-extrabold">Z</div>
                          <div className="min-w-0">
                            <p className="truncate">Zeel</p>
                            <p className="text-[8px] text-slate-400 font-medium truncate">Sales Exec</p>
                          </div>
                        </div>
                      </td>

                      {/* Action Menu Column */}
                      <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><button className="h-7 w-7 rounded border border-[#E5EAF1] bg-white hover:bg-slate-50 text-[#172033] flex items-center justify-center"><MoreHorizontal className="w-4 h-4 text-slate-500" /></button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded border border-[#E5EAF1] shadow-sm text-xs font-bold">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => setSelected(inq)}>Workspace View</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => updateStatus(inq, 'contacted')}>Active</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer" onClick={() => updateStatus(inq, 'converted')}>Converted</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-indigo-600" onClick={() => handleRowEmailClick(inq)}>Send Email</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination bar */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border border-[#E5EAF1] rounded shadow-xs flex-shrink-0">
            <p className="text-xs font-bold text-[#667085]">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount} entries
            </p>
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="h-8 w-8 rounded border-slate-200 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-8 w-8 rounded border-slate-200 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile drawer backdrop */}
      {selected && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 lg:hidden"
          onClick={() => setSelected(null)}
        />
      )}

      {/* RIGHT COLUMN: Sticky Internally Scrollable Inquiry Context Panel (340px-360px Width) */}
      {selected && (
        <InquiryDetailsDrawer 
          selected={selected} 
          setSelected={setSelected}
          showFullMessage={showFullMessage}
          setShowFullMessage={setShowFullMessage}
          updateStatus={updateStatus}
          admin={admin}
          onSendEmail={handleRowEmailClick}
        />
      )}

      {/* Email Composer Drawer */}
      <EmailComposerDrawer
        isOpen={isComposerOpen}
        onClose={() => {
          setIsComposerOpen(false);
          setComposerInquiry(null);
          setBulkComposerIds([]);
        }}
        contextType="inquiry"
        contextId={composerInquiry?.id || ""}
        selectedIds={bulkComposerIds}
        recipientEmail={composerInquiry?.email || ""}
        recipientName={composerInquiry?.name || ""}
        onSent={() => {
          setSelectedRows([]);
          load();
        }}
      />
    </div>
  );
}

// ─── Reusable Reconfigured Rebuilt Drawer Component ───
interface DrawerProps {
  selected: any;
  setSelected: (val: any) => void;
  showFullMessage: boolean;
  setShowFullMessage: (val: boolean) => void;
  updateStatus: (inq: any, stat: string) => void;
  admin: any;
  onSendEmail: (inq: any) => void;
}

function InquiryDetailsDrawer({
  selected,
  setSelected,
  showFullMessage,
  setShowFullMessage,
  updateStatus,
  admin,
  onSendEmail
}: DrawerProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"Overview" | "Timeline" | "Customer" | "Notes">("Overview");

  // Single central config system for person/customer profile visibility driving the fields visible for Super Admin, Admin, Sales, Operations, and Finance:
  const profileFieldsConfig = [
    // Section: Profile Summary / custom tags
    { id: "travel_type", label: "Travel Type", val: "Family", section: "Summary", allowedRoles: ["superadmin", "admin", "sales", "ops", "finance"] },
    { id: "travellers", label: "Travellers", val: "4 Travellers", section: "Summary", allowedRoles: ["superadmin", "admin", "sales", "ops", "finance"] },
    { id: "budget", label: "Budget", val: "₹65K – ₹75K", section: "Summary", allowedRoles: ["superadmin", "admin", "sales", "finance"] },
    { id: "lead_source", label: "Lead Source", val: "Instagram Ad", section: "Summary", allowedRoles: ["superadmin", "admin", "sales"] },
    { id: "priority", label: "Priority", val: "High", section: "Summary", allowedRoles: ["superadmin", "admin", "sales", "ops"] },

    // Section: Overview / Detail grid fields
    { id: "source", label: "Source", val: "Instagram Ad", section: "Detail", allowedRoles: ["superadmin", "admin", "sales"] },
    { id: "campaign", label: "Campaign", val: "MKA_Snowfall_July", section: "Detail", allowedRoles: ["superadmin", "admin", "sales"] },
    { id: "first_inquiry", label: "First Inquiry", val: "21 Jul 2026", section: "Detail", allowedRoles: ["superadmin", "admin", "sales", "ops", "finance"] },
    { id: "last_activity", label: "Last Activity", val: "21 Jul 2026", section: "Detail", allowedRoles: ["superadmin", "admin", "sales", "ops", "finance"] },
    { id: "pref_departure", label: "Preferred Departure", val: "06 Jun 2026", section: "Detail", allowedRoles: ["superadmin", "admin", "sales", "ops", "finance"] },
    { id: "flexibility", label: "Flexibility", val: "± 3 Days", section: "Detail", allowedRoles: ["superadmin", "admin", "sales", "ops"] }
  ];

  const userRole = admin?.role || "sales";

  // Filter fields based on user role permission configuration
  const permittedFields = profileFieldsConfig.filter(field => 
    field.allowedRoles.includes(userRole)
  );

  const summaryTags = permittedFields.filter(f => f.section === "Summary");
  const detailFields = permittedFields.filter(f => f.section === "Detail");

  return (
    <div className="w-full sm:w-[380px] lg:w-[360px] bg-white border-l border-[#E5EAF1] flex flex-col overflow-hidden flex-shrink-0 fixed lg:sticky inset-y-0 right-0 lg:top-0 h-full lg:h-[calc(100vh-48px)] z-50 lg:z-40 font-['Montserrat'] shadow-2xl lg:shadow-sm lg:-mr-6 lg:-my-6">
      {/* DRAWER HEADER (52px height) */}
      <div className="h-[52px] px-4 flex items-center justify-between border-b border-[#E5EAF1] shrink-0 bg-white">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-mono font-bold text-slate-800 tracking-tight">INQ-2026-0721-001</span>
          <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500 cursor-pointer shrink-0" />
        </div>
        <div className="flex items-center gap-1">
          <X className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-800 p-0.5 rounded hover:bg-slate-50 transition-colors" onClick={() => setSelected(null)} />
        </div>
      </div>

      {/* DRAWER BODY (Scrolls internally) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-white">
        {/* TABS - CRITICAL ALIGNMENT FIX */}
        <div className="relative border-b border-[#E5EAF1] shrink-0">
          <div className="flex gap-4 h-[44px] overflow-x-auto no-scrollbar scroll-smooth items-stretch">
            {(["Overview", "Timeline", "Customer", "Notes"] as const).map(tab => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative text-[10.5px] font-bold tracking-wider uppercase transition-all flex items-center px-1 whitespace-nowrap h-full select-none outline-none",
                    active ? "text-[#FF6B00]" : "text-[#667085] hover:text-slate-800"
                  )}
                >
                  {tab}
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF6B00] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents */}
        {activeTab === "Overview" && (
          <div className="space-y-4">
            {/* PROFILE SUMMARY CARD */}
            <div className="space-y-3 pb-3 border-b border-[#E5EAF1]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 shrink-0">
                  {selected.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-bold text-[#172033] truncate leading-tight">{selected.name}</p>
                    <span className="bg-emerald-50 text-[#12B76A] border border-emerald-200/50 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                      Existing Customer
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Lead / Booking Owner
                  </p>
                </div>
              </div>

              {/* CONTACT DETAILS LIST */}
              <div className="space-y-1.5 text-xs text-[#667085] font-semibold pl-1">
                <p className="flex items-center gap-2.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                  <span className="text-[#172033]">{selected.phone}</span>
                </p>
                <p className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                  <span className="text-[#172033] truncate">{selected.email}</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> 
                  <span className="text-[#172033]">Ahmedabad, Gujarat</span>
                </p>
              </div>

              {/* DYNAMIC PERMITTED SUMMARY PROFILE TAGS */}
              {summaryTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {summaryTags.map(tag => (
                    <div key={tag.id} className="text-[9.5px] bg-[#F1F5F9] text-slate-700 font-bold border border-slate-200 px-2 py-0.5 rounded">
                      {tag.label}: {tag.val}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* INQUIRY INFORMATION GRID */}
            {detailFields.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Inquiry Details</span>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 border border-[#E5EAF1] rounded-lg p-3">
                  {detailFields.map(field => (
                    <div key={field.id} className="min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{field.label}</span>
                      <p className={cn("font-bold mt-0.5 truncate", field.id === "pref_departure" ? "text-[#FF6B00]" : "text-[#172033]")}>
                        {field.val}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOMER MESSAGE PREVIEW */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Customer Message</span>
              <div className="bg-[#F8FAF9] p-3 rounded-lg border border-[#E5EAF1] leading-relaxed italic text-xs text-slate-700">
                <p className={cn(showFullMessage ? "" : "line-clamp-2")}>
                  "{selected.message || "We are planning for a trip in June end. Please share itinerary and cost details."}"
                </p>
                <button className="text-[10px] text-[#FF6B00] font-bold mt-2 hover:underline" onClick={() => setShowFullMessage(!showFullMessage)}>
                  {showFullMessage ? "Show less" : "Show more"}
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quick Actions</span>
              <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-bold text-slate-700">
                <div onClick={() => window.open(`tel:${selected.phone}`)} className="p-2 border border-[#E5EAF1] rounded-lg hover:bg-slate-50 cursor-pointer flex flex-col justify-between h-12">
                  <Phone className="w-3.5 h-3.5 mx-auto text-slate-500" /> <span>Call</span>
                </div>
                <div onClick={() => toast.success("WhatsApp channel open")} className="p-2 border border-[#E5EAF1] rounded-lg hover:bg-slate-50 cursor-pointer flex flex-col justify-between h-12">
                  <MessageSquare className="w-3.5 h-3.5 mx-auto text-slate-500" /> <span>WhatsApp</span>
                </div>
                <div onClick={() => onSendEmail(selected)} className="p-2 border border-[#E5EAF1] rounded-lg hover:bg-slate-50 cursor-pointer flex flex-col justify-between h-12">
                  <Mail className="w-3.5 h-3.5 mx-auto text-slate-500" /> <span>Email</span>
                </div>
                <div onClick={() => navigate(`/admin/quotations/new?name=${encodeURIComponent(selected.name || '')}&phone=${encodeURIComponent(selected.phone || '')}&email=${encodeURIComponent(selected.email || '')}&destination=${encodeURIComponent(selected.tripTitle || '')}`)} className="p-2 border border-[#E5EAF1] rounded-lg hover:bg-slate-50 cursor-pointer flex flex-col justify-between h-12">
                  <FileText className="w-3.5 h-3.5 mx-auto text-slate-500" /> <span>Quotation</span>
                </div>
                <div onClick={() => updateStatus(selected, 'converted')} className="p-2 border border-[#E5EAF1] rounded-lg hover:bg-slate-50 cursor-pointer flex flex-col justify-between h-12">
                  <CheckCircle2 className="w-3.5 h-3.5 mx-auto text-[#12B76A]" /> <span>Won</span>
                </div>
              </div>
            </div>

            {/* BOOKING LINK STATUS CARD */}
            <div className="border border-[#E5EAF1] rounded-xl p-3 bg-[#F8FAF9] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#667085] uppercase">Booking Link Status</span>
                <span className="text-[9px] bg-emerald-50 text-[#12B76A] border border-emerald-100 font-bold px-1.5 py-0.5 rounded">Sent</span>
              </div>
              <div className="space-y-1 text-[10px] font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span>Link ID:</span>
                  <span className="font-bold font-mono">BL-2026-0721-001</span>
                </div>
                <div className="flex justify-between">
                  <span>Created On:</span>
                  <span className="font-bold">21 Jul 2026</span>
                </div>
                <div className="flex justify-between">
                  <span>Expires On:</span>
                  <span className="font-bold text-[#F04438]">22 Jul 2026</span>
                </div>
              </div>
              <button className="w-full text-center py-2 text-xs font-bold text-[#FF6B00] border border-dashed border-[#FF6B00]/40 rounded hover:bg-white transition-all mt-1" onClick={() => toast.success("Copied booking link!")}>
                View Booking Link
              </button>
            </div>
          </div>
        )}

        {activeTab === "Timeline" && (
          <div className="space-y-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Activity History</span>
            <div className="relative pl-4 border-l border-slate-200 ml-2 space-y-4 text-xs">
              <div className="relative">
                <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <p className="font-bold text-[#172033]">Booking Link Sent</p>
                <p className="text-[#667085] text-[10px] mt-0.5">21 Jul 2026 &middot; 04:30 PM</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
                <p className="font-bold text-[#172033]">Inquiry Created</p>
                <p className="text-[#667085] text-[10px] mt-0.5">21 Jul 2026 &middot; 10:15 AM &middot; via Web Form</p>
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-3">
              <EmailLogsTimeline contextType="inquiry" contextId={selected.id} />
            </div>
          </div>
        )}

        {activeTab === "Customer" && (
          <div className="space-y-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Customer Specifications</span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">First Name</span>
                <p className="font-bold text-slate-800 mt-1">{selected.name.split(' ')[0]}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Last Name</span>
                <p className="font-bold text-slate-800 mt-1">{selected.name.split(' ')[1] || "—"}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">City</span>
                <p className="font-bold text-slate-800 mt-1">Ahmedabad</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">State</span>
                <p className="font-bold text-slate-800 mt-1">Gujarat</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Notes" && (
          <div className="space-y-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Notes & Annotations</span>
            <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Suresh (Sales Executive)</span>
                <span className="text-[9px] text-slate-400">21 Jul 2026</span>
              </div>
              <p className="text-slate-655 italic">"Client requested Leh Ladakh group packages itinerary. Sent packages detail."</p>
            </div>
            <p className="text-xs text-slate-400 text-center py-4">No other notes found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
