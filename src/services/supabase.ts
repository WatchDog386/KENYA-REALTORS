// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Accept': 'application/json',
    }
  }
});

export type UserRole = 'admin' | 'tenant' | 'landlord';

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

// ----------------------------------------
// Enhanced error handler for RLS issues
// ----------------------------------------
const handleRLSError = async (error: any, operation: string, userId?: string) => {
  console.error(`RLS Error in ${operation}:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    userId
  });

  // If it's a 406 error, check if it's RLS related
  if (error.code === 'PGRST116' || error.status === 406) {
    console.warn(`RLS policy might be blocking ${operation}. Checking policies...`);
    
    // Try a direct query to check if the row exists (bypassing RLS temporarily)
    if (userId) {
      try {
        const { data: exists } = await supabase
          .from('profiles')
          .select('user_id', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        console.log(`Profile exists check: ${exists ? 'Yes' : 'No'}`);
      } catch (checkError) {
        console.error('Error checking profile existence:', checkError);
      }
    }
  }
  
  throw error;
};

// ----------------------------------------
// Fetch the currently logged-in user's profile with RLS workaround
// ----------------------------------------
export const getCurrentUserProfile = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error in getCurrentUserProfile:', authError);
      return null;
    }

    if (!user) {
      console.log('No authenticated user');
      return null;
    }

    console.log('Fetching profile for user:', user.id);

    // Try with minimal select first
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle instead of single to avoid throwing on no rows

    if (error) {
      await handleRLSError(error, 'getCurrentUserProfile', user.id);
      return null;
    }

    if (!profile) {
      console.log('No profile found for user:', user.id);
      return null;
    }

    console.log('Profile found:', profile.id);
    return profile;
  } catch (error) {
    console.error('Unexpected error in getCurrentUserProfile:', error);
    return null;
  }
};

// ----------------------------------------
// Create a new profile for a user with better error handling
// ----------------------------------------
export const createUserProfile = async (userId: string, email: string, fullName?: string) => {
  try {
    console.log('Creating profile for:', { userId, email });
    
    // First check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingProfile) {
      console.log('Profile already exists for user:', userId);
      // Fetch and return the full existing profile
      const { data: fullProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      return fullProfile;
    }

    // Prepare profile data - minimal and safe
    const profileData = {
      user_id: userId,
      email: email.trim(),
      full_name: fullName?.trim() || email.split('@')[0],
      name: fullName?.trim() || email.split('@')[0],
      role: 'tenant' as UserRole,
      phone: null,
      avatar_url: null,
      data: {
        created_at: new Date().toISOString(),
        source: 'web_app'
      },
    };

    console.log('Inserting profile data:', profileData);

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      console.error('Detailed create profile error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // If unique constraint violation, try to fetch existing
      if (error.code === '23505') {
        console.log('Unique violation, fetching existing profile');
        const { data: existing } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        return existing;
      }
      
      throw error;
    }

    console.log('Profile created successfully:', data?.id);
    return data;
  } catch (error: any) {
    console.error('Unexpected error in createUserProfile:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Try one more time with a simpler insert
    if (error.code === '42501' || error.status === 406) {
      console.log('Retrying with minimal profile data...');
      try {
        const { data } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: email.trim(),
            role: 'tenant'
          })
          .select()
          .single();
        return data;
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
      }
    }
    
    return null;
  }
};

// ----------------------------------------
// Update a user profile with RLS consideration
// ----------------------------------------
export const updateUserProfile = async (updates: Partial<UserProfile>) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('No authenticated user');

    console.log('Updating profile for user:', user.id, 'with:', updates);

    // Prepare safe updates
    const { id, user_id, inserted_at, updated_at, email, ...safeUpdates } = updates;

    const updatePayload: any = {
      ...safeUpdates,
      updated_at: new Date().toISOString(),
    };

    // Preserve existing data if present
    if (updates.data) {
      updatePayload.data = {
        ...(updates.data || {}),
        updated_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      await handleRLSError(error, 'updateUserProfile', user.id);
      throw error;
    }

    console.log('Profile updated successfully');
    return data;
  } catch (error) {
    console.error('Unexpected error in updateUserProfile:', error);
    throw error;
  }
};

// ----------------------------------------
// Get user profile by user ID with RLS check
// ----------------------------------------
export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      await handleRLSError(error, 'getUserById', userId);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getUserById:', error);
    return null;
  }
};

// ----------------------------------------
// Role check helpers with caching
// ----------------------------------------
let roleCache: { [userId: string]: UserRole } = {};

export const isAdmin = async () => {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'admin';
};

export const isLandlord = async () => {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'landlord';
};

export const isTenant = async () => {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'tenant';
};

// ----------------------------------------
// Check RLS policies (diagnostic function)
// ----------------------------------------
export const checkRLSPolicies = async () => {
  try {
    console.log('Checking RLS policies...');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user logged in, cannot check RLS');
      return { enabled: false, user: null };
    }
    
    // Try to query profiles table as the authenticated user
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('RLS check failed:', error);
      return { enabled: true, blocked: true, error: error.message, user: user.id };
    }
    
    console.log('RLS check passed - user can query profiles table');
    return { enabled: true, blocked: false, user: user.id };
  } catch (error) {
    console.error('Error checking RLS:', error);
    return { enabled: false, error: String(error) };
  }
};

// ----------------------------------------
// Database setup check with RLS validation
// ----------------------------------------
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database check...');
    
    // Check if profiles table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return { initialized: false, error: tablesError.message };
    }

    if (!tables || tables.length === 0) {
      console.warn('Profiles table does not exist. Please run the SQL setup.');
      return { initialized: false, error: 'Profiles table missing' };
    }

    // Check RLS status
    const { data: rlsStatus } = await supabase
      .from('information_schema.tables')
      .select('is_row_level_security_enabled')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .single();

    console.log('RLS enabled on profiles:', rlsStatus?.is_row_level_security_enabled);
    
    // Check policies
    const { data: policies } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');

    console.log('Table privileges:', policies?.length || 0, 'policies found');

    return { 
      initialized: true, 
      rlsEnabled: rlsStatus?.is_row_level_security_enabled,
      policyCount: policies?.length || 0
    };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { initialized: false, error: String(error) };
  }
};

// ----------------------------------------
// Test function to verify RLS is working correctly
// ----------------------------------------
export const testRLSAccess = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('No user logged in for RLS test');
    return { success: false, message: 'Not authenticated' };
  }
  
  console.log('Testing RLS access for user:', user.id);
  
  // Test 1: Can user query their own profile?
  const { data: ownProfile, error: ownError } = await supabase
    .from('profiles')
    .select('user_id, email')
    .eq('user_id', user.id)
    .maybeSingle();
  
  // Test 2: Can user query all profiles (should fail if RLS is working)
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true });
  
  const results = {
    canAccessOwnProfile: !ownError && !!ownProfile,
    ownProfileError: ownError?.message,
    canAccessAllProfiles: !allError,
    allProfilesError: allError?.message,
    rlsWorkingProperly: !ownError && !!allError, // Should access own but not all
    userId: user.id
  };
  
  console.log('RLS Test Results:', results);
  return results;
};

export default supabase;