import { useState, useEffect, useMemo } from "react";
import {
  Train,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Save,
  RefreshCw,
  Wallet,
  ShieldCheck,
  Building2,
  FileText,
  Clock,
  Coins,
  Ticket,
  Plus,
  Trash2,
  Copy,
  Layers,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import api from "@/services/api";
import { formatINR } from "@/lib/utils";

export interface TrainLegTemplate {
  enabled: boolean;
  required: boolean;
  boardingStation: string;
  destination: string;
  trainName: string;
  trainNumber: string;
  route: string;
  class: string;
  quota: string;
  ticketType: string;
  expectedCost: number | "";
  bookingProvider: string;
  notes: string;
}

export interface ClassTierTemplate {
  id: string;
  classCode: string; // e.g. "3A", "SL", "2A", "3E", "1A", "CC"
  name: string; // e.g. "3AC (AC 3 Tier)", "Sleeper Class (SL)"
  departureJourney: TrainLegTemplate;
  returnJourney: TrainLegTemplate;
  totalExpectedCostPerPassenger: number;
}

export interface TripTrainTemplateData {
  tiers: ClassTierTemplate[];
  defaultTierId?: string;
  // Legacy backward-compatibility fallbacks
  departureJourney?: TrainLegTemplate;
  returnJourney?: TrainLegTemplate;
  totalExpectedCostPerPassenger?: number;
}

const defaultLeg = (
  classCode = "3A",
  isReturn = false,
  cost = 0,
): TrainLegTemplate => ({
  enabled: true,
  required: true,
  boardingStation: "",
  destination: "",
  trainName: "",
  trainNumber: "",
  route: "",
  class: classCode,
  quota: "GN",
  ticketType: "IRCTC E-Ticket",
  expectedCost: cost,
  bookingProvider: "Riya Travel Portal",
  notes: "",
});

const CLASS_OPTIONS = [
  { value: "3A", label: "3A - AC 3 Tier", defaultName: "3AC Class (3A)" },
  { value: "SL", label: "SL - Sleeper Class", defaultName: "Sleeper Class (SL)" },
  { value: "2A", label: "2A - AC 2 Tier", defaultName: "2AC Class (2A)" },
  { value: "3E", label: "3E - AC 3 Economy", defaultName: "3AC Economy (3E)" },
  { value: "1A", label: "1A - First AC", defaultName: "1st AC Class (1A)" },
  { value: "CC", label: "CC - AC Chair Car", defaultName: "Chair Car (CC)" },
  { value: "2S", label: "2S - Second Sitting", defaultName: "Second Sitting (2S)" },
];

const QUOTA_OPTIONS = [
  { value: "GN", label: "GN - General Quota" },
  { value: "TQ", label: "TQ - Tatkal Quota" },
  { value: "PT", label: "PT - Premium Tatkal" },
  { value: "LD", label: "LD - Ladies Quota" },
  { value: "DF", label: "DF - Defence Quota" },
  { value: "FT", label: "FT - Foreign Tourist" },
];

const TICKET_TYPE_OPTIONS = [
  "IRCTC E-Ticket",
  "Group Ticket",
  "PRS Counter Ticket",
  "Tatkal E-Ticket",
];

const PROVIDER_OPTIONS = [
  "Riya Travel Portal",
  "IRCTC Direct Corporate",
  "Agent PRS Counter",
  "Manual / Other Partner",
];

const createInitialTiers = (): ClassTierTemplate[] => [
  {
    id: "tier_3a",
    classCode: "3A",
    name: "3AC Class (3A)",
    departureJourney: defaultLeg("3A", false, 1850),
    returnJourney: defaultLeg("3A", true, 1750),
    totalExpectedCostPerPassenger: 3600,
  },
  {
    id: "tier_sl",
    classCode: "SL",
    name: "Sleeper Class (SL)",
    departureJourney: defaultLeg("SL", false, 950),
    returnJourney: defaultLeg("SL", true, 950),
    totalExpectedCostPerPassenger: 1900,
  },
];

interface TripTrainTicketTemplateTabProps {
  tripId?: string;
  tripTitle?: string;
  initialTemplate?: any;
  onTemplateSaved?: (template: TripTrainTemplateData) => void;
}

export default function TripTrainTicketTemplateTab({
  tripId,
  tripTitle,
  initialTemplate,
  onTemplateSaved,
}: TripTrainTicketTemplateTabProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Normalize initial data
  const [tiers, setTiers] = useState<ClassTierTemplate[]>(() => {
    if (initialTemplate?.tiers && Array.isArray(initialTemplate.tiers) && initialTemplate.tiers.length > 0) {
      return initialTemplate.tiers;
    }
    if (initialTemplate?.departureJourney || initialTemplate?.returnJourney) {
      // Migrate single legacy template into tier list
      return [
        {
          id: "tier_legacy",
          classCode: initialTemplate.departureJourney?.class || "3A",
          name:
            CLASS_OPTIONS.find(
              (c) => c.value === initialTemplate.departureJourney?.class,
            )?.defaultName || "Primary Class",
          departureJourney: {
            ...defaultLeg(initialTemplate.departureJourney?.class || "3A", false),
            ...(initialTemplate.departureJourney || {}),
          },
          returnJourney: {
            ...defaultLeg(initialTemplate.returnJourney?.class || "3A", true),
            ...(initialTemplate.returnJourney || {}),
          },
          totalExpectedCostPerPassenger:
            Number(initialTemplate.totalExpectedCostPerPassenger) || 0,
        },
      ];
    }
    return createInitialTiers();
  });

  const [activeTierId, setActiveTierId] = useState<string>(() => tiers[0]?.id || "tier_3a");

  // Load existing trip template from server
  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    api
      .get(`/trips/${tripId}/train-template`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          if (Array.isArray(d.tiers) && d.tiers.length > 0) {
            setTiers(d.tiers);
            setActiveTierId(d.defaultTierId || d.tiers[0].id);
          } else if (d.departureJourney || d.returnJourney) {
            const migrated = [
              {
                id: "tier_primary",
                classCode: d.departureJourney?.class || "3A",
                name:
                  CLASS_OPTIONS.find(
                    (c) => c.value === d.departureJourney?.class,
                  )?.defaultName || "Primary Class",
                departureJourney: {
                  ...defaultLeg(d.departureJourney?.class || "3A", false),
                  ...(d.departureJourney || {}),
                },
                returnJourney: {
                  ...defaultLeg(d.returnJourney?.class || "3A", true),
                  ...(d.returnJourney || {}),
                },
                totalExpectedCostPerPassenger:
                  Number(d.totalExpectedCostPerPassenger) || 0,
              },
            ];
            setTiers(migrated);
            setActiveTierId(migrated[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load train template:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tripId]);

  // Current active tier
  const activeTier = useMemo(() => {
    return tiers.find((t) => t.id === activeTierId) || tiers[0] || null;
  }, [tiers, activeTierId]);

  // Real-time calculated total expected cost for active tier
  const calculatedActiveTotal = useMemo(() => {
    if (!activeTier) return 0;
    const dep = activeTier.departureJourney.enabled
      ? Number(activeTier.departureJourney.expectedCost) || 0
      : 0;
    const ret = activeTier.returnJourney.enabled
      ? Number(activeTier.returnJourney.expectedCost) || 0
      : 0;
    return dep + ret;
  }, [activeTier]);

  const handleUpdateActiveTier = (updater: (tier: ClassTierTemplate) => ClassTierTemplate) => {
    if (!activeTier) return;
    setTiers((prev) =>
      prev.map((t) => (t.id === activeTier.id ? updater(t) : t)),
    );
  };

  const handleDepartureChange = (field: keyof TrainLegTemplate, value: any) => {
    handleUpdateActiveTier((curr) => ({
      ...curr,
      departureJourney: {
        ...curr.departureJourney,
        [field]: value,
      },
    }));
  };

  const handleReturnChange = (field: keyof TrainLegTemplate, value: any) => {
    handleUpdateActiveTier((curr) => ({
      ...curr,
      returnJourney: {
        ...curr.returnJourney,
        [field]: value,
      },
    }));
  };

  const handleAddTier = (classCode: string) => {
    const existingOpt = CLASS_OPTIONS.find((c) => c.value === classCode);
    const newId = `tier_${classCode.toLowerCase()}_${Date.now()}`;
    const baseTier = tiers[0];

    const newTier: ClassTierTemplate = {
      id: newId,
      classCode,
      name: existingOpt?.defaultName || `${classCode} Class`,
      departureJourney: {
        ...defaultLeg(classCode, false, classCode === "SL" ? 950 : 1850),
        boardingStation: baseTier?.departureJourney?.boardingStation || "",
        destination: baseTier?.departureJourney?.destination || "",
        trainName: baseTier?.departureJourney?.trainName || "",
        trainNumber: baseTier?.departureJourney?.trainNumber || "",
        route: baseTier?.departureJourney?.route || "",
        class: classCode,
      },
      returnJourney: {
        ...defaultLeg(classCode, true, classCode === "SL" ? 950 : 1750),
        boardingStation: baseTier?.returnJourney?.boardingStation || "",
        destination: baseTier?.returnJourney?.destination || "",
        trainName: baseTier?.returnJourney?.trainName || "",
        trainNumber: baseTier?.returnJourney?.trainNumber || "",
        route: baseTier?.returnJourney?.route || "",
        class: classCode,
      },
      totalExpectedCostPerPassenger: classCode === "SL" ? 1900 : 3600,
    };

    setTiers((prev) => [...prev, newTier]);
    setActiveTierId(newId);
    toast.success(`Added ${newTier.name} template`);
  };

  const handleDeleteTier = (tierId: string) => {
    if (tiers.length <= 1) {
      toast.error("At least one train class tier must remain configured");
      return;
    }
    const filtered = tiers.filter((t) => t.id !== tierId);
    setTiers(filtered);
    if (activeTierId === tierId) {
      setActiveTierId(filtered[0]?.id || "");
    }
    toast.info("Class tier removed");
  };

  const handleCopyStationsFromFirst = () => {
    if (tiers.length < 2 || !activeTier) return;
    const source = tiers.find((t) => t.id !== activeTier.id);
    if (!source) return;

    handleUpdateActiveTier((curr) => ({
      ...curr,
      departureJourney: {
        ...curr.departureJourney,
        boardingStation: source.departureJourney.boardingStation,
        destination: source.departureJourney.destination,
        trainName: source.departureJourney.trainName,
        trainNumber: source.departureJourney.trainNumber,
        route: source.departureJourney.route,
      },
      returnJourney: {
        ...curr.returnJourney,
        boardingStation: source.returnJourney.boardingStation,
        destination: source.returnJourney.destination,
        trainName: source.returnJourney.trainName,
        trainNumber: source.returnJourney.trainNumber,
        route: source.returnJourney.route,
      },
    }));
    toast.success(`Copied stations & train info from ${source.name}`);
  };

  const handleSave = async () => {
    if (!tripId) {
      toast.error("Trip ID is required to save template");
      return;
    }

    setSaving(true);
    try {
      // Recalculate totals for each tier
      const updatedTiers = tiers.map((t) => {
        const dep = t.departureJourney.enabled
          ? Number(t.departureJourney.expectedCost) || 0
          : 0;
        const ret = t.returnJourney.enabled
          ? Number(t.returnJourney.expectedCost) || 0
          : 0;
        return {
          ...t,
          totalExpectedCostPerPassenger: dep + ret,
        };
      });

      const primaryTier = updatedTiers[0] || updatedTiers.find((t) => t.id === activeTierId);

      const payload: TripTrainTemplateData = {
        tiers: updatedTiers,
        defaultTierId: activeTierId,
        // Legacy fallbacks for single-leg viewers
        departureJourney: primaryTier?.departureJourney,
        returnJourney: primaryTier?.returnJourney,
        totalExpectedCostPerPassenger:
          primaryTier?.totalExpectedCostPerPassenger || 0,
      };

      const res = await api.put(`/trips/${tripId}/train-template`, payload);
      if (res.data?.success) {
        toast.success(
          `Train ticket templates (${updatedTiers.length} class tiers) saved successfully!`,
        );
        if (onTemplateSaved) {
          onTemplateSaved(payload);
        }
      }
    } catch (err: any) {
      console.error("Failed to save train ticket template:", err);
      toast.error(
        err.response?.data?.message || "Failed to save train ticket template",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
        <span className="text-xs font-semibold">
          Loading Trip Train Ticket Template...
        </span>
      </div>
    );
  }

  if (!activeTier) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-orange-600 text-white rounded-xl shadow-xs shrink-0">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Trip Train Ticket Template
                </h2>
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-300 text-[10px] font-black uppercase"
                >
                  Multi-Class Supported
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Configure travel class packages (e.g.{" "}
                <strong className="text-slate-800">Sleeper (SL)</strong> vs{" "}
                <strong className="text-slate-800">3AC (3A)</strong>), expected pricing, and train
                numbers for{" "}
                <span className="font-bold text-slate-900">
                  {tripTitle || tripId || "This Trip"}
                </span>
                .
              </p>
            </div>
          </div>

          {/* Quick Active Expected Cost Badge */}
          <div className="bg-white border border-orange-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0 shadow-xs">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {activeTier.name} Expected
              </div>
              <div className="text-base font-black text-emerald-600">
                {formatINR(calculatedActiveTotal)}
                <span className="text-[10px] text-slate-500 font-normal ml-1">
                  / passenger
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────── CLASS TIERS SELECTOR TAB BAR ──────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              Configured Travel Classes ({tiers.length})
            </span>
          </div>

          {tiers.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyStationsFromFirst}
              className="h-7 text-[11px] font-semibold text-slate-600 hover:text-orange-600 hover:bg-orange-50 gap-1.5 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              Copy Stations & Trains to Active Class
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {tiers.map((tier) => {
            const isActive = tier.id === activeTier.id;
            const depCost = tier.departureJourney.enabled
              ? Number(tier.departureJourney.expectedCost) || 0
              : 0;
            const retCost = tier.returnJourney.enabled
              ? Number(tier.returnJourney.expectedCost) || 0
              : 0;
            const tierTotal = depCost + retCost;

            return (
              <div
                key={tier.id}
                onClick={() => setActiveTierId(tier.id)}
                className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                  isActive
                    ? "bg-orange-50/80 border-orange-500 shadow-2xs ring-2 ring-orange-500/20"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                    isActive
                      ? "bg-orange-600 text-white"
                      : "bg-slate-200 text-slate-700 group-hover:bg-slate-300"
                  }`}
                >
                  {tier.classCode}
                </div>
                <div className="text-left">
                  <div
                    className={`text-xs font-black ${
                      isActive ? "text-orange-950" : "text-slate-800"
                    }`}
                  >
                    {tier.name}
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600">
                    {formatINR(tierTotal)}
                    <span className="text-[9px] font-normal text-slate-400 ml-1">
                      / pax
                    </span>
                  </div>
                </div>

                {tiers.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTier(tier.id);
                    }}
                    title="Delete this class tier"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Quick Add Class Dropdown */}
          <div className="flex items-center gap-1.5 pl-1">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddTier(e.target.value);
                  e.target.value = "";
                }
              }}
              defaultValue=""
              className="h-9 px-3 rounded-xl border border-dashed border-orange-300 bg-orange-50/40 hover:bg-orange-50 text-xs font-bold text-orange-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              <option value="" disabled>
                + Add Travel Class Tier...
              </option>
              {CLASS_OPTIONS.filter(
                (c) => !tiers.some((t) => t.classCode === c.value),
              ).map((c) => (
                <option key={c.value} value={c.value}>
                  + {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Critical Integration Callout */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-blue-950">
            Multi-Class Automatic Finance Routing:
          </span>
          <p className="text-blue-800 text-[11px] leading-relaxed">
            When passengers book a <strong>Sleeper (SL)</strong> package, Finance automatically
            compares against the Sleeper expected cost. When booked as <strong>3AC (3A)</strong>,
            Finance compares against the 3AC expected cost without manual cross-calculation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ──────────────────────── DEPARTURE JOURNEY ──────────────────────── */}
        <Card className="border border-slate-200 rounded-2xl shadow-xs overflow-hidden bg-white">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Departure Journey ({activeTier.classCode})
                </h3>
                <span className="text-[10px] text-slate-500">
                  Outward leg from base to destination
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                {activeTier.departureJourney.enabled ? "Active" : "Disabled"}
              </span>
              <Switch
                checked={activeTier.departureJourney.enabled}
                onCheckedChange={(val) => handleDepartureChange("enabled", val)}
              />
            </div>
          </div>

          <div
            className={`p-5 space-y-4 ${
              !activeTier.departureJourney.enabled
                ? "opacity-40 pointer-events-none"
                : ""
            }`}
          >
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                Mandatory Ticket for Passenger?
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">
                  {activeTier.departureJourney.required ? "Required" : "Optional"}
                </span>
                <Switch
                  checked={activeTier.departureJourney.required}
                  onCheckedChange={(val) =>
                    handleDepartureChange("required", val)
                  }
                />
              </div>
            </div>

            {/* Stations */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Boarding Station *
                </Label>
                <Input
                  value={activeTier.departureJourney.boardingStation}
                  onChange={(e) =>
                    handleDepartureChange("boardingStation", e.target.value)
                  }
                  placeholder="e.g. Ahmedabad (ADI)"
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Destination Station *
                </Label>
                <Input
                  value={activeTier.departureJourney.destination}
                  onChange={(e) =>
                    handleDepartureChange("destination", e.target.value)
                  }
                  placeholder="e.g. Amritsar (ASR)"
                  className="h-8 text-xs font-medium"
                />
              </div>
            </div>

            {/* Train Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Train Name
                </Label>
                <Input
                  value={activeTier.departureJourney.trainName}
                  onChange={(e) =>
                    handleDepartureChange("trainName", e.target.value)
                  }
                  placeholder="e.g. Sarvodaya Express"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Train Number
                </Label>
                <Input
                  value={activeTier.departureJourney.trainNumber}
                  onChange={(e) =>
                    handleDepartureChange("trainNumber", e.target.value)
                  }
                  placeholder="e.g. 12473"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Class & Quota */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Travel Class
                </Label>
                <select
                  value={activeTier.departureJourney.class}
                  onChange={(e) =>
                    handleDepartureChange("class", e.target.value)
                  }
                  className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                >
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Booking Quota
                </Label>
                <select
                  value={activeTier.departureJourney.quota}
                  onChange={(e) =>
                    handleDepartureChange("quota", e.target.value)
                  }
                  className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                >
                  {QUOTA_OPTIONS.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expected Cost & Provider */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  Expected Cost / Pax (₹) *
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={activeTier.departureJourney.expectedCost}
                    onChange={(e) =>
                      handleDepartureChange(
                        "expectedCost",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder={activeTier.classCode === "SL" ? "950" : "1850"}
                    className="h-8 pl-6 text-xs font-bold text-emerald-600 bg-emerald-50/40 border-emerald-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Booking Provider
                </Label>
                <select
                  value={activeTier.departureJourney.bookingProvider}
                  onChange={(e) =>
                    handleDepartureChange("bookingProvider", e.target.value)
                  }
                  className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ticket Type & Route */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Ticket Type
                </Label>
                <select
                  value={activeTier.departureJourney.ticketType}
                  onChange={(e) =>
                    handleDepartureChange("ticketType", e.target.value)
                  }
                  className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                >
                  {TICKET_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Route Identifier
                </Label>
                <Input
                  value={activeTier.departureJourney.route}
                  onChange={(e) =>
                    handleDepartureChange("route", e.target.value)
                  }
                  placeholder="e.g. ADI - NDLS - ASR"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-700">
                Ticketing Instructions / Notes
              </Label>
              <Input
                value={activeTier.departureJourney.notes}
                onChange={(e) =>
                  handleDepartureChange("notes", e.target.value)
                }
                placeholder="e.g. Book 120 days prior at 8:00 AM"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </Card>

        {/* ──────────────────────── RETURN JOURNEY ──────────────────────── */}
        <Card className="border border-slate-200 rounded-2xl shadow-xs overflow-hidden bg-white">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Return Journey ({activeTier.classCode})
                </h3>
                <span className="text-[10px] text-slate-500">
                  Inward leg back to home station
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                {activeTier.returnJourney.enabled ? "Active" : "Disabled"}
              </span>
              <Switch
                checked={activeTier.returnJourney.enabled}
                onCheckedChange={(val) => handleReturnChange("enabled", val)}
              />
            </div>
          </div>

          <div
            className={`p-5 space-y-4 ${
              !activeTier.returnJourney.enabled
                ? "opacity-40 pointer-events-none"
                : ""
            }`}
          >
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                Mandatory Ticket for Passenger?
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">
                  {activeTier.returnJourney.required ? "Required" : "Optional"}
                </span>
                <Switch
                  checked={activeTier.returnJourney.required}
                  onCheckedChange={(val) =>
                    handleReturnChange("required", val)
                  }
                />
              </div>
            </div>

            {/* Stations */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Boarding Station *
                </Label>
                <Input
                  value={activeTier.returnJourney.boardingStation}
                  onChange={(e) =>
                    handleReturnChange("boardingStation", e.target.value)
                  }
                  placeholder="e.g. Amritsar (ASR)"
                  className="h-8 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Destination Station *
                </Label>
                <Input
                  value={activeTier.returnJourney.destination}
                  onChange={(e) =>
                    handleReturnChange("destination", e.target.value)
                  }
                  placeholder="e.g. Ahmedabad (ADI)"
                  className="h-8 text-xs font-medium"
                />
              </div>
            </div>

            {/* Train Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Train Name
                </Label>
                <Input
                  value={activeTier.returnJourney.trainName}
                  onChange={(e) =>
                    handleReturnChange("trainName", e.target.value)
                  }
                  placeholder="e.g. Paschim Express"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Train Number
                </Label>
                <Input
                  value={activeTier.returnJourney.trainNumber}
                  onChange={(e) =>
                    handleReturnChange("trainNumber", e.target.value)
                  }
                  placeholder="e.g. 12926"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Class & Quota */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Travel Class
                </Label>
                <select
                  value={activeTier.returnJourney.class}
                  onChange={(e) =>
                    handleReturnChange("class", e.target.value)
                  }
                  className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                >
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Booking Quota
                </Label>
                <select
                  value={activeTier.returnJourney.quota}
                  onChange={(e) =>
                    handleReturnChange("quota", e.target.value)
                  }
                  className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                >
                  {QUOTA_OPTIONS.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expected Cost & Provider */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  Expected Cost / Pax (₹) *
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={activeTier.returnJourney.expectedCost}
                    onChange={(e) =>
                      handleReturnChange(
                        "expectedCost",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder={activeTier.classCode === "SL" ? "950" : "1750"}
                    className="h-8 pl-6 text-xs font-bold text-emerald-600 bg-emerald-50/40 border-emerald-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Booking Provider
                </Label>
                <select
                  value={activeTier.returnJourney.bookingProvider}
                  onChange={(e) =>
                    handleReturnChange("bookingProvider", e.target.value)
                  }
                  className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ticket Type & Route */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Ticket Type
                </Label>
                <select
                  value={activeTier.returnJourney.ticketType}
                  onChange={(e) =>
                    handleReturnChange("ticketType", e.target.value)
                  }
                  className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                >
                  {TICKET_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Route Identifier
                </Label>
                <Input
                  value={activeTier.returnJourney.route}
                  onChange={(e) =>
                    handleReturnChange("route", e.target.value)
                  }
                  placeholder="e.g. ASR - CDG - ADI"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-slate-700">
                Ticketing Instructions / Notes
              </Label>
              <Input
                value={activeTier.returnJourney.notes}
                onChange={(e) =>
                  handleReturnChange("notes", e.target.value)
                }
                placeholder="e.g. Return group booking via Riya wallet"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Footer & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {activeTier.name} (Dep)
            </div>
            <div className="text-sm font-bold text-slate-900">
              {formatINR(Number(activeTier.departureJourney.expectedCost) || 0)}
            </div>
          </div>

          <div className="text-slate-300 font-light text-xl">+</div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {activeTier.name} (Ret)
            </div>
            <div className="text-sm font-bold text-slate-900">
              {formatINR(Number(activeTier.returnJourney.expectedCost) || 0)}
            </div>
          </div>

          <div className="text-slate-300 font-light text-xl">=</div>

          <div>
            <div className="text-[10px] uppercase font-black text-emerald-700">
              Total {activeTier.name} Expected
            </div>
            <div className="text-lg font-black text-emerald-600">
              {formatINR(calculatedActiveTotal)}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-9 px-5 shadow-xs cursor-pointer"
        >
          {saving ? (
            <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5 mr-2" />
          )}
          {saving ? "Saving Template..." : `Save All Class Templates (${tiers.length})`}
        </Button>
      </div>
    </div>
  );
}
