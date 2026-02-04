import { supabase } from '@/services/supabase';

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
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_unit_types (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    // Process data to add computed fields
    return (data || []).map((prop: any) => {
      const unitTypes = prop.property_unit_types || [];
      const totalUnits = unitTypes.reduce((sum: number, unit: any) => sum + (unit.units_count || 0), 0);
        // Using Number() to ensure we don't get string concatenation if DB returns strings
      const expectedIncome = unitTypes.reduce((sum: number, unit: any) => sum + (Number(unit.units_count || 0) * Number(unit.price_per_unit || 0)), 0);

      return {
        ...prop,
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
