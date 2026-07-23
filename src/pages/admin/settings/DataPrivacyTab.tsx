import React, { useState } from "react";
import { Database, Download, ShieldCheck, Trash2, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { Admin } from "@/types";
import { settingsService } from "@/services/settings.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

interface DataPrivacyTabProps {
  profile: Admin;
  onRefresh: () => void;
}

export function DataPrivacyTab({ profile }: DataPrivacyTabProps) {
  const { logout } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [marketingCookies, setMarketingCookies] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      await settingsService.exportUserDataJSON();
      toast.success("User data export started!");
    } catch (e) {
      toast.error("Failed to export data JSON");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    await settingsService.deleteAccount(password);
    toast.success("Account deactivated. Logging out...");
    logout();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Export Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-bold text-slate-900">Personal Data Export & Archival</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-800">Download Complete Account JSON</h4>
            <p className="text-[11px] text-slate-500">Export your user profile, assigned trips, and audit log history in JSON format.</p>
          </div>
          <Button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="h-9 px-4 text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white shrink-0"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {isExporting ? "Generating JSON..." : "Export My Data"}
          </Button>
        </div>
      </div>

      {/* Cookie & Compliance Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-bold text-slate-900">GDPR Compliance & Cookie Controls</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <Label className="text-xs font-bold text-slate-800">Essential Session Cookies</Label>
              <p className="text-[11px] text-slate-500">Required for system login and secure authentication tokens (Always On)</p>
            </div>
            <Switch checked={true} disabled />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-800">Analytics & Performance Cookies</Label>
              <p className="text-[11px] text-slate-500">Help us measure dashboard page load speeds and usability</p>
            </div>
            <Switch checked={analyticsCookies} onCheckedChange={setAnalyticsCookies} />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <div>
              <Label className="text-xs font-bold text-slate-800">Marketing & Campaign Cookies</Label>
              <p className="text-[11px] text-slate-500">Enable insights for public trip campaign promotions</p>
            </div>
            <Switch checked={marketingCookies} onCheckedChange={setMarketingCookies} />
          </div>
        </div>
      </div>

      {/* Account Deactivation */}
      <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-rose-700">Danger Zone: Permanent Account Deletion</h4>
            <p className="text-[11px] text-slate-500">Deactivate your account profile and revoke all active login tokens</p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="h-8 text-xs font-semibold px-3 bg-rose-600 hover:bg-rose-700"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete Account
          </Button>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
