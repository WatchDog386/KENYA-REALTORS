// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User as SupabaseUser, Provider } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";

// Available roles
const AVAILABLE_ROLES = [
  { name: "tenant", description: "Tenant/Renter" },
  { name: "property_manager", description: "Property Manager" },
  { name: "super_admin", description: "Super Administrator" },
  { name: "owner", description: "Property Owner" },
] as const;

// Permissions by role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  tenant: ["view_lease", "pay_rent", "submit_maintenance"],
  property_manager: [
    "manage_assigned_properties",
    "view_tenants",
    "collect_rent",
  ],
  super_admin: ["*"],
  owner: ["manage_properties", "view_tenants", "manage_managers"],
};

// Interface for user profile
interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: "super_admin" | "property_manager" | "tenant" | "owner" | null;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  status?: string;
  approved?: boolean;
  property_id?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  profile: UserProfile | null; // Alias for user
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    userData: { full_name: string }
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithProvider: (
    provider: Provider
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  updateUserRole: (role: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  resendVerificationEmail: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  createProfileIfMissing: () => Promise<boolean>;
  isAdmin: () => boolean;
  isApproved: () => boolean;
  getUserRole: () => string | null;
  hasPermission: (permission: string) => boolean;
  getAvailableRoles: () => typeof AVAILABLE_ROLES;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Get available roles
  const getAvailableRoles = () => AVAILABLE_ROLES;

  // Fetch user profile from unified profiles table
  const fetchUserProfileFromDB = async (
    userId: string
  ): Promise<UserProfile | null> => {
    try {
      console.log("🔍 Fetching profile for user ID:", userId);

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      console.log("📄 Profile fetch result:", { data, fetchError }, userId);

      if (fetchError) {
        console.error("❌ Error fetching profile:", fetchError);
        return null;
      }

      if (data) {
        console.log("✅ Profile found:", data.email, "Role:", data.role);
        // Ensure role defaults to tenant if not set
        const profile = {
          ...data,
          role: data.role || "tenant",
          is_active: data.is_active !== false,
        } as UserProfile;
        return profile;
      }

      console.log("⚠️ No profile found for user:", userId);
      return null;
    } catch (err) {
      console.error("❌ Error in fetchUserProfileFromDB:", err);
      return null;
    }
  };

  // Create user profile with default role as null (to be selected later)
  const createUserProfileInDB = async (
    userId: string,
    email: string,
    firstName: string,
    lastName?: string,
    phone?: string,
    userType?: string,
    status?: string
  ): Promise<UserProfile | null> => {
    try {
      console.log("🛠️ Creating profile for:", email);

      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName || null,
          phone: phone || null,
          role: userType || null, 
          user_type: userType || null,
          status: status || 'pending',
          is_active: userType === 'super_admin',
          approved: userType === 'super_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("❌ Error creating profile:", insertError);
        // Return a fallback profile
        return {
          id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          role: (userType as any) || null,
          status: status ?? 'pending',
          is_active: userType === 'super_admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      console.log("✅ Profile created successfully");
      return data as UserProfile;
    } catch (err) {
      console.error("❌ Error in createUserProfileInDB:", err);
      return {
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: (userType as any) || null,
        status: status ?? 'pending',
        is_active: userType === 'super_admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  };

  // Update user role - directly updates profile with approval flag
  const updateUserRole = async (role: string): Promise<void> => {
    if (!user) {
      throw new Error("No user logged in");
    }

    try {
      console.log("🔄 Updating role to:", role);

      // Default approval status is false for sensitive roles
      const isAutoApproved = role === 'super_admin'; // Only super_admin via this method if allowed (usually restricted)
      
      const { error } = await supabase
        .from("profiles")
        .update({
          role: role,
          approved: isAutoApproved, // Set approval status
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("❌ Error updating role:", error);
        throw error;
      }

      console.log("✅ Role updated successfully");
      await refreshUser();
      
    } catch (err) {
      console.error("❌ Error in updateUserRole:", err);
      throw err;
    }
  };

  // Helper function to check if user is admin
  const isAdmin = (): boolean => {
    return user?.role === "super_admin";
  };

  // Helper check for approval
  const isApproved = (): boolean => {
    // Super admins are implicitly approved (or explicitly if DB says so, but safety first)
    if (user?.role === "super_admin") return true;
    return !!user?.approved;
  };

  // Get user role
  const getUserRole = (): string | null => {
    return user?.role || null;
  };

  // Permission checking helper
  const hasPermission = (permission: string): boolean => {
    if (!user?.role) return false;

    if (user.role === "super_admin") return true;

    const permissions = ROLE_PERMISSIONS[user.role] || [];

    if (permissions.includes("*")) return true;

    return permissions.includes(permission);
  };

  // Create profile if missing
  const createProfileIfMissing = async (): Promise<boolean> => {
    if (!supabaseUser) {
      console.log("❌ No authenticated user");
      return false;
    }

    try {
      console.log("🔄 Checking/creating profile for:", supabaseUser.email);

      const existingProfile = await fetchUserProfileFromDB(supabaseUser.id);

      if (existingProfile) {
        console.log("✅ Profile already exists");
        setUser(existingProfile);
        return true;
      }

      console.log("📝 Creating new profile...");
      const userEmail = supabaseUser.email || "";
      const fullName =
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        userEmail.split("@")[0];
      const [firstName, ...rest] = fullName.split(" ");
      const lastName =
        supabaseUser.user_metadata?.last_name || rest.join(" ") || "";
      const phone = supabaseUser.user_metadata?.phone || null;
      // Check both 'role' and 'account_type' metadata keys
      const userType = supabaseUser.user_metadata?.role || supabaseUser.user_metadata?.account_type || null;
      // Status is pending if they have a role (except super_admin), otherwise undefined
      const status: string | undefined = (userType && userType !== 'super_admin') ? "pending" : undefined;

      const newProfile = await createUserProfileInDB(
        supabaseUser.id,
        userEmail,
        firstName,
        lastName,
        phone,
        userType,
        status
      );

      if (newProfile) {
        console.log("✅ Profile created successfully");
        setUser(newProfile);
        setTimeout(() => {
          navigate("/profile", { replace: true });
        }, 100);
        return true;
      }

      return false;
    } catch (err) {
      console.error("❌ Error in createProfileIfMissing:", err);
      return false;
    }
  };

  // Redirect user based on role
  const handlePostLoginRedirect = (userProfile: UserProfile | null) => {
    if (!userProfile) return;

    console.log(`🚀 Redirecting based on role: ${userProfile.role}...`);

    // If no role yet, send to role selection
    if (!userProfile.role) {
      console.log("⚠️ No role assigned yet");
      setTimeout(() => {
        navigate("/auth/role-selection", { replace: true });
      }, 100);
      return;
    }

    // User is approved (auto-approved on login) and has a role - redirect to dashboard
    setTimeout(() => {
      switch (userProfile.role) {
        case "super_admin":
          navigate("/portal/super-admin/dashboard", { replace: true });
          break;
        case "property_manager":
          navigate("/portal/manager", { replace: true });
          break;
        case "tenant":
          navigate("/portal/tenant", { replace: true });
          break;
        case "owner":
          navigate("/portal/owner", { replace: true });
          break;
        default:
          navigate("/profile", { replace: true });
      }
    }, 100);
  };

  // Initialize auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log(
          "🔐 Auth initialization - Session:",
          session ? "Exists" : "None"
        );

        setSession(session);
        setSupabaseUser(session?.user || null);

        if (session?.user) {
          const profile = await fetchUserProfileFromDB(session.user.id);
          setUser(profile);

          if (profile) {
            console.log("✅ User authenticated with profile");
            // Don't redirect on initialization - only on explicit login events
          } else {
            console.log("⚠️ User authenticated but no profile");
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log("🔄 Auth state changed:", event);

      setIsLoading(true);
      setSession(session);
      setSupabaseUser(session?.user || null);

      if (session?.user) {
        setTimeout(async () => {
          try {
            const profile = await fetchUserProfileFromDB(session.user.id);
            setUser(profile);

            // Only redirect on explicit SIGNED_IN event, not on token refresh
            if (profile && event === "SIGNED_IN") {
              handlePostLoginRedirect(profile);
            } else if (!profile && event === "SIGNED_IN") {
              await createProfileIfMissing();
            }
          } catch (err) {
            console.error("Error during auth state change:", err);
          } finally {
            setIsLoading(false);
          }
        }, 500);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        return { success: false, error: "Email and password are required" };
      }

      console.log("🔐 Attempting sign in:", trimmedEmail);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (error) {
        console.error("❌ Auth error:", error.message);
        return {
          success: false,
          error:
            error.message === "Invalid login credentials"
              ? "Invalid email or password."
              : error.message,
        };
      }

      if (data.user) {
        console.log("✅ Sign in successful");

        const profile = await fetchUserProfileFromDB(data.user.id);
        setUser(profile);

        if (profile) {
          handlePostLoginRedirect(profile);
        }

        return { success: true };
      }

      return { success: false, error: "Authentication failed" };
    } catch (err: any) {
      console.error("❌ Sign in error:", err);
      return { success: false, error: err.message || "Sign in failed" };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    userData: { full_name: string }
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (!trimmedEmail.includes("@")) {
        return { success: false, error: "Please enter a valid email" };
      }

      if (trimmedPassword.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters",
        };
      }

      console.log("📝 Signing up:", trimmedEmail);

      const { data: authData, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      });

      if (error) return { success: false, error: error.message };

      if (authData.user) {
        const [firstName, ...rest] = userData.full_name.split(" ");
        const lastName = rest.join(" ");
        const profile = await createUserProfileInDB(
          authData.user.id,
          trimmedEmail,
          firstName,
          lastName
        );

        if (profile) {
          setUser(profile);
          console.log("✅ Profile created");
        }

        if (!authData.session) {
          return {
            success: true,
            error: "Please check your email to verify your account",
          };
        } else if (profile) {
          handlePostLoginRedirect(profile);
        }
      }

      return { success: true };
    } catch (err: any) {
      console.error("❌ Sign up error:", err);
      return { success: false, error: err.message || "Sign up failed" };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Google sign in failed" };
    } finally {
      setIsLoading(false);
    }
  };

  // Generic provider sign in
  const signInWithProvider = async (
    provider: Provider
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Provider sign in failed",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSupabaseUser(null);
      setSession(null);
      setError(null);

      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("❌ Sign out error:", err);
      setError(err.message || "Sign out failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    try {
      setError(null);
      const { error } = await supabase
        .from("profiles")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...data,
          updated_at: new Date().toISOString(),
        };
      });
    } catch (err: any) {
      console.error("Update profile error:", err);
      throw err;
    }
  };

  // Refresh user
  const refreshUser = async () => {
    if (supabaseUser) {
      const profile = await fetchUserProfileFromDB(supabaseUser.id);
      setUser(profile);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (email: string) => {
    try {
      const trimmedEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
      });

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Failed to resend verification",
      };
    }
  };

  // Update password
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || "Failed to update password" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile: user, // Alias for user
        supabaseUser,
        isLoading,
        error,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithProvider,
        signOut,
        updateProfile,
        updatePassword,
        updateUserRole,
        refreshUser,
        resendVerificationEmail,
        clearError,
        createProfileIfMissing,
        isAdmin,
        isApproved,
        getUserRole,
        hasPermission,
        getAvailableRoles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
