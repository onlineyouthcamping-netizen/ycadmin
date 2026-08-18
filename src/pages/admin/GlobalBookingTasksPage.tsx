import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  ArrowUpRight,
  Filter
} from "lucide-react";
import { bookingsService } from "@/services/bookings.service";
import { useStaffUsers } from "@/hooks/useStaffUsers";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function GlobalBookingTasksPage() {
  const { staffUsers } = useStaffUsers();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await bookingsService.getAllBookingTasks({
        status: statusFilter,
        assignee: assigneeFilter,
      });
      setTasks(data || []);
    } catch (e) {
      toast.error("Failed to fetch global booking tasks");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, assigneeFilter]);

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.booking?.bookingId?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Booking Tasks</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage and track all tasks assigned across all bookings.
          </p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by task title or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-9 text-xs font-semibold rounded-md border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs font-semibold rounded-md border border-slate-200 bg-white focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="h-9 px-3 text-xs font-semibold rounded-md border border-slate-200 bg-white focus:outline-none focus:border-primary max-w-[150px]"
          >
            <option value="ALL">All Assignees</option>
            {staffUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Task Details</th>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                    Loading tasks...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{t.title}</div>
                      {t.description && (
                        <div className="text-[10px] text-slate-500 max-w-[250px] truncate mt-0.5">
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/bookings?id=${t.booking?.id}&tab=tasks`}
                        className="font-bold text-primary hover:underline"
                      >
                        {t.booking?.bookingId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700">{t.assignedTo?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {t.dueDate ? (
                        <span className="text-slate-600">
                          {format(new Date(t.dueDate), "MMM dd, yyyy")}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1",
                          t.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700"
                            : t.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {t.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                        {t.status !== "COMPLETED" && <Clock className="w-3 h-3" />}
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/bookings?id=${t.booking?.id}&tab=tasks`}
                        className="inline-flex items-center justify-center h-7 px-3 text-[10px] font-bold uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                      >
                        View <ArrowUpRight className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
