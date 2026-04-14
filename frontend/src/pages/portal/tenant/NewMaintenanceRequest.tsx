import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { maintenanceService } from "@/services/maintenanceService";
import { toast } from "sonner";

const NewMaintenanceRequestPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [categoryId, setCategoryId] = useState("");
  const [damageImage, setDamageImage] = useState<File | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description?: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const { data, error } = await supabase
          .from("technician_categories")
          .select("id, name, description")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) throw error;
        setCategories((data || []) as Array<{ id: string; name: string; description?: string | null }>);
      } catch (error) {
        console.error("Failed to load maintenance categories", error);
        toast.error("Could not load maintenance categories");
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !title.trim() || !description.trim() || !categoryId || !damageImage) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, property_id, unit_id")
        .eq("user_id", user.id)
        .single();

      if (!tenant?.property_id) {
        toast.error("Tenant profile not found");
        return;
      }

      const normalizedPriority = priority === "urgent" ? "emergency" : priority;

      const createdRequest = await maintenanceService.createMaintenanceRequest(
        user.id,
        tenant.property_id,
        tenant.unit_id || null,
        title.trim(),
        description.trim(),
        normalizedPriority as "low" | "medium" | "high" | "emergency",
        categoryId,
        damageImage
      );

      // Best-effort routing and alerts for manager + matching technician category.
      try {
        await maintenanceService.autoAssignToTechnician(createdRequest.id, categoryId, tenant.property_id);

        const [managerAssignments, categoryTechnicians] = await Promise.all([
          supabase
            .from("property_manager_assignments")
            .select("property_manager_id")
            .eq("property_id", tenant.property_id)
            .eq("status", "active"),
          maintenanceService.getAvailableTechnicians(categoryId, tenant.property_id),
        ]);

        const recipientIds = new Set<string>();

        (managerAssignments.data || []).forEach((row: any) => {
          const managerId = row?.property_manager_id;
          if (managerId) recipientIds.add(managerId);
        });

        (categoryTechnicians || []).forEach((technician: any) => {
          if (technician?.user_id) recipientIds.add(technician.user_id);
        });

        recipientIds.delete(user.id);

        if (recipientIds.size > 0) {
          const categoryName = categories.find((category) => category.id === categoryId)?.name || "General Maintenance";
          const notificationRows = Array.from(recipientIds).map((recipientId) => ({
            recipient_id: recipientId,
            sender_id: user.id,
            type: "maintenance",
            title: "New maintenance request submitted",
            message: `A new ${categoryName} issue was reported: ${title.trim()}`,
            related_entity_type: "maintenance_request",
            related_entity_id: createdRequest.id,
            read: false,
          }));

          await supabase.from("notifications").insert(notificationRows);
        }
      } catch (routingError) {
        console.warn("Maintenance routing notifications failed", routingError);
      }

      toast.success("Maintenance request submitted successfully!");
      navigate("/portal/tenant/maintenance");
    } catch (err) {
      console.error("Error creating request:", err);
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/portal/tenant/maintenance")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">
            New Maintenance Request
          </h1>
          <p className="text-sm text-gray-600">Report an issue with your unit</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Leaky kitchen faucet"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00356B] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00356B] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Damage Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00356B] focus:border-transparent"
                disabled={categoriesLoading}
              >
                <option value="">Select issue category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the closest category so the request goes to the right technician type.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00356B] focus:border-transparent"
              >
                <option value="low">Low - Non-urgent repairs</option>
                <option value="medium">Medium - Standard repairs</option>
                <option value="high">High - Urgent issues</option>
                <option value="emergency">Emergency - Safety concerns</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Damage Photo *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDamageImage(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00356B] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                A clear photo is required to speed up technician assignment and repair planning.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="text-blue-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Request Submission
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your request will be reviewed and assigned to the appropriate
                    team. You'll receive updates as work progresses.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00356B] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#002a54] transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewMaintenanceRequestPage;
