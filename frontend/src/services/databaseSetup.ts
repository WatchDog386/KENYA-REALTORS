// src/services/databaseSetup.ts
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const setupDatabase = async () => {
  try {
    console.log('Setting up database...');
    
    // First, check if we're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Authentication required');
    }

    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Check if profiles table exists with new structure
    const { data: tableExists, error: tableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('Profiles table check error:', tableError);
      throw new Error('Database tables not properly initialized. Please run the SQL migrations first.');
    }

    console.log('Checking profile for user:', user.id);
    
    // Check if user has a profile in the new structure
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking profile:', profileError);
      throw new Error('Failed to check user profile');
    }

    if (!profile) {
      console.log('No profile found, creating...');
      
      // Create profile with new structure
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || user.email?.split('@')[0],
          last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ')[1] || '',
          role: 'tenant',
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create profile:', createError);
        throw new Error(`Failed to create profile: ${createError.message}`);
      }

      console.log('Profile created:', newProfile);
      return { 
        success: true, 
        profile: newProfile, 
        action: 'created' 
      };
    }

    console.log('Profile exists:', profile);
    return { 
      success: true, 
      profile, 
      action: 'exists' 
    };

  } catch (error: any) {
    console.error('Database setup error:', error);
    toast.error(error.message || 'Failed to setup database');
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    };
  }
};

export const checkDatabaseTables = async () => {
  try {
    const checks = await Promise.all([
      supabase.from('profiles').select('count').limit(1),
      supabase.from('properties').select('count').limit(1),
      supabase.from('approval_requests').select('count').limit(1),
      supabase.from('leases').select('count').limit(1),
      supabase.from('payments').select('count').limit(1),
    ]);

    const results = {
      profiles: !checks[0].error,
      properties: !checks[1].error,
      approvalRequests: !checks[2].error,
      leases: !checks[3].error,
      payments: !checks[4].error,
    };

    const allTablesExist = Object.values(results).every(Boolean);
    
    return {
      ...results,
      allTablesExist,
      message: allTablesExist ? 'All tables exist' : 'Some tables are missing'
    };
  } catch (error) {
    console.error('Error checking database tables:', error);
    return {
      profiles: false,
      properties: false,
      approvalRequests: false,
      leases: false,
      payments: false,
      allTablesExist: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const repairUserProfile = async (userId: string) => {
  try {
    console.log('Repairing profile for user:', userId);
    
    // Get user from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not found:', userError);
      throw new Error('User not found');
    }

    // Check current profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      console.log('Profile already exists, updating...');
      
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          email: user.email,
          first_name: user.user_metadata?.first_name || existingProfile.first_name || user.email?.split('@')[0],
          last_name: user.user_metadata?.last_name || existingProfile.last_name || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      return { success: true, profile: updatedProfile, action: 'updated' };
    } else {
      console.log('Creating new profile...');
      
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || user.email?.split('@')[0],
          last_name: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ')[1] || '',
          role: 'tenant',
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create profile: ${createError.message}`);
      }

      return { success: true, profile: newProfile, action: 'created' };
    }
  } catch (error: any) {
    console.error('Repair error:', error);
    toast.error(error.message || 'Failed to repair profile');
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred' 
    };
  }
};

// Function to initialize database with migrations
export const runMigrations = async () => {
  try {
    toast.loading('Running database migrations...');
    
    // In a real application, you would:
    // 1. Have a migrations table to track which migrations have been run
    // 2. Read SQL files from a migrations folder
    // 3. Execute them in order
    
    // For now, we'll just check if tables exist
    const tableCheck = await checkDatabaseTables();
    
    if (!tableCheck.allTablesExist) {
      toast.warning('Some database tables are missing. Please run the SQL migrations manually in Supabase.');
      return {
        success: false,
        message: 'Tables missing. Run migrations manually.',
        details: tableCheck
      };
    }
    
    toast.success('Database is properly configured!');
    return {
      success: true,
      message: 'All tables exist',
      details: tableCheck
    };
  } catch (error: any) {
    console.error('Migration error:', error);
    toast.error('Failed to run migrations');
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
};

// Helper function to get user profile with proper typing
export const getUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return { success: true, profile };
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};