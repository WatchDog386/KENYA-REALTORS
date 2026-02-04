#!/bin/bash

# ============================================================================
# USER SYNC ENHANCEMENT - SETUP SCRIPT
# ============================================================================
# This script helps you set up the user sync system quickly

echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         USER SYNC ENHANCEMENT - SETUP WIZARD                      ║"
echo "║                                                                   ║"
echo "║  Auth users will sync to profiles table automatically on signup   ║"
echo "║  Super admin (duncanmarshel@gmail.com) can manage all users       ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📋 SETUP OPTIONS:"
echo ""
echo "1️⃣  AUTOMATIC (Recommended)"
echo "   → npm run migrate:user-sync"
echo "   → Automatically applies migration"
echo "   → Verifies super admin setup"
echo "   → Takes ~10 seconds"
echo ""
echo "2️⃣  MANUAL (Via Supabase Dashboard)"
echo "   → Open: https://rcxmrtqgppayncelonls.supabase.co"
echo "   → SQL Editor → New Query"
echo "   → Copy from: supabase/migrations/20260205_enhance_user_sync.sql"
echo "   → Click 'Run'"
echo "   → Takes ~2 minutes"
echo ""
echo "3️⃣  PYTHON SCRIPT"
echo "   → python scripts/apply-user-sync-migration.py"
echo "   → Checks for Supabase CLI"
echo "   → Provides detailed instructions"
echo "   → Takes ~30 seconds"
echo ""

# Ask user which option they want
read -p "Which option would you like? (1/2/3): " option

case $option in
  1)
    echo ""
    echo "🚀 Running automatic migration..."
    npm run migrate:user-sync
    ;;
  2)
    echo ""
    echo "📖 Opening Supabase instructions..."
    cat << 'EOF'

MANUAL SETUP STEPS:

1. Open: https://rcxmrtqgppayncelonls.supabase.co
2. Go to: SQL Editor (left sidebar)
3. Click: "New Query" button
4. Copy and paste the entire contents of:
   supabase/migrations/20260205_enhance_user_sync.sql
5. Click the "Run" button
6. Wait for completion message
7. Verify in browser console

VERIFICATION:
- Check query results for ✅ messages
- Run: SELECT * FROM public.profiles LIMIT 5;
- Should see users with roles and status

EOF
    ;;
  3)
    echo ""
    echo "🐍 Running Python migration script..."
    python scripts/apply-user-sync-migration.py
    ;;
  *)
    echo "❌ Invalid option. Please choose 1, 2, or 3"
    exit 1
    ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📋 VERIFICATION STEPS:"
echo ""
echo "1. Check super admin setup:"
echo "   SQL: SELECT email, role, status FROM public.profiles"
echo "        WHERE email = 'duncanmarshel@gmail.com';"
echo ""
echo "2. Login to admin dashboard:"
echo "   - Account: duncanmarshel@gmail.com"
echo "   - Go to: Admin Dashboard → All Users"
echo "   - Should see users list with roles"
echo ""
echo "3. Test auto-sync:"
echo "   - Create a new test account"
echo "   - Wait 2-3 seconds"
echo "   - Refresh admin dashboard"
echo "   - New user should appear automatically"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "✅ SETUP COMPLETE!"
echo ""
echo "📚 For detailed information:"
echo "   - USER_SYNC_QUICK_START.md (5-minute guide)"
echo "   - USER_SYNC_SETUP_GUIDE.md (detailed instructions)"
echo "   - USER_SYNC_IMPLEMENTATION_CHECKLIST.md (verification steps)"
echo ""
echo "🚀 Your user sync system is now ready!"
echo ""
