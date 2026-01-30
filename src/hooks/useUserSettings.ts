// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
export interface EquipmentType {
  id: string;
  name: string;
  total_cost: number;
  rate_per_unit: number;
  usage_quantity: number;
  usage_unit: string;
  description?: string;
}
export interface RoomType {
  id: string;
  name: string;
  calculation_method: "volume" | "area";
  description?: string;
}
export interface AdditionalService {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  payment_plan?: string;
  total: number;
  days: number;
  unit: string;
}
export interface UserEquipmentRate {
  id: string;
  name: string;
  description: string;
  equipment_type_id: string;
  rate_per_unit: number;
  usage_unit: string;
  usage_quantity: number;
  total_cost: number;
}
export interface UserTransportRate {
  id: string;
  region: string;
  cost_per_km: number;
  base_cost: number;
}
export interface UserServiceRate {
  id: string;
  name: string;
  service_id: string;
  description: string;
  category: string;
  price: number;
  payment_plan?: string;
  total: number;
  days: number;
  unit: string;
}
export interface UserSubcontractorRate {
  id: string;
  name: string;
  service_id: string;
  price: number;
}
export interface UserMaterialPrice {
  id: string;
  name: string;
  material_id: string;
  price: number;
}
export const useUserSettings = () => {
  const { user, profile } = useAuth();
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [additionalServices, setAdditionalServices] = useState<
    AdditionalService[]
  >([]);
  const [equipmentRates, setEquipmentRates] = useState<UserEquipmentRate[]>([]);
  const [transportRates, setTransportRates] = useState<UserTransportRate[]>([]);
  const [serviceRates, setServiceRates] = useState<UserServiceRate[]>([]);
  const [subcontractorRates, setSubcontractorRates] = useState<
    UserSubcontractorRate[]
  >([]);
  const [materialPrices, setMaterialPrices] = useState<UserMaterialPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const isInitialLoad = useRef(true);
  const location = useLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const fetchRoomTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("room_types").select("*");
      if (error) throw error;
      setRoomTypes(data);
    } catch (error) {
      console.error("Error fetching room types:", error);
    }
  }, []);
  const fetchEquipmentTypes = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("equipment_types")
        .select("*")
        .order("name");
      if (data) setEquipmentTypes(data);
    } catch (err) {
      console.error("Error fetching equipment types:", err);
    }
  }, []);
  const fetchAdditionalServices = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("additional_services")
        .select("*")
        .order("name");
      if (data) setAdditionalServices(data);
    } catch (err) {
      console.error("Error fetching additional services:", err);
    }
  }, []);
  const fetchSubcontractors = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("subcontractor_prices")
        .select("*")
        .order("name");
      if (data) setSubcontractorRates(data);
    } catch (err) {
      console.error("Error fetching subcontractors:", err);
    }
  }, []);
  const fetchUserRates = useCallback(async () => {
    if (!user) return;
    try {
      const [
        { data: equipmentData },
        { data: transportData },
        { data: serviceData },
        { data: subcontractorData },
        { data: materialData },
      ] = await Promise.all([
        supabase
          .from("user_equipment_rates")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("user_transport_rates")
          .select("*")
          .eq("user_id", user.id),
        supabase.from("user_service_rates").select("*").eq("user_id", user.id),
        supabase
          .from("user_subcontractor_rates")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("user_material_prices")
          .select("*")
          .eq("user_id", user.id),
      ]);
      setEquipmentRates(equipmentData);
      setTransportRates(transportData);
      setServiceRates(serviceData);
      setSubcontractorRates(subcontractorData);
      setMaterialPrices(materialData);
    } catch (err) {
      console.error("Error fetching user rates:", err);
    }
  }, [user?.id]);
  const fetchAll = useCallback(
    async (silent = false) => {
      if (!silent && isInitialLoad.current) setLoading(true);
      await Promise.allSettled([
        fetchEquipmentTypes(),
        fetchRoomTypes(),
        fetchAdditionalServices(),
        fetchSubcontractors(),
        fetchUserRates(),
      ]);
      if (!silent && isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    },
    [
      fetchEquipmentTypes,
      fetchRoomTypes,
      fetchAdditionalServices,
      fetchSubcontractors,
      fetchUserRates,
    ]
  );
  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user, profile, location.key]);

  const updateEquipmentRate = async (
    equipmentTypeId: string,
    rate: number,
    quantity?: number,
    unit?: string
  ) => {
    if (!user) return { error: "User not authenticated" };
    try {
      const { error } = await supabase.from("user_equipment_rates").upsert(
        {
          user_id: user.id,
          equipment_type_id: equipmentTypeId,
          rate_per_unit: rate,
          usage_quantity: quantity,
          usage_unit: unit,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,equipment_type_id",
          ignoreDuplicates: false,
        }
      );

      if (!error) {
        await fetchUserRates();
      }
      return { error };
    } catch (err) {
      console.error("Error updating equipment rate:", err);
      return { error: err };
    }
  };
  const updateTransportRate = async (
    region: string,
    costPerKm: number,
    baseCost: number
  ) => {
    if (!user) return { error: "User not authenticated" };
    try {
      const { error } = await supabase.from("user_transport_rates").upsert(
        {
          user_id: user.id,
          region,
          cost_per_km: costPerKm,
          base_cost: baseCost,
        },
        { onConflict: "user_id,region" }
      );
      if (!error) await fetchUserRates();
      return { error };
    } catch (err) {
      console.error("Error updating transport rate:", err);
      return { error: err };
    }
  };
  const updateServiceRate = async (serviceId: string, price: number) => {
    if (!user) return { error: "User not authenticated" };
    try {
      const { error } = await supabase.from("user_service_rates").upsert(
        {
          user_id: user.id,
          service_id: serviceId,
          price,
        },
        { onConflict: "user_id,service_id" }
      );
      if (!error) await fetchUserRates();
      return { error };
    } catch (err) {
      console.error("Error updating service rate:", err);
      return { error: err };
    }
  };
  const updateSubcontractorRate = async (serviceId: string, price: number) => {
    if (!user) return { error: "User not authenticated" };
    try {
      const { error } = await supabase.from("user_subcontractor_rates").upsert(
        {
          user_id: user.id,
          service_id: serviceId,
          price,
        },
        { onConflict: "user_id,service_id" }
      );
      if (!error) await fetchUserRates();
      return { error };
    } catch (err) {
      console.error("Error updating subcontractor rate:", err);
      return { error: err };
    }
  };
  const updateMaterialPrice = async (materialId: string, price: number) => {
    if (!user) return { error: "User not authenticated" };
    try {
      const region = profile.location;
      const { error } = await supabase.from("user_material_prices").upsert(
        {
          user_id: user.id,
          material_id: materialId,
          region,
          price,
        },
        { onConflict: "user_id,material_id,region" }
      );
      if (!error) await fetchUserRates();
      return { error };
    } catch (err) {
      console.error("Error updating material price:", err);
      return { error: err };
    }
  };
  const updateOverallProfitMargin = async (margin: number) => {
    if (!user) return { error: "User not authenticated" };
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            name: existingProfile?.name || "",
            email: existingProfile?.email || user.email || "",
            overall_profit_margin: margin,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("overall_profit_margin")
        .single();
      if (error) throw error;
      return { data: data?.overall_profit_margin, error: null };
    } catch (err) {
      console.error("Error updating profit margin:", err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to update margin",
      };
    }
  };
  const updateLabourPercent = async (margin: number) => {
    if (!user) return { error: "User not authenticated" };
    try {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();
      const { data, error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            name: existingProfile?.name || "",
            email: existingProfile?.email || user.email || "",
            labour_percent: margin,
          },
          { onConflict: "id" }
        )
        .select("labour_percent")
        .single();
      if (error) throw error;
      return { data: data?.labour_percent, error: null };
    } catch (err) {
      console.error("Error updating labour:", err);
      return {
        data: null,
        error: err instanceof Error ? err.message : "Failed to update labour",
      };
    }
  };
  return {
    equipmentTypes,
    additionalServices,
    equipmentRates,
    transportRates,
    serviceRates,
    subcontractorRates,
    roomTypes,
    materialPrices,
    loading,
    updateEquipmentRate,
    updateTransportRate,
    updateServiceRate,
    updateSubcontractorRate,
    updateMaterialPrice,
    updateLabourPercent,
    updateOverallProfitMargin,
  };
};
