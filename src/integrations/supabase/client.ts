// © 2026 Jeff. All rights reserved.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const isBrowser = typeof window !== "undefined";
const isDev =
  (typeof import.meta !== "undefined" && import.meta.env?.DEV) ||
  process.env.NODE_ENV === "development";

const getEnv = (key: string): string | undefined => {
  if (typeof import.meta !== "undefined" && import.meta.env?.[key]) return import.meta.env[key];
  if (typeof process !== "undefined" && process.env?.[key]) return process.env[key];
  if (typeof Deno !== "undefined") return Deno.env.get(key);
  return undefined;
};

const SUPABASE_URL = getEnv("VITE_SUPABASE_URL") || getEnv("NEXT_PUBLIC_SUPABASE_URL") || getEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL) throw new Error("❌ Missing SUPABASE_URL.");
if (isBrowser && !SUPABASE_ANON_KEY) throw new Error("❌ Missing SUPABASE_ANON_KEY for browser.");

if (isDev) console.log("✅ Supabase Config Loaded", { url: SUPABASE_URL, hasAnonKey: !!SUPABASE_ANON_KEY, hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY, runtime: isBrowser ? "browser" : "server" });

const getSiteUrl = (): string => {
  if (isBrowser) {
    // Use the current location in browser for email redirects
    const origin = window.location.origin;
    console.log("🌐 Browser URL (for email redirects):", origin);
    return origin;
  }
  if (isDev) return "http://localhost:5173"; // Common Vite port
  return "https://realtor.co.ke";
};

const currentSiteUrl = getSiteUrl();
if (isDev) console.log("🌐 Current Site URL:", currentSiteUrl);

const storage = isBrowser ? window.localStorage : undefined;

// Ensure WebCrypto API is available for browser environments
if (isBrowser && !globalThis.crypto) {
  console.warn("⚠️ WebCrypto API not available, using fallback");
}

// ------------------
// MAIN SUPABASE CLIENT
// ------------------
export const supabase: SupabaseClient<Database> = createClient(SUPABASE_URL, SUPABASE_ANON_KEY!, {
  auth: { 
    storage, 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: "pkce",
    storageKey: "supabase.auth.token",
  },
  global: { headers: { "x-application": "realtors-kenya", "x-client": "web", "x-site-url": currentSiteUrl } },
  realtime: { params: { eventsPerSecond: 10 } },
});

// ------------------
// USER PROFILE TYPES
// ------------------
export type UserRole = "admin" | "tenant" | "landlord";
export interface UserProfile {
  id: bigint;
  user_id: string;
  email: string;
  full_name?: string;
  name?: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  data?: any;
  inserted_at: string;
  updated_at: string;
}

// ------------------
// PROFILE HELPERS
// ------------------
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (data) return data;

    if (error?.code === "PGRST116") return await createUserProfile(user.id, user.email || "", user.user_metadata?.full_name || "");
    return null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};

export const createUserProfile = async (userId: string, email: string, fullName?: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .insert([{
        user_id: userId,
        email,
        name: fullName || email.split("@")[0],
        full_name: fullName || email.split("@")[0],
        role: "tenant" as UserRole,
        data: { email, created_at: new Date().toISOString(), role: "tenant" }
      }])
      .select()
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error in createUserProfile:", error);
    return null;
  }
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString(), data: { ...(updates.data || {}), updated_at: new Date().toISOString() } })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    return null;
  }
};

// ------------------
// REDIRECT HELPERS
// ------------------
export const getAuthRedirectUrl = (path = ""): string => {
  const cleanBase = currentSiteUrl.endsWith("/") ? currentSiteUrl.slice(0, -1) : currentSiteUrl;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return cleanPath ? `${cleanBase}/${cleanPath}` : cleanBase;
};

// ------------------
// AUTH METHODS
// ------------------
export const signUpWithRedirect = async (email: string, password: string, name?: string) => {
  return supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: getAuthRedirectUrl("dashboard"), data: { name: name || email.split("@")[0], site_url: currentSiteUrl } },
  });
};

export const signInWithRedirect = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signInWithGoogle = async () => {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getAuthRedirectUrl("auth/callback"), queryParams: { access_type: "offline", prompt: "consent" } },
  });
};

export const resetPasswordWithRedirect = async (email: string) => {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo: getAuthRedirectUrl("reset-password") });
};

// ------------------
// SERVICE ROLE & EDGE CLIENTS
// ------------------
export const createServiceRoleClient = (): SupabaseClient<Database> => {
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("❌ SUPABASE_SERVICE_ROLE_KEY is required for server operations");
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { "x-client": "service-role", "x-site-url": currentSiteUrl } } });
};

export const createEdgeClient = (accessToken: string): SupabaseClient<Database> => {
  if (!accessToken) throw new Error("❌ Access token required for edge client");
  return createClient<Database>(SUPABASE_URL, accessToken, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { "x-client": "edge-function", "x-site-url": currentSiteUrl } } });
};

// ------------------
// CONNECTION TEST
// ------------------
export const testSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from("profiles").select("id", { head: true });
    if (error) return { success: false, error: error.message };
    return { success: true, url: SUPABASE_URL, siteUrl: currentSiteUrl, timestamp: new Date().toISOString() };
  } catch (err: any) {
    return { success: false, error: err.message ?? "Unknown error" };
  }
};

// ------------------
// AUTH ERROR HANDLER
// ------------------
export const handleAuthError = (error: any) => {
  const map: Record<string, string> = {
    "Invalid login credentials": "Login failed: Incorrect password or unverified account.",
    "Email not confirmed": "Please confirm your email address.",
    "User already registered": "An account with this email already exists.",
    "Password should be at least 6 characters": "Password must be at least 6 characters.",
    "Too many requests": "Too many attempts. Try again later.",
    "Email rate limit exceeded": "Too many emails sent. Please wait.",
    "Invalid email": "Please enter a valid email address.",
    "Signup requires a valid password": "Please enter a valid password.",
    "Unable to validate email address: invalid format": "Invalid email format.",
    "Auth session missing": "Session expired. Please sign in again.",
  };
  return { message: map[error?.message] || "Authentication failed.", original: error };
};

// ------------------
// EMAIL VERIFICATION
// ------------------
export const checkEmailVerificationStatus = async (userId: string) => {
  try {
    if (isBrowser) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId) return { verified: !!user.email_confirmed_at, verifiedAt: user.email_confirmed_at };
      return { verified: false, verifiedAt: null };
    }
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createServiceRoleClient();
      const { data: { user }, error } = await adminClient.auth.admin.getUserById(userId);
      if (error) return { verified: false, verifiedAt: null };
      return { verified: !!user?.email_confirmed_at, verifiedAt: user?.email_confirmed_at };
    }
    return { verified: false, verifiedAt: null };
  } catch (error) {
    console.error("Error checking email verification:", error);
    return { verified: false, verifiedAt: null };
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    return await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: getAuthRedirectUrl("dashboard") } });
  } catch (error: any) {
    return { error };
  }
};

// ------------------
// DEV DEBUG LISTENERS
// ------------------
if (isDev && isBrowser) {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("🔐 Auth Event:", event, { user: session?.user?.email, siteUrl: currentSiteUrl, userId: session?.user?.id });
  });
}

export default supabase;
