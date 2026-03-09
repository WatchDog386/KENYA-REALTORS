import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, MapPin, LogOut, Loader2, Camera, Building, 
  Briefcase, Shield, Check, X, Edit3, Save, Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role: string;
  avatar_url?: string;
  bio?: string;
  company?: string;
  location?: string;
  is_active: boolean;
  created_at?: string;
}

const ManagerProfile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    location: '',
    bio: ''
  });

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        first_name: data?.first_name || '',
        last_name: data?.last_name || '',
        phone: data?.phone || '',
        company: data?.company || '',
        location: data?.location || '',
        bio: data?.bio || ''
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    if (!user?.id) return;

    try {
      setUploadingImage(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast.success('Profile picture updated!');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          company: formData.company,
          location: formData.location,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...formData } : null);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#00356B]" />
      </div>
    );
  }

  // Calculate initials for fallback
  const getInitials = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.first_name[0]}${formData.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6">
          
          {/* Main Profile Header - Enhanced Contrast */}
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            {/* Dynamic Avatar Section */}
            <div className="relative shrink-0">
              <div className="relative group inline-block">
                <div className="overflow-hidden rounded-2xl border-4 border-slate-50 shadow-lg bg-slate-100">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="w-auto h-auto max-w-[200px] max-h-[200px] min-w-[120px] object-contain block"
                    />
                  ) : (
                    <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-[#00356B]">
                      <span className="text-4xl font-bold">{getInitials()}</span>
                    </div>
                  )}
                </div>
                
                {/* Floating Action Button for Upload */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-3 bg-[#D85C2C] hover:bg-[#b84520] text-white rounded-full shadow-lg transition-all z-10 border-4 border-white transform translate-x-1/4 translate-y-1/4"
                  disabled={uploadingImage}
                  title="Upload new photo"
                >
                  {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  disabled={uploadingImage} 
                />
              </div>
            </div>

            {/* Name & Role Section */}
            <div className="flex-1 text-left space-y-4 w-full">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                  {profile?.first_name} {profile?.last_name}
                </h1>
                <div className="flex items-center flex-wrap gap-3 mt-2">
                  <Badge className="bg-[#154279] text-white px-3 py-1 text-sm font-semibold rounded-lg hover:bg-[#154279]">
                    {profile?.role?.replace('_', ' ').toUpperCase() || 'MANAGER'}
                  </Badge>
                  <div className="h-4 w-px bg-slate-300 hidden md:block" />
                  <div className="text-slate-500 font-medium flex items-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                    <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                    {profile?.location || 'Location not set'}
                  </div>
                </div>
                {profile?.bio && (
                   <p className="mt-4 text-slate-600 max-w-2xl leading-relaxed hidden md:block">
                     {profile.bio}
                   </p>
                )}
              </div>
              
              <div className="flex items-center gap-4 pt-2">
                 <div className="flex gap-3">
                   {isEditing ? (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveProfile} 
                        disabled={saving}
                        className="bg-[#D85C2C] hover:bg-[#b84520] text-white min-w-[120px] rounded-xl shadow-lg ring-offset-2 focus:ring-2 ring-orange-200"
                      >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-white border text-slate-700 hover:bg-slate-50 border-slate-200 rounded-xl px-6 py-5 shadow-sm transition-all"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                 </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - Contact & Status */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                <h3 className="text-lg font-bold text-[#154279] flex items-center pb-4 border-b border-slate-100">
                   <User className="w-5 h-5 mr-2" /> 
                   Contact Details
                </h3>
                
                <div className="space-y-4">
                  <div className="group flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm text-[#154279]">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                      <p className="text-sm font-medium text-slate-900 truncate" title={profile?.email}>{profile?.email}</p>
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-orange-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm text-[#D85C2C]">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                      {isEditing ? (
                        <Input 
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="h-8 mt-1 text-sm bg-white border-slate-200"
                          placeholder="Add phone "
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-900">{profile?.phone || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  <div className="group flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-purple-100 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm text-purple-600">
                      <Building className="w-5 h-5" />
                    </div>
                    <div className="w-full">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Company</p>
                      {isEditing ? (
                        <Input 
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="h-8 mt-1 text-sm bg-white border-slate-200"
                          placeholder="Organization"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-900">{profile?.company || 'Not provided'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

               <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl text-red-600 border-red-100 bg-red-50/50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all shadow-sm"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out of Account
              </Button>
            </div>

            {/* Right Column - Detailed Form */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-[#154279] flex items-center">
                       <Briefcase className="w-5 h-5 mr-2" />
                       Personal Information
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 ml-7">Manage your bio and extensive profile details</p>
                  </div>
                </div>
                
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="first_name" className="text-slate-700 font-bold">First Name</Label>
                      <Input 
                        id="first_name" 
                        name="first_name" 
                        value={formData.first_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`h-11 rounded-xl transition-all ${isEditing ? "border-blue-200 focus-visible:ring-[#154279] focus-visible:border-[#154279] bg-white shadow-sm" : "bg-slate-50 border-slate-100 text-slate-700"}`}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="last_name" className="text-slate-700 font-bold">Last Name</Label>
                      <Input 
                        id="last_name" 
                        name="last_name" 
                        value={formData.last_name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`h-11 rounded-xl transition-all ${isEditing ? "border-blue-200 focus-visible:ring-[#154279] focus-visible:border-[#154279] bg-white shadow-sm" : "bg-slate-50 border-slate-100 text-slate-700"}`}
                      />
                    </div>

                    <div className="space-y-3 md:col-span-2">
                      <Label htmlFor="location" className="text-slate-700 font-bold">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <Input 
                          id="location" 
                          name="location" 
                          value={formData.location}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={`pl-10 h-11 rounded-xl transition-all ${isEditing ? "border-blue-200 focus-visible:ring-[#154279] focus-visible:border-[#154279] bg-white shadow-sm" : "bg-slate-50 border-slate-100 text-slate-700"}`}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-slate-100" />

                  <div className="space-y-3">
                    <Label htmlFor="bio" className="text-slate-700 font-bold">Professional Bio</Label>
                    <Textarea 
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`min-h-[180px] rounded-xl p-4 resize-none transition-all ${isEditing ? "border-blue-200 focus-visible:ring-[#154279] focus-visible:border-[#154279] bg-white shadow-sm" : "bg-slate-50 border-slate-100 text-slate-700"}`}
                      placeholder="Share your professional background, experience, and role responsibilities..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerProfile;