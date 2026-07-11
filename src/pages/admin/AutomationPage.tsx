import React, { useState, useEffect } from "react";
import { 
  ClipboardList, Plus, Play, Trash2, Calendar, User, 
  RotateCw, RefreshCw, Layers, CheckCircle2, ChevronRight, Activity
} from "lucide-react";
import { erpService, RecurringTask } from "@/services/erp.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AutomationPage() {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>("All");

  // Create Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSchedule, setNewSchedule] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Custom'>('Weekly');
  const [newDept, setNewDept] = useState("Operations");
  const [newAssigned, setNewAssigned] = useState("");
  const [newDayOfWeek, setNewDayOfWeek] = useState("Monday");
  const [newDayOfMonth, setNewDayOfMonth] = useState(1);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const data = await erpService.getRecurringTasks();
      setTasks(data);
    } catch (err) {
      toast.error("Failed to load automation routines");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Task title is required");
      return;
    }
    try {
      const added = await erpService.createRecurringTask({
        title: newTitle,
        schedule: newSchedule,
        department: newDept,
        assignedTo: newAssigned,
        dayOfWeek: newSchedule === 'Weekly' ? newDayOfWeek : '',
        dayOfMonth: newSchedule === 'Monthly' ? newDayOfMonth : 1
      });
      setTasks(prev => [...prev, added]);
      setCreateOpen(false);
      setNewTitle("");
      setNewAssigned("");
      toast.success("Recurring automation routine configured!");
    } catch (err) {
      toast.error("Failed to configure routine");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const updated = await erpService.completeRecurringTask(id);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      toast.success(`Task marked complete! Next occurrence rolled to ${updated.nextOccurrence}`);
    } catch (err) {
      toast.error("Failed to complete task");
    }
  };

  const filteredTasks = selectedDept === "All" ? tasks : tasks.filter(t => t.department === selectedDept);

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-[#F4F7FB] min-h-screen -mx-6 -my-6">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ClipboardList className="w-5 h-5 text-[#F97316]" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Recurring Tasks & Automation</h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Configure schedules for department checks, content posts, and daily reporting routines</p>
          </div>
        </div>
        <Button 
          onClick={() => setCreateOpen(true)}
          className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-[4px] h-9 px-4 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Routine
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main List */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Controls */}
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 flex items-center justify-between shadow-xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Routines</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-450 font-bold">Filter Department:</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-8 rounded-[4px] border border-[#E2E8F0] text-xs font-semibold text-slate-650 bg-white px-2 focus-visible:ring-[#F97316]"
              >
                <option value="All">All Departments</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="People">People</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-[#E2E8F0]">
                    <th className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3 pl-6">Automation Routine</th>
                    <th className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">Schedule</th>
                    <th className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">Department</th>
                    <th className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">Assigned Owner</th>
                    <th className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">Next Action Date</th>
                    <th className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3">Status</th>
                    <th className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 py-3 pr-6 text-right">Execute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Schedules Ledger...</span>
                      </td>
                    </tr>
                  ) : filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 pl-6 font-bold text-xs text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-orange-50 border border-orange-100 rounded flex items-center justify-center">
                              <RotateCw className="w-3.5 h-3.5 text-[#F97316]" />
                            </div>
                            <span>{task.title}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-xs font-semibold text-slate-650">
                          <span className="flex items-center gap-1">
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200 px-2 py-0.5 rounded-[4px] text-[8px] uppercase tracking-wider font-extrabold">{task.schedule}</Badge>
                            {task.schedule === 'Weekly' && <span className="text-[10px] text-slate-500">on {task.dayOfWeek}</span>}
                            {task.schedule === 'Monthly' && <span className="text-[10px] text-slate-500">on Day {task.dayOfMonth}</span>}
                          </span>
                        </td>
                        <td className="py-3.5 text-xs font-semibold text-slate-600">{task.department}</td>
                        <td className="py-3.5 text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {task.assignedTo}
                          </span>
                        </td>
                        <td className="py-3.5 text-[11px] font-bold text-slate-700">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {task.nextOccurrence}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-2 py-0.5 font-bold uppercase text-[8px] tracking-wider rounded-[4px] border shadow-none">
                            {task.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 pr-6 text-right">
                          <Button 
                            onClick={() => handleComplete(task.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-[4px] h-7.5 px-3 font-bold text-[10px] flex items-center gap-1 ml-auto shadow-none transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done & Roll
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-xs text-slate-400 font-semibold">
                        No automated routines found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Sidebar Info Panel */}
        <div className="space-y-6">
          
          {/* Instructions Box */}
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <RefreshCw className="w-4 h-4 text-slate-400" /> Auto-Scheduler
            </h3>
            <div className="text-xs font-medium text-slate-500 space-y-2.5 leading-relaxed">
              <p>YouthCamping OS processes recurring checklists automatically.</p>
              <div className="p-3 bg-slate-50 border rounded text-[11px] font-semibold text-slate-650 space-y-1.5">
                <p>• **Done & Roll** will register the log audit record, notify subscribers, and advance the next check-in deadline.</p>
                <p>• Department managers get notified 24h prior to task schedule due dates.</p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Activity className="w-4 h-4 text-slate-400" /> Automation Trigger Log
            </h3>
            <div className="space-y-3">
              {[
                { name: "Suresh completed 'Vendor Payment Review'", time: "Today 10:12 AM" },
                { name: "Vidhi completed 'Post Instagram Reel'", time: "Yesterday 06:15 PM" },
                { name: "System rolled forward 'Review Hotel Rates'", time: "Monday 09:30 AM" }
              ].map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">{log.name}</p>
                    <span className="text-[9.5px] text-slate-400 font-bold uppercase">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Configure Routine Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[4px] border border-[#E2E8F0] p-5 bg-white shadow-xl">
          <DialogHeader className="border-b border-[#E2E8F0] pb-3">
            <DialogTitle className="font-bold uppercase tracking-tight text-sm flex items-center gap-2 text-slate-850">
              <ClipboardList className="w-4 h-4 text-[#F97316]" /> Configure Automation Routine
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-4 text-xs font-semibold text-slate-700">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Routine Title *</label>
              <Input 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Verify Camp Store Invoices"
                className="h-8.5 border-slate-200 focus-visible:ring-[#F97316]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Department</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full h-8.5 rounded-[4px] border border-slate-200 bg-white px-2 focus-visible:ring-[#F97316]"
                >
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="People">People</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Frequency</label>
                <select
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value as any)}
                  className="w-full h-8.5 rounded-[4px] border border-slate-200 bg-white px-2 focus-visible:ring-[#F97316]"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Assigned Owner</label>
                <Input 
                  value={newAssigned}
                  onChange={(e) => setNewAssigned(e.target.value)}
                  placeholder="e.g. Suresh Bhai"
                  className="h-8.5 border-slate-200 focus-visible:ring-[#F97316]"
                />
              </div>
              
              {newSchedule === 'Weekly' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Run Day</label>
                  <select
                    value={newDayOfWeek}
                    onChange={(e) => setNewDayOfWeek(e.target.value)}
                    className="w-full h-8.5 rounded-[4px] border border-slate-200 bg-white px-2 focus-visible:ring-[#F97316]"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
              )}

              {newSchedule === 'Monthly' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Run Day of Month</label>
                  <Input 
                    type="number"
                    min={1}
                    max={28}
                    value={newDayOfMonth}
                    onChange={(e) => setNewDayOfMonth(Number(e.target.value))}
                    className="h-8.5 border-slate-200 focus-visible:ring-[#F97316]"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-[#E2E8F0] gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCreateOpen(false)}
                className="h-8.5 font-semibold text-xs border-slate-200 rounded-[4px]"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#F97316] hover:bg-[#EA580C] text-white h-8.5 font-semibold text-xs rounded-[4px] px-4"
              >
                Save Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
