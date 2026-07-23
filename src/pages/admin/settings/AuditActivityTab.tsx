import React, { useState, useEffect } from "react";
import { ShieldAlert, Download, RefreshCw, Filter, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityLogItem, settingsService } from "@/services/settings.service";
import { toast } from "sonner";

export function AuditActivityTab() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, limit, statusFilter]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await settingsService.getActivityLogs({
        page,
        limit,
        status: statusFilter === "all" ? undefined : statusFilter
      });
      setLogs(res.logs);
      setTotalCount(res.totalCount);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      await settingsService.exportAuditCSV();
      toast.success("Audit CSV downloaded!");
    } catch (e) {
      toast.error("Failed to export audit CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">System Activity & Audit Trail</h3>
              <p className="text-[11px] text-slate-500">Read-only event log of user logins, role changes, and booking actions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs w-32 border-slate-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              className="h-8 text-xs font-semibold border-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Refresh
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="h-8 text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Resource</th>
                <th className="py-2.5 px-4">Details</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 text-slate-500 font-medium text-[11px]">
                    {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-semibold">
                    {log.resource}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {log.details}
                  </td>
                  <td className="py-3 px-4">
                    {log.status === "success" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>Showing page {page} of {Math.ceil(totalCount / limit) || 1} ({totalCount} total events)</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-7 text-xs border-slate-300"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page * limit >= totalCount}
              onClick={() => setPage(page + 1)}
              className="h-7 text-xs border-slate-300"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
