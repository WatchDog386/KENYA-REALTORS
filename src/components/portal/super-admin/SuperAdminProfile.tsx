import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Loader2, 
  Upload, 
  Check, 
  X, 
  Edit2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Facebook, 
  Linkedin, 
  Instagram,
  User,
  Shield,
  Key
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRoles } from "@/hooks/useRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      
      if (!user?.id) {
        toast.error("User not authenticated");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64String = event.target?.result as string;
          
          setFormData((prev) => ({
            ...prev,
            avatar_url: base64String,
          }));
          setPreviewImage(base64String);
          toast.success("Image selected successfully (Click Save to apply)");
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  // --- RENDERING HELPERS ---

  const renderEditableField = (
    label: string, 
    value: string | undefined, 
    name: string, 
    type: string = "text",
    icon?: React.ReactNode,
    isReadOnly: boolean = false
  ) => {
    if (isEditing && !isReadOnly) {
      return (
        <div className="flex items-center gap-3 mb-2 group">
          <div className="w-full">
            <Input
              type={type}
              name={name}
              value={formData[name as keyof typeof formData] as string}
              onChange={handleInputChange}
              className="h-9"
              placeholder={label}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4 mb-4 group">
        <div className="flex-1">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[#F96302] opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#F96302]/10 rounded"
          >
            <Edit2 size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 font-nunito p-4 md:p-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* --- Main Profile Card Section --- */}
      <div className="relative bg-white rounded-[30px] overflow-hidden shadow-xl border border-slate-100 flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Side: Information */}
        <div className="flex-1 p-8 md:p-12 z-10 flex flex-col justify-center">
          <div className="mb-6">
             <p className="text-sm text-[#F96302] font-bold mb-1 tracking-wide uppercase">
               Official ID: <span className="text-[#154279]">#{user?.id.substring(0, 8)}</span>
             </p>
          </div>

          <div className="space-y-6">
            {/* Name & Title */}
            <div>
              {isEditing ? (
                 <div className="flex flex-col gap-3 mb-4">
                    <label className="text-xs font-bold text-[#154279] uppercase">First Name</label>
                    <Input 
                      placeholder="First Name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="text-xl font-medium border-[#154279]/20 focus:border-[#F96302]"
                    />
                    <label className="text-xs font-bold text-[#154279] uppercase mt-2">Last Name</label>
                     <Input 
                      placeholder="Last Name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="text-xl font-medium border-[#154279]/20 focus:border-[#F96302]"
                    />
                 </div>
              ) : (
                <div className="flex items-start justify-between group">
                  <h1 className="text-4xl md:text-5xl font-black text-[#154279] mb-2 tracking-tight leading-tight">
                    {profile?.first_name || "Super"} <br/>
                    <span className="text-slate-700">{profile?.last_name || "Admin"}</span>
                  </h1>
                   <button 
                      onClick={() => setIsEditing(true)}
                      className="text-[#F96302] opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-[#F96302]/10 rounded-full mt-2 transform hover:scale-110"
                    >
                      <Edit2 size={20} />
                    </button>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                 <Badge className="bg-[#154279] text-white hover:bg-[#0f325e] px-3 py-1 text-sm rounded-md shadow-sm border-0">
                    Super Administrator
                 </Badge>
                 <span className="text-[#F96302] font-bold text-sm bg-[#F96302]/10 px-3 py-1 rounded-md">
                    Kenya Realtors Portal
                 </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 mt-8 max-w-md">
              <div className="space-y-4">
                 <div className="flex items-center gap-4 group transition-all hover:translate-x-1 duration-300">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#154279] shadow-sm group-hover:bg-[#154279] group-hover:text-white transition-colors">
                      <Mail size={18} />
                   </div>
                   <div className="flex-1">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                     <p className="text-gray-900 font-semibold">{user?.email}</p>
                   </div>
                 </div>

                 <div className="flex items-center gap-4 group transition-all hover:translate-x-1 duration-300">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#154279] shadow-sm group-hover:bg-[#154279] group-hover:text-white transition-colors">
                      <Phone size={18} />
                   </div>
                   <div className="flex-1">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Phone</p>
                     {isEditing ? (
                        <Input
                           name="phone"
                           value={formData.phone}
                           onChange={handleInputChange}
                           placeholder="Phone Number"
                           className="mt-1 h-8"
                        />
                     ) : (
                        <p className="text-gray-900 font-semibold">{profile?.phone || "Not set"}</p>
                     )}
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-4 group transition-all hover:translate-x-1 duration-300">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#154279] shadow-sm group-hover:bg-[#154279] group-hover:text-white transition-colors">
                      <MapPin size={18} />
                   </div>
                   <div className="flex-1">
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Location</p>
                     <p className="text-gray-900 font-semibold">Nairobi, Kenya</p>
                   </div>
                 </div>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex gap-3 mt-8">
              <button className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#154279] hover:border-[#154279] hover:shadow-md transition-all transform hover:-translate-y-1">
                <Facebook size={18} />
              </button>
              <button className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#154279] hover:border-[#154279] hover:shadow-md transition-all transform hover:-translate-y-1">
                <Linkedin size={18} />
              </button>
              <button className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#F96302] hover:border-[#F96302] hover:shadow-md transition-all transform hover:-translate-y-1">
                <Instagram size={18} />
              </button>
            </div>

            {/* Edit Actions Footer (Only visible when editing) */}
            {isEditing && (
              <div className="flex gap-3 pt-6 animate-in slide-in-from-bottom-2">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-[#F96302] hover:bg-[#d85502] text-white rounded-lg px-8 shadow-lg font-bold"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
                <Button 
                  onClick={handleCancel}
                  disabled={isSaving}
                  variant="outline"
                  className="rounded-lg px-6 border-slate-300 hover:bg-slate-50 text-slate-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Image Container */}
        <div className="w-full md:w-[45%] relative min-h-[400px] md:min-h-full overflow-hidden">
           {/* Decorative Background Element */}
           <div className="absolute inset-0 bg-gradient-to-br from-[#154279] to-[#0f325e] opacity-10 md:rounded-bl-[80px]"></div>

           {/* The Image Itself - Positioned to minimize cropping */}
           <div className="absolute inset-2 md:inset-4 md:left-0 rounded-2xl md:rounded-l-none md:rounded-r-2xl md:rounded-bl-[80px] overflow-hidden shadow-2xl h-[calc(100%-16px)] md:h-[calc(100%-32px)] md:mr-4 border-4 border-white">
              <img 
                src={previewImage || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"} 
                alt="Profile" 
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
              />
              
              {/* Edit Image Button Overlay */}
              <div className="absolute bottom-6 right-6">
                  <label className="bg-[#154279] hover:bg-[#0f325e] text-white px-5 py-3 rounded-full cursor-pointer shadow-xl transition-all flex items-center gap-2 font-bold text-sm border-2 border-white hover:scale-105 active:scale-95">
                    <Edit2 size={16} />
                    Change Photo
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
      </div>
      
      <div className="flex justify-end pr-8">
         <button className="text-[#154279] hover:text-[#F96302] hover:underline text-sm font-bold flex items-center gap-2 transition-colors">
             <Edit2 size={14} /> Update Official Press Photo
         </button>
      </div>


      {/* --- Additional Info Sections Below (Tabs) --- */}
      <div className="mt-12">
        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-2 bg-slate-200/50 p-1 rounded-full h-auto">
            <TabsTrigger 
              value="roles" 
              className="rounded-full py-2.5 data-[state=active]:bg-[#154279] data-[state=active]:text-white transition-all font-medium"
            >
               Roles & Permissions
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="rounded-full py-2.5 data-[state=active]:bg-[#154279] data-[state=active]:text-white transition-all font-medium"
            >
               Security Settings
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-8">
            <TabsContent value="roles" className="animate-in fade-in slide-in-from-bottom-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="text-[#154279]" />
                    Assigned Roles & Capabilities
                  </CardTitle>
                  <CardDescription>
                    A comprehensive list of your access rights within the system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Active Roles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Check if user has explicit roles OR is super_admin in profile */}
                      {(userRoles.length > 0 || profile?.role === 'super_admin') ? (
                        <>
                          {/* Explicitly show Super Admin card if profile says so, even if not in user_roles */}
                          {profile?.role === 'super_admin' && !userRoles.some(r => r.role?.name === 'Super Admin') && (
                             <div className="border p-4 rounded-xl bg-slate-50 relative overflow-hidden group hover:border-[#154279]/30 transition-colors">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                  <Shield size={40} className="text-[#154279]" />
                                </div>
                                <h4 className="font-bold text-[#154279]">Super Administrator</h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">Full system access and management capabilities.</p>
                                <Badge className="mt-3 bg-blue-100 text-blue-700 pointer-events-none border-0 hover:bg-blue-100">
                                  System Role
                                </Badge>
                             </div>
                          )}

                          {userRoles.map((userRole) => (
                             <div key={userRole.id} className="border p-4 rounded-xl bg-slate-50 relative overflow-hidden group hover:border-[#154279]/30 transition-colors">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                  <Shield size={40} className="text-[#154279]" />
                                </div>
                                <h4 className="font-bold text-[#154279]">{userRole.role?.name}</h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{userRole.role?.description}</p>
                                <Badge className="mt-3 bg-blue-100 text-blue-700 pointer-events-none border-0 hover:bg-blue-100">
                                  Assigned {new Date(userRole.assigned_at).toLocaleDateString()}
                                </Badge>
                             </div>
                          ))}
                        </>
                      ) : (
                        <div className="col-span-2 p-8 border border-dashed rounded-lg text-center bg-slate-50/50">
                          <Shield className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                          <p className="text-gray-500 font-medium">No roles explicitly assigned.</p>
                          <p className="text-sm text-gray-400">Contact system administrator if this is an error.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                     <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">System Permissions</h3>
                     <div className="flex flex-wrap gap-2">
                        {/* If super_admin, show all capabilities badge */}
                        {profile?.role === 'super_admin' && (
                           <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-200 flex items-center gap-1.5 font-medium">
                              <Check size={12} strokeWidth={3} /> Full System Access
                           </span>
                        )}
                        
                        {allPermissions.map((perm) => (
                           <span key={perm} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200 flex items-center gap-1.5">
                              <Check size={12} /> {perm}
                           </span>
                        ))}
                        
                        {allPermissions.length === 0 && profile?.role !== 'super_admin' && (
                           <span className="text-gray-500 italic">No specific permissions found.</span>
                        )}
                     </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="animate-in fade-in slide-in-from-bottom-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="text-[#154279]" />
                    Security Configuration
                  </CardTitle>
                  <CardDescription>
                    Manage your sign-in methods and password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                        <div>
                           <div className="font-semibold text-gray-900">Password</div>
                           <div className="text-sm text-gray-500">Secure your account with a strong password</div>
                        </div>
                        <Button variant="outline" onClick={() => navigate("/reset-password")}>Update</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors opacity-75">
                        <div>
                           <div className="font-semibold text-gray-900">Two-Factor Authentication</div>
                           <div className="text-sm text-gray-500">Add an extra layer of security (Coming Soon)</div>
                        </div>
                        <Button variant="outline" disabled>Enable</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

    </div>
  );
};

export default SuperAdminProfile;
