import { useState, useEffect } from "react";
import { adminUsersService } from "@/services/adminUsers.service";
import { Admin, AdminRole } from "@/types";
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Key,
  Calendar,
  Lock,
  Mail,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const ROLES: { value: AdminRole; label: string; desc: string }[] = [
  { value: 'superadmin', label: 'Super Admin', desc: 'Full unrestricted system access' },
  { value: 'admin', label: 'Admin', desc: 'Manage trips, bookings, reports (No users/settings)' },
  { value: 'sales', label: 'Sales', desc: 'View and manage own bookings, leads and quotes only' },
  { value: 'operations', label: 'Operations', desc: 'View trip rosters, assign guides and rooms' },
  { value: 'finance', label: 'Finance', desc: 'View payments, GST, process invoice updates' },
  { value: 'guide', label: 'Guide', desc: 'Read assigned trips operations, meal preferences' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access to approved system modules' }
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create user dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("admin");
  const [isCreating, setIsCreating] = useState(false);

  // Reset password dialog state
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Admin | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await adminUsersService.listAdmins();
      setUsers(data);
    } catch (error: any) {
      console.error("Failed to fetch admins:", error);
      toast.error(error.response?.data?.message || "Failed to load admin users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword || !newRole) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsCreating(true);
      await adminUsersService.createAdmin({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole
      });
      toast.success("Admin user created successfully");
      setCreateOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("admin");
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to create admin:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: AdminRole) => {
    try {
      await adminUsersService.updateAdminRole(userId, role);
      toast.success(`Role updated successfully to ${role}`);
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to update role:", error);
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const res = await adminUsersService.toggleAdminActive(userId);
      toast.success(`User account is now ${res.isActive ? 'active' : 'inactive'}`);
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to toggle status:", error);
      toast.error(error.response?.data?.message || "Failed to change active status");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordVal) {
      toast.error("Please enter a new password");
      return;
    }

    try {
      setIsResetting(true);
      await adminUsersService.resetAdminPassword(selectedUser.id, resetPasswordVal);
      toast.success(`Password reset successfully for ${selectedUser.name}`);
      setResetOpen(false);
      setSelectedUser(null);
      setResetPasswordVal("");
    } catch (error: any) {
      console.error("Failed to reset password:", error);
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase tracking-tight">Admin Accounts</h1>
          <p className="text-muted-foreground font-medium text-sm">Manage roles, permissions, deactivation, and reset credentials.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="rounded-2xl font-bold uppercase text-[11px] tracking-wider h-11 px-5 flex items-center gap-2 shadow-md">
          <Plus className="w-4 h-4" /> Create User
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <Card key={user.id} className="rounded-3xl border-2 hover:border-primary transition-all overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user.role === 'superadmin' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                    {user.role === 'superadmin' ? <Shield className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg leading-none">{user.name}</h3>
                      {!user.isActive && (
                        <Badge variant="destructive" className="font-bold text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-bold mt-1">{user.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-8">
                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Access Level</p>
                    <Badge className={`
                      ${user.role === 'superadmin' ? 'bg-rose-500 hover:bg-rose-600' : 
                        user.role === 'admin' ? 'bg-blue-500 hover:bg-blue-600' : 
                        user.role === 'sales' ? 'bg-emerald-500 hover:bg-emerald-600' : 
                        user.role === 'operations' ? 'bg-violet-500 hover:bg-violet-600' : 
                        user.role === 'finance' ? 'bg-amber-500 hover:bg-amber-600' : 
                        user.role === 'guide' ? 'bg-orange-500 hover:bg-orange-600' : 
                        'bg-slate-500 hover:bg-slate-600'} 
                      text-white font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full
                    `}>
                      {user.role}
                    </Badge>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Last Login</p>
                    <p className="text-xs font-bold text-slate-700 flex items-center md:justify-end gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                    </p>
                  </div>

                  <div className="hidden md:block w-px h-10 bg-border mx-1" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-2xl border-2 p-2 shadow-2xl bg-white z-50">
                      <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground p-3">Account Actions</DropdownMenuLabel>
                      
                      {/* Toggle active status */}
                      <DropdownMenuItem 
                        onClick={() => handleToggleActive(user.id)}
                        className={`rounded-xl p-3 cursor-pointer ${user.isActive ? 'text-rose-500 hover:text-rose-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                        disabled={user.id === 'root_admin_bypass'}
                      >
                        {user.isActive ? (
                          <>
                            <XCircle className="w-4 h-4 mr-3" />
                            <span className="text-xs font-bold uppercase">Deactivate User</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-3" />
                            <span className="text-xs font-bold uppercase">Reactivate User</span>
                          </>
                        )}
                      </DropdownMenuItem>

                      {/* Reset password */}
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedUser(user);
                          setResetOpen(true);
                        }}
                        className="rounded-xl p-3 cursor-pointer"
                        disabled={user.id === 'root_admin_bypass'}
                      >
                        <Key className="w-4 h-4 mr-3 text-slate-500" />
                        <span className="text-xs font-bold uppercase">Reset Password</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2">Change Role</DropdownMenuLabel>
                      
                      {ROLES.filter(r => r.value !== user.role).map((roleObj) => (
                        <DropdownMenuItem
                          key={roleObj.value}
                          onClick={() => handleUpdateRole(user.id, roleObj.value)}
                          className="rounded-xl px-3 py-2 cursor-pointer"
                          disabled={user.id === 'root_admin_bypass'}
                        >
                          <span className="text-xs font-bold uppercase">{roleObj.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 rounded-[48px] border-2 border-dashed">
            <Users className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No users found</p>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl border-2 p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight text-xl flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Create Admin Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-semibold">
              Fill in credentials and choose an initial role mapping.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black uppercase tracking-wider text-slate-700">Full Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="John Doe"
                className="rounded-xl h-12 border-2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@youthcamping.in"
                  className="rounded-xl h-12 border-2 pl-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-slate-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl h-12 border-2 pl-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-black uppercase tracking-wider text-slate-700">System Role</Label>
              <select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as AdminRole)}
                className="w-full rounded-xl h-12 border-2 px-3 bg-white text-sm font-bold focus:outline-none focus:border-primary"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} - {r.desc}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl border-2 font-bold uppercase text-[10px] tracking-widest h-12">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12">
                {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-2 p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tight text-xl flex items-center gap-2">
              <Key className="w-5 h-5 text-rose-500" /> Reset Password
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-semibold">
              Enter a new password for <span className="font-bold text-slate-900">{selectedUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs font-black uppercase tracking-wider text-slate-700">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="new-password"
                  type="password"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl h-12 border-2 pl-11"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setResetOpen(false);
                setSelectedUser(null);
                setResetPasswordVal("");
              }} className="rounded-xl border-2 font-bold uppercase text-[10px] tracking-widest h-12">
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting} className="bg-rose-500 hover:bg-rose-600 rounded-xl font-bold uppercase text-[10px] tracking-widest h-12 text-white">
                {isResetting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
