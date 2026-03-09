import { supabase } from "@/integrations/supabase/client";
import { AccountingTransaction, AccountingDashboardData, Accountant } from '@/types/newRoles';

/**
 * Accounting Service - Manage all financial transactions
 * Handles deposits, bills, rent, and payments through approval workflow
 */

// ============================================================================
// ACCOUNTANT MANAGEMENT
// ============================================================================

/**
 * Get accountant profile by user ID
 */
export const getAccountantByUserId = async (userId: string): Promise<Accountant | null> => {
  try {
    const { data, error } = await supabase
      .from('accountants')
      .select('*, profiles:user_id(*)')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching accountant:', error);
    return null;
  }
};

/**
 * Create accountant profile
 */
export const createAccountant = async (
  userId: string,
  data: {
    employee_id?: string;
    hire_date?: string;
    assigned_by: string;
  }
): Promise<Accountant | null> => {
  try {
    const { data: result, error } = await supabase
      .from('accountants')
      .insert([
        {
          user_id: userId,
          employee_id: data.employee_id,
          hire_date: data.hire_date,
          assigned_by: data.assigned_by,
          assignment_date: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error creating accountant:', error);
    return null;
  }
};

/**
 * Suspend accountant
 */
export const suspendAccountant = async (accountantId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('accountants')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('id', accountantId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error suspending accountant:', error);
    return false;
  }
};

/**
 * Reactivate accountant
 */
export const reactivateAccountant = async (accountantId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('accountants')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', accountantId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error reactivating accountant:', error);
    return false;
  }
};

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

/**
 * Get all pending transactions
 */
export const getPendingTransactions = async (): Promise<AccountingTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('accounting_transactions')
      .select('*, property:property_id(*), property_manager:property_manager_id(id, first_name, last_name, email), tenant:tenant_id(id, first_name, last_name, email)')
      .eq('status', 'pending')
      .order('pending_from', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    return [];
  }
};

/**
 * Get all processed transactions
 */
export const getProcessedTransactions = async (
  limit = 100,
  offset = 0
): Promise<AccountingTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('accounting_transactions')
      .select('*, property:property_id(*), property_manager:property_manager_id(id, first_name, last_name, email), tenant:tenant_id(id, first_name, last_name, email)')
      .eq('status', 'processed')
      .order('processed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching processed transactions:', error);
    return [];
  }
};

/**
 * Get transactions by property
 */
export const getPropertyTransactions = async (
  propertyId: string,
  status?: 'pending' | 'approved' | 'rejected' | 'processed'
): Promise<AccountingTransaction[]> => {
  try {
    let query = supabase
      .from('accounting_transactions')
      .select('*, property:property_id(*), property_manager:property_manager_id(id, first_name, last_name, email), tenant:tenant_id(id, first_name, last_name, email)')
      .eq('property_id', propertyId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching property transactions:', error);
    return [];
  }
};

/**
 * Get transactions by type
 */
export const getTransactionsByType = async (
  type: 'deposit' | 'rent' | 'bill' | 'payment',
  status?: 'pending' | 'approved' | 'rejected' | 'processed'
): Promise<AccountingTransaction[]> => {
  try {
    let query = supabase
      .from('accounting_transactions')
      .select('*, property:property_id(*), property_manager:property_manager_id(id, first_name, last_name, email), tenant:tenant_id(id, first_name, last_name, email)')
      .eq('transaction_type', type);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions by type:', error);
    return [];
  }
};

/**
 * Approve transaction (accountant action)
 */
export const approveTransaction = async (
  transactionId: string,
  accountantId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('accounting_transactions')
      .update({
        status: 'approved',
        approved_by: accountantId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error approving transaction:', error);
    return false;
  }
};

/**
 * Reject transaction (accountant action)
 */
export const rejectTransaction = async (
  transactionId: string,
  reason: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('accounting_transactions')
      .update({
        status: 'rejected',
        notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    return false;
  }
};

/**
 * Process transaction (move to processed after approval)
 */
export const processTransaction = async (transactionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('accounting_transactions')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .eq('status', 'approved');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error processing transaction:', error);
    return false;
  }
};

/**
 * Create new transaction (from property manager)
 */
export const createTransaction = async (
  propertyId: string,
  data: {
    transaction_type: 'deposit' | 'rent' | 'bill' | 'payment';
    amount: number;
    description?: string;
    tenant_id?: string;
    property_manager_id: string;
    reference_number?: string;
  }
): Promise<AccountingTransaction | null> => {
  try {
    const { data: result, error } = await supabase
      .from('accounting_transactions')
      .insert([
        {
          property_id: propertyId,
          transaction_type: data.transaction_type,
          amount: data.amount,
          description: data.description,
          tenant_id: data.tenant_id,
          property_manager_id: data.property_manager_id,
          reference_number: data.reference_number || `TXN-${Date.now()}`,
          status: 'pending',
          pending_from: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
};

// ============================================================================
// DASHBOARD & REPORTING
// ============================================================================

/**
 * Get accounting dashboard data
 */
export const getAccountingDashboardData = async (): Promise<AccountingDashboardData | null> => {
  try {
    // Get pending transactions
    const { data: pendingData, error: pendingError } = await supabase
      .from('accounting_transactions')
      .select('id, amount, transaction_type')
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    // Get processed transactions
    const { data: processedData, error: processedError } = await supabase
      .from('accounting_transactions')
      .select('id, amount, transaction_type, processed_at')
      .eq('status', 'processed');

    if (processedError) throw processedError;

    // Get all transactions for summary
    const { data: allData, error: allError } = await supabase
      .from('accounting_transactions')
      .select('id, amount, transaction_type, status');

    if (allError) throw allError;

    const pendingTransactions = pendingData || [];
    const processedTransactions = processedData || [];
    const allTransactions = allData || [];

    const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0);

    const summaryByType = {
      deposits: {
        count: allTransactions.filter((t) => t.transaction_type === 'deposit').length,
        amount: allTransactions
          .filter((t) => t.transaction_type === 'deposit')
          .reduce((sum, t) => sum + t.amount, 0),
      },
      rent: {
        count: allTransactions.filter((t) => t.transaction_type === 'rent').length,
        amount: allTransactions
          .filter((t) => t.transaction_type === 'rent')
          .reduce((sum, t) => sum + t.amount, 0),
      },
      bills: {
        count: allTransactions.filter((t) => t.transaction_type === 'bill').length,
        amount: allTransactions
          .filter((t) => t.transaction_type === 'bill')
          .reduce((sum, t) => sum + t.amount, 0),
      },
      payments: {
        count: allTransactions.filter((t) => t.transaction_type === 'payment').length,
        amount: allTransactions
          .filter((t) => t.transaction_type === 'payment')
          .reduce((sum, t) => sum + t.amount, 0),
      },
    };

    // Fetch detailed pending transactions
    const { data: detailedPending, error: detailedError } = await supabase
      .from('accounting_transactions')
      .select('*, property:property_id(*), property_manager:property_manager_id(id, first_name, last_name, email), tenant:tenant_id(id, first_name, last_name, email)')
      .eq('status', 'pending')
      .order('pending_from', { ascending: true });

    if (detailedError) throw detailedError;

    return {
      totalPending: pendingTransactions.length,
      totalProcessed: processedTransactions.length,
      totalAmount,
      pendingAmount,
      transactions: detailedPending || [],
      summaryByType,
    };
  } catch (error) {
    console.error('Error fetching accounting dashboard data:', error);
    return null;
  }
};

/**
 * Get accounting summary for date range
 */
export const getAccountingSummary = async (
  startDate: string,
  endDate: string
): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('accounting_transactions')
      .select('transaction_type, amount, status, processed_at')
      .gte('processed_at', startDate)
      .lte('processed_at', endDate);

    if (error) throw error;

    const transactions = data || [];

    return {
      period: { start: startDate, end: endDate },
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      byType: {
        deposits: {
          count: transactions.filter((t) => t.transaction_type === 'deposit').length,
          amount: transactions
            .filter((t) => t.transaction_type === 'deposit')
            .reduce((sum, t) => sum + t.amount, 0),
        },
        rent: {
          count: transactions.filter((t) => t.transaction_type === 'rent').length,
          amount: transactions
            .filter((t) => t.transaction_type === 'rent')
            .reduce((sum, t) => sum + t.amount, 0),
        },
        bills: {
          count: transactions.filter((t) => t.transaction_type === 'bill').length,
          amount: transactions
            .filter((t) => t.transaction_type === 'bill')
            .reduce((sum, t) => sum + t.amount, 0),
        },
        payments: {
          count: transactions.filter((t) => t.transaction_type === 'payment').length,
          amount: transactions
            .filter((t) => t.transaction_type === 'payment')
            .reduce((sum, t) => sum + t.amount, 0),
        },
      },
      byStatus: {
        pending: transactions.filter((t) => t.status === 'pending').length,
        approved: transactions.filter((t) => t.status === 'approved').length,
        rejected: transactions.filter((t) => t.status === 'rejected').length,
        processed: transactions.filter((t) => t.status === 'processed').length,
      },
    };
  } catch (error) {
    console.error('Error fetching accounting summary:', error);
    return null;
  }
};
