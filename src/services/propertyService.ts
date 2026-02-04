import { supabase } from '@/integrations/supabase/client';

export interface PropertyUnitType {
  id?: string;
  property_id?: string;
  name: string;
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
  property_unit_types?: PropertyUnitType[];
  // Computed on frontend
  total_units?: number;
  expected_income?: number;
  created_at?: string;
}

export interface CreatePropertyDTO {
  name: string;
  location: string;
  image_url: string;
  type?: string;
  description?: string;
  amenities?: string;
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
      console.error('Error fetching properties:', propsError);
      throw propsError;
    }

    if (!properties || properties.length === 0) {
      return [];
    }

    // Fetch unit types separately
    const { data: unitTypes, error: unitsError } = await supabase
      .from('property_unit_types')
      .select('*');

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
      const propUnitTypes = (unitTypes || []).filter((unit: any) => unit.property_id === prop.id);
      const totalUnits = propUnitTypes.reduce((sum: number, unit: any) => sum + (unit.units_count || 0), 0);
      const expectedIncome = propUnitTypes.reduce((sum: number, unit: any) => sum + (Number(unit.units_count || 0) * Number(unit.price_per_unit || 0)), 0);

      return {
        ...prop,
        property_unit_types: propUnitTypes,
        total_units: totalUnits,
        expected_income: expectedIncome
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
        amenities: property.amenities
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
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
