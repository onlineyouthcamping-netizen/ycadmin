import React, { useState, useEffect } from "react";
import { Laptop, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionTable } from "./components/SessionTable";
import { LoginSession } from "@/types";
import { settingsService } from "@/services/settings.service";
import { toast } from "sonner";

export function ConnectedDevicesTab() {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const list = await settingsService.getSessions();
      setSessions(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      await settingsService.logoutSession(sessionId);
      toast.success("Signed out device session");
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to logout session");
    }
  };

  const handleLogoutAllOthers = async () => {
    try {
      const closed = await settingsService.logoutAllExceptCurrent();
      toast.success(`Signed out of ${closed} other device sessions`);
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to logout other devices");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Connected Devices & Active Sessions</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            className="h-8 text-xs font-semibold border-slate-300 w-full sm:w-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Refresh Sessions
          </Button>
        </div>

        <SessionTable
          sessions={sessions}
          onLogoutSession={handleLogoutSession}
          onLogoutAllOthers={handleLogoutAllOthers}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
