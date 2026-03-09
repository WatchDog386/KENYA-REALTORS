// src/pages/portal/tenant/Maintenance.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wrench,
  Plus,
  ArrowLeft,
  Loader2,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
  };
  image_url?: string;
}

const MaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [user?.id]);

  const fetchRequests = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*, category:technician_categories(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      toast.error("Failed to load maintenance requests");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "assigned":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <img
          src="/lovable-uploads/27116824-00d0-4ce0-8d5f-30a840902c33.png"
          alt="Loading..."
          className="w-16 h-16 animate-spin opacity-20"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-nunito min-h-screen bg-slate-50/50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/portal/tenant")}
            className="hover:bg-slate-100 -ml-2"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#154279] to-[#F96302]">
              Maintenance
            </h1>
            <p className="text-sm text-gray-500">
              Track and manage your repair requests
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/portal/tenant/maintenance/new")}
          className="bg-[#F96302] hover:bg-[#d85501] text-white shadow-md hover:shadow-lg transition-all"
        >
          <Plus size={18} className="mr-2" />
          New Request
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
        >
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#154279]">
                {requests.length}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Since move-in
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
        >
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {requests.filter((r) => r.status === "in_progress").length}
              </div>
               <p className="text-xs text-blue-500 mt-1 flex items-center">
                <Wrench size={12} className="mr-1" /> Currently working
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
        >
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {requests.filter((r) => r.status === "completed").length}
              </div>
               <p className="text-xs text-green-500 mt-1 flex items-center">
                <CheckCircle size={12} className="mr-1" /> Resolved
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
        >
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {requests.filter((r) => r.status === "pending").length}
              </div>
               <p className="text-xs text-yellow-500 mt-1 flex items-center">
                <Clock size={12} className="mr-1" /> Awaiting Action
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 border-b border-gray-100">
             <div>
              <CardTitle className="text-xl text-[#154279]">Request History</CardTitle>
              <CardDescription>All submitted maintenance tickets</CardDescription>
            </div>
             <Button variant="outline" size="sm" className="hidden sm:flex">
                <Filter size={16} className="mr-2" /> Filter
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0 divide-y divide-gray-100">
              {requests.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                   <div className="bg-gray-100 p-4 rounded-full mb-4">
                     <Wrench className="h-8 w-8 text-gray-400" />
                   </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No maintenance requests</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    You haven't submitted any maintenance requests yet.
                  </p>
                  <Button
                    onClick={() => navigate("/portal/tenant/maintenance/new")}
                    className="bg-[#154279] text-white"
                  >
                    Submit your first request
                  </Button>
                </div>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/portal/tenant/maintenance/${request.id}`)}
                  >
                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                      <div className={cn("p-2 rounded-full mt-1", 
                        request.priority === 'urgent' ? 'bg-red-100 text-red-600' : 
                        request.priority === 'high' ? 'bg-orange-100 text-orange-600' : 
                        'bg-blue-100 text-blue-600'
                      )}>
                        {request.priority === 'urgent' ? <AlertCircle size={20} /> : <Wrench size={20} />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-[#154279] transition-colors">{request.title}</h4>
                         <p className="text-sm text-gray-500 mt-1 line-clamp-1 max-w-md">{request.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>ID: #{request.id.slice(0, 8)}</span>
                          {request.category && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-slate-600">{request.category.name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{formatDate(request.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 pl-14 sm:pl-0">
                      <Badge 
                        variant="outline" 
                        className={cn("capitalize font-normal", getStatusColor(request.status))}
                      >
                        {request.status.replace('_', ' ')}
                      </Badge>
                       <Badge 
                        variant="outline" 
                        className={cn("capitalize font-normal text-[10px]", getPriorityColor(request.priority))}
                      >
                        {request.priority} Priority
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
