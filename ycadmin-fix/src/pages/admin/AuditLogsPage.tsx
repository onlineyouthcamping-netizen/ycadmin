import { useState, useEffect } from "react";
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
  ArrowRight,
  Eye
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await adminUsersService.listAuditLogs();
      setLogs(data);
    } catch (error: any) {
      console.error("Failed to fetch audit logs:", error);
      toast.error(error.response?.data?.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.actorUserId && log.actorUserId.toLowerCase().includes(term)) ||
      (log.entityType && log.entityType.toLowerCase().includes(term)) ||
      (log.entityId && log.entityId.toLowerCase().includes(term)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(term))
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("failed")) return "bg-rose-500 hover:bg-rose-600";
    if (action.includes("created") || action.includes("publish")) return "bg-emerald-500 hover:bg-emerald-600";
    if (action.includes("delete") || action.includes("deactivated")) return "bg-red-500 hover:bg-red-600";
    if (action.includes("change") || action.includes("reset") || action.includes("update")) return "bg-amber-500 hover:bg-amber-600";
    return "bg-slate-500 hover:bg-slate-600";
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground font-medium text-sm">Real-time recording of admin actions, security alterations and mutations.</p>
        </div>
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail..."
            className="rounded-xl pl-10 border-2 h-11"
          />
        </div>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[32px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b-2">
              <TableRow>
                <TableHead className="font-black uppercase tracking-wider text-[11px] py-4 pl-6 text-slate-900">Timestamp</TableHead>
                <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-900">Actor</TableHead>
                <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-900">Action performed</TableHead>
                <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-900">Target Entity</TableHead>
                <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-900">IP Address</TableHead>
                <TableHead className="font-black uppercase tracking-wider text-[11px] pr-6 text-right text-slate-900">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors border-b">
                  <TableCell className="font-semibold text-xs py-4 pl-6 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.actorUserId || 'System'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getActionBadgeColor(log.action)} text-white font-black uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-full`}>
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-600">
                    {log.entityType ? (
                      <span className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-slate-400" />
                        <span className="capitalize">{log.entityType}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-[10px] text-muted-foreground">{log.entityId || 'N/A'}</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-600 font-mono">
                    {log.ipAddress ? (
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        {log.ipAddress}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setSelectedLog(log);
                        setDetailsOpen(true);
                      }}
                      className="rounded-lg h-8 w-8 hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <FileText className="w-12 h-12 text-muted-foreground/30" />
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No audit logs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Details View Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-2 p-6 bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Audit Record Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-semibold">
              Action performed: <span className="font-bold text-slate-900">{selectedLog?.action}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-4 text-sm font-medium">
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Log ID</p>
                  <p className="font-mono text-xs text-slate-800">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Timestamp</p>
                  <p className="text-xs text-slate-800">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Actor ID</p>
                  <p className="font-mono text-xs text-slate-800">{selectedLog.actorUserId || 'System'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">IP Address</p>
                  <p className="font-mono text-xs text-slate-800">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.entityType && (
                <div className="border-b pb-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Target Resource</p>
                  <p className="text-xs text-slate-800 flex items-center gap-1">
                    <span className="font-bold capitalize">{selectedLog.entityType}</span>
                    <span className="text-slate-400">({selectedLog.entityId})</span>
                  </p>
                </div>
              )}

              {selectedLog.beforeData && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">State Before Mutation</p>
                  <pre className="bg-slate-50 border-2 rounded-2xl p-4 font-mono text-[10px] overflow-x-auto text-slate-700 max-h-48">
                    {JSON.stringify(selectedLog.beforeData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.afterData && (
                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">State After Mutation</p>
                  <pre className="bg-slate-50 border-2 rounded-2xl p-4 font-mono text-[10px] overflow-x-auto text-slate-700 max-h-48">
                    {JSON.stringify(selectedLog.afterData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button onClick={() => {
              setDetailsOpen(false);
              setSelectedLog(null);
            }} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12 w-full">
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
