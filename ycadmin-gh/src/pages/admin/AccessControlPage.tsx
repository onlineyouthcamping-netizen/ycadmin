import { Shield, Check, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

const PERMISSION_LABELS: Record<string, string> = {
  'dashboard.view': 'View Dashboard',
  'trips.view': 'View Trips',
  'trips.create': 'Create Trips',
  'trips.edit': 'Edit Trips',
  'trips.publish': 'Publish Trips',
  'trips.archive': 'Archive Trips',
  'trips.delete': 'Permanently Delete Trips',
  'bookings.view': 'View Bookings',
  'bookings.create': 'Create Bookings',
  'bookings.edit': 'Edit Bookings',
  'bookings.approve': 'Approve Bookings',
  'bookings.reject': 'Reject Bookings',
  'payments.view': 'View Payments',
  'payments.edit': 'Edit Payments',
  'inquiries.view': 'View Inquiries',
  'inquiries.create': 'Create Inquiries',
  'inquiries.edit': 'Edit Inquiries',
  'quotations.view': 'View Quotations',
  'quotations.create': 'Create Quotations',
  'quotations.edit': 'Edit Quotations',
  'customers.view': 'View Customer Data',
  'customers.export': 'Export Customers',
  'pagebuilder.view': 'View PageBuilder',
  'pagebuilder.edit': 'Edit PageBuilder',
  'seo.view': 'View SEO Metadata',
  'seo.edit': 'Edit SEO Metadata',
  'guides.view': 'View Guides Roster',
  'guides.manage': 'Manage Guides',
  'operations.view': 'View Operations',
  'operations.edit': 'Edit Operations Fields',
  'reports.view': 'View Finance Reports',
  'reports.export': 'Export Reports',
  'users.view': 'View Admin Users',
  'users.manage': 'Manage Admin Users',
  'roles.manage': 'Manage System Roles',
  'audit.view': 'View Audit Trails',
  'settings.view': 'View Settings',
  'settings.edit': 'Edit Settings'
};

const ROLES = ['superadmin', 'admin', 'sales', 'operations', 'finance', 'guide', 'viewer'] as const;

export default function AccessControlPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase tracking-tight">Access Control Matrix</h1>
        <p className="text-muted-foreground font-medium text-sm">System-wide role permissions and module restrictions mapping.</p>
      </div>

      <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 flex items-start gap-4 mb-6">
        <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 mb-1">Security Enforcement Active</h4>
          <p className="text-xs font-semibold text-slate-600 leading-relaxed">
            Only a Super Admin can change access permissions. All modifications to roles, permissions, or system credentials are fully logged in the Audit Trail and require JWT token invalidation on target accounts.
          </p>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-[32px] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b-2">
              <TableRow>
                <TableHead className="font-black uppercase tracking-wider text-[11px] py-4 pl-6 text-slate-900">Module Permission</TableHead>
                {ROLES.map((role) => (
                  <TableHead key={role} className="font-black uppercase tracking-wider text-[10px] text-center text-slate-900">
                    <div className="flex flex-col items-center gap-1">
                      <Shield className={`w-4 h-4 ${role === 'superadmin' ? 'text-rose-500' : 'text-primary'}`} />
                      <span>{role}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(PERMISSION_LABELS).map(([permissionKey, label]) => (
                <TableRow key={permissionKey} className="hover:bg-slate-50/50 transition-colors border-b">
                  <TableCell className="font-bold text-xs py-4 pl-6 text-slate-700">
                    <div className="flex flex-col">
                      <span>{label}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{permissionKey}</span>
                    </div>
                  </TableCell>
                  {ROLES.map((role) => {
                    const hasPerm = role === 'superadmin' || ROLE_PERMISSIONS[role]?.includes(permissionKey);
                    return (
                      <TableCell key={role} className="text-center">
                        <div className="flex justify-center">
                          {hasPerm ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
