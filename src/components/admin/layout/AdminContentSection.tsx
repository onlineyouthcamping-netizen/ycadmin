import React from "react";
import { cn } from "@/lib/utils";

interface AdminContentSectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AdminContentSection({ title, description, actions, children, className }: AdminContentSectionProps) {
  return (
    <section className={cn("bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div>
            {title && <h2 className="text-base font-normal text-slate-850 leading-snug">{title}</h2>}
            {description && <p className="text-xs text-slate-500 font-normal">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
