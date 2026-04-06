import { supabase } from '@/integrations/supabase/client';

export interface PropertyUnitType {
  id?: string;
  property_id?: string;
  name: string;
  unit_type_name?: string; // @deprecated use name
  unit_category?: string;
  units_count: number;
  price_per_unit: number;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  image_url: string;
  type?: string;
  description?: string;
  amenities?: string;
  number_of_floors?: number;
  property_unit_types?: PropertyUnitType[];
  // Computed on frontend
  total_units?: number;
  expected_income?: number;
  unit_price_breakdown?: Array<{
    name: string;
    total_units: number;
    tiers: Array<{
      price_per_unit: number;
      units_count: number;
    }>;
  }>;
  created_at?: string;
}

export interface CreatePropertyDTO {
  name: string;
  location: string;
  image_url: string;
  type?: string;
  description?: string;
  amenities?: string;
  number_of_floors?: number;
  units: {
    name: string;
    units_count: number;
    price_per_unit: number;
  }[];
}

export const propertyService = {
  async fetchProperties() {
    console.log('Fetching properties...');
    
    // Fetch properties separately from unit types to avoid PostgREST schema cache issues
    const { data: properties, error: propsError } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (propsError) {
      console.error('❌ Error fetching properties:', {
        message: propsError.message,
        code: propsError.code,
        details: (propsError as any).details
      });
      throw propsError;
    }
    
    console.log(`✅ Successfully fetched ${properties?.length || 0} properties`);

    if (!properties || properties.length === 0) {
      return [];
    }

    // Fetch unit types separately
    const { data: unitTypes, error: unitsError } = await supabase
      .from('property_unit_types')
      .select('*');
      
    // Fetch actual units separately (lightweight) for correct income calculation
    const { data: realUnits, error: realUnitsError } = await supabase
      .from('units')
      .select('property_id, price');

    if (unitsError) {
      console.error('Error fetching unit types:', unitsError);
      // Don't fail - just continue with properties
      return properties.map((prop: any) => ({
        ...prop,
        property_unit_types: [],
        total_units: 0,
        expected_income: 0
      }));
    }

    // Manually join unit types to properties
    return (properties || []).map((prop: any) => {
      // 1. Calculate based on definitions (Configured)
      const propUnitTypes = (unitTypes || []).filter((unit: any) => unit.property_id === prop.id);
      const definedTotalUnits = propUnitTypes.reduce((sum: number, unit: any) => sum + (unit.units_count || 0), 0);
      const definedExpectedIncome = propUnitTypes.reduce((sum: number, unit: any) => sum + (Number(unit.units_count || 0) * Number(unit.price_per_unit || 0)), 0);

      // 2. Calculate based on actual units (Real)
      const propRealUnits = (realUnits || []).filter((u: any) => u.property_id === prop.id);
      const realTotalUnits = propRealUnits.length;
      const realExpectedIncome = propRealUnits.reduce((sum: number, u: any) => sum + (Number(u.price) || 0), 0);
      
      // 3. Decide which to use. If actual units exist, they are the source of truth for calculations.
      // This ensures that when user updates unit prices, the income reflects that.
      const useReal = realTotalUnits > 0;

      return {
        ...prop,
        property_unit_types: propUnitTypes,
        total_units: useReal ? realTotalUnits : definedTotalUnits,
        expected_income: useReal ? realExpectedIncome : definedExpectedIncome
      };
    });
  },

  async createProperty(property: CreatePropertyDTO) {
    // 1. Create Property
    const { data: propData, error: propError } = await supabase
      .from('properties')
      .insert({
        name: property.name,
        location: property.location,
        image_url: property.image_url,
        type: property.type,
        description: property.description,
        amenities: property.amenities,
        number_of_floors: property.number_of_floors || 1
      })
      .select()
      .single();

    if (propError) throw propError;

    if (!propData) throw new Error('Failed to create property');

    // 2. Create Units
    if (property.units && property.units.length > 0) {
      const unitsToInsert = property.units.map(unit => ({
        property_id: propData.id,
        name: unit.name,
        units_count: unit.units_count,
        price_per_unit: unit.price_per_unit
      }));

      const { error: unitsError } = await supabase
        .from('property_unit_types')
        .insert(unitsToInsert);

      if (unitsError) {
        console.error('Error creating units:', unitsError);
        // We could delete the property here if units fail, but let's keep it simple
        throw unitsError;
      }
    }

    return propData;
  },

  async deleteProperty(id: string) {
    const db = supabase as any;

    const ignoreMissingTableError = (error: any) => error?.code === '42P01';
    const ignoreMissingColumnError = (error: any) => error?.code === '42703';

    const deleteByProperty = async (table: string) => {
      const { error } = await db.from(table).delete().eq('property_id', id);
      if (error && !ignoreMissingTableError(error)) {
        throw new Error(`[${table}] ${error.message}`);
      }
    };

    // Clear profile references that can block property deletion in non-cascading schemas.
    const { error: profileUpdateError } = await db
      .from('profiles')
      .update({ assigned_property_id: null })
      .eq('assigned_property_id', id);

    if (profileUpdateError && !ignoreMissingColumnError(profileUpdateError)) {
      throw new Error(`[profiles] ${profileUpdateError.message}`);
    }

    const dependentTables = [
      'property_manager_assignments',
      'technician_property_assignments',
      'proprietor_properties',
      'caretakers',
      'lease_applications',
      'vacancy_notices',
      'maintenance_requests',
      'invoices',
      'payments',
      'tenants',
      'leases',
      'units',
      'property_unit_types'
    ];

    for (const table of dependentTables) {
      await deleteByProperty(table);
    }

    const { error } = await db.from('properties').delete().eq('id', id);
    if (error) {
      throw new Error(`[properties] ${error.message}`);
    }
  },

  async updateProperty(id: string, updates: Partial<Property>) {
    // Only basic updates for now as requested for "add, delete, update"
    // Ideally we'd handle unit updates too, but that's complex.
    const { error } = await supabase
      .from('properties')
      .update({
        name: updates.name,
        location: updates.location,
        image_url: updates.image_url
      })
      .eq('id', id);
      
    if (error) throw error;
  }
};
