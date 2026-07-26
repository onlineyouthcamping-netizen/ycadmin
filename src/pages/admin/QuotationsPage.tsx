import { useEffect, useState, useCallback, useMemo } from "react";
import { quotationsService } from "@/services/quotations.service";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Pencil, Trash2, FileText, Calendar, User, MapPin, Share2, Clock, 
  Copy, Sparkles, CheckCircle2, AlertCircle, TrendingUp, Search, Filter, 
  RefreshCw, ExternalLink, ArrowUpRight, Check, Eye
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quotationsService.getAll({ page, limit: pageSize, search });
      const currentTotalPages = res.pagination?.totalPages || 0;
      
      if (currentTotalPages > 0 && page > currentTotalPages) {
        setPage(1);
        return;
      }
      
      setQuotations(Array.isArray(res.data) ? res.data : []);
      setTotalCount(res.pagination?.totalCount || 0);
      setTotalPages(currentTotalPages);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotations");
      setQuotations([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => { load(); }, [load]);

  const metrics = useMemo(() => {
    const total = totalCount || quotations.length;
    const published = quotations.filter(q => q.status === 'Published').length;
    const totalVal = quotations.reduce((acc, q) => acc + (Number(q.finalPrice) || 0), 0);
    const avgValue = total > 0 ? Math.round(totalVal / total) : 0;
    return { total, published, totalVal, avgValue };
  }, [quotations, totalCount]);

  const filteredQuotations = useMemo(() => {
    if (statusFilter === "published") {
      return quotations.filter(q => q.status === "Published");
    }
    if (statusFilter === "draft") {
      return quotations.filter(q => q.status !== "Published");
    }
    if (statusFilter === "expired") {
      return quotations.filter(q => q.expiresAt && new Date() > new Date(q.expiresAt));
    }
    return quotations;
  }, [quotations, statusFilter]);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      await quotationsService.remove(id);
      toast.success("Quotation deleted");
      load();
    } catch (err) {
      toast.error("Failed to delete quotation");
    }
  };

  const handleExtend = async (id: string) => {
    try {
      await quotationsService.extend(id, 48);
      toast.success("Validity extended by 48 hours");
      load();
    } catch (err) {
      toast.error("Failed to extend validity");
    }
  };

  const handleCopy = (q: any) => {
    const baseUrl = window.location.origin;
    const tokenPart = q.shareToken ? `?token=${q.shareToken}` : '';
    const url = `${baseUrl}/quote/${q.slug || q.id}${tokenPart}`;
    navigator.clipboard.writeText(url);
    toast.success("Public quote link copied to clipboard!");
  };

  const columns = [
    { 
      key: "customerName", 
      header: "Client Details", 
      render: (q: any) => {
        const nameStr = q.customerName || "Untitled Client";
        const firstLetter = nameStr.charAt(0).toUpperCase();
        return (
          <div className="flex items-center gap-3 min-w-[210px]">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/80 text-[#D4541A] font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
              {firstLetter}
            </div>
            <div>
              <p className="font-extrabold text-[#0B1528] text-xs leading-tight hover:text-[#D4541A] transition-colors cursor-pointer" onClick={() => navigate(`/admin/quotations/${q.id}`)}>
                {nameStr}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" /> 
                  {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "Recent"}
                </span>
                {q.phone && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    • {q.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    { 
      key: "destination", 
      header: "Destination", 
      render: (q: any) => (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100/90 border border-slate-200 px-3 py-1 rounded-xl w-fit whitespace-nowrap shadow-2xs">
          <MapPin className="h-3.5 w-3.5 text-[#D4541A]" />
          {q.destination || "TBD"}
        </div>
      )
    },
    { 
      key: "price", 
      header: "Total Proposal Value", 
      render: (q: any) => (
        <div className="whitespace-nowrap">
          <span className="font-black text-sm text-[#0B1528]">₹{Number(q.finalPrice || 0).toLocaleString()}</span>
          {q.discount > 0 ? (
            <span className="text-[10px] text-emerald-600 font-bold block">Saved ₹{Number(q.discount).toLocaleString()}</span>
          ) : (
            <span className="text-[10px] text-slate-400 font-semibold block">Standard Quote</span>
          )}
        </div>
      )
    },
    { 
      key: "validity", 
      header: "Validity Status", 
      render: (q: any) => {
        if (!q.expiresAt) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
              <Clock className="w-3 h-3 text-slate-400" />
              No Expiry
            </span>
          );
        }
        const isExpired = new Date() > new Date(q.expiresAt);
        const isUrgent = !isExpired && (new Date(q.expiresAt).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;
        
        if (isExpired) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-red-50 text-red-600 border border-red-200">
              <AlertCircle className="w-3 h-3 text-red-500" />
              Expired
            </span>
          );
        }
        if (isUrgent) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
              <Clock className="w-3 h-3 text-amber-600" />
              Urgent (24h)
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Active
          </span>
        );
      }
    },
    { 
      key: "status", 
      header: "Status", 
      render: (q: any) => (
        <span className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-extrabold border uppercase tracking-wider",
          q.status === 'Published' 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-slate-100 text-slate-600 border-slate-200"
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            q.status === 'Published' ? "bg-emerald-500" : "bg-slate-400"
          )} />
          {q.status || "Draft"}
        </span>
      )
    },
    { 
      key: "actions", 
      header: "Actions", 
      render: (q: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleCopy(q)} 
            title="Copy Public Link" 
            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              const baseUrl = window.location.origin;
              const tokenPart = q.shareToken ? `?token=${q.shareToken}` : '';
              window.open(`${baseUrl}/quote/${q.slug || q.id}${tokenPart}`, '_blank');
            }} 
            title="Preview Proposal" 
            className="h-8 w-8 text-[#D4541A] hover:bg-orange-50 rounded-lg cursor-pointer transition-colors"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleExtend(q.id)} 
            title="Extend Validity (+48h)" 
            className="h-8 w-8 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/admin/quotations/${q.id}`)} 
            title="Edit Proposal" 
            className="h-8 w-8 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleDelete(q.id)} 
            className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors" 
            title="Delete Quote"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4541A]/10 to-orange-100 border border-[#D4541A]/20 text-[#D4541A] flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#0B1528] tracking-tight">Quotations & Dynamic Proposals</h1>
              <span className="text-[10px] font-extrabold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full uppercase">
                V4.0 Engine
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Create, customize, and track client-facing travel itineraries & price quotes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            className="h-10 px-3.5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold gap-1.5 cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button 
            onClick={() => navigate("/admin/quotations/new")} 
            className="h-10 px-5 rounded-xl font-extrabold text-xs bg-[#D4541A] hover:bg-[#c24813] text-white flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" /> Create Proposal
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Proposals</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0B1528] mt-2">{metrics.total}</p>
          <p className="text-[11px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">100%</span> active track
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Published Active</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{metrics.published}</p>
          <p className="text-[11px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
            Ready for client review
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Pipeline Value</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#D4541A] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#D4541A] mt-2">₹{metrics.totalVal.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            Cumulative quote total
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Quote Value</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">₹{metrics.avgValue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            Average per proposal
          </p>
        </div>
      </div>

      {/* Main Table Card with Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
            {[
              { id: "all", label: "All Proposals", count: metrics.total },
              { id: "published", label: "Published", count: metrics.published },
              { id: "draft", label: "Drafts", count: metrics.total - metrics.published },
              { id: "expired", label: "Expired", count: quotations.filter(q => q.expiresAt && new Date() > new Date(q.expiresAt)).length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === tab.id
                    ? "bg-white text-[#0B1528] shadow-2xs border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                  statusFilter === tab.id ? "bg-[#D4541A]/10 text-[#D4541A]" : "bg-slate-200 text-slate-600"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold text-slate-400">
            Showing {filteredQuotations.length} of {metrics.total} proposals
          </span>
        </div>

        {/* DataTable Container */}
        <DataTable
          columns={columns} 
          data={filteredQuotations} 
          loading={loading}
          searchKey="customerName" 
          searchPlaceholder="Search proposal by client name or destination..."
          emptyMessage="No quotations generated yet" 
          emptyIcon={<FileText className="h-10 w-10 text-slate-300" />}
          serverSide={true}
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          onSearchChange={handleSearchChange}
        />
      </div>
    </div>
  );
}

