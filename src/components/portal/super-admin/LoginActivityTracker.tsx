// src/components/portal/super-admin/LoginActivityTracker.tsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LogIn,
  LogOut,
  AlertCircle,
  Globe,
  Calendar,
  Clock,
  User,
  Filter,
  RefreshCw,
  Download,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loginActivityService, type LoginActivity } from "@/services/loginActivityService";
import { formatDistanceToNow } from "date-fns";

interface LoginActivityTrackerProps {
  className?: string;
}

const LoginActivityTracker: React.FC<LoginActivityTrackerProps> = ({
  className = "",
}) => {
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    uniqueUsers: 0,
    averageSessionDuration: 0,
  });
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const [activities, stats] = await Promise.all([
        loginActivityService.getLoginActivities(200),
        loginActivityService.getLoginStatistics(0),
      ]);
      setActivities(activities);
      setStats(stats);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === "success") return activity.login_status !== "failed";
    if (filter === "failed") return activity.login_status === "failed";
    return true;
  });

  const getStatusColor = (
    status: "success" | "failed" | "session_ended"
  ) => {
    switch (status) {
      case "success":
      case "session_ended":
        return "bg-emerald-100 text-emerald-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (
    status: "success" | "failed" | "session_ended"
  ) => {
    switch (status) {
      case "success":
        return <LogIn className="w-4 h-4" />;
      case "session_ended":
        return <LogOut className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className={className}>
      {/* Header with Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Logins */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative rounded-2xl p-4 shadow-lg bg-gradient-to-br from-[#154279] to-[#205a9e] text-white overflow-hidden transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full pointer-events-none -mr-8 -mt-8" />
          <div className="relative z-10">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg w-fit mb-2 group-hover:bg-white/30 transition-colors">
              <LogIn className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-blue-100 uppercase tracking-widest">
              Total Logins
            </h3>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalLogins}
            </div>
          </div>
        </motion.div>

        {/* Successful Logins */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative rounded-2xl p-4 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full pointer-events-none -mr-8 -mt-8" />
          <div className="relative z-10">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg w-fit mb-2 group-hover:bg-white/30 transition-colors">
              <LogIn className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-emerald-100 uppercase tracking-widest">
              Successful
            </h3>
            <div className="text-2xl font-black text-white mt-1">
              {stats.successfulLogins}
            </div>
          </div>
        </motion.div>

        {/* Failed Logins */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group relative rounded-2xl p-4 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white overflow-hidden transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full pointer-events-none -mr-8 -mt-8" />
          <div className="relative z-10">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg w-fit mb-2 group-hover:bg-white/30 transition-colors">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-red-100 uppercase tracking-widest">
              Failed
            </h3>
            <div className="text-2xl font-black text-white mt-1">
              {stats.failedLogins}
            </div>
          </div>
        </motion.div>

        {/* Unique Users */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative rounded-2xl p-4 shadow-lg bg-gradient-to-br from-[#F96302] to-[#e05802] text-white overflow-hidden transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full pointer-events-none -mr-8 -mt-8" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full pointer-events-none -mr-8 -mt-8" />
          <div className="relative z-10">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg w-fit mb-2 group-hover:bg-white/30 transition-colors">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-bold text-purple-100 uppercase tracking-widest">
              Avg Duration
            </h3>
            <div className="text-2xl font-black text-white mt-1">
              {stats.averageSessionDuration}m
            </div>
          </div>
        </motion.div>
      </div>

      {/* Activity List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-[#154279] uppercase tracking-tight">
              <Globe className="w-5 h-5 text-[#F96302]" /> Login History
            </h2>
            <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">
              Event Details Tracking
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchActivities}
              className="text-slate-600 hover:text-[#154279] hover:bg-blue-50 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className={
              filter === "all"
                ? "bg-[#154279] text-white hover:bg-[#0f325e]"
                : "text-slate-600 hover:text-[#154279] hover:bg-white"
            }
          >
            All Activities
          </Button>
          <Button
            variant={filter === "success" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("success")}
            className={
              filter === "success"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "text-slate-600 hover:text-emerald-600 hover:bg-white"
            }
          >
            Successful
          </Button>
          <Button
            variant={filter === "failed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("failed")}
            className={
              filter === "failed"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "text-slate-600 hover:text-red-600 hover:bg-white"
            }
          >
            Failed
          </Button>
        </div>

        {/* Activities List */}
        <div className="divide-y divide-slate-100 bg-white max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <p className="mt-2 text-sm font-medium">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No login activities found</p>
            </div>
          ) : (
            filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">User Name</span>
                      <div className="flex items-center gap-2">
                        <div className={"p-1.5 rounded-md "}>{getStatusIcon(activity.login_status)}</div>
                        <span className="font-bold text-sm text-slate-900 truncate">{activity.email || "System"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">User Type</span>
                      <span className="text-sm text-slate-600">{activity.role ? activity.role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "N/A"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Source IP</span>
                      <span className="text-sm text-slate-600 flex items-center gap-1"><Globe className="w-3 h-3" /> {activity.ip_address || "Unknown"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Type & Status</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getStatusColor(activity.login_status)}>{activity.login_status === "session_ended" ? "Session Ended" : activity.login_status === "failed" ? "Login Failed" : "Login Success"}</Badge>
                        {activity.failure_reason && <span className="text-xs text-red-600">{activity.failure_reason}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-right shrink-0 min-w-[120px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Timestamp</span>
                    <span className="text-sm font-semibold text-slate-700">{new Date(activity.login_timestamp).toLocaleString()}</span>
                    <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(activity.login_timestamp), { addSuffix: true })}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LoginActivityTracker;
