import React from "react";
import { CheckCircle2, ShieldCheck, Globe, Zap } from "lucide-react";

export function SiteStatusCard() {
  const statusItems = [
    { label: "Domain configured", icon: Globe, detail: "youthcamping.online" },
    { label: "SSL certificate active", icon: ShieldCheck, detail: "TLS 1.3 Encryption" },
    { label: "CDN enabled", icon: Zap, detail: "Global Edge Caching" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-[#0B1528]">Site Status</h3>
          <p className="text-xs text-slate-500 font-medium">Core infrastructure checks</p>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {statusItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-[#0B1528]">{item.label}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-medium">
              {item.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
