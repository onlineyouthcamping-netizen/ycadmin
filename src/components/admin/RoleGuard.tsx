import React from "react";
import { useAuthStore } from "@/store/auth.store";
import { hasPermission } from "@/lib/permissions";

interface RoleGuardProps {
  requiredPermission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  requiredPermission, 
  children, 
  fallback = null 
}) => {
  const { admin } = useAuthStore();

  if (!admin) {
    return <>{fallback}</>;
  }

  const isAllowed = hasPermission(admin.role, requiredPermission);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export const RequireRole: React.FC<RoleGuardProps> = ({ requiredPermission, children, fallback }) => {
  return (
    <RoleGuard requiredPermission={requiredPermission} fallback={fallback}>
      {children}
    </RoleGuard>
  );
};

