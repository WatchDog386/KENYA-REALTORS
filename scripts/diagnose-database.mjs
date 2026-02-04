#!/usr/bin/env node

/**
 * Database Diagnostic Tool
 * Checks the actual database state and helps identify configuration issues
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

console.log('\n========================================');
console.log('DATABASE DIAGNOSTIC TOOL');
console.log('========================================\n');

// Check if env files exist
console.log('📋 Checking environment files...');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local exists');
} else {
  console.log('❌ .env.local NOT found');
  console.log('   This file should contain VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

if (fs.existsSync(envExamplePath)) {
  console.log('✅ .env.example exists');
} else {
  console.log('❌ .env.example NOT found');
}

// Try to read and parse the .env.local file
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n📝 Environment Variables:');
console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ SET' : '❌ NOT SET'}`);
console.log(`   VITE_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ SET' : '❌ NOT SET'}`);

if (!supabaseUrl || !supabaseKey) {
  console.log('\n⚠️  Missing environment variables!');
  console.log('Create a .env.local file with:');
  console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

// Initialize Supabase client
console.log('\n🔗 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
  try {
    // Check 1: Can we connect?
    console.log('\n✅ Connected to Supabase at ' + supabaseUrl);

    // Check 2: Profiles table structure
    console.log('\n📊 Checking profiles table structure...');
    const { data: profilesInfo, error: profilesError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (profilesError) {
      console.log('Note: Could not query information_schema (expected with RLS)');
      // Try direct select
      const { data: test, error: testError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.log('❌ Cannot select from profiles table:', testError.message);
      } else {
        console.log('✅ profiles table exists and is readable');
      }
    }

    // Check 3: Property manager assignments table
    console.log('\n📊 Checking property_manager_assignments table...');
    const { data: pmTest, error: pmError } = await supabase
      .from('property_manager_assignments')
      .select('*')
      .limit(1);

    if (pmError && pmError.code !== 'PGRST116') {
      console.log('❌ Error accessing property_manager_assignments:', pmError.message);
    } else {
      console.log('✅ property_manager_assignments table exists');
    }

    // Check 4: Can we select from all_users_with_profile view?
    console.log('\n📊 Checking all_users_with_profile view...');
    const { data: usersData, error: usersError, count } = await supabase
      .from('all_users_with_profile')
      .select('*', { count: 'exact' })
      .limit(5);

    if (usersError) {
      console.log('❌ Error accessing all_users_with_profile view:', usersError.message);
      console.log('   This is critical - UserManagementNew depends on this view!');
    } else {
      console.log(`✅ all_users_with_profile view accessible (${count} total users)`);
      if (usersData && usersData.length > 0) {
        console.log('\n   Sample user:');
        const user = usersData[0];
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - First Name: ${user.first_name}`);
        console.log(`   - Role: ${user.role}`);
        console.log(`   - Status: ${user.status}`);
      }
    }

    // Check 5: Properties table
    console.log('\n📊 Checking properties table...');
    const { data: propsData, error: propsError, count: propsCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .limit(1);

    if (propsError) {
      console.log('❌ Error accessing properties table:', propsError.message);
    } else {
      console.log(`✅ properties table accessible (${propsCount} total properties)`);
    }

    // Check 6: Tenants table
    console.log('\n📊 Checking tenants table...');
    const { data: tenantsData, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);

    if (tenantsError) {
      console.log('❌ Error accessing tenants table:', tenantsError.message);
    } else {
      console.log('✅ tenants table accessible');
    }

    // Check 7: Current auth state
    console.log('\n🔐 Checking authentication...');
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      console.log('⚠️  Not authenticated (this is OK for diagnostics)');
    } else {
      console.log(`✅ Authenticated as: ${authData.user.email}`);
      console.log(`   Role: ${authData.user.user_metadata?.role || 'N/A'}`);
    }

    // Summary
    console.log('\n========================================');
    console.log('DIAGNOSTIC SUMMARY');
    console.log('========================================');
    console.log('\n✅ If you see green checkmarks above, your database is working!');
    console.log('❌ If you see red X marks, those are the issues to fix.');
    console.log('\nCommon issues:');
    console.log('1. Missing .env.local file with Supabase credentials');
    console.log('2. Incorrect Supabase URL or anon key');
    console.log('3. Missing database tables or views (check migrations)');
    console.log('4. RLS policies blocking access');

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
    process.exit(1);
  }
}

runDiagnostics();
