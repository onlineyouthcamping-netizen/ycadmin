import { useEffect, useState, useCallback, useMemo } from "react";
import { quotationsService } from "@/services/quotations.service";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, FileText, Calendar, User, MapPin, Share2, Clock, Copy, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
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
    return { total, published, totalVal };
  }, [quotations, totalCount]);

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
    toast.success("Public quote link copied!");
  };

  const columns = [
    { 
      key: "customerName", 
      header: "Client Details", 
      render: (q: any) => {
        const firstLetter = (q.customerName || "C").charAt(0).toUpperCase();
        return (
          <div className="flex items-center gap-3.5 min-w-[200px]">
            <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-200/80 text-[#D4541A] font-black text-sm flex items-center justify-center shrink-0">
              {firstLetter}
            </div>
            <div>
              <p className="font-extrabold text-[#0B1528] text-xs leading-tight">{q.customerName || "Untitled Client"}</p>
              <p className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                 <Calendar className="h-3 w-3 text-slate-400" /> 
                 {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "Recent"}
              </p>
            </div>
          </div>
        );
      }
    },
    { 
      key: "destination", 
      header: "Destination", 
      render: (q: any) => (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100/80 border border-slate-200/60 px-2.5 py-1 rounded-lg w-fit whitespace-nowrap">
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
          <span className="font-extrabold text-xs text-[#0B1528]">₹{Number(q.finalPrice || 0).toLocaleString()}</span>
          {q.discount > 0 && <span className="text-[10px] text-emerald-600 font-bold block">Saved ₹{Number(q.discount).toLocaleString()}</span>}
        </div>
      )
    },
    { 
      key: "validity", 
      header: "Validity Status", 
      render: (q: any) => {
        if (!q.expiresAt) {
          return (
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
              No Expiry
            </span>
          );
        }
        const isExpired = new Date() > new Date(q.expiresAt);
        const isUrgent = !isExpired && (new Date(q.expiresAt).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000;
        
        if (isExpired) {
          return (
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-red-50 text-red-600 border border-red-200">
              Expired
            </span>
          );
        }
        if (isUrgent) {
          return (
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
              Urgent (24h)
            </span>
          );
        }
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
          "px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border uppercase tracking-wider",
          q.status === 'Published' 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-slate-100 text-slate-600 border-slate-200"
        )}>
          {q.status || "Draft"}
        </span>
      )
    },
    { 
      key: "actions", 
      header: "Actions", 
      render: (q: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => handleCopy(q)} title="Copy Public Link" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            const baseUrl = window.location.origin;
            const tokenPart = q.shareToken ? `?token=${q.shareToken}` : '';
            window.open(`${baseUrl}/quote/${q.slug || q.id}${tokenPart}`, '_blank');
          }} title="Preview Quote" className="h-8 w-8 text-[#D4541A] hover:bg-orange-50 rounded-lg cursor-pointer">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleExtend(q.id)} title="Extend Validity (+48h)" className="h-8 w-8 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer">
            <Clock className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/quotations/${q.id}`)} title="Edit Proposal" className="h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer" title="Delete Quote">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6 p-6 sm:p-8 bg-slate-50/50 min-h-screen font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D4541A] flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0B1528] tracking-tight">Quotations & Dynamic Proposals</h1>
            <p className="text-xs font-semibold text-slate-500">Create, customize, and track client-facing travel itineraries & price quotes</p>
          </div>
        </div>

        <Button 
          onClick={() => navigate("/admin/quotations/new")} 
          className="h-10 px-5 rounded-xl font-extrabold text-xs bg-[#D4541A] hover:bg-[#c24813] text-white flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" /> Create Proposal
        </Button>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Proposals</p>
          <p className="text-2xl font-black text-[#0B1528] mt-1">{metrics.total}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Published Active</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.published}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Pipeline Value</p>
          <p className="text-2xl font-black text-[#D4541A] mt-1">₹{metrics.totalVal.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
        <DataTable
          columns={columns} 
          data={quotations} 
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
