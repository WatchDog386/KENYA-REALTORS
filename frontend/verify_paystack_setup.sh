#!/bin/bash
# Paystack Integration Checklist
# Use this to verify all components are in place

echo "🔍 Checking Paystack Integration Files..."
echo ""

# Check service files
echo "📦 Service Files:"
[ -f "src/services/paystackService.ts" ] && echo "✅ paystackService.ts" || echo "❌ paystackService.ts MISSING"
[ -f "src/services/paystackWebhookHandler.ts" ] && echo "✅ paystackWebhookHandler.ts" || echo "❌ paystackWebhookHandler.ts MISSING"

# Check component files
echo ""
echo "🎨 Component Files:"
[ -f "src/components/dialogs/PaystackPaymentDialog.tsx" ] && echo "✅ PaystackPaymentDialog.tsx" || echo "❌ PaystackPaymentDialog.tsx MISSING"

# Check updated page files
echo ""
echo "📄 Updated Page Files:"
[ -f "src/pages/portal/tenant/MakePayment.tsx" ] && echo "✅ MakePayment.tsx" || echo "❌ MakePayment.tsx MISSING"
[ -f "src/pages/portal/tenant/Payments.tsx" ] && echo "✅ Payments.tsx" || echo "❌ Payments.tsx MISSING"
[ -f "src/pages/portal/ManagerPortal.tsx" ] && echo "✅ ManagerPortal.tsx" || echo "❌ ManagerPortal.tsx MISSING"

# Check documentation
echo ""
echo "📚 Documentation:"
[ -f ".env" ] && echo "✅ .env (with Paystack keys)" || echo "❌ .env MISSING"
[ -f "PAYSTACK_QUICK_START.md" ] && echo "✅ PAYSTACK_QUICK_START.md" || echo "❌ MISSING"
[ -f "PAYSTACK_IMPLEMENTATION.md" ] && echo "✅ PAYSTACK_IMPLEMENTATION.md" || echo "❌ MISSING"
[ -f "PAYSTACK_SETUP_COMPLETE.md" ] && echo "✅ PAYSTACK_SETUP_COMPLETE.md" || echo "❌ MISSING"
[ -f "PAYSTACK_COMPLETION_REPORT.md" ] && echo "✅ PAYSTACK_COMPLETION_REPORT.md" || echo "❌ MISSING"
[ -f "README_PAYSTACK.md" ] && echo "✅ README_PAYSTACK.md" || echo "❌ MISSING"

echo ""
echo "✅ All checks complete!"
echo ""
echo "Next steps:"
echo "1. npm run dev"
echo "2. Test payment flow"
echo "3. Check Supabase records"
echo "4. Read PAYSTACK_QUICK_START.md"
