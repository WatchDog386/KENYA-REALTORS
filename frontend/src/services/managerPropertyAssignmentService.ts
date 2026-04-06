import { supabase } from "@/integrations/supabase/client";

const isMissingSchemaObjectError = (error: any) => {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "42P01" ||
    code === "42703" ||
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("column")
  );
};

const collectActivePropertyIds = (rows: any[]): string[] => {
  return (rows || [])
    .filter((row) => {
      const status = String(row?.status || "").toLowerCase();
      return !status || status === "active";
    })
    .map((row) => row?.property_id)
    .filter((propertyId): propertyId is string => Boolean(propertyId));
};

const readPropertyManagerAssignments = async (managerId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("property_manager_assignments")
    .select("property_id, status")
    .eq("property_manager_id", managerId);

  if (error) {
    if (isMissingSchemaObjectError(error)) {
      return [];
    }
    console.warn("Failed to read property_manager_assignments", error);
    return [];
  }

  return collectActivePropertyIds((data || []) as any[]);
};

const readLegacyManagerAssignments = async (managerId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("manager_assignments")
    .select("property_id, status")
    .eq("manager_id", managerId);

  if (error) {
    if (isMissingSchemaObjectError(error)) {
      return [];
    }
    console.warn("Failed to read manager_assignments", error);
    return [];
  }

  return collectActivePropertyIds((data || []) as any[]);
};

const readProfileAssignedProperty = async (managerId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("assigned_property_id")
    .eq("id", managerId)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaObjectError(error)) {
      return [];
    }
    console.warn("Failed to read profile assigned_property_id", error);
    return [];
  }

  const assignedPropertyId = (data as any)?.assigned_property_id;
  return assignedPropertyId ? [String(assignedPropertyId)] : [];
};

export const getManagerAssignedPropertyIds = async (managerId: string): Promise<string[]> => {
  if (!managerId) return [];

  const [primaryAssignments, legacyAssignments, profileAssignment] = await Promise.all([
    readPropertyManagerAssignments(managerId),
    readLegacyManagerAssignments(managerId),
    readProfileAssignedProperty(managerId),
  ]);

  return Array.from(new Set([...primaryAssignments, ...legacyAssignments, ...profileAssignment]));
};

export const getPrimaryManagerAssignedPropertyId = async (
  managerId: string
): Promise<string | null> => {
  const propertyIds = await getManagerAssignedPropertyIds(managerId);
  return propertyIds[0] || null;
};
