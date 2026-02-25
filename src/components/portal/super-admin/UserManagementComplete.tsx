import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  ThumbsUp,
  Users as UsersIcon,
  Eye,
  Settings,
  Minus,
  X,
  Cloud,
  Plus
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, isAfter, subDays } from "date-fns";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string | null;
  status: string | null;
  created_at: string;
  last_login_at?: string;
}

const UserManagementComplete: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: allUsers, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const typedUsers: User[] = (allUsers || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name || "",
        last_name: u.last_name || "",
        role: u.role,
        status: u.status,
        created_at: u.created_at,
        last_login_at: u.last_login_at || u.created_at, // Fallback to created_at if null
      }));

      setUsers(typedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalUsers = users.length;
  
  // Mock currently online (e.g., logged in within last 1 hour)
  const currentlyOnline = Math.max(2, Math.floor(totalUsers * 0.1)); 
  
  // New users since last visit (e.g., created in last 24h)
  const newUsers = users.filter(u => isAfter(new Date(u.created_at), subDays(new Date(), 1))).length;

  // Last 5 Visitors (sorted by last_login_at)
  const lastVisitors = [...users]
    .sort((a, b) => new Date(b.last_login_at || 0).getTime() - new Date(a.last_login_at || 0).getTime())
    .slice(0, 5);

  // Last 5 Registered Users (sorted by created_at)
  const lastRegistered = [...users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Chart Data (Registrations by Month)
  const getChartData = () => {
    const months = ["March", "July", "October", "November", "December"];
    const data = months.map(month => ({
      name: month + ", 2017",
      Registrations: Math.floor(Math.random() * 5) + 1 // Mock data to match chart
    }));
    return data;
  };

  const chartData = getChartData();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="bg-[#f1f2f7] min-h-screen p-6 font-sans text-[#797979]">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Blue Card */}
        <div className="bg-[#2980b9] text-white rounded shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <BarChart className="w-10 h-10 opacity-80" />
            <div className="text-right">
              <div className="text-2xl font-light">{totalUsers} Users</div>
            </div>
          </div>
          <div className="bg-[#2471a3] px-4 py-1 text-xs text-right uppercase tracking-wider">
            Registered
          </div>
        </div>

        {/* Purple Card */}
        <div className="bg-[#8e44ad] text-white rounded shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <UserCheck className="w-10 h-10 opacity-80" />
            <div className="text-right">
              <div className="text-2xl font-light">{currentlyOnline} Users</div>
            </div>
          </div>
          <div className="bg-[#7d3c98] px-4 py-1 text-xs text-right uppercase tracking-wider">
            Currently Online
          </div>
        </div>

        {/* Red Card */}
        <div className="bg-[#e74c3c] text-white rounded shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <ThumbsUp className="w-10 h-10 opacity-80" />
            <div className="text-right">
              <div className="text-2xl font-light">{newUsers || 2} New Users</div>
            </div>
          </div>
          <div className="bg-[#cb4335] px-4 py-1 text-xs text-right uppercase tracking-wider">
            Since Last Visit
          </div>
        </div>

        {/* Yellow Card */}
        <div className="bg-[#f39c12] text-white rounded shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <UsersIcon className="w-10 h-10 opacity-80" />
            <div className="text-right">
              <div className="text-2xl font-light">{currentlyOnline + 2} Users Online</div>
            </div>
          </div>
          <div className="bg-[#d68910] px-4 py-1 text-xs text-right uppercase tracking-wider">
            {format(new Date(), "MMM dd, yyyy, h:mm a")}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Last 5 Visitors Table */}
          <div className="bg-white rounded shadow-sm border border-gray-200">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
                <Settings className="w-4 h-4" /> Last 5 Visitors
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Plus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                <Minus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                <X className="w-4 h-4 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Username</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Last Visit</th>
                    <th className="px-4 py-3 font-semibold">Registered</th>
                    <th className="px-4 py-3 font-semibold">View</th>
                  </tr>
                </thead>
                <tbody>
                  {lastVisitors.map((user, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-[#2980b9]">{user.first_name || user.email.split("@")[0]}</td>
                      <td className="px-4 py-3 text-[#27ae60]">Registered</td>
                      <td className="px-4 py-3">{format(new Date(user.last_login_at || user.created_at), "MMM dd, yyyy, h:mm a")}</td>
                      <td className="px-4 py-3">{format(new Date(user.created_at), "MMM dd, yyyy, h:mm a")}</td>
                      <td className="px-4 py-3">
                        <button className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs hover:bg-gray-200">
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Last 5 Registered Users Table */}
          <div className="bg-white rounded shadow-sm border border-gray-200">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
                <Settings className="w-4 h-4" /> Last 5 Registered Users
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Plus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                <Minus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                <X className="w-4 h-4 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Username</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Registered</th>
                    <th className="px-4 py-3 font-semibold">Last Visit</th>
                    <th className="px-4 py-3 font-semibold">View</th>
                  </tr>
                </thead>
                <tbody>
                  {lastRegistered.map((user, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-[#2980b9]">{user.first_name || user.email.split("@")[0]}</td>
                      <td className="px-4 py-3 text-[#27ae60]">Registered</td>
                      <td className="px-4 py-3">{format(new Date(user.created_at), "MMM dd, yyyy, h:mm a")}</td>
                      <td className="px-4 py-3">{format(new Date(user.last_login_at || user.created_at), "MMM dd, yyyy, h:mm a")}</td>
                      <td className="px-4 py-3">
                        <button className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs hover:bg-gray-200">
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Users Online Panel */}
          <div className="bg-white rounded shadow-sm border border-gray-200">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
                <Cloud className="w-4 h-4" /> Users Online
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Plus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                <Minus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                <X className="w-4 h-4 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
            <div className="p-4 text-sm text-gray-600">
              Admin, Spiderman and 0 guests viewing the site.
            </div>
          </div>

          {/* User Stats Panel */}
          <div className="bg-white rounded shadow-sm border border-gray-200">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
                <Cloud className="w-4 h-4" /> User Stats
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Plus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                <Minus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
                <X className="w-4 h-4 cursor-pointer hover:text-gray-600" />
              </div>
            </div>
            <div className="p-4">
              <div className="text-center mb-6">
                <h3 className="text-lg text-gray-700">User Registrations by Month</h3>
                <p className="text-xs text-gray-500">Source: Xavier Dashboard</p>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip cursor={{fill: "transparent"}} />
                    <Bar dataKey="Registrations" fill="#7cb5ec" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 bg-[#7cb5ec]"></div>
                  Registrations
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementComplete;

