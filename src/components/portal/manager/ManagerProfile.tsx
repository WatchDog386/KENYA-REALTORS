import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, LogOut, Save, Loader2, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
}

const ManagerProfile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
      loadProfile();
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
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
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900">My Profile</h1>
            </div>
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className={isEditing ? "" : "bg-blue-600 hover:bg-blue-700"}
            >
              <Edit2 size={16} className="mr-2" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
          <p className="text-slate-600">Manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-32"></div>

          {/* Profile Content */}
          <div className="px-6 pb-6 relative -mt-16 z-10">
            <div className="flex items-end gap-4 mb-6">
              <div className="w-32 h-32 bg-slate-200 rounded-lg border-4 border-white shadow-md flex items-center justify-center">
                <User className="w-16 h-16 text-slate-400" />
              </div>
              <div className="flex-1 pb-2">
                <h2 className="text-3xl font-bold text-slate-900">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <p className="text-slate-600 capitalize">{profile?.role || 'Manager'}</p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Mail className="inline-block w-4 h-4 mr-2" />
                      Email
                    </label>
                    <p className="text-slate-900 font-semibold">{profile?.email}</p>
                  </div>

                  {/* Phone */}
                  {isEditing ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Phone className="inline-block w-4 h-4 mr-2" />
                        Phone
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Phone className="inline-block w-4 h-4 mr-2" />
                        Phone
                      </label>
                      <p className="text-slate-900 font-semibold">{formData.phone || '—'}</p>
                    </div>
                  )}

                  {/* Location */}
                  {isEditing ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <MapPin className="inline-block w-4 h-4 mr-2" />
                        Location
                      </label>
                      <Input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Enter location"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <MapPin className="inline-block w-4 h-4 mr-2" />
                        Location
                      </label>
                      <p className="text-slate-900 font-semibold">{formData.location || '—'}</p>
                    </div>
                  )}

                  {/* Company */}
                  {isEditing ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Company
                      </label>
                      <Input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Enter company name"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Company
                      </label>
                      <p className="text-slate-900 font-semibold">{formData.company || '—'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio Section */}
              <div className="bg-slate-50 rounded-lg p-4">
                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bio
                    </label>
                    <Textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                      rows={5}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bio
                    </label>
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {formData.bio || '—'}
                    </p>
                  </div>
                )}

                {/* Name Fields */}
                {isEditing && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        First Name
                      </label>
                      <Input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Last Name
                      </label>
                      <Input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-2 mt-6">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save size={16} className="mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Account Actions</h3>
          <Button 
            onClick={handleSignOut}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManagerProfile;
