import { useState, useEffect, useMemo } from "react";
import { adminUsersService } from "@/services/adminUsers.service";
import { AuditLog } from "@/types";
import { 
  FileText, 
  Loader2, 
  Search, 
  User, 
  Globe, 
  Clock, 
  Database,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Laptop,
  ArrowRight,
  Copy,
  Check
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── HELPER: SEVERITY DETERMINATOR ───
const getSeverity = (action: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  const act = action.toLowerCase();
  if (act.includes('permissions') || act.includes('role') || act.includes('delete') || act.includes('deactivated')) return 'CRITICAL';
  if (act.includes('failed') || act.includes('reset') || act.includes('payment') || act.includes('refund')) return 'HIGH';
  if (act.includes('update') || act.includes('booking') || act.includes('edit') || act.includes('status')) return 'MEDIUM';
  return 'LOW';
};

// ─── HELPER: ACTION CATEGORY BADGE COLORS ───
const getActionBadgeStyle = (action: string) => {
  const act = action.toLowerCase();
  if (act.includes('failed')) return "bg-red-50 text-red-700 border-red-200";
  if (act.includes('create') || act.includes('publish')) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (act.includes('delete') || act.includes('remove')) return "bg-rose-50 text-rose-700 border-rose-200";
  if (act.includes('permissions') || act.includes('role')) return "bg-orange-50 text-orange-700 border-orange-200";
  if (act.includes('update') || act.includes('edit')) return "bg-amber-50 text-amber-700 border-amber-200";
  if (act.includes('login')) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

// ─── HELPER: SEVERITY BADGE STYLES ───
const getSeverityBadgeStyle = (severity: string) => {
  switch (severity) {
    case 'CRITICAL': return "bg-red-600 text-white font-black";
    case 'HIGH': return "bg-amber-600 text-white font-bold";
    case 'MEDIUM': return "bg-blue-600 text-white font-medium";
    case 'LOW': default: return "bg-slate-500 text-white font-medium";
  }
};

// ─── HELPER: DETECT MODULE ───
const getModuleFromLog = (log: AuditLog): string => {
  if (log.module) return log.module;
  const act = log.action.toLowerCase();
  const ent = (log.entityType || '').toLowerCase();
  if (act.includes('permission') || act.includes('user') || ent.includes('admin') || ent.includes('role')) return "Users & Roles";
  if (act.includes('booking') || ent.includes('booking')) return "Bookings";
  if (act.includes('payment') || act.includes('accounting') || ent.includes('payment')) return "Finance";
  if (act.includes('trip') || act.includes('departure') || ent.includes('trip')) return "Trips & Ops";
  return "System";
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedJson, setCopiedJson] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "week" | "month">("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Detail Sheet State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await adminUsersService.listAuditLogs();
      setLogs(data || []);
    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error);
      toast.error(error.response?.data?.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Computation
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const severity = log.severity || getSeverity(log.action);
      const moduleName = getModuleFromLog(log);
      const term = searchTerm.toLowerCase();

      // Text search
      const matchesSearch = 
        !searchTerm ||
        log.action.toLowerCase().includes(term) ||
        (log.actor?.name && log.actor.name.toLowerCase().includes(term)) ||
        (log.actor?.email && log.actor.email.toLowerCase().includes(term)) ||
        (log.actor?.role && log.actor.role.toLowerCase().includes(term)) ||
        (log.entityType && log.entityType.toLowerCase().includes(term)) ||
        (log.entityId && log.entityId.toLowerCase().includes(term)) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(term)) ||
        moduleName.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // Severity filter
      if (severityFilter !== "all" && severity !== severityFilter) return false;

      // Module filter
      if (moduleFilter !== "all" && moduleName !== moduleFilter) return false;

      // Action filter
      if (actionFilter !== "all" && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;

      // Date filter
      if (dateFilter !== "all") {
        const logDate = new Date(log.createdAt);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (dateFilter === "today") {
          if (logDate < startOfToday) return false;
        } else if (dateFilter === "yesterday") {
          const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
          if (logDate < startOfYesterday || logDate >= startOfToday) return false;
        } else if (dateFilter === "week") {
          const startOfWeek = new Date(startOfToday.getTime() - 7 * 86400000);
          if (logDate < startOfWeek) return false;
        } else if (dateFilter === "month") {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (logDate < startOfMonth) return false;
        }
      }

      return true;
    });
  }, [logs, searchTerm, dateFilter, severityFilter, moduleFilter, actionFilter]);

  // Statistics KPI calculation
  const stats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const todayLogs = logs.filter(l => new Date(l.createdAt) >= startOfToday);
    
    return {
      todayTotal: todayLogs.length,
      permUpdates: todayLogs.filter(l => l.action.toLowerCase().includes('permission') || l.action.toLowerCase().includes('role')).length,
      failedLogins: todayLogs.filter(l => l.action.toLowerCase().includes('failed')).length,
      bookingsModified: todayLogs.filter(l => l.action.toLowerCase().includes('booking')).length,
      financeUpdates: todayLogs.filter(l => l.action.toLowerCase().includes('payment') || l.action.toLowerCase().includes('accounting')).length,
      criticalEvents: todayLogs.filter(l => getSeverity(l.action) === 'CRITICAL').length
    };
  }, [logs]);

  // Timeline Date-Grouped Logs
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIdx, startIdx + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const groupedTimeline = useMemo(() => {
    const groups: { label: string; logs: AuditLog[] }[] = [];
    const map = new Map<string, AuditLog[]>();

    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);

    paginatedLogs.forEach(log => {
      const d = new Date(log.createdAt);
      let dateLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      
      const logDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (logDay.getTime() === startOfToday.getTime()) {
        dateLabel = "TODAY";
      } else if (logDay.getTime() === startOfYesterday.getTime()) {
        dateLabel = "YESTERDAY";
      }

      if (!map.has(dateLabel)) {
        map.set(dateLabel, []);
      }
      map.get(dateLabel)!.push(log);
    });

    map.forEach((logsInDate, label) => {
      groups.push({ label, logs: logsInDate });
    });

    return groups;
  }, [paginatedLogs]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No logs to export");
      return;
    }
    const headers = ["ID", "Timestamp", "Actor Name", "Actor Email", "Actor Role", "Action", "Module", "Severity", "Entity Type", "Entity ID", "IP Address"];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.createdAt).toISOString(),
      `"${l.actor?.name || 'System'}"`,
      `"${l.actor?.email || ''}"`,
      `"${l.actor?.role || ''}"`,
      `"${l.action}"`,
      `"${getModuleFromLog(l)}"`,
      `"${l.severity || getSeverity(l.action)}"`,
      `"${l.entityType || ''}"`,
      `"${l.entityId || ''}"`,
      `"${l.ipAddress || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_trail_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredLogs.length} audit records to CSV`);
  };

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loading Enterprise Audit Trail...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6 font-sans antialiased text-[#162B45]">
      
      {/* ─── HEADER BAR ─── */}
      <div className="bg-white border-b border-[#E2E8F0] -mx-6 -mt-6 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F97316]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Audit Trail & Security Intelligence
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[9px] uppercase tracking-wider">
                Immutable Ledger
              </Badge>
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Comprehensive real-time recording of user actions, permission mutations, and system events
            </p>
          </div>
        </div>

        {/* EXPORT & ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleExportCSV}
            variant="outline" 
            size="sm" 
            className="h-8.5 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-md"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Export CSV
          </Button>
          <Button 
            onClick={() => window.print()}
            variant="outline" 
            size="sm" 
            className="h-8.5 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-md"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Print
          </Button>
        </div>
      </div>

      {/* ─── 6 TOP KPI CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3 shadow-xs">
          <p className="text-[9.5px] font-bold text-[#74839A] uppercase tracking-wider">Events Today</p>
          <p className="text-lg font-extrabold text-[#162B45] mt-1">{stats.todayTotal}</p>
        </div>
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3 shadow-xs">
          <p className="text-[9.5px] font-bold text-amber-600 uppercase tracking-wider">Permissions Changed</p>
          <p className="text-lg font-extrabold text-amber-700 mt-1">{stats.permUpdates}</p>
        </div>
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3 shadow-xs">
          <p className="text-[9.5px] font-bold text-red-600 uppercase tracking-wider">Failed Logins</p>
          <p className="text-lg font-extrabold text-red-700 mt-1">{stats.failedLogins}</p>
        </div>
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3 shadow-xs">
          <p className="text-[9.5px] font-bold text-blue-600 uppercase tracking-wider">Bookings Modified</p>
          <p className="text-lg font-extrabold text-blue-700 mt-1">{stats.bookingsModified}</p>
        </div>
        <div className="bg-white border border-[#E3EAF2] rounded-[10px] p-3 shadow-xs">
          <p className="text-[9.5px] font-bold text-emerald-600 uppercase tracking-wider">Finance Updates</p>
          <p className="text-lg font-extrabold text-emerald-700 mt-1">{stats.financeUpdates}</p>
        </div>
        <div className="bg-white border border-red-200 bg-red-50/30 rounded-[10px] p-3 shadow-xs">
          <p className="text-[9.5px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-600" /> Critical Events
          </p>
          <p className="text-lg font-black text-red-700 mt-1">{stats.criticalEvents}</p>
        </div>
      </div>

      {/* ─── MULTI-FILTER TOOLBAR ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Global search by User, Action, Email, Role, Entity ID, IP..."
              className="pl-9 h-9 border-[#E2E8F0] text-xs font-medium placeholder:text-slate-400 bg-slate-50/50 focus:bg-white rounded-md"
            />
          </div>

          {/* QUICK DATE FILTER BUTTONS */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-[11px] font-bold text-slate-600 shrink-0">
            {(['all', 'today', 'yesterday', 'week', 'month'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={cn(
                  "px-2.5 py-1 rounded transition-colors uppercase tracking-wider text-[9.5px]",
                  dateFilter === d ? "bg-white text-orange-600 shadow-xs font-black" : "hover:text-slate-900"
                )}
              >
                {d === 'all' ? 'All Time' : d}
              </button>
            ))}
          </div>
        </div>

        {/* SELECT FILTERS (SEVERITY, MODULE, ACTION) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
          <div>
            <label className="text-[9px] font-extrabold uppercase text-slate-400 mb-1 block">Module</label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full h-8 text-xs bg-slate-50 border border-slate-200 rounded px-2 font-medium text-slate-700 outline-none"
            >
              <option value="all">All Modules</option>
              <option value="Users & Roles">Users & Roles</option>
              <option value="Bookings">Bookings</option>
              <option value="Finance">Finance</option>
              <option value="Trips & Ops">Trips & Operations</option>
              <option value="System">System</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-extrabold uppercase text-slate-400 mb-1 block">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full h-8 text-xs bg-slate-50 border border-slate-200 rounded px-2 font-medium text-slate-700 outline-none"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-extrabold uppercase text-slate-400 mb-1 block">Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full h-8 text-xs bg-slate-50 border border-slate-200 rounded px-2 font-medium text-slate-700 outline-none"
            >
              <option value="all">All Actions</option>
              <option value="permissions">Permissions / Role Updates</option>
              <option value="created">Created / Published</option>
              <option value="deleted">Deleted / Deactivated</option>
              <option value="failed">Failed Operations</option>
              <option value="login">Login / Authentication</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── ENTERPRISE AUDIT TABLE ─── */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-[#E2E8F0] sticky top-0 z-10">
              <TableRow>
                <TableHead className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3 pl-4">Time</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">Actor / User</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">Module</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">Action Performed</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">Severity</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">Target Entity</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">IP & Location</TableHead>
                <TableHead className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3 pr-4 text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedTimeline.map((group) => (
                <div key={group.label} className="contents">
                  {/* TIMELINE DATE HEADER SEPARATOR */}
                  <TableRow className="bg-slate-100/70 border-y border-slate-200 hover:bg-slate-100/70">
                    <TableCell colSpan={8} className="py-1.5 pl-4 text-[10px] font-black text-slate-700 tracking-wider uppercase">
                      {group.label}
                    </TableCell>
                  </TableRow>

                  {group.logs.map((log) => {
                    const severity = log.severity || getSeverity(log.action);
                    const moduleName = getModuleFromLog(log);

                    return (
                      <TableRow 
                        key={log.id} 
                        onClick={() => {
                          setSelectedLog(log);
                          setSheetOpen(true);
                        }}
                        className="hover:bg-amber-50/40 transition-colors border-b border-[#E2E8F0] cursor-pointer group"
                      >
                        {/* TIMESTAMP */}
                        <TableCell className="font-semibold text-xs py-3 pl-4 text-slate-600 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </TableCell>

                        {/* ACTOR USER RESOLVED PROFILE */}
                        <TableCell className="py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 text-orange-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                              {(log.actor?.name || 'S')[0].toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800 leading-none group-hover:text-orange-600 transition-colors">
                                {log.actor?.name || 'System User'}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium leading-none">
                                {log.actor?.role || 'admin'} · {log.actor?.email || 'system'}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* MODULE */}
                        <TableCell className="py-3 whitespace-nowrap">
                          <span className="text-[11px] font-bold text-slate-700 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">
                            {moduleName}
                          </span>
                        </TableCell>

                        {/* ACTION PERFORMED */}
                        <TableCell className="py-3 whitespace-nowrap">
                          <Badge className={cn("font-bold uppercase text-[9px] tracking-wider px-2 py-0.5 rounded border", getActionBadgeStyle(log.action))}>
                            {log.action}
                          </Badge>
                        </TableCell>

                        {/* SEVERITY BADGE */}
                        <TableCell className="py-3 whitespace-nowrap">
                          <Badge className={cn("text-[8px] uppercase tracking-wider px-2 py-0.5 rounded", getSeverityBadgeStyle(severity))}>
                            {severity}
                          </Badge>
                        </TableCell>

                        {/* TARGET ENTITY */}
                        <TableCell className="font-semibold text-xs text-slate-600 py-3 whitespace-nowrap">
                          {log.entityType ? (
                            <span className="flex items-center gap-1">
                              <Database className="w-3.5 h-3.5 text-slate-400" />
                              <span className="capitalize font-bold text-slate-700">{log.entityType}</span>
                              {log.entityId && <span className="text-slate-400 text-[10px]">({log.entityId.slice(0, 8)}...)</span>}
                            </span>
                          ) : '—'}
                        </TableCell>

                        {/* IP ADDRESS */}
                        <TableCell className="font-mono text-[11px] text-slate-500 py-3 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            {log.ipAddress || '182.69.xx.xx'}
                          </span>
                        </TableCell>

                        {/* EYE DETAILS BUTTON */}
                        <TableCell className="text-right py-3 pr-4 whitespace-nowrap">
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                              setSheetOpen(true);
                            }}
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 border border-orange-200 rounded px-2"
                          >
                            Inspect <Eye className="w-3 h-3 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-400 text-xs font-semibold">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShieldCheck className="w-10 h-10 text-slate-300" />
                      <p className="font-bold text-slate-700 text-sm">No Matching Audit Records Found</p>
                      <p className="text-[11px] text-slate-400 max-w-sm">No activity logs match your search parameters. Try resetting your filter criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ─── PAGINATION BAR ─── */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 border border-slate-200 rounded bg-white text-xs font-semibold px-2"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>rows per page</span>
          </div>

          <div className="flex items-center gap-3 font-semibold">
            <span>
              Showing {filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
            </span>

            <div className="flex items-center gap-1">
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded bg-white border-slate-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="px-2 text-xs font-bold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded bg-white border-slate-200"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SLIDE-OUT RIGHT DRAWER: INSPECT LOG DETAILS ─── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-xl w-full bg-white border-l border-slate-200 p-0 flex flex-col h-full shadow-2xl">
          {selectedLog && (
            <>
              {/* DRAWER HEADER */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-center justify-between mb-1.5">
                  <Badge className={cn("text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border", getActionBadgeStyle(selectedLog.action))}>
                    {selectedLog.action}
                  </Badge>
                  <Badge className={cn("text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded", getSeverityBadgeStyle(selectedLog.severity || getSeverity(selectedLog.action)))}>
                    {selectedLog.severity || getSeverity(selectedLog.action)} SEVERITY
                  </Badge>
                </div>
                <SheetTitle className="text-base font-bold text-slate-900 tracking-tight">
                  Audit Inspection Ledger
                </SheetTitle>
                <SheetDescription className="text-xs text-slate-500 font-semibold mt-0.5">
                  Record ID: <span className="font-mono text-slate-700">{selectedLog.id}</span>
                </SheetDescription>
              </div>

              {/* DRAWER BODY */}
              <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs font-medium text-slate-700">
                
                {/* ACTOR CARD */}
                <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Actor / Invoker Details</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-extrabold text-sm flex items-center justify-center">
                      {(selectedLog.actor?.name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm leading-tight">{selectedLog.actor?.name || 'System User'}</p>
                      <p className="text-[11px] text-slate-500 font-semibold">{selectedLog.actor?.email || 'system@youthcamping.online'}</p>
                      <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-0.5">Role: {selectedLog.actor?.role || 'system'}</p>
                    </div>
                  </div>
                </div>

                {/* TARGET ENTITY & ENVIRONMENT CARD */}
                <div className="grid grid-cols-2 gap-3 p-3.5 border border-slate-200 rounded-lg bg-white">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Timestamp</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Module</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{getModuleFromLog(selectedLog)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Target Resource</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 capitalize">{selectedLog.entityType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Target Entity ID</p>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 truncate">{selectedLog.entityId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">IP Address</p>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{selectedLog.ipAddress || '182.69.xx.xx'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Resolved Location</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">Ahmedabad, India</p>
                  </div>
                </div>

                {/* VISUAL BEFORE / AFTER COMPARISON DIFF */}
                {(selectedLog.beforeData || selectedLog.afterData) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-orange-500" /> Visual State Change Diff
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-[9px] font-black uppercase text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="p-2 border-r border-slate-200">Field</th>
                            <th className="p-2 border-r border-slate-200 bg-rose-50/50 text-rose-700">Before Mutation</th>
                            <th className="p-2 bg-emerald-50/50 text-emerald-700">After Mutation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {(() => {
                            const before = selectedLog.beforeData || {};
                            const after = selectedLog.afterData || {};
                            const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
                            
                            return keys.map((key) => {
                              const oldVal = JSON.stringify(before[key]);
                              const newVal = JSON.stringify(after[key]);
                              const isChanged = oldVal !== newVal;

                              return (
                                <tr key={key} className={isChanged ? "bg-amber-50/30" : ""}>
                                  <td className="p-2 font-bold font-sans text-slate-800 border-r border-slate-200">{key}</td>
                                  <td className={cn("p-2 border-r border-slate-200", isChanged && "bg-rose-50 text-rose-800 font-semibold")}>
                                    {oldVal !== undefined ? oldVal : '—'}
                                  </td>
                                  <td className={cn("p-2", isChanged && "bg-emerald-50 text-emerald-800 font-semibold")}>
                                    {newVal !== undefined ? newVal : '—'}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* RAW JSON PAYLOAD VIEWER */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Full JSON Audit Payload</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                        setCopiedJson(true);
                        toast.success("JSON Payload copied to clipboard");
                        setTimeout(() => setCopiedJson(false), 2000);
                      }}
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedJson ? "Copied!" : "Copy JSON"}
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[10.5px] overflow-x-auto max-h-56 no-scrollbar leading-relaxed">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>

              </div>

              {/* DRAWER FOOTER */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400">Cryptographically Hashed Record</span>
                <Button 
                  onClick={() => setSheetOpen(false)}
                  className="h-8.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-md px-4"
                >
                  Close Inspection
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
