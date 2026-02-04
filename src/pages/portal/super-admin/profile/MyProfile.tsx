// src/pages/portal/super-admin/profile/MyProfile.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Shield, Lock, Save, Edit2, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HeroBackground } from "@/components/ui/HeroBackground";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabase";

const MyProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({ first_name: "", last_name: "", phone: "", bio: "", avatar_url: "" });
  const [formData, setFormData] = useState(profileData);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => { if (user?.id) loadProfile(); }, [user?.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
      if (error) throw error;
      const profileInfo = { first_name: data?.first_name || "", last_name: data?.last_name || "", phone: data?.phone || "", bio: data?.bio || "", avatar_url: data?.avatar_url || "" };
      setProfileData(profileInfo);
      setFormData(profileInfo);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally { setLoading(false); }
  };

  const handleSaveProfile = async () => {
    if (!formData.first_name || !formData.last_name) { toast.error("Please fill in all required fields"); return; }
    try {
      setLoading(true);
      const { error } = await supabase.from("profiles").update(formData).eq("id", user?.id);
      if (error) throw error;
      setProfileData(formData);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) { toast.error("Please fill in all password fields"); return; }
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast.error("New passwords do not match"); return; }
    if (passwordData.newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally { setLoading(false); }
  };

  if (loading && !profileData.first_name) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}><Loader2 className="h-12 w-12 text-[#154279]" /></motion.div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap');
        body { font-family: 'Nunito', sans-serif; }
      `}</style>

      <div className="bg-slate-50 min-h-screen antialiased text-slate-900 font-nunito" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {/* HERO SECTION */}
        <section className="bg-gradient-to-r from-[#154279] to-[#0f325e] overflow-hidden py-10 shadow-lg mb-8 relative">
          <HeroBackground />
          <div className="max-w-[1400px] mx-auto px-6 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="md:w-1/2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 tracking-wide uppercase rounded-full border border-white/30">Super Admin</span>
                  <span className="text-blue-100 text-[10px] font-semibold uppercase tracking-widest">Account</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-[1.2] tracking-tight">
                  My <span className="text-[#F96302]">Profile</span>
                </h1>
                <p className="text-sm text-blue-100 leading-relaxed mb-8 max-w-lg font-medium">
                  Manage your account information and security settings. Update your profile and change password.
                </p>
              </div>
              <div className="md:w-1/2 w-full mt-6 md:mt-0 flex justify-end">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white max-w-xs w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-lg"><Shield className="w-6 h-6 text-white" /></div>
                    <div>
                      <div className="text-xs font-medium text-blue-100 uppercase tracking-wider">Account Status</div>
                      <div className="text-xl font-bold">Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-[1400px] mx-auto px-6 pb-20 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information Card */}
            <div className="lg:col-span-2">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 bg-gradient-to-r from-[#154279] to-[#0f325e] text-white rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#F96302]" />
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { if (editing) setFormData(profileData); setEditing(!editing); }} className="text-white hover:bg-white/10">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-6 pb-6 border-b border-slate-200">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#154279] to-[#0f325e] flex items-center justify-center text-white text-2xl font-bold">
                      {user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-slate-700 font-bold text-sm">Account Email</p>
                      <p className="text-slate-500 text-sm">{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-700 font-bold text-sm mb-2 block">First Name *</Label>
                      <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} disabled={!editing} className="border-slate-200 rounded-xl focus:border-[#F96302] disabled:bg-slate-50" />
                    </div>
                    <div>
                      <Label className="text-slate-700 font-bold text-sm mb-2 block">Last Name *</Label>
                      <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} disabled={!editing} className="border-slate-200 rounded-xl focus:border-[#F96302] disabled:bg-slate-50" />
                    </div>
                    <div>
                      <Label className="text-slate-700 font-bold text-sm mb-2 block">Phone Number</Label>
                      <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={!editing} placeholder="+254..." className="border-slate-200 rounded-xl focus:border-[#F96302] disabled:bg-slate-50" />
                    </div>
                    <div>
                      <Label className="text-slate-700 font-bold text-sm mb-2 block">Role</Label>
                      <Input value="Super Admin" disabled className="border-slate-200 rounded-xl bg-slate-50" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-slate-700 font-bold text-sm mb-2 block">Bio</Label>
                      <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} disabled={!editing} placeholder="Tell us about yourself..." className="border-slate-200 rounded-xl focus:border-[#F96302] disabled:bg-slate-50 min-h-[100px]" />
                    </div>
                  </div>
                  {editing && (
                    <div className="flex gap-4 pt-4 border-t border-slate-200">
                      <Button variant="outline" onClick={() => { setFormData(profileData); setEditing(false); }} disabled={loading} className="border-slate-200 rounded-xl">Cancel</Button>
                      <Button onClick={handleSaveProfile} disabled={loading} className="flex-1 bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl">
                        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Security Card */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-[#F96302] to-orange-500 text-white rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5" />
                    <CardTitle className="text-lg">Security</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">Your account is secured. Change your password regularly.</AlertDescription>
                  </Alert>
                  <div>
                    <Label className="text-slate-700 font-bold text-sm mb-2 block">New Password</Label>
                    <Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} placeholder="Enter new password" className="border-slate-200 rounded-xl focus:border-[#F96302]" />
                  </div>
                  <div>
                    <Label className="text-slate-700 font-bold text-sm mb-2 block">Confirm Password</Label>
                    <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} placeholder="Confirm new password" className="border-slate-200 rounded-xl focus:border-[#F96302]" />
                  </div>
                  <Button onClick={handleChangePassword} disabled={loading} className="w-full bg-[#F96302] hover:bg-[#e05802] text-white font-bold rounded-xl">
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />} Change Password
                  </Button>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <CardTitle className="text-lg">Account Status</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Status</p>
                      <p className="text-xs text-slate-500">Account active and verified</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Role</p>
                      <p className="text-xs text-slate-500">Full system access</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">Super Admin</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">2FA</p>
                      <p className="text-xs text-slate-500">Two-factor authentication</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-slate-200 rounded-lg text-xs font-bold">Enable</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyProfile;
