import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, Check, X, Edit2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRoles } from "@/hooks/useRoles";

interface ProfileData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
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

const SuperAdminProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchUserRoles } = useRoles();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: "",
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
      setUserRoles(roles as unknown as UserRoleData[]);
      
      // Extract all unique permissions from roles
      const permissionsSet = new Set<string>();
      roles.forEach((userRole: any) => {
        userRole.role?.permissions?.forEach((perm: string) => {
          permissionsSet.add(perm);
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB for base64)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    try {
      setImageUploading(true);
      
      if (!user?.id) {
        toast.error("User not authenticated");
        return;
      }

      // Read file as base64 data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64String = event.target?.result as string;
          
          setFormData((prev) => ({
            ...prev,
            avatar_url: base64String,
          }));
          setPreviewImage(base64String);
          toast.success("Image selected successfully");
        } catch (err) {
          console.error("Error processing image:", err);
          toast.error("Failed to process image");
        } finally {
          setImageUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast.error("Failed to read image file");
        setImageUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Error uploading image:", err);
      toast.error("Failed to process image");
      setImageUploading(false);
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

      setProfile({
        ...profile!,
        ...formData,
      });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || "",
      avatar_url: profile?.avatar_url || "",
    });
    setPreviewImage(profile?.avatar_url || null);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00356B]" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/portal/super-admin")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">
            My Profile
          </h1>
          <p className="text-sm text-gray-600">
            {isEditing ? "Edit your personal information" : "Manage your personal information and roles"}
          </p>
        </div>
      </div>

      {/* Personal Information Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personal Information</CardTitle>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1 bg-[#00356B] text-white rounded-lg hover:bg-[#002647] transition-colors text-sm"
            >
              <Edit2 size={16} />
              Edit Profile
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-[#00356B] to-[#004B97] rounded-full flex items-center justify-center overflow-hidden shadow-lg border-4 border-white">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {formData.first_name?.[0]?.toUpperCase() || "S"}
                  </span>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-[#00356B] text-white p-3 rounded-full cursor-pointer hover:bg-[#002647] transition-colors shadow-md">
                  <Upload size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {imageUploading && (
              <p className="text-sm text-gray-500">Uploading image...</p>
            )}
            <p className="text-xs text-gray-500">
              {isEditing ? "Click camera icon to upload" : "Profile Picture"}
            </p>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {/* Edit Mode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00356B]"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00356B]"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00356B]"
                  placeholder="Phone number"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* View Mode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">First Name</p>
                  <p className="font-semibold text-gray-900">
                    {profile?.first_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Name</p>
                  <p className="font-semibold text-gray-900">
                    {profile?.last_name || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{user?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold text-gray-900">
                  {profile?.phone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={getStatusColor(profile?.status || "active")}>
                  {profile?.status || "N/A"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-semibold text-gray-900">
                    {profile?.created_at ? formatDate(profile.created_at) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Login</p>
                  <p className="font-semibold text-gray-900">
                    {profile?.last_login_at ? formatDate(profile.last_login_at) : "Never"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles & Permissions Card */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} className="text-[#00356B]" />
              Roles & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Assigned Roles */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Assigned Roles</h3>
              {userRoles.length > 0 ? (
                <div className="space-y-3">
                  {userRoles.map((userRole) => (
                    <div
                      key={userRole.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {userRole.role?.name || "Unknown Role"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {userRole.role?.description || "No description"}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          Assigned {formatDate(userRole.assigned_at)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No roles assigned</p>
              )}
            </div>

            {/* Permissions */}
            {allPermissions.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Active Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {allPermissions.map((permission) => (
                    <Badge key={permission} className="bg-green-100 text-green-800">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuperAdminProfile;
