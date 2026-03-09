import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Upload, X, Loader2, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { maintenanceService } from "@/services/maintenanceService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
}


const NewMaintenanceRequestPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("technician_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error loading categories:", err);
      toast.error("Failed to load maintenance categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !title || !description || !categoryId) {
      toast.error("Please fill in all required fields (Title, Category, Description)");
      return;
    }

    setLoading(true);
    try {
      // 1. Get Tenant Info
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, property_id, unit_id")
        .eq("user_id", user.id)
        .single();

      if (!tenant) {
        toast.error("Tenant profile not found");
        return;
      }

      console.log(`[CreateRequest] Tenant: ${tenant.id}, Property: ${tenant.property_id}, Category: ${categoryId}`);

      // 2. Create maintenance request using the proper service
      // Note: Pass tenant's user_id (which is what maintenance_requests.tenant_id expects)
      const request = await maintenanceService.createMaintenanceRequest(
        user.id,  // tenant_id in maintenance_requests points to user.id
        tenant.property_id,
        tenant.unit_id,
        title,
        description,
        priority as 'low' | 'medium' | 'high' | 'emergency',
        categoryId,
        imageFile
      );

      console.log(`[CreateRequest] ✅ Request created: ${request.id}`);

      // 3. Auto-assign to a technician if available
      console.log(`[CreateRequest] 🔄 Attempting auto-assignment...`);
      const assignedRequest = await maintenanceService.autoAssignToTechnician(
        request.id,
        categoryId,
        tenant.property_id
      );

      if (assignedRequest?.assigned_to_technician_id) {
        console.log(`[CreateRequest] ✅ Assigned to technician: ${assignedRequest.assigned_to_technician_id}`);
        toast.success("Maintenance request submitted and assigned to a technician!");
      } else {
        console.log(`[CreateRequest] ℹ️ No technician assigned yet - request visible in category pool`);
        toast.success("Maintenance request submitted! Visible to technicians in your requested category.");
      }

      navigate("/portal/tenant/maintenance");
    } catch (err: any) {
      console.error("Error creating request:", err);
      toast.error(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl px-4 md:px-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/portal/tenant/maintenance")}
          className="hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Button>
        <div>
          <h1 className="text-3xl font-light text-[#00356B] tracking-tight">
            New Maintenance Request
          </h1>
          <p className="text-sm text-gray-600">Report an issue with your unit for technician assignment</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Leaky kitchen faucet"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00356B] focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              {loadingCategories ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                   <Loader2 className="h-4 w-4 animate-spin" /> Loading categories...
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00356B] focus:border-transparent bg-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Selecting the correct category ensures the right technician is notified.
              </p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="flex gap-4">
                {["low", "medium", "high", "emergency"].map((p) => (
                  <label key={p} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={priority === p}
                      onChange={(e) => setPriority(e.target.value)}
                      className="mr-2 text-[#00356B] focus:ring-[#00356B]"
                    />
                    <span className="capitalize">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail..."
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00356B] focus:border-transparent resize-none"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (Optional)
              </label>
              
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Camera className="h-8 w-8" />
                    <span className="text-sm">Click to upload or take a photo</span>
                    <span className="text-xs text-gray-400">Max 5MB</span>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-48 w-auto object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00356B] hover:bg-[#002a55] text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewMaintenanceRequestPage;
