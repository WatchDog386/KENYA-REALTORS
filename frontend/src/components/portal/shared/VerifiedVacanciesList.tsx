import React, { useEffect, useState } from 'react';
import { Building2, Calendar, Loader2, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface VacancyItem {
  id: string;
  move_out_date: string;
  created_at: string;
  property_name: string;
  unit_number: string;
  tenant_name: string;
}

interface VerifiedVacanciesListProps {
  title?: string;
  description?: string;
  limit?: number;
}

const VerifiedVacanciesList: React.FC<VerifiedVacanciesListProps> = ({
  title = 'Verified Vacancies',
  description = 'Units verified by managers after tenant move-out.',
  limit = 8,
}) => {
  const [loading, setLoading] = useState(true);
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);

  useEffect(() => {
    fetchVerifiedVacancies();
  }, [limit]);

  const fetchVerifiedVacancies = async () => {
    try {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from('vacancy_notices')
        .select('id, tenant_id, property_id, unit_id, move_out_date, created_at, status')
        .in('status', ['completed', 'approved'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const noticeRows = rows || [];
      if (!noticeRows.length) {
        setVacancies([]);
        return;
      }

      const tenantIds = [...new Set(noticeRows.map((row: any) => row.tenant_id).filter(Boolean))];
      const propertyIds = [...new Set(noticeRows.map((row: any) => row.property_id).filter(Boolean))];
      const unitIds = [...new Set(noticeRows.map((row: any) => row.unit_id).filter(Boolean))];

      const [tenantProfilesResp, propertiesResp, unitsResp] = await Promise.all([
        tenantIds.length
          ? supabase.from('profiles').select('id, first_name, last_name').in('id', tenantIds)
          : Promise.resolve({ data: [], error: null } as any),
        propertyIds.length
          ? supabase.from('properties').select('id, name').in('id', propertyIds)
          : Promise.resolve({ data: [], error: null } as any),
        unitIds.length
          ? supabase.from('units').select('id, unit_number').in('id', unitIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const profileMap = new Map(
        ((tenantProfilesResp.data || []) as any[]).map((profile) => [
          profile.id,
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Tenant',
        ])
      );
      const propertyMap = new Map(((propertiesResp.data || []) as any[]).map((property) => [property.id, property.name || 'Property']));
      const unitMap = new Map(((unitsResp.data || []) as any[]).map((unit) => [unit.id, unit.unit_number || 'N/A']));

      const mapped = noticeRows.map((row: any) => ({
        id: row.id,
        move_out_date: row.move_out_date,
        created_at: row.created_at,
        property_name: propertyMap.get(row.property_id) || 'Property',
        unit_number: unitMap.get(row.unit_id) || 'N/A',
        tenant_name: profileMap.get(row.tenant_id) || 'Tenant',
      }));

      setVacancies(mapped);
    } catch (error) {
      console.error('Error fetching verified vacancies:', error);
      setVacancies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading verified vacancies...
          </div>
        ) : vacancies.length === 0 ? (
          <p className="text-sm text-gray-500">No verified vacancies yet.</p>
        ) : (
          <div className="space-y-3">
            {vacancies.map((vacancy) => (
              <div key={vacancy.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Building2 className="h-4 w-4 text-[#154279]" />
                    {vacancy.property_name} - Unit {vacancy.unit_number}
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">Verified Vacancy</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {vacancy.tenant_name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Move-out: {vacancy.move_out_date ? new Date(vacancy.move_out_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VerifiedVacanciesList;
