import React from "react";
import { History, UserCheck, Layout, Edit, Globe } from "lucide-react";

export interface ActivityItem {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  iconType?: "layout" | "publish" | "edit";
}

interface ActivityFeedCardProps {
  activities?: ActivityItem[];
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    action: "Homepage Hero section updated",
    user: "Hemal",
    timestamp: "2 hours ago",
    iconType: "layout",
  },
  {
    id: "act-2",
    action: "Published Manali Trek Journal Article",
    user: "Hetvi",
    timestamp: "5 hours ago",
    iconType: "publish",
  },
  {
    id: "act-3",
    action: "Updated Footer Office Address & Links",
    user: "Parth",
    timestamp: "Yesterday, 4:15 PM",
    iconType: "edit",
  },
  {
    id: "act-4",
    action: "Auto-invalidated CDN Edge Cache",
    user: "System",
    timestamp: "2 days ago",
    iconType: "publish",
  },
];

export function ActivityFeedCard({ activities = DEFAULT_ACTIVITIES }: ActivityFeedCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          <History className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-[#0B1528]">Last Activity</h3>
          <p className="text-xs text-slate-500 font-medium">Recent published edits</p>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {activities.slice(0, 4).map((act) => (
          <div key={act.id} className="flex items-start gap-3 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#D4541A] mt-1.5 shrink-0" />
            <div className="space-y-0.5 min-w-0 flex-1">
              <p className="font-bold text-[#0B1528] leading-snug">{act.action}</p>
              <p className="text-[11px] text-slate-400 font-medium">
                by <span className="text-slate-600 font-semibold">{act.user}</span> • {act.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
