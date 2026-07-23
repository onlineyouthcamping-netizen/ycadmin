import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AdminPageContainer } from "@/components/admin/layout/AdminPageContainer";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { SETTINGS_TABS, SettingsTabId, isTabVisible } from "./settings/constants/tabs";
import { MyAccountTab } from "./settings/MyAccountTab";
import { UINotificationsTab } from "./settings/UINotificationsTab";
import { SecurityPasswordTab } from "./settings/SecurityPasswordTab";
import { ConnectedDevicesTab } from "./settings/ConnectedDevicesTab";
import { PreferencesTab } from "./settings/PreferencesTab";
import { AuditActivityTab } from "./settings/AuditActivityTab";
import { APIKeysTab } from "./settings/APIKeysTab";
import { DataPrivacyTab } from "./settings/DataPrivacyTab";
import { BillingTab } from "./settings/BillingTab";
import { IntegrationsTab } from "./settings/IntegrationsTab";
import { settingsService } from "@/services/settings.service";
import { useAuthStore } from "@/store/auth.store";
import { Admin } from "@/types";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { admin: authAdmin } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTabId>("account");

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const tabParam = searchParams.get("tab") as SettingsTabId;

    if (tabParam && SETTINGS_TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    } else if (path.includes("security") || path.includes("change-password")) {
      setActiveTab("security");
    } else if (path.includes("profile")) {
      setActiveTab("account");
    } else {
      setActiveTab("account");
    }
  }, [location, searchParams]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await settingsService.getProfile();
      setProfile(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load profile settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  if (isLoading || !profile) {
    return (
      <AdminPageContainer fullWidth={true}>
        <div className="h-96 flex items-center justify-center space-x-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          <span className="text-sm font-semibold">Loading YouthCamping OS Settings...</span>
        </div>
      </AdminPageContainer>
    );
  }

  const role = profile.role || authAdmin?.role || "admin";
  const email = profile.email || authAdmin?.email || "";
  const visibleTabs = SETTINGS_TABS.filter((t) => isTabVisible(t, role, email));

  return (
    <AdminPageContainer fullWidth={true}>
      <AdminPageHeader
        title="Settings & System Preferences"
        description="Manage your account profile, UI themes, security, connected devices, and system defaults"
      />

      {/* Top Tab Scrollable Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs mb-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max border-b border-slate-100 px-3">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold transition-all border-b-2 ${
                  isActive
                    ? "border-orange-500 text-orange-600 bg-orange-50/40"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-orange-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Tab Module */}
      <div className="transition-all">
        {activeTab === "account" && <MyAccountTab profile={profile} onRefresh={fetchProfile} />}
        {activeTab === "ui-notifications" && <UINotificationsTab profile={profile} onRefresh={fetchProfile} />}
        {activeTab === "security" && <SecurityPasswordTab profile={profile} onRefresh={fetchProfile} />}
        {activeTab === "devices" && <ConnectedDevicesTab />}
        {activeTab === "preferences" && <PreferencesTab profile={profile} onRefresh={fetchProfile} />}
        {activeTab === "audit" && <AuditActivityTab />}
        {activeTab === "api-keys" && <APIKeysTab />}
        {activeTab === "privacy" && <DataPrivacyTab profile={profile} onRefresh={fetchProfile} />}
        {activeTab === "billing" && <BillingTab />}
        {activeTab === "integrations" && <IntegrationsTab />}
      </div>
    </AdminPageContainer>
  );
}
