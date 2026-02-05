import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Loader2,
  Home,
  MapPin,
  DollarSign,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RentalApplicationData {
  id: string;
  user_id: string;
  application_type: string;
  property_title: string | null;
  property_type: string | null;
  property_location: string | null;
  monthly_rent: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  preferred_unit_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_locations: string[] | null;
  occupancy_date: string | null;
  status: string;
  created_at: string;
  profiles: {
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

const RentalApplications = () => {
  const [applications, setApplications] = useState<RentalApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("rental_applications")
        .select(
          `
          *,
          profiles:user_id (
            email,
            first_name,
            last_name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading applications:", error);
        toast.error("Failed to load applications");
        return;
      }

      setApplications(data || []);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("An error occurred while loading applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdatingId(applicationId);
    try {
      const { error } = await supabase
        .from("rental_applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) {
        toast.error("Failed to update status");
        return;
      }

      setApplications(
        applications.map((app) =>
          app.id === applicationId
            ? { ...app, status: newStatus }
            : app
        )
      );

      toast.success("Application status updated");
    } catch (error) {
      toast.error("An error occurred while updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "under_review":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredApplications = applications.filter((app) => {
    const typeMatch = filterType === "all" || app.application_type === filterType;
    const statusMatch = filterStatus === "all" || app.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const stats = {
    total: applications.length,
    postRental: applications.filter((a) => a.application_type === "post_rental")
      .length,
    lookingForRental: applications.filter(
      (a) => a.application_type === "looking_for_rental"
    ).length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#154279]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total", value: stats.total, color: "from-blue-500 to-blue-600" },
          { label: "Post Rental", value: stats.postRental, color: "from-orange-500 to-orange-600" },
          { label: "Looking", value: stats.lookingForRental, color: "from-green-500 to-green-600" },
          { label: "Pending", value: stats.pending, color: "from-yellow-500 to-yellow-600" },
          { label: "Approved", value: stats.approved, color: "from-emerald-500 to-emerald-600" },
          { label: "Rejected", value: stats.rejected, color: "from-red-500 to-red-600" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border-2 border-white/20 bg-gradient-to-br ${stat.color} text-white`}
          >
            <p className="text-xs font-medium uppercase opacity-90">{stat.label}</p>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="post_rental">Post Rental</SelectItem>
            <SelectItem value="looking_for_rental">Looking for Rental</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No applications found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {app.application_type === "post_rental" ? (
                          <Home className="w-5 h-5 text-orange-500" />
                        ) : (
                          <MapPin className="w-5 h-5 text-green-500" />
                        )}
                        <Badge variant="outline">
                          {app.application_type === "post_rental"
                            ? "Post Rental"
                            : "Looking for Rental"}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">
                        {app.application_type === "post_rental"
                          ? app.property_title
                          : `Seeking ${app.preferred_unit_type}`}
                      </CardTitle>
                      <CardDescription>
                        {app.profiles?.email} • {formatDate(app.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(app.status)}>
                        {getStatusIcon(app.status)}
                        <span className="ml-1">{app.status.replace("_", " ")}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Application Details */}
                    {app.application_type === "post_rental" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {app.property_location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-600">Location</p>
                              <p className="font-medium">{app.property_location}</p>
                            </div>
                          </div>
                        )}
                        {app.monthly_rent && (
                          <div className="flex items-start gap-2">
                            <DollarSign className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-600">Monthly Rent</p>
                              <p className="font-medium">
                                KSH {app.monthly_rent.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                        {app.bedrooms && (
                          <div className="flex items-start gap-2">
                            <Home className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-600">Bedrooms</p>
                              <p className="font-medium">{app.bedrooms}</p>
                            </div>
                          </div>
                        )}
                        {app.bathrooms && (
                          <div>
                            <p className="text-xs text-gray-600">Bathrooms</p>
                            <p className="font-medium">{app.bathrooms}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {app.budget_min && app.budget_max && (
                          <div className="flex items-start gap-2">
                            <DollarSign className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-600">Budget</p>
                              <p className="font-medium">
                                KSH {app.budget_min.toLocaleString()} -{" "}
                                {app.budget_max.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                        {app.occupancy_date && (
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-600">Occupancy Date</p>
                              <p className="font-medium">
                                {new Date(app.occupancy_date).toLocaleDateString("en-KE")}
                              </p>
                            </div>
                          </div>
                        )}
                        {app.preferred_locations &&
                          app.preferred_locations.length > 0 && (
                            <div className="flex items-start gap-2 md:col-span-2">
                              <MapPin className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-600">
                                  Preferred Locations
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {app.preferred_locations.map((location) => (
                                    <Badge key={location} variant="outline">
                                      {location}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Contact Info */}
                    {app.contact_name && (
                      <div className="border-t pt-4">
                        <p className="text-xs font-medium text-gray-600 uppercase mb-2">
                          Contact
                        </p>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-gray-600">Name:</span>{" "}
                            {app.contact_name}
                          </p>
                          {app.contact_phone && (
                            <p>
                              <span className="text-gray-600">Phone:</span>{" "}
                              <a
                                href={`tel:${app.contact_phone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {app.contact_phone}
                              </a>
                            </p>
                          )}
                          {app.contact_email && (
                            <p>
                              <span className="text-gray-600">Email:</span>{" "}
                              <a
                                href={`mailto:${app.contact_email}`}
                                className="text-blue-600 hover:underline"
                              >
                                {app.contact_email}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="border-t pt-4 flex flex-col md:flex-row gap-3">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-600 uppercase mb-2">
                          Update Status
                        </p>
                        <Select
                          value={app.status}
                          onValueChange={(value) =>
                            handleStatusChange(app.id, value)
                          }
                          disabled={updatingId === app.id}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="md:w-auto mt-auto"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default RentalApplications;
