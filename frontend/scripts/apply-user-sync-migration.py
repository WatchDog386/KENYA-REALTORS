#!/usr/bin/env python3
"""
Apply user sync migration to Supabase
This script reads the migration SQL and provides instructions or attempts to apply it
"""

import os
import sys
import subprocess
from pathlib import Path

# Supabase credentials
SUPABASE_URL = "https://rcxmrtqgppayncelonls.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjeG1ydHFncHBheW5jZWxvbmxzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODAzMzc1NCwiZXhwIjoyMDgzNjA5NzU0fQ.k_auqkmx43e40iVZ1mq3kjfWXjAcwU9v4LvMdsZ1FUw"

def read_migration():
    """Read the migration SQL file"""
    migration_path = Path(__file__).parent.parent / "supabase" / "migrations" / "20260205_enhance_user_sync.sql"
    
    if not migration_path.exists():
        print(f"❌ Migration file not found: {migration_path}")
        sys.exit(1)
    
    with open(migration_path, 'r') as f:
        return f.read()

def apply_migration_via_supabase_cli():
    """Try to apply migration using supabase CLI"""
    try:
        # Check if supabase CLI is installed
        result = subprocess.run(["supabase", "--version"], capture_output=True, text=True)
        if result.returncode != 0:
            return False
        
        print("📦 Using Supabase CLI to apply migration...")
        result = subprocess.run(
            ["supabase", "db", "push"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Migration applied successfully via Supabase CLI!")
            return True
        else:
            print(f"⚠️ CLI error: {result.stderr}")
            return False
            
    except FileNotFoundError:
        return False

def main():
    print("🚀 User Sync Enhancement Migration\n")
    print("=" * 60)
    
    # Read migration
    print("📖 Reading migration file...")
    migration_sql = read_migration()
    
    # Try CLI first
    if apply_migration_via_supabase_cli():
        print("\n✨ Migration completed successfully!")
        print("\n📋 Applied changes:")
        print("✅ Enhanced handle_new_user() function")
        print("✅ Trigger on_auth_user_created created")
        print("✅ All auth.users synced to profiles table")
        print("✅ Super admin role assigned to duncanmarshel@gmail.com")
        print("✅ get_all_users_with_auth() function created")
        print("✅ RLS policies updated for super admin")
        return 0
    
    # Fallback: provide manual instructions
    print("\n⚠️  Cannot apply via CLI. Please use manual approach:\n")
    print("=" * 60)
    print("\n📋 MANUAL INSTALLATION STEPS:")
    print("\n1. Open Supabase Dashboard:")
    print(f"   👉 {SUPABASE_URL}")
    print("\n2. Go to SQL Editor (sidebar -> SQL)")
    print("\n3. Create new query and paste this SQL:")
    print("-" * 60)
    print(migration_sql)
    print("-" * 60)
    print("\n4. Click 'Run' button")
    print("\n5. Verify in User Management Dashboard")
    print("=" * 60)
    print("\n✅ After applying migration:")
    print("   - Auth users automatically sync to profiles on signup")
    print("   - duncanmarshel@gmail.com has super_admin role")
    print("   - Super admin can view all users in dashboard")
    print("   - RLS policies allow super admin full access")
    
    return 1

if __name__ == "__main__":
    sys.exit(main())
