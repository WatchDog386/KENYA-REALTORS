import React, { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  Key,
  Loader2,
  Mail,
  Phone,
  Shield,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  status: "active" | "inactive" | "suspended" | "pending";
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

interface UserRoleData {
  id: string;
  role_id: string;
  assigned_at: string;
  assigned_by?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
  };
}

const PANEL_HEADER_CLASS =
  "border-b border-[#bcc3cd] px-1 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#5d6c7c]";

const inputClassName =
  "h-10 rounded-none border border-[#b6bec8] bg-white px-3 text-[13px] text-[#1f2937] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#F96302]";

const SUPER_ADMIN_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1000&q=80";

const SuperAdminProfile: React.FC = () => {
  const { user } = useAuth();
  const { fetchUserRoles } = useRoles();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: "",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchRolesData();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        first_name: data?.first_name || "",
        last_name: data?.last_name || "",
        phone: data?.phone || "",
        avatar_url: data?.avatar_url || "",
      });

      if (data?.avatar_url) {
        setPreviewImage(data.avatar_url);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesData = async () => {
    if (!user?.id) return;

    try {
      const roles = await fetchUserRoles(user.id);
      const normalizedRoles = (roles || []) as UserRoleData[];
      setUserRoles(normalizedRoles);

      const permissionsSet = new Set<string>();
      normalizedRoles.forEach((entry) => {
        entry.role?.permissions?.forEach((permission) => {
          permissionsSet.add(permission);
        });
      });

      setAllPermissions(Array.from(permissionsSet).sort());
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    try {
      setImageUploading(true);

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          avatar_url: base64String,
        }));
        setPreviewImage(base64String);
        setImageUploading(false);
        toast.success("Image selected. Click Save Profile to apply.");
      };

      reader.onerror = () => {
        setImageUploading(false);
        toast.error("Failed to read image file");
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error processing image:", err);
      setImageUploading(false);
      toast.error("Failed to process image");
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...formData,
            }
          : prev,
      );

      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || "",
      avatar_url: profile?.avatar_url || "",
    });
    setPreviewImage(profile?.avatar_url || null);
  };

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Fill in new password and confirmation");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setIsChangingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setPasswordData({ newPassword: "", confirmPassword: "" });
      toast.success("Password updated successfully");
    } catch (err) {
      console.error("Error changing password:", err);
      toast.error("Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fullName = `${formData.first_name || "Super"} ${formData.last_name || "Admin"}`.trim();
  const imageSrc = previewImage || formData.avatar_url || SUPER_ADMIN_FALLBACK_IMAGE;

  const roleLabels = useMemo(() => {
    const labels = new Set<string>();

    userRoles.forEach((entry) => {
      if (entry.role?.name) {
        labels.add(entry.role.name);
      }
    });

    if (profile?.role === "super_admin") {
      labels.add("Super Administrator");
    }

    if (labels.size === 0 && profile?.role) {
      labels.add(profile.role.replace(/_/g, " "));
    }

    return Array.from(labels);
  }, [profile?.role, userRoles]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center bg-[#d7dce1]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#154279]" />
          <p className="text-[13px] font-medium text-[#5f6b7c]">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d7dce1] p-4 md:p-6 font-['Poppins','Segoe_UI',sans-serif] text-[#243041]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="mx-auto max-w-[1500px] space-y-3">
        <section className="border border-[#bcc3cd] bg-[#eef1f4]">
          <div className={PANEL_HEADER_CLASS}>Super Admin Profile</div>
          <div className="grid grid-cols-1 gap-4 p-3 xl:grid-cols-12">
            <div className="space-y-4 xl:col-span-8">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c4cad3] pb-3">
                <div className="min-w-[260px] flex-1">
                  <h1 className="text-[34px] font-bold leading-none text-[#1f2937]">{fullName}</h1>
                  <div className="mt-1 flex items-center gap-2 text-[14px] font-medium text-[#5f6b7c]">
                    <Mail className="h-4 w-4 text-[#154279]" />
                    <span>{user?.email || "No email"}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#7b8895]">
                    ID #{(profile?.id || user?.id || "unknown").slice(0, 8).toUpperCase()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 self-start">
                  <span className="bg-[#154279] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Super Admin</span>
                  <span className="bg-[#F96302] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    {(profile?.status || "active").replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div className="border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Primary Role</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{roleLabels[0] || "Super Administrator"}</p>
                </div>
                <div className="border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Phone</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{formData.phone || "Not set"}</p>
                </div>
                <div className="border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-2 sm:col-span-2 lg:col-span-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Last Updated</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">
                    {new Date(profile?.updated_at || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="mx-auto w-full max-w-[360px] p-0">
                <div className="relative flex h-[220px] items-center justify-center overflow-hidden border border-[#c7cdd6] bg-[#e3e7ec] p-2 md:h-[250px]">
                  <img
                    src={imageSrc}
                    alt="Super admin"
                    className="max-h-full max-w-full object-contain object-center"
                  />
                </div>

                <label className="mt-2 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 border border-[#d96d26] bg-[#F96302] px-3 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#e15802]">
                  {imageUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading
                    </>
                  ) : (
                    <>
                      <Camera className="h-3.5 w-3.5" />
                      Change Photo
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="border border-[#bcc3cd] bg-[#eef1f4]">
          <div className={PANEL_HEADER_CLASS}>Profile Details</div>
          <div className="space-y-4 p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
              <div className="border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Role</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{roleLabels[0] || "Super Administrator"}</p>
              </div>
              <div className="border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Phone</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">{formData.phone || "Not set"}</p>
              </div>
              <div className="border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Created</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">
                  {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
              <div className="border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7b8895]">Updated</p>
                <p className="mt-1 text-[13px] font-semibold text-[#1f2937]">
                  {new Date(profile?.updated_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
              <div className="space-y-4 border-t border-[#c4cad3] pt-3 xl:col-span-8">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Profile Information</div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">First Name</label>
                    <Input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="First name"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Last Name</label>
                    <Input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Email Address</label>
                    <Input
                      value={user?.email || ""}
                      readOnly
                      className={`${inputClassName} bg-[#e8ecf1] text-[#59687d]`}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Phone Number</label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+254..."
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-[#c4cad3] pt-3">
                  <Button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="h-10 rounded-none border border-[#154279] bg-[#154279] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#10335f]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-3.5 w-3.5" />
                        Save Profile
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetForm}
                    disabled={isSaving}
                    className="h-10 rounded-none border border-[#b6bec8] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#465870] hover:bg-[#f5f7fa]"
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-4 border-t border-[#c4cad3] pt-3 xl:col-span-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Security</div>

                <div className="flex items-start gap-2 border border-[#bfd3ea] bg-[#e9f2fd] px-3 py-2 text-[12px] text-[#154279]">
                  <Shield className="mt-0.5 h-4 w-4" />
                  <p className="font-medium">Keep your account secure by updating your password regularly.</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">New Password</label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Confirm Password</label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm password"
                    className={inputClassName}
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="h-10 w-full rounded-none border border-[#d96d26] bg-[#F96302] px-4 text-[11px] font-semibold uppercase tracking-wide text-white hover:bg-[#e15802]"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Updating Password
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-3.5 w-3.5" />
                      Update Password
                    </>
                  )}
                </Button>

                <div className="space-y-2 border-t border-[#c4cad3] pt-3">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#324156]">
                    <CheckCircle2 className="h-4 w-4 text-[#2dae49]" />
                    Account status: {(profile?.status || "active").replace("_", " ")}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#324156]">
                    <User className="h-4 w-4 text-[#154279]" />
                    Role: {roleLabels[0] || "Super Administrator"}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#324156]">
                    <Phone className="h-4 w-4 text-[#154279]" />
                    Contact: {formData.phone || "Not set"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-[#c4cad3] pt-3 xl:grid-cols-12">
              <div className="xl:col-span-5">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Assigned Roles</div>
                <div className="space-y-2">
                  {roleLabels.length > 0 ? (
                    roleLabels.map((label) => (
                      <div key={label} className="flex items-center gap-2 border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-2 text-[13px] font-semibold text-[#1f2937]">
                        <Shield className="h-4 w-4 text-[#154279]" />
                        <span>{label}</span>
                      </div>
                    ))
                  ) : (
                    <div className="border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-3 text-[13px] font-medium text-[#5f6b7c]">
                      No role information available.
                    </div>
                  )}
                </div>
              </div>

              <div className="xl:col-span-7">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#6a7788]">Permissions</div>
                <div>
                  {allPermissions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allPermissions.map((permission) => (
                        <span
                          key={permission}
                          className="border border-[#bed3ea] bg-[#e9f2fd] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#154279]"
                        >
                          {permission.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="border-l-2 border-l-[#b7c0cb] bg-transparent px-3 py-3 text-[13px] font-medium text-[#5f6b7c]">
                      No permissions found for this account.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminProfile;