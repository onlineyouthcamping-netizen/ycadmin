import React from "react";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  showBreadcrumbs?: boolean;
}

export function AdminPageHeader({ title, description, actions, showBreadcrumbs = false }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-4">
      <div className="space-y-1 min-w-0">
        {showBreadcrumbs && <AdminBreadcrumbs />}
        <h1 className="text-xl sm:text-2xl font-light text-slate-900 tracking-tight leading-snug">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-slate-500 font-normal leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
