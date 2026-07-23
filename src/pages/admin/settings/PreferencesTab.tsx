import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sliders, Save, Loader2, DollarSign, Calendar, Clock, Globe } from "lucide-react";
import { Admin, UserPreferences } from "@/types";
import { settingsService } from "@/services/settings.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

interface PreferencesTabProps {
  profile: Admin;
  onRefresh: () => void;
}

export function PreferencesTab({ profile, onRefresh }: PreferencesTabProps) {
  const { checkAuth } = useAuthStore();
  const prefs: UserPreferences = profile.uiSettings?.preferences || {};

  const [defaultTripFilter, setDefaultTripFilter] = useState(prefs.defaultTripFilter || "upcoming");
  const [defaultSort, setDefaultSort] = useState(prefs.defaultSort || "date-desc");
  const [autoSaveDrafts, setAutoSaveDrafts] = useState(prefs.autoSaveDrafts ?? true);
  const [currency, setCurrency] = useState(prefs.currency || "INR");
  const [dateFormat, setDateFormat] = useState(prefs.dateFormat || "DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState(prefs.timeFormat || "12h");
  const [timezone, setTimezone] = useState(prefs.timezone || "Asia/Kolkata");

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      const updatedPrefs: UserPreferences = {
        ...prefs,
        defaultTripFilter,
        defaultSort,
        autoSaveDrafts,
        currency,
        dateFormat,
        timeFormat,
        timezone
      };

      await settingsService.updateProfile({
        preferences: updatedPrefs
      });

      await checkAuth();
      onRefresh();
      toast.success("Default preferences saved!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sliders className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-bold text-slate-900">System Defaults & Operational Preferences</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Trip Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Default Trip View Filter</Label>
            <RadioGroup value={defaultTripFilter} onValueChange={setDefaultTripFilter} className="flex flex-col gap-2 pt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upcoming" id="t-upcoming" />
                <Label htmlFor="t-upcoming" className="text-xs font-semibold cursor-pointer">Upcoming Departures Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="t-all" />
                <Label htmlFor="t-all" className="text-xs font-semibold cursor-pointer">All Departures (Upcoming & Past)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Default Sort Order */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Default List Sort Order</Label>
            <Select value={defaultSort} onValueChange={setDefaultSort}>
              <SelectTrigger className="h-9 text-xs border-slate-300">
                <SelectValue placeholder="Select Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Departure Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Departure Date (Oldest First)</SelectItem>
                <SelectItem value="name-asc">Trip Name (A-Z)</SelectItem>
                <SelectItem value="bookings-desc">Highest Bookings Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Default Currency Symbol</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-9 text-xs border-slate-300">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">Indian Rupee (₹ INR)</SelectItem>
                <SelectItem value="USD">US Dollar ($ USD)</SelectItem>
                <SelectItem value="EUR">Euro (€ EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="h-9 text-xs border-slate-300">
                <SelectValue placeholder="Timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</SelectItem>
                <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST -05:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Format */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Date Display Format</Label>
            <RadioGroup value={dateFormat} onValueChange={setDateFormat} className="flex items-center gap-4 pt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DD/MM/YYYY" id="d-ddmmyyyy" />
                <Label htmlFor="d-ddmmyyyy" className="text-xs font-semibold cursor-pointer">DD/MM/YYYY</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MM/DD/YYYY" id="d-mmddyyyy" />
                <Label htmlFor="d-mmddyyyy" className="text-xs font-semibold cursor-pointer">MM/DD/YYYY</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Time Format */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Time Display Format</Label>
            <RadioGroup value={timeFormat} onValueChange={setTimeFormat} className="flex items-center gap-4 pt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="12h" id="t-12h" />
                <Label htmlFor="t-12h" className="text-xs font-semibold cursor-pointer">12-Hour (2:30 PM)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="24h" id="t-24h" />
                <Label htmlFor="t-24h" className="text-xs font-semibold cursor-pointer">24-Hour (14:30)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
          <div>
            <Label className="text-xs font-bold text-slate-800">Auto-Save Booking Forms</Label>
            <p className="text-[11px] text-slate-500">Automatically cache unfinished booking drafts locally</p>
          </div>
          <Switch checked={autoSaveDrafts} onCheckedChange={setAutoSaveDrafts} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-9 px-5 text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Preferences
        </Button>
      </div>
    </form>
  );
}
