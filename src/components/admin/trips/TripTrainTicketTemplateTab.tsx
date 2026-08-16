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

export interface TripTrainTemplateData {
  departureJourney: TrainLegTemplate;
  returnJourney: TrainLegTemplate;
  totalExpectedCostPerPassenger: number;
}

const defaultLeg = (isReturn = false): TrainLegTemplate => ({
  enabled: true,
  required: true,
  boardingStation: isReturn ? "" : "",
  destination: isReturn ? "" : "",
  trainName: "",
  trainNumber: "",
  route: "",
  class: "3A",
  quota: "GN",
  ticketType: "IRCTC E-Ticket",
  expectedCost: 0,
  bookingProvider: "Riya Travel Portal",
  notes: "",
});

const CLASS_OPTIONS = [
  { value: "3A", label: "3A - AC 3 Tier" },
  { value: "2A", label: "2A - AC 2 Tier" },
  { value: "1A", label: "1A - First AC" },
  { value: "3E", label: "3E - AC 3 Economy" },
  { value: "SL", label: "SL - Sleeper Class" },
  { value: "CC", label: "CC - AC Chair Car" },
  { value: "2S", label: "2S - Second Sitting" },
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

  const [template, setTemplate] = useState<TripTrainTemplateData>(() => {
    if (initialTemplate) {
      return {
        departureJourney: {
          ...defaultLeg(false),
          ...(initialTemplate.departureJourney || {}),
        },
        returnJourney: {
          ...defaultLeg(true),
          ...(initialTemplate.returnJourney || {}),
        },
        totalExpectedCostPerPassenger:
          Number(initialTemplate.totalExpectedCostPerPassenger) || 0,
      };
    }
    return {
      departureJourney: defaultLeg(false),
      returnJourney: defaultLeg(true),
      totalExpectedCostPerPassenger: 0,
    };
  });

  // Load existing trip template from server
  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    api
      .get(`/trips/${tripId}/train-template`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setTemplate({
            departureJourney: {
              ...defaultLeg(false),
              ...(d.departureJourney || {}),
            },
            returnJourney: {
              ...defaultLeg(true),
              ...(d.returnJourney || {}),
            },
            totalExpectedCostPerPassenger:
              Number(d.totalExpectedCostPerPassenger) || 0,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load train template:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tripId]);

  // Real-time calculated total expected cost
  const calculatedTotal = useMemo(() => {
    const dep = template.departureJourney.enabled
      ? Number(template.departureJourney.expectedCost) || 0
      : 0;
    const ret = template.returnJourney.enabled
      ? Number(template.returnJourney.expectedCost) || 0
      : 0;
    return dep + ret;
  }, [template]);

  const handleDepartureChange = (field: keyof TrainLegTemplate, value: any) => {
    setTemplate((prev) => ({
      ...prev,
      departureJourney: {
        ...prev.departureJourney,
        [field]: value,
      },
    }));
  };

  const handleReturnChange = (field: keyof TrainLegTemplate, value: any) => {
    setTemplate((prev) => ({
      ...prev,
      returnJourney: {
        ...prev.returnJourney,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!tripId) {
      toast.error("Trip ID is required to save template");
      return;
    }

    setSaving(true);
    try {
      const payload: TripTrainTemplateData = {
        ...template,
        totalExpectedCostPerPassenger: calculatedTotal,
      };

      const res = await api.put(`/trips/${tripId}/train-template`, payload);
      if (res.data?.success) {
        toast.success(
          `Train ticket template for "${tripTitle || tripId}" saved successfully!`,
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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Trip Train Ticket Template
                </h2>
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-300 text-[10px] font-black uppercase"
                >
                  Strictly Trip-Scoped
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Configure authoritative departure & return train journeys, expected ticket costs,
                and class details for{" "}
                <span className="font-bold text-slate-900">
                  {tripTitle || tripId || "This Trip"}
                </span>
                .
              </p>
            </div>
          </div>

          {/* Quick Expected Cost KPI Badge */}
          <div className="bg-white border border-orange-200 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0 shadow-xs">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Total Expected Cost
              </div>
              <div className="text-base font-black text-emerald-600">
                {formatINR(calculatedTotal)}
                <span className="text-[10px] text-slate-500 font-normal ml-1">
                  / passenger
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Integration Callout */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-blue-950">
            Automatic Finance & Ticketing Integration:
          </span>
          <p className="text-blue-800 text-[11px] leading-relaxed">
            The price entered here automatically feeds into{" "}
            <strong>Booking Workspaces</strong>, <strong>Ticketing Queues</strong>, and{" "}
            <strong>Finance Controller</strong> as the authoritative expected train cost. When
            actual tickets are issued via the Riya Portal, Finance tracks the exact variance (+/−)
            without requiring duplicate data entry.
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
                  Departure Journey
                </h3>
                <span className="text-[10px] text-slate-500">
                  Outward leg from base to destination
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                {template.departureJourney.enabled ? "Active" : "Disabled"}
              </span>
              <Switch
                checked={template.departureJourney.enabled}
                onCheckedChange={(val) => handleDepartureChange("enabled", val)}
              />
            </div>
          </div>

          <div
            className={`p-5 space-y-4 ${
              !template.departureJourney.enabled
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
                  {template.departureJourney.required ? "Required" : "Optional"}
                </span>
                <Switch
                  checked={template.departureJourney.required}
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
                  value={template.departureJourney.boardingStation}
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
                  value={template.departureJourney.destination}
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
                  value={template.departureJourney.trainName}
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
                  value={template.departureJourney.trainNumber}
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
                  Default Travel Class
                </Label>
                <select
                  value={template.departureJourney.class}
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
                  value={template.departureJourney.quota}
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
                    value={template.departureJourney.expectedCost}
                    onChange={(e) =>
                      handleDepartureChange(
                        "expectedCost",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder="1850"
                    className="h-8 pl-6 text-xs font-bold text-emerald-600 bg-emerald-50/40 border-emerald-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Booking Provider
                </Label>
                <select
                  value={template.departureJourney.bookingProvider}
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

            {/* Ticket Type & Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Ticket Type
                </Label>
                <select
                  value={template.departureJourney.ticketType}
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
                  value={template.departureJourney.route}
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
                value={template.departureJourney.notes}
                onChange={(e) =>
                  handleDepartureChange("notes", e.target.value)
                }
                placeholder="e.g. Open booking 120 days prior at 8:00 AM"
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
                  Return Journey
                </h3>
                <span className="text-[10px] text-slate-500">
                  Inward leg back to home station
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                {template.returnJourney.enabled ? "Active" : "Disabled"}
              </span>
              <Switch
                checked={template.returnJourney.enabled}
                onCheckedChange={(val) => handleReturnChange("enabled", val)}
              />
            </div>
          </div>

          <div
            className={`p-5 space-y-4 ${
              !template.returnJourney.enabled
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
                  {template.returnJourney.required ? "Required" : "Optional"}
                </span>
                <Switch
                  checked={template.returnJourney.required}
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
                  value={template.returnJourney.boardingStation}
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
                  value={template.returnJourney.destination}
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
                  value={template.returnJourney.trainName}
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
                  value={template.returnJourney.trainNumber}
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
                  Default Travel Class
                </Label>
                <select
                  value={template.returnJourney.class}
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
                  value={template.returnJourney.quota}
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
                    value={template.returnJourney.expectedCost}
                    onChange={(e) =>
                      handleReturnChange(
                        "expectedCost",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    placeholder="1750"
                    className="h-8 pl-6 text-xs font-bold text-emerald-600 bg-emerald-50/40 border-emerald-300"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Booking Provider
                </Label>
                <select
                  value={template.returnJourney.bookingProvider}
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

            {/* Ticket Type & Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-slate-700">
                  Ticket Type
                </Label>
                <select
                  value={template.returnJourney.ticketType}
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
                  value={template.returnJourney.route}
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
                value={template.returnJourney.notes}
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
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Departure Cost
            </div>
            <div className="text-sm font-bold text-slate-900">
              {formatINR(Number(template.departureJourney.expectedCost) || 0)}
            </div>
          </div>

          <div className="text-slate-300 font-light text-xl">+</div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Return Cost
            </div>
            <div className="text-sm font-bold text-slate-900">
              {formatINR(Number(template.returnJourney.expectedCost) || 0)}
            </div>
          </div>

          <div className="text-slate-300 font-light text-xl">=</div>

          <div>
            <div className="text-[10px] uppercase font-black text-emerald-700">
              Total Expected / Passenger
            </div>
            <div className="text-lg font-black text-emerald-600">
              {formatINR(calculatedTotal)}
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
          {saving ? "Saving Template..." : "Save Train Ticket Template"}
        </Button>
      </div>
    </div>
  );
}
