// src/components/portal/manager/ManagerSettings.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings } from 'lucide-react';

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

const ManagerSettings: React.FC = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email (Read-only)</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to sign out?')) {
                signOut();
              }
            }}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerSettings;
