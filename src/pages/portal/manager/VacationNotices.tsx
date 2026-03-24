import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RentRefundRequestDocument from '@/components/documents/RentRefundRequestDocument';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NoticeItem {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id: string;
  move_out_date: string;
  reason: string;
  status: string;
  created_at: string;
  property_name: string;
  unit_number: string;
  tenant_name: string;
}

const ManagerVacationNotices = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<{
    propertyName: string;
    unitNumber: string;
    requestDate: string;
    rentDeposit: number;
    waterDeposit: number;
    rentArrears: number;
    waterArrears: number;
    utilityArrears: number;
  }>({
    propertyName: 'AYDEN HOMES TOWERS',
    unitNumber: '1305',
    requestDate: new Date().toISOString(),
    rentDeposit: 0,
    waterDeposit: 0,
    rentArrears: 0,
    waterArrears: 0,
    utilityArrears: 0,
  });
  const [loadingDocumentData, setLoadingDocumentData] = useState(true);

  useEffect(() => {
    fetchVacationNotices();
  }, []);

  const selectedNoticeForDocument = useMemo(() => {
    return notices.find((notice) => notice.status === 'pending' || notice.status === 'inspection_scheduled') || notices[0];
  }, [notices]);

  useEffect(() => {
    if (selectedNoticeForDocument) {
      fetchDocumentData(selectedNoticeForDocument);
    } else {
      setLoadingDocumentData(false);
    }
  }, [selectedNoticeForDocument?.id]);

  const fetchVacationNotices = async () => {
    try {
      setLoadingNotices(true);
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp.user;
      if (!user) return;

      const { data: assignedRows } = await supabase
        .from('property_manager_assignments')
        .select('property_id')
        .eq('property_manager_id', user.id);

      const { data: directRows } = await supabase
        .from('properties')
        .select('id')
        .eq('property_manager_id', user.id);

      const propertyIds = [
        ...(assignedRows || []).map((row: any) => row.property_id),
        ...(directRows || []).map((row: any) => row.id),
      ].filter(Boolean);

      if (!propertyIds.length) return;

      const { data: noticeRows } = await supabase
        .from('vacancy_notices')
        .select('id, tenant_id, property_id, unit_id, move_out_date, reason, status, created_at')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false })
        .limit(40);

      const rows = noticeRows || [];
      if (!rows.length) {
        setNotices([]);
        return;
      }

      const tenantIds = [...new Set(rows.map((row: any) => row.tenant_id).filter(Boolean))];
      const unitIds = [...new Set(rows.map((row: any) => row.unit_id).filter(Boolean))];
      const uniquePropertyIds = [...new Set(rows.map((row: any) => row.property_id).filter(Boolean))];

      const [tenantProfilesResp, propertiesResp, unitsResp] = await Promise.all([
        tenantIds.length
          ? supabase.from('profiles').select('id, first_name, last_name').in('id', tenantIds)
          : Promise.resolve({ data: [], error: null } as any),
        uniquePropertyIds.length
          ? supabase.from('properties').select('id, name').in('id', uniquePropertyIds)
          : Promise.resolve({ data: [], error: null } as any),
        unitIds.length
          ? supabase.from('units').select('id, unit_number').in('id', unitIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const profileMap = new Map(((tenantProfilesResp.data || []) as any[]).map((profile) => [
        profile.id,
        `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Tenant',
      ]));
      const propertyMap = new Map(((propertiesResp.data || []) as any[]).map((property) => [property.id, property.name || 'Property']));
      const unitMap = new Map(((unitsResp.data || []) as any[]).map((unit) => [unit.id, unit.unit_number || 'N/A']));

      const mappedNotices: NoticeItem[] = rows.map((row: any) => ({
        id: row.id,
        tenant_id: row.tenant_id,
        property_id: row.property_id,
        unit_id: row.unit_id,
        move_out_date: row.move_out_date,
        reason: row.reason || '',
        status: row.status || 'pending',
        created_at: row.created_at,
        property_name: propertyMap.get(row.property_id) || 'Property',
        unit_number: unitMap.get(row.unit_id) || 'N/A',
        tenant_name: profileMap.get(row.tenant_id) || 'Tenant',
      }));

      setNotices(mappedNotices);
    } catch (error) {
      console.error('Error fetching vacation notices:', error);
    } finally {
      setLoadingNotices(false);
    }
  };

  const fetchDocumentData = async (notice: NoticeItem) => {
    try {
      setLoadingDocumentData(true);

      const { data: unitData } = await supabase
        .from('units')
        .select('unit_number, price')
        .eq('id', notice.unit_id)
        .maybeSingle();

      const { data: bills } = await supabase
        .from('bills_and_utilities')
        .select('bill_type, amount, paid_amount')
        .eq('property_id', notice.property_id)
        .eq('unit_id', notice.unit_id);

      const rows = bills || [];
      const safeOutstanding = (row: any) => Math.max(0, Number(row.amount || 0) - Number(row.paid_amount || 0));

      const rentArrears = rows
        .filter((row: any) => String(row.bill_type || '').toLowerCase() === 'rent')
        .reduce((sum: number, row: any) => sum + safeOutstanding(row), 0);

      const waterArrears = rows
        .filter((row: any) => String(row.bill_type || '').toLowerCase().includes('water'))
        .reduce((sum: number, row: any) => sum + safeOutstanding(row), 0);

      const utilityArrears = rows
        .filter((row: any) => {
          const billType = String(row.bill_type || '').toLowerCase();
          return billType !== 'rent' && !billType.includes('water');
        })
        .reduce((sum: number, row: any) => sum + safeOutstanding(row), 0);

      setDocumentData({
        propertyName: notice.property_name || 'AYDEN HOMES TOWERS',
        unitNumber: unitData?.unit_number || notice.unit_number || 'N/A',
        requestDate: notice.move_out_date || notice.created_at || new Date().toISOString(),
        rentDeposit: Math.max(0, Number(unitData?.price || 0)),
        waterDeposit: 0,
        rentArrears,
        waterArrears,
        utilityArrears,
      });
    } catch (error) {
      console.error('Error fetching move-out document data:', error);
    } finally {
      setLoadingDocumentData(false);
    }
  };

  const verifyVacancy = async (notice: NoticeItem) => {
    try {
      setVerifyingId(notice.id);

      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp.user;
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('vacancy_notices')
        .update({ status: 'completed' })
        .eq('id', notice.id);

      if (updateError) throw updateError;

      const { data: recipients } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['technician', 'proprietor', 'accountant', 'super_admin']);

      const notificationRows = (recipients || []).map((recipient: any) => ({
        recipient_id: recipient.id,
        sender_id: user.id,
        type: 'vacancy_verified',
        title: 'Vacancy Verified by Manager',
        message: `Vacancy verified for ${notice.property_name}, Unit ${notice.unit_number}. This vacancy is now available in the portal feed.`,
        related_entity_type: 'vacancy_notice',
        related_entity_id: notice.id,
      }));

      if (notificationRows.length) {
        await supabase.from('notifications').insert(notificationRows);
      }

      toast.success('Vacancy verified and shared across role portals.');
      fetchVacationNotices();
    } catch (error: any) {
      console.error('Error verifying vacancy:', error);
      toast.error(error?.message || 'Failed to verify vacancy');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D85C2C] to-[#D85C2C]/80 rounded-xl shadow-lg p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Vacation Notices</h1>
            <p className="text-orange-100 text-sm mt-1">Manage tenant vacation and absence reports</p>
          </div>
        </div>
        <Button className="bg-white text-[#D85C2C] hover:bg-gray-100">New Notice</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants Intending to Vacate</CardTitle>
          <CardDescription>
            Sending a notice to vacate records the tenant here for move-out tracking and refund workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingNotices ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notices...
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notice to vacate submissions yet</h3>
              <p className="text-gray-500">Once tenants submit a notice to vacate, they will be listed here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <div key={notice.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{notice.property_name} - Unit {notice.unit_number}</p>
                      <p className="text-sm text-gray-600">Tenant: {notice.tenant_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Move-out date: {notice.move_out_date ? new Date(notice.move_out_date).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Reason: {notice.reason || 'No reason provided'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        notice.status === 'completed' || notice.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : notice.status === 'inspection_scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {notice.status.replace('_', ' ')}
                      </span>

                      {notice.status !== 'completed' && notice.status !== 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => verifyVacancy(notice)}
                          disabled={verifyingId === notice.id}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {verifyingId === notice.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Verify Vacancy
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Move-Out Refund Request Document</CardTitle>
          <CardDescription>
            Standard document used when processing tenant move-out deposit refunds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDocumentData ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading document values...
            </div>
          ) : (
            <RentRefundRequestDocument
              propertyName={documentData.propertyName}
              unitNumber={documentData.unitNumber}
              requestDate={documentData.requestDate}
              addItems={[
                { label: 'Rent Deposit', amount: documentData.rentDeposit },
                { label: 'Water Deposit', amount: documentData.waterDeposit },
              ]}
              deductItems={[
                { label: 'Rent Arrears', amount: documentData.rentArrears },
                { label: 'Water Bill Arrears', amount: documentData.waterArrears },
                { label: 'Other Utility Arrears', amount: documentData.utilityArrears },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerVacationNotices;