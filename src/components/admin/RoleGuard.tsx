import React from "react";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission } from "@/lib/permissions";

interface RoleGuardProps {
  allowedRoles?: string[];
  permission?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  permission,
  children, 
  fallback = null 
}) => {
  const { admin } = useAuthStore();

  if (!admin) {
    return <>{fallback}</>;
  }

  // 1. If permission is specified, check via the new permission system
  if (permission) {
    const isAllowed = hasPermission(admin.permissions, permission, admin.role);
    if (!isAllowed) return <>{fallback}</>;
  }

  // 2. If allowedRoles is specified, fallback check role list
  if (allowedRoles && allowedRoles.length > 0) {
    const roleMatch = allowedRoles.map(r => r.toLowerCase()).includes(admin.role.toLowerCase());
    if (!roleMatch && admin.role.toLowerCase() !== "superadmin") {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export const RequireRole: React.FC<RoleGuardProps> = ({ allowedRoles, permission, children, fallback }) => {
  return (
    <RoleGuard allowedRoles={allowedRoles} permission={permission} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

export const RequirePermission: React.FC<{
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, children, fallback = null }) => {
  return (
    <RoleGuard permission={permission} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

