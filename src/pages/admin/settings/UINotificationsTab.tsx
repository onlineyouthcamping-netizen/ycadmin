import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sun, Moon, Palette, Bell, Save, Loader2 } from "lucide-react";
import { Admin, NotificationPreferences, UISettings } from "@/types";
import { settingsService } from "@/services/settings.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

interface UINotificationsTabProps {
  profile: Admin;
  onRefresh: () => void;
}

export function applyUIThemeSettings({
  theme,
  themePreset,
  fontSize,
  listView
}: {
  theme?: 'light' | 'dark';
  themePreset?: string;
  fontSize?: 'small' | 'normal' | 'large';
  listView?: 'compact' | 'detailed';
}) {
  const root = document.documentElement;

  if (theme) {
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('yc_theme', theme);
  }

  if (themePreset) {
    root.setAttribute('data-color', themePreset);
    localStorage.setItem('yc_theme_preset', themePreset);
  }

  if (fontSize) {
    const fontSizes = { small: '12px', normal: '14px', large: '16px' };
    root.setAttribute('data-font-size', fontSize);
    root.style.fontSize = fontSizes[fontSize] || '14px';
    localStorage.setItem('yc_font_size', fontSize);
  }

  if (listView) {
    root.setAttribute('data-density', listView);
    localStorage.setItem('yc_table_density', listView);
  }
}

export function UINotificationsTab({ profile, onRefresh }: UINotificationsTabProps) {
  const { checkAuth } = useAuthStore();
  const currentUi: UISettings = profile.uiSettings || {};
  const currentNotif: NotificationPreferences = profile.notificationPreferences || {};

  // Appearance State
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    (localStorage.getItem('yc_theme') as any) || currentUi.theme || 'light'
  );
  const [themePreset, setThemePresetState] = useState<'ocean-blue' | 'forest-green' | 'sunset-orange' | 'modern-purple'>(
    (localStorage.getItem('yc_theme_preset') as any) || currentUi.themePreset || 'ocean-blue'
  );
  const [fontSize, setFontSizeState] = useState<'small' | 'normal' | 'large'>(
    (localStorage.getItem('yc_font_size') as any) || currentUi.fontSize || 'normal'
  );
  const [listView, setListViewState] = useState<'compact' | 'detailed'>(
    (localStorage.getItem('yc_table_density') as any) || currentUi.listView || 'detailed'
  );

  // Notification Preferences State
  const [dailyDigest, setDailyDigest] = useState(currentNotif.dailyDigest ?? true);
  const [bookingAlerts, setBookingAlerts] = useState(currentNotif.bookingAlerts ?? true);
  const [paymentConfirmations, setPaymentConfirmations] = useState(currentNotif.paymentConfirmations ?? true);
  const [departureReminders, setDepartureReminders] = useState(currentNotif.departureReminders ?? true);
  const [inAppNotifications, setInAppNotifications] = useState(currentNotif.inAppNotifications ?? true);
  const [notificationSound, setNotificationSound] = useState(currentNotif.notificationSound ?? true);
  const [frequency] = useState<'real-time' | 'hourly' | 'daily'>(currentNotif.frequency || 'real-time');

  const [isSaving, setIsSaving] = useState(false);

  // Apply saved theme settings on initial mount
  useEffect(() => {
    applyUIThemeSettings({ theme, themePreset, fontSize, listView });
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    applyUIThemeSettings({ theme: newTheme });
  };

  const handleThemePresetChange = (newPreset: 'ocean-blue' | 'forest-green' | 'sunset-orange' | 'modern-purple') => {
    setThemePresetState(newPreset);
    applyUIThemeSettings({ themePreset: newPreset });
  };

  const handleFontSizeChange = (newSize: 'small' | 'normal' | 'large') => {
    setFontSizeState(newSize);
    applyUIThemeSettings({ fontSize: newSize });
  };

  const handleTableDensityChange = (newDensity: 'compact' | 'detailed') => {
    setListViewState(newDensity);
    applyUIThemeSettings({ listView: newDensity });
  };

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
        inAppNotifications,
        notificationSound,
        frequency
      };

      await settingsService.updateProfile({
        uiSettings: uiSettingsObj,
        notificationPreferences: notifObj
      });

      await checkAuth();
      onRefresh();
      toast.success("UI & Notification preferences updated and saved!");
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
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Palette className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Appearance & Theme Customization</h3>
        </div>

        <div className="space-y-6">
          {/* Light / Dark Mode - Responsive Grid */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Interface Theme</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                  theme === "light" ? "border-orange-500 bg-orange-50/50 ring-1 ring-orange-500" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800">
                  <Sun className="w-4 h-4 text-amber-500" /> Light Mode
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                  theme === "dark" ? "border-orange-500 bg-slate-900 text-white ring-1 ring-orange-500" : "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                  <Moon className="w-4 h-4 text-indigo-400" /> Dark Mode
                </div>
              </button>
            </div>
          </div>

          {/* Color Palette Preset - 2 cols on mobile, 4 on desktop */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Color Palette Preset</Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleThemePresetChange(p.id as any)}
                  className={`p-2.5 rounded-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                    themePreset === p.id ? "border-orange-500 bg-orange-50/40 text-slate-900 dark:text-white" : "border-slate-200 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${p.color} shrink-0`} />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size - Responsive Flex Column on mobile, Row on sm */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Font Size</Label>
            <RadioGroup value={fontSize} onValueChange={(val: any) => handleFontSizeChange(val)} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="f-small" />
                <Label htmlFor="f-small" className="text-xs sm:text-sm font-semibold cursor-pointer text-slate-800 dark:text-slate-300">Small (12px)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="f-normal" />
                <Label htmlFor="f-normal" className="text-xs sm:text-sm font-semibold cursor-pointer text-slate-800 dark:text-slate-300">Normal (14px)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="f-large" />
                <Label htmlFor="f-large" className="text-xs sm:text-sm font-semibold cursor-pointer text-slate-800 dark:text-slate-300">Large (16px)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data Table Density - Responsive Flex Column on mobile, Row on sm */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">Data Table Density</Label>
            <RadioGroup value={listView} onValueChange={(val: any) => handleTableDensityChange(val)} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="l-compact" />
                <Label htmlFor="l-compact" className="text-xs sm:text-sm font-semibold cursor-pointer text-slate-800 dark:text-slate-300">Compact (High density)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="l-detailed" />
                <Label htmlFor="l-detailed" className="text-xs sm:text-sm font-semibold cursor-pointer text-slate-800 dark:text-slate-300">Detailed (Spacious)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Section B: Notifications */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Bell className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Notification Alerts & Email Preferences</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex-1">
              <Label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Daily Digest Email</Label>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Summary of departures and daily bookings every morning at 8 AM</p>
            </div>
            <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} className="shrink-0" />
          </div>

          <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex-1">
              <Label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Real-Time Booking Alerts</Label>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Instant notification when a new customer submits a booking</p>
            </div>
            <Switch checked={bookingAlerts} onCheckedChange={setBookingAlerts} className="shrink-0" />
          </div>

          <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex-1">
              <Label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Payment Confirmations</Label>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Alerts when payments or station handovers are completed</p>
            </div>
            <Switch checked={paymentConfirmations} onCheckedChange={setPaymentConfirmations} className="shrink-0" />
          </div>

          <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex-1">
              <Label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Departure Reminders</Label>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upcoming trip readiness alerts (7 days & 1 day before date)</p>
            </div>
            <Switch checked={departureReminders} onCheckedChange={setDepartureReminders} className="shrink-0" />
          </div>

          <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
            <div className="flex-1">
              <Label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">In-App Notification Sounds</Label>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Play a subtle bell sound on urgent system tasks</p>
            </div>
            <Switch checked={notificationSound} onCheckedChange={setNotificationSound} className="shrink-0" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          id="settings-tab-save-btn"
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto h-10 sm:h-9 px-6 text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#F97316] hover:bg-[#EA580C] text-white shadow-xs rounded-lg flex items-center gap-1.5"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
          SAVE UI & NOTIFICATIONS
        </Button>
      </div>
    </form>
  );
}
