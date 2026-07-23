import React from "react";
import { Laptop, Smartphone, Globe, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginSession } from "@/types";

interface SessionTableProps {
  sessions: LoginSession[];
  onLogoutSession: (sessionId: string) => void;
  onLogoutAllOthers: () => void;
  isLoading?: boolean;
}

export function SessionTable({ sessions, onLogoutSession, onLogoutAllOthers, isLoading }: SessionTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800">Active Login Sessions</h4>
          <p className="text-[11px] text-slate-500">Devices currently logged into your YouthCamping account</p>
        </div>
        {sessions.length > 1 && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onLogoutAllOthers}
            disabled={isLoading}
            className="h-8 text-xs font-semibold px-3 bg-rose-600 hover:bg-rose-700"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Sign Out All Other Devices
          </Button>
        )}
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-4">Device</th>
              <th className="py-2.5 px-4">Location & IP</th>
              <th className="py-2.5 px-4">Last Activity</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {sessions.map((sess) => (
              <tr key={sess.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      {sess.deviceName.toLowerCase().includes("mobile") || sess.deviceName.toLowerCase().includes("iphone") ? (
                        <Smartphone className="w-4 h-4 text-slate-600" />
                      ) : (
                        <Laptop className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span>{sess.deviceName}</span>
                        {sess.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Current Device
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sess.location}</span>
                    <span className="text-slate-400 font-mono text-[11px]">({sess.ipAddress})</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-500 font-medium">
                  {new Date(sess.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-3 px-4 text-right">
                  {sess.isCurrent ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Active Now
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onLogoutSession(sess.id)}
                      disabled={isLoading}
                      className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold"
                    >
                      Sign Out
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
