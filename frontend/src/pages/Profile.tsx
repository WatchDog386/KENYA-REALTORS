// src/pages/Profile.tsx
// © 2025 Jeff. All rights reserved.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Edit,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const RISA_BLUE = "#015B97";
const RISA_LIGHT_BLUE = "#3288e6";

const Profile = () => {
  const navigate = useNavigate();
  const {
    user,
    updateProfile,
    updateUserRole,
    getAvailableRoles,
    createProfileIfMissing,
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableRoles = getAvailableRoles();

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
      });
      setSelectedRole(user.role || "");
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setError(null);
  };

  const handleRoleChange = async (role: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserRole(role);
      setSelectedRole(role);
      setSuccess("Role updated successfully! Redirecting to dashboard...");

      // Redirect to portal which will route to correct dashboard
      setTimeout(() => {
        navigate("/portal");
      }, 1500);
      // Once approved, user's profile will be updated and they can navigate to their dashboard
    } catch (err: any) {
      console.error("Error submitting role change:", err);
      setError(err.message || "Failed to submit role change request");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const created = await createProfileIfMissing();
      if (created) {
        setSuccess(
          "Profile created successfully! Please select a role to proceed."
        );
      } else {
        setSuccess("Profile already exists.");
      }
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setError(err.message || "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      });
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const isRoleSelectionNeeded = !user?.role;
  const initials = `${user?.first_name || ""}${
    user?.last_name?.[0] || ""
  }`.toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-slate-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold" style={{ color: RISA_BLUE }}>
              My Profile
            </h1>
          </div>
        </motion.div>

        {/* Alert Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm">{success}</p>
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {!user ? (
            // No Profile Exists - Show Create Profile Screen
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">Create Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No Profile Found
                  </h3>
                  <p className="text-slate-600 text-sm mb-6">
                    Create your profile to get started and access all features.
                  </p>
                  <Button
                    onClick={handleCreateProfile}
                    disabled={loading}
                    size="lg"
                    className="gap-2"
                    style={{ backgroundColor: RISA_BLUE }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Profile
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Profile Exists - Show Profile Information
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-start justify-between mb-4">
                  <CardTitle className="text-2xl">
                    Profile Information
                  </CardTitle>
                  {!isRoleSelectionNeeded && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="gap-2"
                    >
                      {isEditing ? (
                        <>
                          <Save className="w-4 h-4" />
                          Done
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4" />
                          Edit
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <Avatar
                    className="w-20 h-20 border-2"
                    style={{ borderColor: RISA_BLUE }}
                  >
                    <AvatarImage
                      src={user?.avatar_url}
                      alt={user?.first_name || ""}
                    />
                    <AvatarFallback
                      style={{ backgroundColor: RISA_LIGHT_BLUE }}
                    >
                      {initials || <User className="w-10 h-10" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {user?.first_name || "User"}
                    </h3>
                    <p className="text-slate-600 text-sm">{user?.email}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name" className="mb-2 block">
                      First Name
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange(e, "first_name")}
                      disabled={!isEditing}
                      className="disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="mb-2 block">
                      Last Name
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange(e, "last_name")}
                      disabled={!isEditing}
                      className="disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="mb-2 block">
                    Email Address
                  </Label>
                  <Input id="email" value={user?.email} disabled />
                </div>

                {/* Phone Field */}
                <div>
                  <Label htmlFor="phone" className="mb-2 block">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange(e, "phone")}
                    placeholder="+1 (555) 000-0000"
                    disabled={!isEditing}
                    className="disabled:bg-slate-50"
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <Label htmlFor="role" className="mb-2 block">
                    User Role{" "}
                    {isRoleSelectionNeeded && (
                      <span className="text-red-600">*</span>
                    )}
                  </Label>
                  <Select
                    value={selectedRole || ""}
                    onValueChange={handleRoleChange}
                    disabled={loading || !!user?.role}
                  >
                    <SelectTrigger
                      id="role"
                      className={`${
                        isRoleSelectionNeeded ? "border-orange-400" : ""
                      } ${
                        user?.role
                          ? "bg-slate-50 cursor-not-allowed"
                          : "bg-white"
                      }`}
                    >
                      <SelectValue placeholder="Select your role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          {role.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isRoleSelectionNeeded && (
                    <p className="text-xs text-orange-600 mt-1">
                      Please select a role to proceed. This will determine your
                      access level and features.
                    </p>
                  )}
                  {user?.role && (
                    <p className="text-xs text-slate-600 mt-1">
                      Your role cannot be changed after selection. Contact
                      support if you need assistance.
                    </p>
                  )}
                </div>

                {/* Save Button for Profile Edits */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 pt-4"
                  >
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 gap-2"
                      style={{ backgroundColor: RISA_BLUE }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Info Box for Role Selection */}
        {isRoleSelectionNeeded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <h3 className="font-semibold text-blue-900 mb-2">Get Started</h3>
            <p className="text-blue-800 text-sm">
              Select a user role above to access your personalized dashboard and
              features.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
