import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sun, Moon, Palette, Bell, Volume2, Save, Loader2, Monitor } from "lucide-react";
import { Admin, NotificationPreferences, UISettings } from "@/types";
import { settingsService } from "@/services/settings.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

interface UINotificationsTabProps {
  profile: Admin;
  onRefresh: () => void;
}

export function UINotificationsTab({ profile, onRefresh }: UINotificationsTabProps) {
  const { checkAuth } = useAuthStore();
  const currentUi: UISettings = profile.uiSettings || {};
  const currentNotif: NotificationPreferences = profile.notificationPreferences || {};

  // Appearance State
  const [theme, setTheme] = useState<'light' | 'dark'>(currentUi.theme || 'light');
  const [themePreset, setThemePreset] = useState<'ocean-blue' | 'forest-green' | 'sunset-orange' | 'modern-purple'>(currentUi.themePreset || 'ocean-blue');
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>(currentUi.fontSize || 'normal');
  const [listView, setListView] = useState<'compact' | 'detailed'>(currentUi.listView || 'detailed');

  // Notification Preferences State
  const [dailyDigest, setDailyDigest] = useState(currentNotif.dailyDigest ?? true);
  const [bookingAlerts, setBookingAlerts] = useState(currentNotif.bookingAlerts ?? true);
  const [paymentConfirmations, setPaymentConfirmations] = useState(currentNotif.paymentConfirmations ?? true);
  const [departureReminders, setDepartureReminders] = useState(currentNotif.departureReminders ?? true);
  const [staffAnnouncements, setStaffAnnouncements] = useState(currentNotif.staffAnnouncements ?? true);
  const [inAppNotifications, setInAppNotifications] = useState(currentNotif.inAppNotifications ?? true);
  const [notificationSound, setNotificationSound] = useState(currentNotif.notificationSound ?? true);
  const [frequency, setFrequency] = useState<'real-time' | 'hourly' | 'daily'>(currentNotif.frequency || 'real-time');

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      const uiSettingsObj: UISettings = {
        ...currentUi,
        theme,
        themePreset,
        fontSize,
        listView
      };

      const notifObj: NotificationPreferences = {
        ...currentNotif,
        dailyDigest,
        bookingAlerts,
        paymentConfirmations,
        departureReminders,
        staffAnnouncements,
        inAppNotifications,
        notificationSound,
        frequency
      };

      await settingsService.updateProfile({
        uiSettings: uiSettingsObj,
        notificationPreferences: notifObj
      });

      // Local storage persistence
      localStorage.setItem("yc_theme", theme);
      localStorage.setItem("yc_theme_preset", themePreset);

      await checkAuth();
      onRefresh();
      toast.success("UI & Notification preferences updated!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const presets = [
    { id: "ocean-blue", label: "Ocean Blue", color: "bg-blue-600" },
    { id: "forest-green", label: "Forest Green", color: "bg-emerald-600" },
    { id: "sunset-orange", label: "Sunset Orange", color: "bg-orange-500" },
    { id: "modern-purple", label: "Modern Purple", color: "bg-purple-600" }
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      {/* Section A: Appearance */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Palette className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-bold text-slate-900">Appearance & Theme Customization</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Light / Dark Mode */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Interface Theme</Label>
            <div className="flex items-center gap-4 pt-1">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex-1 p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                  theme === "light" ? "border-orange-500 bg-orange-50/50 ring-1 ring-orange-500" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Sun className="w-4 h-4 text-amber-500" /> Light Mode
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex-1 p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                  theme === "dark" ? "border-orange-500 bg-slate-900 text-white ring-1 ring-orange-500" : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Moon className="w-4 h-4 text-indigo-400" /> Dark Mode
                </div>
              </button>
            </div>
          </div>

          {/* Theme Preset */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Color Palette Preset</Label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setThemePreset(p.id as any)}
                  className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                    themePreset === p.id ? "border-orange-500 bg-orange-50/40 text-slate-900" : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${p.color} shrink-0`} />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Font Size</Label>
            <RadioGroup value={fontSize} onValueChange={(val: any) => setFontSize(val)} className="flex items-center gap-4 pt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="f-small" />
                <Label htmlFor="f-small" className="text-xs font-semibold cursor-pointer">Small (12px)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="f-normal" />
                <Label htmlFor="f-normal" className="text-xs font-semibold cursor-pointer">Normal (14px)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="f-large" />
                <Label htmlFor="f-large" className="text-xs font-semibold cursor-pointer">Large (16px)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* List Density */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Data Table Density</Label>
            <RadioGroup value={listView} onValueChange={(val: any) => setListView(val)} className="flex items-center gap-4 pt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="l-compact" />
                <Label htmlFor="l-compact" className="text-xs font-semibold cursor-pointer">Compact (High density)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="l-detailed" />
                <Label htmlFor="l-detailed" className="text-xs font-semibold cursor-pointer">Detailed (Spacious)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Section B: Notifications */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bell className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-bold text-slate-900">Notification Alerts & Email Preferences</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <Label className="text-xs font-bold text-slate-800">Daily Digest Email</Label>
              <p className="text-[11px] text-slate-500">Summary of departures and daily bookings every morning at 8 AM</p>
            </div>
            <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-800">Real-Time Booking Alerts</Label>
              <p className="text-[11px] text-slate-500">Instant notification when a new customer submits a booking</p>
            </div>
            <Switch checked={bookingAlerts} onCheckedChange={setBookingAlerts} />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-800">Payment Confirmations</Label>
              <p className="text-[11px] text-slate-500">Alerts when payments or station handovers are completed</p>
            </div>
            <Switch checked={paymentConfirmations} onCheckedChange={setPaymentConfirmations} />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-800">Departure Reminders</Label>
              <p className="text-[11px] text-slate-500">Upcoming trip readiness alerts (7 days & 1 day before date)</p>
            </div>
            <Switch checked={departureReminders} onCheckedChange={setDepartureReminders} />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-800">In-App Notification Sounds</Label>
              <p className="text-[11px] text-slate-500">Play a subtle bell sound on urgent system tasks</p>
            </div>
            <Switch checked={notificationSound} onCheckedChange={setNotificationSound} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSaving}
          className="h-9 px-5 text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save UI & Notifications
        </Button>
      </div>
    </form>
  );
}
