import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  type: "apartment" | "house" | "commercial" | "land" | "other";
  status: "available" | "occupied" | "under_maintenance" | "closed";
  total_units: number;
  occupied_units: number;
  monthly_rent?: number;
  manager_id?: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
  images?: string[];
  amenities?: string[];
  description?: string;
}

export interface PropertyUnit {
  id: string;
  property_id: string;
  unit_number: string;
  floor: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  monthly_rent: number;
  status: "available" | "occupied" | "under_maintenance" | "reserved";
  amenities: string[];
  images: string[];
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  type: "apartment" | "house" | "commercial" | "land" | "other";
  total_units: number;
  monthly_rent?: number;
  manager_id?: string;
  images?: string[];
  amenities?: string[];
  description?: string;
}

export interface UpdatePropertyInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  type?: "apartment" | "house" | "commercial" | "land" | "other";
  status?: "available" | "occupied" | "under_maintenance" | "closed";
  total_units?: number;
  monthly_rent?: number;
  manager_id?: string;
  images?: string[];
  amenities?: string[];
  description?: string;
}

export interface CreateUnitInput {
  property_id: string;
  unit_number: string;
  floor: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  monthly_rent: number;
  amenities?: string[];
  images?: string[];
  description?: string;
}

class PropertyService {
  // Get all properties
  async getAllProperties(filters?: {
    status?: string;
    type?: string;
    manager_id?: string;
    search?: string;
  }): Promise<Property[]> {
    try {
      let query = supabase
        .from("properties")
        .select(
          `
          *,
          manager:profiles!properties_manager_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }

      if (filters?.manager_id && filters.manager_id !== "all") {
        query = query.eq("manager_id", filters.manager_id);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
      return [];
    }
  }

  // Get property by ID
  async getPropertyById(id: string): Promise<Property | null> {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          *,
          manager:profiles!properties_manager_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Property not found");
      return null;
    }
  }

  // Create new property
  async createProperty(input: CreatePropertyInput): Promise<Property | null> {
    try {
      // Get current user ID for created_by
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const propertyData = {
        ...input,
        status: "available" as const,
        occupied_units: 0,
        created_by: profile?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("properties")
        .insert([propertyData])
        .select(
          `
          *,
          manager:profiles!properties_manager_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .single();

      if (error) throw error;

      toast.success("Property created successfully");
      return data;
    } catch (error: any) {
      console.error("Error creating property:", error);
      toast.error(`Failed to create property: ${error.message}`);
      return null;
    }
  }

  // Update property
  async updateProperty(
    id: string,
    updates: UpdatePropertyInput
  ): Promise<Property | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", id)
        .select(
          `
          *,
          manager:profiles!properties_manager_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .single();

      if (error) throw error;

      toast.success("Property updated successfully");
      return data;
    } catch (error: any) {
      console.error("Error updating property:", error);
      toast.error(`Failed to update property: ${error.message}`);
      return null;
    }
  }

  // Delete property
  async deleteProperty(id: string): Promise<boolean> {
    try {
      // Check if property has active tenants
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id")
        .eq("property_id", id)
        .eq("status", "active")
        .limit(1);

      if (tenants && tenants.length > 0) {
        throw new Error("Cannot delete property with active tenants");
      }

      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) throw error;

      toast.success("Property deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting property:", error);
      toast.error(`Failed to delete property: ${error.message}`);
      return false;
    }
  }

  // Get property units
  async getPropertyUnits(propertyId: string): Promise<PropertyUnit[]> {
    try {
      const { data, error } = await supabase
        .from("property_units")
        .select("*")
        .eq("property_id", propertyId)
        .order("unit_number");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching property units:", error);
      return [];
    }
  }

  // Create property unit
  async createUnit(input: CreateUnitInput): Promise<PropertyUnit | null> {
    try {
      const unitData = {
        ...input,
        status: "available" as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("property_units")
        .insert([unitData])
        .select()
        .single();

      if (error) throw error;

      // Update property total units count
      await this.incrementPropertyUnits(input.property_id);

      toast.success("Unit created successfully");
      return data;
    } catch (error: any) {
      console.error("Error creating unit:", error);
      toast.error(`Failed to create unit: ${error.message}`);
      return null;
    }
  }

  // Update unit
  async updateUnit(
    id: string,
    updates: Partial<PropertyUnit>
  ): Promise<PropertyUnit | null> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("property_units")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      toast.success("Unit updated successfully");
      return data;
    } catch (error: any) {
      console.error("Error updating unit:", error);
      toast.error(`Failed to update unit: ${error.message}`);
      return null;
    }
  }

  // Delete unit
  async deleteUnit(id: string): Promise<boolean> {
    try {
      const { data: unit } = await supabase
        .from("property_units")
        .select("property_id, status")
        .eq("id", id)
        .single();

      if (unit?.status === "occupied") {
        throw new Error("Cannot delete occupied unit");
      }

      const { error } = await supabase
        .from("property_units")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Decrement property units count
      if (unit?.property_id) {
        await this.decrementPropertyUnits(unit.property_id);
      }

      toast.success("Unit deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting unit:", error);
      toast.error(`Failed to delete unit: ${error.message}`);
      return false;
    }
  }

  // Assign manager to property
  async assignManager(
    propertyId: string,
    managerId: string | null
  ): Promise<Property | null> {
    try {
      const { data, error } = await supabase
        .from("properties")
        .update({
          manager_id: managerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", propertyId)
        .select(
          `
          *,
          manager:profiles!properties_manager_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .single();

      if (error) throw error;

      toast.success(
        managerId
          ? "Manager assigned successfully"
          : "Manager removed successfully"
      );
      return data;
    } catch (error: any) {
      console.error("Error assigning manager:", error);
      toast.error(`Failed to assign manager: ${error.message}`);
      return null;
    }
  }

  // Get property statistics
  async getPropertyStats() {
    try {
      const { data: properties } = await supabase
        .from("properties")
        .select("status, total_units, occupied_units, type");

      if (!properties) return null;

      const totalProperties = properties.length;
      const totalUnits = properties.reduce(
        (sum, p) => sum + (p.total_units || 0),
        0
      );
      const occupiedUnits = properties.reduce(
        (sum, p) => sum + (p.occupied_units || 0),
        0
      );
      const vacantUnits = totalUnits - occupiedUnits;
      const occupancyRate =
        totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      // Calculate by type
      const propertiesByType: Record<string, number> = {};
      properties.forEach((p) => {
        const type = p.type || "other";
        if (!propertiesByType[type]) {
          propertiesByType[type] = 0;
        }
        propertiesByType[type]++;
      });

      // Calculate by status
      const propertiesByStatus: Record<string, number> = {};
      properties.forEach((p) => {
        const status = p.status || "unknown";
        if (!propertiesByStatus[status]) {
          propertiesByStatus[status] = 0;
        }
        propertiesByStatus[status]++;
      });

      return {
        totalProperties,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        occupancyRate,
        propertiesByType,
        propertiesByStatus,
      };
    } catch (error) {
      console.error("Error getting property stats:", error);
      return null;
    }
  }

  // Increment property units count
  private async incrementPropertyUnits(propertyId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("increment_total_units", {
        property_id: propertyId,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error incrementing property units:", error);
    }
  }

  // Decrement property units count
  private async decrementPropertyUnits(propertyId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc("decrement_total_units", {
        property_id: propertyId,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error decrementing property units:", error);
    }
  }

  // Upload property image
  async uploadPropertyImage(
    file: File,
    propertyId: string
  ): Promise<string | null> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${propertyId}_${Date.now()}.${fileExt}`;
      const filePath = `properties/${propertyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("property-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  }

  // Search properties
  async searchProperties(query: string): Promise<Property[]> {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(
          `
          *,
          manager:profiles!properties_manager_id_fkey(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .or(
          `name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error searching properties:", error);
      return [];
    }
  }
}

export const propertyService = new PropertyService();
