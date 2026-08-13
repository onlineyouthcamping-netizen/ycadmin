import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Trash2,
  Play,
  Copy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { sopsService, SopTemplate, SopVersion, SopTaskTemplate } from "@/services/sops.service";
import { useStaffUsers } from "@/hooks/useStaffUsers";

const STAGES = [
  { id: "ALL", label: "All Stages" },
  { id: "PRE_TRIP_30D", label: "PRE-TRIP 30D" },
  { id: "PRE_TRIP_21D", label: "PRE-TRIP 21D" },
  { id: "PRE_TRIP_14D", label: "PRE-TRIP 14D" },
  { id: "PRE_TRIP_7D", label: "PRE-TRIP 7D" },
  { id: "PRE_TRIP_3D", label: "PRE-TRIP 3D" },
  { id: "PRE_TRIP_1D", label: "PRE-TRIP 1D" },
  { id: "DEPARTURE_DAY", label: "DEPARTURE DAY" },
  { id: "DURING_TRIP", label: "DURING TRIP" },
  { id: "POST_TRIP", label: "POST TRIP" },
];

export default function SopBuilderPage() {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");
  const navigate = useNavigate();
  const { staffUsers } = useStaffUsers();

  const [template, setTemplate] = useState<SopTemplate | null>(null);
  const [activeVersion, setActiveVersion] = useState<SopVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState("ALL");

  // Add/Edit Task Modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SopTaskTemplate | null>(null);
  const [taskForm, setTaskForm] = useState({
    taskName: "",
    description: "",
    stage: "PRE_TRIP_7D",
    relativeOffset: -7,
    priority: "MEDIUM",
    isRequired: true,
    defaultAssignee: "Hemal Patel",
    instructions: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [sampleDepartureDate, setSampleDepartureDate] = useState("2026-08-20");
  const [previewSchedule, setPreviewSchedule] = useState<any[]>([]);

  const loadData = async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const tmplRes = await sopsService.getSopTemplates();
      const found = tmplRes.find((t) => t.id === templateId);
      if (found) {
        setTemplate(found);
        const ver =
          found.versions.find((v) => v.id === found.activeVersionId) ||
          found.versions[0];
        setActiveVersion(ver);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load SOP builder");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [templateId]);

  const handleOpenAddTask = () => {
    setEditingTask(null);
    setTaskForm({
      taskName: "",
      description: "",
      stage: activeStage !== "ALL" ? activeStage : "PRE_TRIP_7D",
      relativeOffset: -7,
      priority: "MEDIUM",
      isRequired: true,
      defaultAssignee: "Hemal Patel",
      instructions: "",
    });
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (t: SopTaskTemplate) => {
    setEditingTask(t);
    setTaskForm({
      taskName: t.taskName,
      description: t.description || "",
      stage: t.stage,
      relativeOffset: t.relativeOffset,
      priority: t.priority,
      isRequired: t.isRequired,
      defaultAssignee: t.defaultAssignee || "Hemal Patel",
      instructions: t.instructions || "",
    });
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVersion) return;
    setIsSubmitting(true);
    try {
      if (editingTask) {
        await sopsService.updateTaskTemplate(editingTask.id, taskForm);
        toast.success("SOP Task Template updated!");
      } else {
        await sopsService.createTaskTemplate(activeVersion.id, taskForm);
        toast.success("SOP Task Template created!");
      }
      setTaskModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save task template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this SOP task template?")) return;
    try {
      await sopsService.deleteTaskTemplate(taskId);
      toast.success("Task deleted");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };

  const handlePreviewSchedule = async () => {
    if (!activeVersion || !sampleDepartureDate) return;
    try {
      const schedule = await sopsService.previewSopSchedule(
        activeVersion.id,
        sampleDepartureDate,
      );
      setPreviewSchedule(schedule);
      setPreviewModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to preview schedule");
    }
  };

  const handleCreateNewVersion = async () => {
    if (!template || !activeVersion) return;
    try {
      const newVer = await sopsService.createSopVersion(
        template.id,
        activeVersion.id,
      );
      toast.success(`Created draft Version ${newVer.versionLabel}`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create version");
    }
  };

  const handleActivateVersion = async (verId: string) => {
    try {
      await sopsService.activateSopVersion(verId);
      toast.success("SOP version activated successfully!");
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to activate version");
    }
  };

  const filteredTasks = (activeVersion?.taskTemplates || []).filter(
    (t) => activeStage === "ALL" || t.stage === activeStage,
  );

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading SOP Builder...</div>;
  }

  if (!template || !activeVersion) {
    return <div className="p-8 text-center text-slate-500">SOP Template not found.</div>;
  }

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      {/* Top Navigation & Title Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/operations/sops")}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to SOP Library
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              {activeVersion.status} ({activeVersion.versionLabel})
            </span>

            <Button
              onClick={handleCreateNewVersion}
              variant="outline"
              className="h-8 text-xs font-semibold text-slate-700"
            >
              <Copy className="w-3.5 h-3.5 mr-1" />
              Duplicate / New Version
            </Button>

            <Button
              onClick={handlePreviewSchedule}
              variant="outline"
              className="h-8 text-xs font-semibold text-[#F97316] border-orange-200 hover:bg-orange-50"
            >
              <Calendar className="w-3.5 h-3.5 mr-1" />
              Preview Date Engine
            </Button>

            <Button
              onClick={handleOpenAddTask}
              className="h-8 text-xs font-bold bg-[#F97316] hover:bg-[#EA580C] text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Task
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-100 rounded-lg text-[#F97316]">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {template.name}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Trip Type: <strong className="text-slate-800">{template.trip?.title}</strong> • Total Configured Tasks:{" "}
            <strong className="text-slate-800">{activeVersion.taskTemplates.length}</strong>
          </p>
        </div>

        {/* Version Switcher Strip */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">
            SOP Versions:
          </span>
          {template.versions.map((v) => {
            const isActive = v.id === activeVersion.id;
            return (
              <div
                key={v.id}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <button onClick={() => setActiveVersion(v)} className="cursor-pointer">
                  {v.versionLabel} ({v.status})
                </button>
                {v.status !== "ACTIVE" && (
                  <button
                    onClick={() => handleActivateVersion(v.id)}
                    className="text-[9px] bg-orange-500 text-white px-1.5 py-0.2 rounded hover:bg-orange-600 ml-1"
                    title="Make Active Version"
                  >
                    Activate
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STAGES.map((s) => {
          const isSelected = activeStage === s.id;
          const count =
            s.id === "ALL"
              ? activeVersion.taskTemplates.length
              : activeVersion.taskTemplates.filter((t) => t.stage === s.id).length;

          return (
            <button
              key={s.id}
              onClick={() => setActiveStage(s.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${
                isSelected
                  ? "bg-[#F97316] text-white border-[#F97316] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3 border-r border-slate-800">TASK TEMPLATE NAME</th>
              <th className="p-3 border-r border-slate-800">STAGE</th>
              <th className="p-3 border-r border-slate-800 text-center">OFFSET</th>
              <th className="p-3 border-r border-slate-800">ASSIGNEE</th>
              <th className="p-3 border-r border-slate-800 text-center">PRIORITY</th>
              <th className="p-3 border-r border-slate-800 text-center">REQUIRED</th>
              <th className="p-3 text-center w-24">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                  No task templates configured for stage "{activeStage}".
                </td>
              </tr>
            ) : (
              filteredTasks.map((t, idx) => {
                const offsetText =
                  t.relativeOffset === 0
                    ? "T0 (Departure)"
                    : t.relativeOffset < 0
                    ? `T${t.relativeOffset} Days`
                    : `T+${t.relativeOffset} Days`;

                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3 border-r border-slate-100">
                      <p className="font-extrabold text-slate-800 text-xs">{t.taskName}</p>
                      {t.instructions && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{t.instructions}</p>
                      )}
                    </td>
                    <td className="p-3 border-r border-slate-100">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {t.stage.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 border-r border-slate-100 text-center">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-orange-50 text-[#F97316] border border-orange-200">
                        {offsetText}
                      </span>
                    </td>
                    <td className="p-3 border-r border-slate-100 font-medium text-slate-700">
                      {t.defaultAssignee || "OPERATIONS"}
                    </td>
                    <td className="p-3 border-r border-slate-100 text-center">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                          t.priority === "CRITICAL"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : t.priority === "HIGH"
                            ? "bg-orange-50 text-orange-600 border border-orange-200"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3 border-r border-slate-100 text-center">
                      {t.isRequired ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          YES
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                          OPTIONAL
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditTask(t)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Task Modal */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingTask ? "Edit SOP Task Template" : "Add SOP Task Template"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configured tasks will automatically generate date-calculated instances for every departure.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTask} className="space-y-3.5 mt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Task Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Room allocation finalized"
                value={taskForm.taskName}
                onChange={(e) => setTaskForm({ ...taskForm, taskName: e.target.value })}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Stage</label>
                <select
                  value={taskForm.stage}
                  onChange={(e) => setTaskForm({ ...taskForm, stage: e.target.value })}
                  className="w-full h-9 text-xs border border-slate-200 rounded-lg px-2 bg-white text-slate-800"
                >
                  {STAGES.filter((s) => s.id !== "ALL").map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Relative Offset (Days)
                </label>
                <Input
                  type="number"
                  placeholder="-30, -7, 0, 1"
                  value={taskForm.relativeOffset}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, relativeOffset: parseInt(e.target.value, 10) || 0 })
                  }
                  className="text-xs h-9"
                />
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  e.g. -7 = 7 days before departure date
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full h-9 text-xs border border-slate-200 rounded-lg px-2 bg-white text-slate-800"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Default Assignee</label>
                <select
                  value={taskForm.defaultAssignee}
                  onChange={(e) => setTaskForm({ ...taskForm, defaultAssignee: e.target.value })}
                  className="w-full h-9 text-xs border border-slate-200 rounded-lg px-2 bg-white text-slate-800"
                >
                  {staffUsers.map((user) => (
                    <option key={user.id || user.email} value={user.name}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Instructions / Advisory Notes</label>
              <textarea
                placeholder="Specific operational rules or instructions for team..."
                value={taskForm.instructions}
                onChange={(e) => setTaskForm({ ...taskForm, instructions: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2 h-16 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTaskModalOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#F97316] hover:bg-[#EA580C] text-white h-9 text-xs font-bold"
              >
                {isSubmitting ? "Saving..." : "Save SOP Task Template"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Schedule Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-2xl bg-white p-6 rounded-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Dynamic Date Engine Preview Schedule
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Test how tasks will be automatically date-calculated for a specific departure.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 my-3 bg-orange-50 p-3 rounded-lg border border-orange-200">
            <span className="text-xs font-bold text-slate-700">Sample Departure Date (T0):</span>
            <Input
              type="date"
              value={sampleDepartureDate}
              onChange={(e) => {
                setSampleDepartureDate(e.target.value);
              }}
              className="text-xs h-8 bg-white max-w-[160px]"
            />
            <Button
              onClick={handlePreviewSchedule}
              className="h-8 text-xs bg-[#F97316] hover:bg-[#EA580C] text-white font-bold"
            >
              Recalculate
            </Button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                  <th className="p-2 border-b">OFFSET</th>
                  <th className="p-2 border-b">CALCULATED DUE DATE</th>
                  <th className="p-2 border-b">TASK NAME</th>
                  <th className="p-2 border-b">PRIORITY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewSchedule.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-[#F97316]">{item.offsetLabel}</td>
                    <td className="p-2 font-extrabold text-slate-800">{item.dueDate}</td>
                    <td className="p-2 font-semibold text-slate-800">{item.taskName}</td>
                    <td className="p-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100">
                        {item.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
