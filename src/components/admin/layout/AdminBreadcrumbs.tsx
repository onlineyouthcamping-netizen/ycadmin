import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { ADMIN_ROUTES } from "@/config/routes.config";

export function AdminBreadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  if (path === "/admin" || path === "/") {
    return null;
  }

  // Match current route or detail route
  const currentRoute = ADMIN_ROUTES.find(r => {
    if (r.path === path) return true;
    if (r.path.includes(":") && path.startsWith(r.path.split(":")[0])) return true;
    return false;
  });

  const labels = currentRoute?.breadcrumbLabel.split(" / ") || ["Admin", "Page"];

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1 truncate">
      <Link to="/admin" className="hover:text-slate-800 flex items-center gap-1 transition-colors">
        <Home className="w-3.5 h-3.5 text-slate-400" />
      </Link>
      {labels.map((lbl, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3 h-3 text-slate-350 shrink-0" />
          <span className={idx === labels.length - 1 ? "font-bold text-slate-800 truncate" : "hover:text-slate-700"}>
            {lbl}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}
