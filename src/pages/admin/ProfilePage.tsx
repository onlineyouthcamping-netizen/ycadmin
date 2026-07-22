import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/dialog";
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

export default function ProfilePage() {
  const { admin: authAdmin, checkAuth } = useAuthStore();
  const [profile, setProfile] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    fetchMyProfile();
  }, []);

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
      await checkAuth();
      toast.success("Profile updated successfully!");
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
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const email = (authAdmin?.email || '').toLowerCase().trim();
  const isFounder = email.includes('hemal') || email === 'hemal.patel@youthcamping.online';

  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const p = location.pathname;
    const search = new URLSearchParams(location.search);
    if (p.includes("change-password") || p.includes("security") || search.get("tab") === "password") {
      setActiveTab("password");
    } else if (p.includes("settings") || search.get("tab") === "settings") {
      setActiveTab("profile");
    } else {
      setActiveTab("profile");
    }
  }, [location]);

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center space-x-2 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm font-semibold">Loading profile information...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <img 
              src={avatarUrl || authAdmin?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} 
              alt={profile?.name} 
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{profile?.name || authAdmin?.name}</h1>
            <p className="text-xs text-slate-500 font-medium">{profile?.email || authAdmin?.email}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-slate-900 text-white uppercase tracking-wider">
                {profile?.role === 'superadmin' ? 'Founder' : (profile?.role || 'STAFF')}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Active Account
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Tabs defaultValue="profile" className="w-full">
          <div className="px-6 border-b border-slate-200 bg-slate-50/50">
            <TabsList className="bg-transparent h-12 p-0 space-x-6">
              <TabsTrigger 
                value="profile" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-slate-900 rounded-none font-bold text-xs text-slate-500 px-1 py-3 h-full"
              >
                <User className="w-4 h-4 mr-2" />
                My Account Profile
              </TabsTrigger>
              <TabsTrigger 
                value="password" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-slate-900 rounded-none font-bold text-xs text-slate-500 px-1 py-3 h-full"
              >
                <Lock className="w-4 h-4 mr-2" />
                Security & Password
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="p-6 m-0 space-y-6">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Full Name</Label>
                  <Input value={profile?.name || ""} disabled className="bg-slate-100/70 border-slate-200 text-xs font-semibold text-slate-700 cursor-not-allowed" />
                  <p className="text-[10px] text-slate-400">Name is locked for security records</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                  <Input value={profile?.email || ""} disabled className="bg-slate-100/70 border-slate-200 text-xs font-semibold text-slate-700 cursor-not-allowed" />
                  <p className="text-[10px] text-slate-400">Email is linked to system authentication</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Phone Number (Editable)</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" className="border-slate-200 text-xs font-medium text-slate-800 focus-visible:ring-orange-500" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Profile Photo URL (Editable)</Label>
                  <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="border-slate-200 text-xs font-medium text-slate-800 focus-visible:ring-orange-500" />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-900">Communication & Notification Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Email Notifications</p>
                      <p className="text-[10px] text-slate-500">Departure and system task updates</p>
                    </div>
                    <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                    <div>
                      <p className="text-xs font-bold text-slate-800">WhatsApp Instant Alerts</p>
                      <p className="text-[10px] text-slate-500">Priority operational alerts</p>
                    </div>
                    <Switch checked={notifWhatsapp} onCheckedChange={setNotifWhatsapp} />
                  </div>
                </div>
              </div>

              {!isFounder && (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs font-medium leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Staff Privacy Policy:</strong> System roles, access permissions, salary history, and official employment documents are strictly controlled by Founder Hemal Patel.
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 h-9">
                  {isSaving && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                  Save Profile Settings
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password" className="p-6 m-0 space-y-6">
            <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="border-slate-200 text-xs focus-visible:ring-orange-500" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter at least 4 characters" className="border-slate-200 text-xs focus-visible:ring-orange-500" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" className="border-slate-200 text-xs focus-visible:ring-orange-500" />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isSavingPassword} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 h-9">
                  {isSavingPassword && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
