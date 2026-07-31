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

  const combinedPerms = Array.from(new Set([
    ...(admin.permissions || []),
    ...((admin as any).customPermissions || [])
  ]));

  // 1. If permission is specified, check via the permission system
  if (permission) {
    const isAllowed = hasPermission(combinedPerms, permission, admin.role);
    if (!isAllowed) return <>{fallback}</>;
  }

  // 2. If allowedRoles is specified, check permission or fallback role match
  if (allowedRoles && allowedRoles.length > 0) {
    const isSuperAdmin = admin.role?.toLowerCase() === "superadmin" || admin.role?.toLowerCase() === "admin";
    const roleMatch = allowedRoles.map(r => r.toLowerCase()).includes(admin.role.toLowerCase());
    if (!roleMatch && !isSuperAdmin && combinedPerms.length === 0) {
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

