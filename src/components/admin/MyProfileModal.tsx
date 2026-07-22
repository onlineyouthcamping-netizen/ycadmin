import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, Lock, Phone, Mail, Award, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { adminUsersService } from "@/services/adminUsers.service";
import { useAuthStore } from "@/store/auth.store";
import { Admin } from "@/types";
import { toast } from "sonner";

interface MyProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "profile" | "password";
}

export function MyProfileModal({ open, onOpenChange, defaultTab = "profile" }: MyProfileModalProps) {
  const { admin: authAdmin, checkAuth } = useAuthStore();
  const [profile, setProfile] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Editable fields
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMyProfile();
    }
  }, [open]);

  const fetchMyProfile = async () => {
    try {
      setIsLoading(true);
      const data = await adminUsersService.getMyProfile();
      setProfile(data);
      setPhone(data.phone || "");
      setAvatarUrl(data.avatarUrl || "");
      setNotifEmail(data.notificationPreferences?.email ?? true);
      setNotifWhatsapp(data.notificationPreferences?.whatsapp ?? true);
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      toast.error("Failed to load profile details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await adminUsersService.updateMyProfile({
        phone,
        avatarUrl,
        notificationPreferences: {
          email: notifEmail,
          whatsapp: notifWhatsapp
        }
      });
      await checkAuth(); // Refresh auth store state
      toast.success("Profile updated successfully!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      toast.error("New password must be at least 4 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsSavingPassword(true);
      await adminUsersService.updateMyPassword({
        currentPassword,
        newPassword
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const email = (authAdmin?.email || '').toLowerCase().trim();
  const isFounder = email.includes('hemal') || email === 'hemal.patel@youthcamping.online';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-extrabold text-sm">
              {profile?.name?.charAt(0)?.toUpperCase() || "Y"}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white leading-snug">
                {profile?.name || authAdmin?.name || "My Account Profile"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 font-medium">
                {profile?.email || authAdmin?.email || "Personal System Settings & Credentials"}
              </DialogDescription>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-white/10 text-slate-300 uppercase tracking-wider border border-white/10">
            {profile?.role === 'superadmin' ? 'Founder' : (profile?.role?.toUpperCase() || 'STAFF')}
          </span>
        </div>

        {isLoading ? (
          <div className="h-72 flex items-center justify-center space-x-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-semibold">Loading profile data...</span>
          </div>
        ) : (
          <Tabs defaultValue={defaultTab} className="w-full">
            <div className="px-6 border-b border-slate-100 bg-slate-50/50">
              <TabsList className="bg-transparent h-11 p-0 space-x-6">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-none rounded-none font-bold text-xs text-slate-500 px-1 py-2.5 h-full"
                >
                  <User className="w-3.5 h-3.5 mr-1.5" />
                  My Personal Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="password" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-none rounded-none font-bold text-xs text-slate-500 px-1 py-2.5 h-full"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                  Change Password
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Tab Content */}
            <TabsContent value="profile" className="p-6 m-0 space-y-5">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Fixed Non-Editable Overview Bar */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Assigned Role</span>
                    <span className="text-xs font-bold text-slate-800 capitalize flex items-center gap-1.5 mt-0.5">
                      <Shield className="w-3.5 h-3.5 text-orange-500" />
                      {profile?.role === 'superadmin' ? 'Founder (Full System Owner)' : profile?.role}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Account Status</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Active & Authorized
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Full Name</Label>
                    <div className="relative">
                      <Input 
                        value={profile?.name || ""} 
                        disabled 
                        className="bg-slate-100/70 border-slate-200 text-xs font-semibold text-slate-700 cursor-not-allowed" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                    <div className="relative">
                      <Input 
                        value={profile?.email || ""} 
                        disabled 
                        className="bg-slate-100/70 border-slate-200 text-xs font-semibold text-slate-700 cursor-not-allowed" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Phone Number (Editable)</Label>
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+91 9876543210" 
                      className="border-slate-200 text-xs font-medium text-slate-800 focus-visible:ring-orange-500" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Profile Photo URL (Editable)</Label>
                    <Input 
                      value={avatarUrl} 
                      onChange={(e) => setAvatarUrl(e.target.value)} 
                      placeholder="https://..." 
                      className="border-slate-200 text-xs font-medium text-slate-800 focus-visible:ring-orange-500" 
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-2 space-y-3 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800 block">Notification Preferences</span>
                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-700">System & Operational Emails</p>
                      <p className="text-[10px] text-slate-400">Receive departure and booking updates</p>
                    </div>
                    <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-700">WhatsApp Alert Notifications</p>
                      <p className="text-[10px] text-slate-400">Receive instant alerts for key actions</p>
                    </div>
                    <Switch checked={notifWhatsapp} onCheckedChange={setNotifWhatsapp} />
                  </div>
                </div>

                {/* Privacy Safeguard Notice */}
                {!isFounder && (
                  <div className="p-3 rounded-md bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-800 text-[11px] font-medium leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Confidentiality Notice:</strong> Role assignments, designations, salary data, and staff profiles are strictly managed by Hemal Patel (Founder).
                    </div>
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs font-semibold">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs">
                    {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Save My Profile Changes
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Password Tab Content */}
            <TabsContent value="password" className="p-6 m-0 space-y-4">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Current Password</Label>
                  <Input 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    placeholder="Enter current password" 
                    className="border-slate-200 text-xs focus-visible:ring-orange-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">New Password</Label>
                  <Input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Enter at least 4 characters" 
                    className="border-slate-200 text-xs focus-visible:ring-orange-500" 
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Confirm New Password</Label>
                  <Input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Re-enter new password" 
                    className="border-slate-200 text-xs focus-visible:ring-orange-500" 
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs font-semibold">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSavingPassword} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs">
                    {isSavingPassword && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
